import type { FastifyInstance } from "fastify";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from "@menu/shared";
import { refreshTokens, users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  createRefreshToken,
  hashRefreshToken,
  parseDuration,
  signAccessToken,
} from "../lib/tokens.js";
import { HttpError, parseBody } from "../lib/http.js";
import { REFRESH_COOKIE } from "../plugins/auth.js";
import { recordAudit } from "../lib/audit.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /** Mints a session: an access JWT plus a stored, revocable refresh token. */
  async function issueSession(userId: string) {
    const roles = await app.loadRoles(userId);
    const accessToken = await signAccessToken(
      { userId, roles },
      app.config.JWT_SECRET,
      app.config.ACCESS_TOKEN_TTL,
    );
    const { token: refreshToken, tokenHash } = createRefreshToken();
    await app.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + parseDuration(app.config.REFRESH_TOKEN_TTL)),
    });
    return { accessToken, refreshToken, roles };
  }

  /**
   * Self-service registration. Creates a plain account and nothing else: no
   * role is granted here, and none can be requested. Privileges only ever come
   * from an administrator or from the seed script.
   */
  app.post(
    "/api/auth/register",
    { config: { rateLimit: app.limit(5, "10 minutes") } },
    async (request, reply) => {
      const input = parseBody(registerSchema, request.body);

      const existing = await app.db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${input.email}`)
        .limit(1);
      if (existing.length > 0) {
        throw new HttpError(409, "un compte existe déjà avec cette adresse");
      }

      const [created] = await app.db
        .insert(users)
        .values({
          email: input.email,
          passwordHash: await hashPassword(input.password),
          name: input.name,
          phone: input.phone ?? null,
        })
        .returning({ id: users.id, email: users.email, name: users.name });

      if (!created) throw new HttpError(500, "création du compte impossible");

      const session = await issueSession(created.id);
      app.setAuthCookies(reply, session);
      return reply.code(201).send({ user: { ...created, roles: session.roles } });
    },
  );

  app.post(
    "/api/auth/login",
    { config: { rateLimit: app.limit(10, "5 minutes") } },
    async (request, reply) => {
      const input = parseBody(loginSchema, request.body);

      const [user] = await app.db
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${input.email}`)
        .limit(1);

      // One message and one code for "no such account" and "wrong password":
      // distinguishing them would let anyone enumerate registered addresses.
      const ok = user ? await verifyPassword(user.passwordHash, input.password) : false;
      if (!user || !ok) {
        throw new HttpError(401, "identifiants invalides");
      }
      if (user.disabledAt) {
        throw new HttpError(403, "ce compte est désactivé");
      }

      const session = await issueSession(user.id);
      app.setAuthCookies(reply, session);
      return {
        user: { id: user.id, email: user.email, name: user.name, roles: session.roles },
      };
    },
  );

  /**
   * Rotates the refresh token on every use: the presented token is revoked and
   * replaced. A stolen token therefore works at most once, and its reuse shows
   * up as an authentication failure.
   */
  app.post("/api/auth/refresh", async (request, reply) => {
    const presented = request.cookies[REFRESH_COOKIE];
    if (!presented) throw new HttpError(401, "session expirée");

    const [stored] = await app.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, hashRefreshToken(presented)),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!stored) {
      app.clearAuthCookies(reply);
      throw new HttpError(401, "session expirée");
    }

    await app.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, stored.id));

    const session = await issueSession(stored.userId);
    app.setAuthCookies(reply, session);
    return { roles: session.roles };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const presented = request.cookies[REFRESH_COOKIE];
    if (presented) {
      await app.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, hashRefreshToken(presented)));
    }
    app.clearAuthCookies(reply);
    return { ok: true };
  });

  app.get("/api/me", { onRequest: [app.requireAuth] }, async (request) => {
    const [user] = await app.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        loyaltyNumber: users.loyaltyNumber,
      })
      .from(users)
      .where(eq(users.id, request.user!.id))
      .limit(1);

    if (!user) throw new HttpError(404, "compte introuvable");
    return { user: { ...user, roles: request.user!.roles } };
  });

  app.patch("/api/me", { onRequest: [app.requireAuth] }, async (request) => {
    const input = parseBody(updateProfileSchema, request.body);
    const [updated] = await app.db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, request.user!.id))
      .returning({ id: users.id, email: users.email, name: users.name, phone: users.phone });

    if (!updated) throw new HttpError(404, "compte introuvable");
    return { user: updated };
  });

  /** Changing the password revokes every other session. */
  app.post("/api/me/password", { onRequest: [app.requireAuth] }, async (request, reply) => {
    const input = parseBody(changePasswordSchema, request.body);
    const userId = request.user!.id;

    const [user] = await app.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new HttpError(404, "compte introuvable");

    if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
      throw new HttpError(401, "mot de passe actuel incorrect");
    }

    await app.db
      .update(users)
      .set({ passwordHash: await hashPassword(input.newPassword), updatedAt: new Date() })
      .where(eq(users.id, userId));

    await app.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));

    await recordAudit(app, {
      actorId: userId,
      action: "password.change",
      resource: "user",
      resourceId: userId,
    });

    app.clearAuthCookies(reply);
    return { ok: true };
  });
}

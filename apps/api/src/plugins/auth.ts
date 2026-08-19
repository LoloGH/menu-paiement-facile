import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import type { UserRole } from "@menu/shared";
import { verifyAccessToken, parseDuration } from "../lib/tokens.js";
import { userRoles } from "../db/schema.js";

export const ACCESS_COOKIE = "menu_access";
export const REFRESH_COOKIE = "menu_refresh";

export interface AuthenticatedUser {
  id: string;
  roles: UserRole[];
}

/**
 * Reads the access token from the cookie (or a bearer header, for scripts and
 * tests) and attaches the caller to the request. It never grants anything by
 * itself — `requireAuth` and `requireRole` are what gate a route.
 */
async function resolveUser(
  app: FastifyInstance,
  request: FastifyRequest,
): Promise<AuthenticatedUser | null> {
  const header = request.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = request.cookies[ACCESS_COOKIE] ?? bearer;
  if (!token) return null;

  const claims = await verifyAccessToken(token, app.config.JWT_SECRET);
  if (!claims) return null;

  return { id: claims.sub, roles: claims.roles };
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest("user", null);

  app.addHook("onRequest", async (request) => {
    request.user = await resolveUser(app, request);
  });

  /** 401 when there is no valid session. */
  app.decorate("requireAuth", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      await reply.code(401).send({ error: "authentification requise" });
    }
  });

  /**
   * 403 unless the caller holds at least one of the listed roles.
   *
   * Roles come from the signed token, which is issued only by the login and
   * refresh routes after reading `user_roles`. There is no path by which a
   * client can assert its own role — the legacy front-end inserted its own
   * `user_roles` row, which is what made every visitor an administrator.
   */
  app.decorate("requireRole", (...roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        await reply.code(401).send({ error: "authentification requise" });
        return;
      }
      if (!roles.some((role) => request.user?.roles.includes(role))) {
        request.log.warn(
          { userId: request.user.id, required: roles, held: request.user.roles },
          "authorisation refused",
        );
        await reply.code(403).send({ error: "droits insuffisants" });
      }
    };
  });

  /** Roles as stored, used when minting a token. */
  app.decorate("loadRoles", async (userId: string): Promise<UserRole[]> => {
    const rows = await app.db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    return rows.map((row) => row.role);
  });

  app.decorate(
    "setAuthCookies",
    (reply: FastifyReply, tokens: { accessToken: string; refreshToken: string }) => {
      const secure = app.config.NODE_ENV === "production";
      const base = {
        httpOnly: true,
        secure,
        sameSite: "lax" as const,
        path: "/",
      };
      reply.setCookie(ACCESS_COOKIE, tokens.accessToken, {
        ...base,
        maxAge: parseDuration(app.config.ACCESS_TOKEN_TTL) / 1000,
      });
      reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, {
        ...base,
        // Only ever sent to the refresh and logout endpoints, so an XSS-free
        // leak of one request does not expose the long-lived credential.
        path: "/api/auth",
        maxAge: parseDuration(app.config.REFRESH_TOKEN_TTL) / 1000,
      });
    },
  );

  app.decorate("clearAuthCookies", (reply: FastifyReply) => {
    reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  });
});

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser | null;
  }
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      ...roles: UserRole[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    loadRoles: (userId: string) => Promise<UserRole[]>;
    setAuthCookies: (
      reply: FastifyReply,
      tokens: { accessToken: string; refreshToken: string },
    ) => void;
    clearAuthCookies: (reply: FastifyReply) => void;
  }
}

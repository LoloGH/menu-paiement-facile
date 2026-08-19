import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@menu/shared";

export interface AccessTokenClaims extends JWTPayload {
  sub: string;
  roles: UserRole[];
}

const ISSUER = "menu-api";
const AUDIENCE = "menu-web";

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function signAccessToken(
  claims: { userId: string; roles: UserRole[] },
  secret: string,
  ttl: string,
): Promise<string> {
  return new SignJWT({ roles: claims.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ttl)
    .sign(key(secret));
}

/** Returns null on any invalid, expired or tampered token. */
export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || !Array.isArray(payload.roles)) return null;
    return payload as AccessTokenClaims;
  } catch {
    return null;
  }
}

/**
 * Refresh tokens are opaque random strings, not JWTs: they must be revocable,
 * which means the database — not the token — is the authority.
 */
export function createRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashRefreshToken(token) };
}

/**
 * SHA-256 rather than argon2: the token already has 256 bits of entropy, so
 * there is nothing to brute-force, and lookup happens on every refresh.
 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** `"15m"`, `"30d"`, `"12h"` → milliseconds. Used for cookie lifetimes. */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) throw new Error(`invalid duration: ${value}`);
  const amount = Number(match[1]);
  const unit = match[2] as "s" | "m" | "h" | "d";
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return amount * factor;
}

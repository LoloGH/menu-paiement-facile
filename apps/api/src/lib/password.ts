import { hash, verify } from "@node-rs/argon2";

/**
 * argon2id, with the parameters OWASP currently gives as a baseline
 * (19 MiB, 2 passes, 1 lane). Tuned in one place so a future change applies
 * everywhere at once.
 *
 * The algorithm is written as a literal because @node-rs/argon2 exports
 * `Algorithm` as an ambient const enum, which has no runtime value and cannot
 * be referenced under `verbatimModuleSyntax`. 2 is Argon2id — also the
 * library's default, but pinned so a change of default cannot weaken this.
 */
const ARGON2ID = 2;

const OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

/**
 * Returns false rather than throwing on a malformed stored hash, so a corrupted
 * row denies access instead of turning into a 500.
 */
export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain, OPTIONS);
  } catch {
    return false;
  }
}

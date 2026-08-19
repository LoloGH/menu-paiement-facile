import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

/**
 * The rest of the suite runs with the limiter relaxed, because Fastify's
 * `inject` makes every request look like it comes from one address. This file
 * builds an app with production settings so the protection itself is covered.
 */
describe("limitation de débit", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  it("bloque le bourrage d'identifiants sur la connexion", async () => {
    app = await buildApp(
      loadConfig({ ...process.env, NODE_ENV: "production", LOG_LEVEL: "silent" }),
    );
    await app.ready();

    const attempt = () =>
      app!.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "victime@test.local", password: "essai" },
      });

    const statuses: number[] = [];
    for (let i = 0; i < 14; i += 1) {
      statuses.push((await attempt()).statusCode);
    }

    // Ten attempts per five minutes, then the door closes.
    expect(statuses.filter((status) => status === 429).length).toBeGreaterThan(0);
    expect(statuses.slice(0, 10).every((status) => status !== 429)).toBe(true);
  });
});

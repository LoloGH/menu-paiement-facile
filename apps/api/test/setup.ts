/**
 * Defaults so `npm test` works from a clean checkout with only a database
 * running. Anything already in the environment wins, so CI and a developer's
 * own PostgreSQL both keep control.
 */
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL ??= "silent";
process.env.DATABASE_URL ??= "postgres://menu:menu@127.0.0.1:5432/menu_test";
process.env.JWT_SECRET ??= "test-only-secret-at-least-32-characters-long";
process.env.PAYMENT_PROVIDER ??= "manual";

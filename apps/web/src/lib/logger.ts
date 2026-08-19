/**
 * Console logging that disappears in production builds.
 *
 * The legacy client made 294 `console.*` calls, printing session objects, full
 * user records and the result of every sign-in to anyone with the devtools
 * open. `warn` and `error` survive because a user reporting a bug needs them;
 * everything else is stripped by the bundler when `import.meta.env.PROD` folds
 * to `true`.
 */
const isDev = import.meta.env.DEV;

/* eslint-disable no-console -- this module is the one place console is allowed */

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

/**
 * Escapes a user-supplied string for use inside a SQL `LIKE`/`ILIKE` pattern.
 *
 * The legacy client interpolated the search box straight into PostgREST's
 * `.or(...)` filter string, where a comma or a parenthesis broke out of the
 * filter and let arbitrary conditions be injected. Queries here are built with
 * bound parameters, so that class of injection is gone; this only neutralises
 * the wildcards `%` and `_`, which would otherwise make a search match far more
 * than the user asked for.
 */
export function likePattern(term: string): string {
  const escaped = term.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}

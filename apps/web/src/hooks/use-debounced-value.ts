import { useEffect, useState } from "react";

/**
 * Delays a value until it stops changing.
 *
 * Used on search inputs: without it, every keystroke fired a query — and, in
 * the legacy code, also rebuilt the realtime subscription.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

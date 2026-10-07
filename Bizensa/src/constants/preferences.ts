import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

/**
 * Remembers a small setting on the phone (currency, theme, toggles...).
 *
 *   const [currency, setCurrency] = usePreference("currency", "PKR");
 */
export function usePreference<T>(key: string, fallback: T) {
  const storeKey = `pref.${key}`;
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    SecureStore.getItemAsync(storeKey)
      .then((raw) => {
        if (!alive || raw == null) return;
        try {
          setValue(JSON.parse(raw) as T);
        } catch {
          /* ignore bad data */
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [storeKey]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      SecureStore.setItemAsync(storeKey, JSON.stringify(next)).catch(() => {});
    },
    [storeKey]
  );

  return [value, update, ready] as const;
}

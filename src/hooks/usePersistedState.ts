import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const PREFIX = "360l:filters";

const buildKey = (userId: string | null | undefined, key: string) =>
  `${PREFIX}:${userId ?? "anon"}:${key}`;

/**
 * Persist arbitrary state in localStorage, namespaced per authenticated user.
 * Used for filter persistence across navigation, reloads and tab minimization.
 */
export function usePersistedState<T>(key: string, defaultValue: T) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const storageKey = buildKey(userId, key);
  const lastKeyRef = useRef(storageKey);

  const read = (): T => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw == null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  };

  const [value, setValue] = useState<T>(read);

  // Re-hydrate when the user changes (login/logout swaps namespace).
  useEffect(() => {
    if (lastKeyRef.current !== storageKey) {
      lastKeyRef.current = storageKey;
      setValue(read());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // quota or serialization error — ignore
    }
  }, [storageKey, value]);

  const clear = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setValue(defaultValue);
  };

  return [value, setValue, clear] as const;
}

/** Wipe all persisted filter entries for a given user (or anon). */
export const clearPersistedFiltersForUser = (userId: string | null | undefined) => {
  try {
    const prefix = `${PREFIX}:${userId ?? "anon"}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
};

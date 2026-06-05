import { useEffect, useRef, useState, useCallback } from "react";

interface Options {
  /** Clave única en localStorage. Ej: "borrador_lote_nuevo" o "borrador_lote_<id>" */
  storageKey: string;
  /** Datos actuales del form a guardar */
  data: Record<string, any>;
  /** Si false, no autoguarda (útil cuando el form aún no está "sucio") */
  enabled?: boolean;
  /** ms de debounce. Default 3000. */
  debounceMs?: number;
}

interface BorradorGuardado {
  data: Record<string, any>;
  guardadoEn: string;
}

export const useAutosaveBorrador = ({
  storageKey,
  data,
  enabled = true,
  debounceMs = 3000,
}: Options) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ data, guardadoEn: new Date().toISOString() }),
        );
        setUltimoGuardado(new Date());
      } catch (e) {
        console.warn("Error guardando borrador en localStorage:", e);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, storageKey, enabled, debounceMs]);

  const cargarBorrador = useCallback((): BorradorGuardado | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as BorradorGuardado;
    } catch {
      return null;
    }
  }, [storageKey]);

  const borrarBorrador = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setUltimoGuardado(null);
    } catch {
      /* noop */
    }
  }, [storageKey]);

  return { ultimoGuardado, cargarBorrador, borrarBorrador };
};

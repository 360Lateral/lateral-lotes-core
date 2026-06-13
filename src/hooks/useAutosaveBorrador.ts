import { useEffect, useRef, useState, useCallback } from "react";

interface Options {
  storageKey: string;
  data: Record<string, any>;
  enabled?: boolean;
  /** ms de debounce. Default 1000 (era 3000 antes, demasiado alto). */
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
  debounceMs = 1000,
}: Options) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  const enabledRef = useRef(enabled);
  const storageKeyRef = useRef(storageKey);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);

  // Mantener refs actualizadas sin disparar el effect principal
  useEffect(() => {
    dataRef.current = data;
    enabledRef.current = enabled;
    storageKeyRef.current = storageKey;
  }, [data, enabled, storageKey]);

  const guardar = useCallback(() => {
    try {
      localStorage.setItem(
        storageKeyRef.current,
        JSON.stringify({ data: dataRef.current, guardadoEn: new Date().toISOString() }),
      );
      setUltimoGuardado(new Date());
    } catch (e) {
      console.warn("Error guardando borrador:", e);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(guardar, debounceMs);

    // CLEANUP: si había un timer pendiente, FORZAR el guardado en lugar de
    // cancelarlo silenciosamente. Evita pérdida de datos al desmontar.
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        if (enabledRef.current) {
          guardar();
        }
      }
    };
  }, [data, storageKey, enabled, debounceMs, guardar]);

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

  const guardarAhora = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    guardar();
  }, [guardar]);

  return { ultimoGuardado, cargarBorrador, borrarBorrador, guardarAhora };
};

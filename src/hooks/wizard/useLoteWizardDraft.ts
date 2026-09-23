import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { WizardForm } from "@/components/LoteWizard";

/**
 * Versión del schema del draft. Incrementar si cambia WizardForm
 * de forma incompatible — drafts con versión distinta se descartan.
 */
const DRAFT_VERSION = 1;
const DRAFT_KEY_PREFIX = "lote-wizard-draft";

export interface DraftEnvelope {
  version: number;
  savedAt: string;
  step: number;
  form: WizardForm;
  published: boolean;
  videoMode: "upload" | "link";
  videoUrl: string;
}

const getDraftKey = (userId: string | undefined) =>
  userId ? `${DRAFT_KEY_PREFIX}-${userId}` : null;

export const useLoteWizardDraft = () => {
  const { user } = useAuth();
  const draftKey = getDraftKey(user?.id);

  const [draftInicial, setDraftInicial] = useState<DraftEnvelope | null>(null);
  const [draftCargado, setDraftCargado] = useState(false);

  useEffect(() => {
    if (!draftKey) {
      setDraftCargado(true);
      return;
    }
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed: DraftEnvelope = JSON.parse(raw);
        if (parsed.version === DRAFT_VERSION) {
          setDraftInicial(parsed);
        } else {
          console.warn("Draft de wizard con versión obsoleta, descartando");
          try { localStorage.removeItem(draftKey); } catch {}
        }
      }
    } catch (err) {
      console.error("Error cargando draft de wizard:", err);
      try { localStorage.removeItem(draftKey); } catch {}
    }
    setDraftCargado(true);
  }, [draftKey]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Omit<DraftEnvelope, "version" | "savedAt"> | null>(null);

  const escribir = useCallback(() => {
    if (!draftKey || !pendingRef.current) return;
    try {
      const full: DraftEnvelope = {
        version: DRAFT_VERSION,
        savedAt: new Date().toISOString(),
        ...pendingRef.current,
      };
      localStorage.setItem(draftKey, JSON.stringify(full));
      pendingRef.current = null;
    } catch (err) {
      console.error("Error guardando draft de wizard:", err);
    }
  }, [draftKey]);

  const guardarDraft = useCallback(
    (envelope: Omit<DraftEnvelope, "version" | "savedAt">) => {
      if (!draftKey) return;
      pendingRef.current = envelope;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        escribir();
      }, 400);
    },
    [draftKey, escribir]
  );

  const limpiarDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingRef.current = null;
    if (!draftKey) return;
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setDraftInicial(null);
  }, [draftKey]);

  // Forzar guardado inmediato al cerrar/ocultar la pestaña o desmontar
  useEffect(() => {
    const flush = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      escribir();
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVis);
      flush();
    };
  }, [escribir]);

  return { draftInicial, draftCargado, guardarDraft, limpiarDraft };
};

export const formatRelativoDraft = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutos = Math.floor(diff / 60000);
  if (minutos < 1) return "hace menos de 1 minuto";
  if (minutos < 60) return `hace ${minutos} minuto${minutos === 1 ? "" : "s"}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} hora${horas === 1 ? "" : "s"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} día${dias === 1 ? "" : "s"}`;
};

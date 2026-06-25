// Helpers compartidos para el portal del propietario (Sprint 2.A).

export const nombreLoteMostrable = (
  nombre?: string | null,
  direccion?: string | null,
  ciudad?: string | null,
): string => {
  const n = (nombre ?? "").trim();
  if (n) return n;
  const d = (direccion ?? "").trim();
  const c = (ciudad ?? "").trim();
  if (d && c) return `${d}, ${c}`;
  if (d) return d;
  if (c) return `Lote en ${c}`;
  return "Lote sin nombre asignado";
};

export type SlaTone = "ok" | "warn" | "danger" | "neutral" | "done";

export interface SlaConfig {
  tone: SlaTone;
  text: string;
  textClass: string;
  bgClass: string;
}

const TONE_STYLES: Record<SlaTone, { textClass: string; bgClass: string }> = {
  ok: { textClass: "text-emerald-700", bgClass: "bg-emerald-50 border-emerald-200" },
  warn: { textClass: "text-amber-700", bgClass: "bg-amber-50 border-amber-200" },
  danger: { textClass: "text-red-700", bgClass: "bg-red-50 border-red-200" },
  neutral: { textClass: "text-muted-foreground", bgClass: "bg-muted/40 border-border" },
  done: { textClass: "text-emerald-700", bgClass: "bg-emerald-50 border-emerald-200" },
};

export const computeSlaConfig = (params: {
  dias: number | null | undefined;
  esEntregado?: boolean;
  fechaEntrega?: string | null;
}): SlaConfig => {
  const { dias, esEntregado, fechaEntrega } = params;
  if (esEntregado) {
    const f = fechaEntrega
      ? new Date(fechaEntrega).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;
    return {
      tone: "done",
      text: f ? `Entregado · ${f}` : "Entregado",
      ...TONE_STYLES.done,
    };
  }
  if (dias === null || dias === undefined) {
    return { tone: "neutral", text: "Sin fecha estimada", ...TONE_STYLES.neutral };
  }
  if (dias < 0) {
    const abs = Math.abs(dias);
    return {
      tone: "danger",
      text: `Atrasado ${abs} ${abs === 1 ? "día" : "días"}`,
      ...TONE_STYLES.danger,
    };
  }
  if (dias === 0) {
    return { tone: "warn", text: "Entrega hoy", ...TONE_STYLES.warn };
  }
  if (dias <= 5) {
    return {
      tone: "warn",
      text: `Faltan ${dias} ${dias === 1 ? "día" : "días"}`,
      ...TONE_STYLES.warn,
    };
  }
  return {
    tone: "ok",
    text: `Faltan ${dias} ${dias === 1 ? "día" : "días"}`,
    ...TONE_STYLES.ok,
  };
};

/**
 * Reconcilia el paso del stepper con el avance porcentual real.
 * - borrador / prospecto: -1 (antes del primer paso)
 * - 0% : 0 (Iniciado)
 * - 1..49% : 1 (En análisis)
 * - 50..99% : 2 (En revisión)
 * - 100% o estado entregado/cerrado : 3 (Entregado)
 */
export const calcularPasoStepper = (
  estado: string,
  avancePct: number,
): number => {
  if (estado === "borrador" || estado === "prospecto") return -1;
  if (estado === "entregado" || estado === "cerrado") return 3;
  const v = Math.max(0, Math.min(100, Math.round(avancePct ?? 0)));
  if (v >= 100) return 3;
  if (v >= 50) return 2;
  if (v > 0) return 1;
  return 0;
};

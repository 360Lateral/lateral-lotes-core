/**
 * Compatibilidad: re-exporta los helpers canónicos desde `format-moneda.ts`.
 * NO añadir nuevos formateadores aquí. Usar `@/lib/format-moneda`.
 */
export {
  formatCOP,
  formatCOPCompact,
  formatNumero,
  formatMetros,
  formatPorcentaje,
  formatNumeroCompact,
  formatUSD,
} from "./format-moneda";

export const formatoRelativo = (date: Date | string | null | undefined): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `hace ${day} ${day === 1 ? "día" : "días"}`;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatFecha = (s?: string | null): string =>
  s
    ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

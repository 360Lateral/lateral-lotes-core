export type EstadoFeedback =
  | "nuevo"
  | "en_revision"
  | "planificado"
  | "en_progreso"
  | "resuelto"
  | "descartado"
  | "duplicado";

export const ESTADO_LABEL: Record<EstadoFeedback, string> = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  planificado: "Planificado",
  en_progreso: "En progreso",
  resuelto: "Resuelto",
  descartado: "Descartado",
  duplicado: "Duplicado",
};

export const ESTADO_TONO: Record<EstadoFeedback, string> = {
  nuevo: "bg-primary/15 text-primary",
  en_revision: "bg-amber-500/15 text-amber-700",
  planificado: "bg-blue-500/15 text-blue-700",
  en_progreso: "bg-violet-500/15 text-violet-700",
  resuelto: "bg-success/15 text-success",
  descartado: "bg-muted text-muted-foreground",
  duplicado: "bg-muted text-muted-foreground",
};

/**
 * Reglas:
 *  - resuelto/descartado/duplicado son finales (admin puede reabrir via "en_revision").
 *  - No se puede saltar de "nuevo" directo a "resuelto": debe pasar por en_progreso.
 *  - Desde cualquier estado activo se puede descartar o marcar como duplicado.
 */
export const TRANSICIONES_VALIDAS: Record<EstadoFeedback, EstadoFeedback[]> = {
  nuevo: ["en_revision", "descartado", "duplicado"],
  en_revision: ["planificado", "en_progreso", "descartado", "duplicado"],
  planificado: ["en_progreso", "en_revision", "descartado"],
  en_progreso: ["resuelto", "en_revision", "descartado"],
  resuelto: ["en_revision"],
  descartado: ["en_revision"],
  duplicado: ["en_revision"],
};

export const TRANSICIONES_QUE_REQUIEREN_CONFIRMACION: EstadoFeedback[] = [
  "descartado",
  "duplicado",
  "resuelto",
];

export const esTransicionValida = (
  desde: EstadoFeedback,
  hacia: EstadoFeedback,
): boolean => {
  if (desde === hacia) return false;
  return TRANSICIONES_VALIDAS[desde]?.includes(hacia) ?? false;
};

export const requiereConfirmacion = (hacia: EstadoFeedback): boolean =>
  TRANSICIONES_QUE_REQUIEREN_CONFIRMACION.includes(hacia);

export const motivoTransicionInvalida = (
  desde: EstadoFeedback,
  hacia: EstadoFeedback,
): string => {
  if (desde === hacia) return "Ya está en este estado.";
  if (desde === "nuevo" && hacia === "resuelto")
    return "Pasa primero por revisión / en progreso.";
  if (desde === "nuevo" && hacia === "en_progreso")
    return "Pasa primero por revisión.";
  return "Transición no permitida desde el estado actual.";
};

export type TipoFeedback = "bug" | "mejora" | "pregunta" | "ux" | "otro";
export type SeveridadFeedback = "baja" | "media" | "alta" | "critica";

export const TIPO_LABEL: Record<TipoFeedback, string> = {
  bug: "Bug",
  mejora: "Mejora",
  pregunta: "Pregunta",
  ux: "UX / sensación",
  otro: "Otro",
};

export const SEVERIDAD_LABEL: Record<SeveridadFeedback, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const SEVERIDAD_TONO: Record<SeveridadFeedback, string> = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-amber-500/15 text-amber-700",
  alta: "bg-orange-500/20 text-orange-700",
  critica: "bg-destructive/20 text-destructive",
};

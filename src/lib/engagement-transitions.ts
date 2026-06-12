/**
 * Estados reales del enum `estado_engagement` en la BD:
 *   prospecto, activo, en_revision, entregado, cerrado, cancelado
 */
export type EstadoEngagement =
  | "prospecto"
  | "activo"
  | "en_revision"
  | "entregado"
  | "cancelado"
  | "cerrado";

/**
 * Matriz de transiciones válidas.
 * Reglas:
 *  - `cerrado` y `cancelado` son finales.
 *  - No se puede saltar la revisión: `activo` no va directo a `entregado`.
 *  - `en_revision` puede regresar a `activo` si requiere ajustes.
 *  - `entregado` solo puede cerrarse.
 */
export const TRANSICIONES_VALIDAS: Record<EstadoEngagement, EstadoEngagement[]> = {
  prospecto: ["activo", "cancelado"],
  activo: ["en_revision", "cancelado"],
  en_revision: ["activo", "entregado", "cancelado"],
  entregado: ["cerrado"],
  cancelado: [],
  cerrado: [],
};

export const TRANSICIONES_QUE_REQUIEREN_CONFIRMACION: EstadoEngagement[] = [
  "cancelado",
  "cerrado",
  "entregado",
];

export const esTransicionValida = (
  desde: EstadoEngagement,
  hacia: EstadoEngagement,
): boolean => {
  if (desde === hacia) return false;
  return TRANSICIONES_VALIDAS[desde]?.includes(hacia) ?? false;
};

export const requiereConfirmacion = (hacia: EstadoEngagement): boolean =>
  TRANSICIONES_QUE_REQUIEREN_CONFIRMACION.includes(hacia);

export const motivoTransicionInvalida = (
  desde: EstadoEngagement,
  hacia: EstadoEngagement,
): string => {
  if (desde === hacia) return "Ya está en este estado.";
  if (desde === "cerrado") return "No se puede modificar un engagement cerrado.";
  if (desde === "cancelado") return "Engagement cancelado, no se puede reactivar.";
  if (desde === "activo" && hacia === "entregado") {
    return "Debe pasar por revisión antes de entregarse.";
  }
  if (desde === "prospecto" && hacia === "entregado") {
    return "No se puede entregar un engagement sin avance.";
  }
  return "Transición no permitida desde el estado actual.";
};

export const ESTADO_LABEL: Record<EstadoEngagement, string> = {
  prospecto: "Prospecto",
  activo: "Activo",
  en_revision: "En revisión",
  entregado: "Entregado",
  cancelado: "Cancelado",
  cerrado: "Cerrado",
};

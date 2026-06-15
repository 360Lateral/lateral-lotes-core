import type { PortafolioVistaFila } from "@/hooks/useVistaPortafolio";

export type SlaEstado =
  | "cumplido_a_tiempo"
  | "cumplido_con_retraso"
  | "atrasado"
  | "riesgo_fecha"
  | "riesgo_ritmo"
  | "verde"
  | null;

/** Clase Tailwind para fila/card según sla_estado */
export const urgenciaClass = (fila: PortafolioVistaFila): string => {
  const estado = fila.sla_estado as SlaEstado;
  switch (estado) {
    case "cumplido_a_tiempo":
      return "bg-green-50 border-l-2 border-l-green-500";
    case "cumplido_con_retraso":
      return "bg-green-50/60 border-l-2 border-l-green-600";
    case "atrasado":
      return "bg-destructive/8 border-l-2 border-l-destructive";
    case "riesgo_fecha":
      return "bg-primary/8 border-l-2 border-l-primary";
    case "riesgo_ritmo":
      return "bg-amber-50 border-l-2 border-l-amber-500";
    case "verde":
    default:
      return "";
  }
};

/** Si no tiene asesor, agregar opacidad */
export const ajusteSinAsesor = (fila: PortafolioVistaFila): string =>
  !fila.asesor_nombre ? "opacity-90 border-l-muted-foreground" : "";

/** Etiqueta human-readable del estado */
export const labelSlaEstado = (estado: SlaEstado): string => {
  switch (estado) {
    case "cumplido_a_tiempo":
      return "Cumplido a tiempo";
    case "cumplido_con_retraso":
      return "Cumplido con retraso";
    case "atrasado":
      return "Atrasado";
    case "riesgo_fecha":
      return "Por vencer";
    case "riesgo_ritmo":
      return "Ritmo lento";
    case "verde":
      return "En tiempo";
    default:
      return "—";
  }
};

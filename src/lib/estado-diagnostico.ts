export type EtapaDiagnostico = "pendiente" | "en_revision" | "finalizado";

export interface EstadoDiagnostico {
  etapa: EtapaDiagnostico;
  label: string;
}

/**
 * Traduce el estado interno del engagement a las tres etapas que se muestran
 * en tarjetas: Pendiente, En revisión y Finalizado. Cancelado o vacío → null.
 */
export const estadoDiagnostico = (estado: string | null | undefined): EstadoDiagnostico | null => {
  switch (estado) {
    case "prospecto":
    case "activo":
      return { etapa: "pendiente", label: "Pendiente" };
    case "en_revision":
      return { etapa: "en_revision", label: "En revisión" };
    case "entregado":
    case "cerrado":
      return { etapa: "finalizado", label: "Finalizado" };
    default:
      return null;
  }
};

export const claseEstadoDiagnostico: Record<EtapaDiagnostico, string> = {
  pendiente: "bg-muted text-foreground",
  en_revision: "bg-warning/15 text-warning",
  finalizado: "bg-success/15 text-success",
};

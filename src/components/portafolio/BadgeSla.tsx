import { Check, Clock, AlertTriangle, TrendingDown } from "lucide-react";
import type { SlaEstado } from "@/lib/sla-helpers";

interface Props {
  estado: SlaEstado;
  diasParaSla?: number | null;
  size?: "sm" | "xs";
}

export const BadgeSla = ({ estado, diasParaSla, size = "sm" }: Props) => {
  const baseClass =
    size === "xs"
      ? "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
      : "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium";

  switch (estado) {
    case "cumplido_a_tiempo":
      return (
        <span className={`${baseClass} bg-green-100 text-green-800`}>
          <Check className="h-2.5 w-2.5" /> Cumplido
        </span>
      );
    case "cumplido_con_retraso":
      return (
        <span className={`${baseClass} bg-green-100 text-green-800`}>
          <Check className="h-2.5 w-2.5" /> Cumplido
          <Clock
            className="ml-0.5 h-2.5 w-2.5 text-amber-600"
            aria-label="Con retraso"
          />
        </span>
      );
    case "atrasado":
      return (
        <span className={`${baseClass} bg-destructive/15 text-destructive`}>
          <AlertTriangle className="h-2.5 w-2.5" />
          Atrasado {diasParaSla != null ? `${Math.abs(diasParaSla)}d` : ""}
        </span>
      );
    case "riesgo_fecha":
      return (
        <span className={`${baseClass} bg-primary/15 text-primary`}>
          <Clock className="h-2.5 w-2.5" />
          {diasParaSla != null ? `${diasParaSla}d para SLA` : "Por vencer"}
        </span>
      );
    case "riesgo_ritmo":
      return (
        <span className={`${baseClass} bg-amber-100 text-amber-800`}>
          <TrendingDown className="h-2.5 w-2.5" />
          Ritmo lento
        </span>
      );
    case "verde":
      return (
        <span className={`${baseClass} bg-muted text-muted-foreground`}>
          <Clock className="h-2.5 w-2.5" />
          {diasParaSla != null ? `${diasParaSla}d` : "En tiempo"}
        </span>
      );
    default:
      return null;
  }
};

export default BadgeSla;

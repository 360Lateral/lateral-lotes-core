import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  semaforo: "verde" | "amarillo" | "ambar" | "rojo" | null;
  diasParaSla: number | null;
}

const SemaforoSlaBadge = ({ semaforo, diasParaSla }: Props) => {
  const dias = diasParaSla ?? 0;
  const isYellow = semaforo === "amarillo" || semaforo === "ambar";

  let cls = "bg-muted text-muted-foreground";
  let label = "—";

  if (semaforo === "verde") {
    cls = "bg-success/15 text-success border-success/30";
    label = dias === 0 ? "Vence hoy" : `Verde · ${dias} días`;
  } else if (isYellow) {
    cls = "bg-warning/15 text-warning border-warning/30";
    label = dias === 0 ? "Vence hoy" : `Amarillo · ${dias} días`;
  } else if (semaforo === "rojo") {
    cls = "bg-destructive/15 text-destructive border-destructive/30";
    label =
      dias === 0
        ? "Vence hoy"
        : dias < 0
          ? `Vencido · ${Math.abs(dias)} días`
          : `Rojo · ${dias} días`;
  }

  return (
    <Badge variant="outline" className={cn("font-body", cls)}>
      {label}
    </Badge>
  );
};

export default SemaforoSlaBadge;

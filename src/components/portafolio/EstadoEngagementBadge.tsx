import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  estado: string;
}

const MAP: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-muted text-muted-foreground" },
  prospecto: { label: "Prospecto", cls: "bg-muted text-muted-foreground" },
  en_progreso: { label: "En progreso", cls: "bg-primary/15 text-primary border-primary/30" },
  activo: { label: "En progreso", cls: "bg-primary/15 text-primary border-primary/30" },
  en_revision: { label: "En revisión", cls: "bg-warning/15 text-warning border-warning/30" },
  entregado: { label: "Entregado", cls: "bg-success/15 text-success border-success/30" },
  cerrado: { label: "Cerrado", cls: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", cls: "bg-muted text-muted-foreground line-through" },
};

const EstadoEngagementBadge = ({ estado }: Props) => {
  const cfg = MAP[estado] ?? { label: estado, cls: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="outline" className={cn("font-body", cfg.cls)}>
      {cfg.label}
    </Badge>
  );
};

export default EstadoEngagementBadge;

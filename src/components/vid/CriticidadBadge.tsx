import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CRITICIDAD_LABEL, type Criticidad } from "@/lib/vid-diagnosticos";

const ESTILO: Record<Criticidad, string> = {
  alto: "bg-destructive/10 text-destructive border-destructive/30",
  medio: "bg-accent/15 text-accent-foreground border-accent/40",
  bajo: "bg-primary/10 text-primary border-primary/30",
};

export default function CriticidadBadge({ nivel, className }: { nivel: Criticidad | null; className?: string }) {
  if (!nivel) return <Badge variant="outline" className={className}>Sin evaluar</Badge>;
  return (
    <Badge variant="outline" className={cn(ESTILO[nivel], "whitespace-nowrap", className)}>
      Criticidad {CRITICIDAD_LABEL[nivel].toLowerCase()}
    </Badge>
  );
}

import { Badge } from "@/components/ui/badge";
import type { EstadoEntregable } from "@/hooks/useEntregablesEngagement";

interface Props {
  estado: EstadoEntregable;
}

const EstadoEntregableBadge = ({ estado }: Props) => {
  if (estado === "publicado")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
        Publicado
      </Badge>
    );
  if (estado === "archivado")
    return <Badge variant="secondary">Archivado</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Borrador</Badge>;
};

export default EstadoEntregableBadge;

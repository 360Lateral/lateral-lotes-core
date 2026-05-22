import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Upload, Inbox, Info } from "lucide-react";
import { useEntregablesEngagement } from "@/hooks/useEntregablesEngagement";
import { useActualizarVisibilidadCliente } from "@/hooks/useActualizarVisibilidadCliente";
import EntregableItem from "./EntregableItem";
import SubirEntregableDialog from "./SubirEntregableDialog";

interface Props {
  engagementId: string;
  mostrarAvanceAlCliente: boolean;
}

const SeccionEntregables = ({ engagementId, mostrarAvanceAlCliente }: Props) => {
  const { data, isLoading } = useEntregablesEngagement(engagementId);
  const toggleVisibilidad = useActualizarVisibilidadCliente();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Entregables al cliente
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={mostrarAvanceAlCliente}
                    disabled={toggleVisibilidad.isPending}
                    onCheckedChange={(v) =>
                      toggleVisibilidad.mutate({ engagementId, mostrar: v })
                    }
                  />
                  <span className="flex items-center gap-1">
                    Mostrar avance al cliente
                    <Info size={13} />
                  </span>
                </label>
              </TooltipTrigger>
              <TooltipContent>
                Cuando está activado, el cliente verá el estado de cada tarea de
                análisis en su portal.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Upload className="mr-2" size={16} />
            Subir / agregar entregable
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Inbox className="text-muted-foreground" size={32} />
          <p className="text-sm text-muted-foreground">
            Aún no hay entregables. Sube el primero para que el cliente lo vea.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((e) => (
            <EntregableItem key={e.id} entregable={e} />
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Los borradores no son visibles para el cliente. Solo los entregables{" "}
        <span className="font-medium">Publicado</span> aparecen en su portal.
      </p>

      <SubirEntregableDialog
        engagementId={engagementId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
};

export default SeccionEntregables;

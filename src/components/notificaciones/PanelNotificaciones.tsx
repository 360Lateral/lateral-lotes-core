import { useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificaciones } from "@/hooks/useNotificaciones";
import { useMarcarTodasLeidas } from "@/hooks/useMarcarTodasLeidas";
import NotificacionItem from "./NotificacionItem";

interface Props {
  onClose: () => void;
}

const PanelNotificaciones = ({ onClose }: Props) => {
  const [soloPendientes, setSoloPendientes] = useState(true);
  const { data = [], isLoading } = useNotificaciones(soloPendientes);
  const marcarTodas = useMarcarTodasLeidas();

  const pendientesCount = data.filter((n) => n.estado === "pendiente").length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <h3 className="font-body text-sm font-semibold text-foreground">Notificaciones</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={pendientesCount === 0 || marcarTodas.isPending}
          onClick={() => marcarTodas.mutate()}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Marcar leídas
        </Button>
      </div>

      <div className="flex gap-1 rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => setSoloPendientes(true)}
          className={`flex-1 rounded px-2 py-1 font-body text-xs font-medium transition-colors ${
            soloPendientes ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Pendientes
        </button>
        <button
          type="button"
          onClick={() => setSoloPendientes(false)}
          className={`flex-1 rounded px-2 py-1 font-body text-xs font-medium transition-colors ${
            !soloPendientes ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Todas
        </button>
      </div>

      <Separator className="my-2" />

      <ScrollArea className="max-h-[480px]">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground" />
            <p className="font-body text-sm text-muted-foreground">
              {soloPendientes
                ? "No tienes notificaciones pendientes"
                : "No tienes notificaciones"}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-1">
            {data.map((n) => (
              <NotificacionItem key={n.id} notificacion={n} onClose={onClose} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default PanelNotificaciones;

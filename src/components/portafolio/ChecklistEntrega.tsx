import { CheckCircle2, Circle, AlertCircle, Send, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useMarcarEngagementEntregado } from "@/hooks/useMarcarEngagementEntregado";
import type { Entregable } from "@/hooks/useEntregablesEngagement";

interface Props {
  engagementId: string;
  estadoEngagement: string;
  diagnostico?: Entregable;
  presentacion?: Entregable;
  tareasCompletadas: number;
  tareasTotal: number;
  yaEntregado: boolean;
  puedeMarcar: boolean;
}

interface ItemCheck {
  label: string;
  ok: boolean;
  pendiente: string;
}

export const ChecklistEntrega = ({
  engagementId,
  estadoEngagement,
  diagnostico,
  presentacion,
  tareasCompletadas,
  tareasTotal,
  yaEntregado,
  puedeMarcar,
}: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const marcarEntregado = useMarcarEngagementEntregado();

  const tareasOk = tareasTotal > 0 && tareasCompletadas === tareasTotal;
  const diagSubido = !!diagnostico;
  const diagPublicado = diagnostico?.estado === "publicado";
  const presSubido = !!presentacion;
  const presPublicado = presentacion?.estado === "publicado";

  if (yaEntregado || (diagPublicado && presPublicado)) {
    return (
      <div className="rounded-md border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <PartyPopper className="h-5 w-5" />
          <h3 className="font-display text-base font-semibold">
            Entregado al cliente
          </h3>
        </div>
        <p className="mt-1 font-body text-sm text-green-700 dark:text-green-300">
          Los entregables están publicados y visibles para el cliente. El SLA se contabiliza como cumplido.
        </p>
      </div>
    );
  }

  const items: ItemCheck[] = [
    {
      label: `Tareas de análisis completadas (${tareasCompletadas}/${tareasTotal})`,
      ok: tareasOk,
      pendiente:
        tareasTotal === 0
          ? "No hay tareas configuradas"
          : `Faltan ${tareasTotal - tareasCompletadas} tareas`,
    },
    {
      label: "Entregable Diagnóstico inmobiliario subido",
      ok: diagSubido,
      pendiente: "Subir el documento o link en la sección Entregables maestros",
    },
    {
      label: "Entregable Presentación al cliente subido",
      ok: presSubido,
      pendiente: "Subir el documento o link en la sección Entregables maestros",
    },
  ];

  const todoListoParaPublicar = diagSubido && presSubido;
  const cosasFaltantes = items.filter((i) => !i.ok);

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="font-display text-base font-semibold text-foreground">
        Estado de entrega
      </h3>
      <p className="mt-1 font-body text-sm text-muted-foreground">
        {todoListoParaPublicar
          ? "Todo listo. Solo marca como entregado para que el cliente lo vea."
          : `Faltan ${cosasFaltantes.length} ${
              cosasFaltantes.length === 1 ? "paso" : "pasos"
            } para poder entregar al cliente.`}
      </p>

      <ul className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            {item.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1">
              <span
                className={`font-body text-sm ${
                  item.ok ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {!item.ok && (
                <p className="mt-0.5 font-body text-xs text-muted-foreground">
                  {item.pendiente}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {((diagSubido && !diagPublicado) || (presSubido && !presPublicado)) && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-700 dark:text-yellow-300" />
          <p className="font-body text-xs text-yellow-900 dark:text-yellow-200">
            {diagSubido && !diagPublicado && presSubido && !presPublicado
              ? "El Diagnóstico y la Presentación están subidos pero en borrador (no visibles al cliente). "
              : diagSubido && !diagPublicado
                ? "El Diagnóstico está subido pero en borrador (no visible al cliente). "
                : "La Presentación está subida pero en borrador (no visible al cliente). "}
            Al marcar como entregado, se publicará automáticamente.
          </p>
        </div>
      )}

      {puedeMarcar && (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              className="mt-4 w-full sm:w-auto"
              disabled={!todoListoParaPublicar || marcarEntregado.isPending}
            >
              {marcarEntregado.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Marcar como entregado al cliente
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Marcar este engagement como entregado?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>Esta acción:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Publica el Diagnóstico y la Presentación (los hace visibles al cliente).</li>
                    <li>Marca el engagement como "entregado".</li>
                    <li>El SLA se calcula como cumplido a partir de este momento.</li>
                  </ul>
                  <p className="text-xs">
                    No se puede revertir desde aquí (requiere despublicar manualmente).
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  marcarEntregado.mutate({
                    engagementId,
                    entregableDiagnosticoId: !diagPublicado ? diagnostico?.id ?? null : null,
                    entregablePresentacionId: !presPublicado ? presentacion?.id ?? null : null,
                  });
                  setDialogOpen(false);
                }}
              >
                Sí, marcar como entregado
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ChecklistEntrega;

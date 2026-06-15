import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
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
import EngagementHeader from "@/components/portafolio/EngagementHeader";
import TareasAnalisisList from "@/components/portafolio/TareasAnalisisList";
import TarjetasMaestros from "@/components/portafolio/TarjetasMaestros";
import { ChecklistEntrega } from "@/components/portafolio/ChecklistEntrega";
import { useEngagementDetalle } from "@/hooks/useEngagementDetalle";
import { useTareasEngagement } from "@/hooks/useTareasEngagement";
import { useActivarEngagement } from "@/hooks/useEngagements";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEntregablesEngagement,
  separarEntregables,
} from "@/hooks/useEntregablesEngagement";
import SeccionEntregables from "@/components/entregables/SeccionEntregables";
import CrearOrdenServicioDialog from "@/components/ordenes/CrearOrdenServicioDialog";
import GenerarLinkPagoDialog from "@/components/portafolio/GenerarLinkPagoDialog";
import FichaConfigDialog from "@/components/lotes/FichaConfigDialog";
import { useUltimaTransaccionEngagement } from "@/hooks/useUltimaTransaccionEngagement";

import { ClipboardList, CreditCard, FileText } from "lucide-react";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";

const EngagementDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: engagement, isLoading, error } = useEngagementDetalle(id);
  const { data: tareas, isLoading: loadingTareas } = useTareasEngagement(id);
  const { data: entregables } = useEntregablesEngagement(id);
  const { isSuperAdmin, isAdminOrAsesor, roles } = useAuth();
  const isAdmin = isSuperAdmin || roles.some((r) => r === "admin");
  const activar = useActivarEngagement();
  const { data: ultimaTrans } = useUltimaTransaccionEngagement(id);

  const puedeSubir = isSuperAdmin || isAdminOrAsesor;
  const [ordenOpen, setOrdenOpen] = useState(false);
  const [linkPagoOpen, setLinkPagoOpen] = useState(false);
  const [fichaConfigOpen, setFichaConfigOpen] = useState(false);


  const { diagnostico, presentacion, ligadosPorAnalisis, sueltos } = useMemo(
    () => separarEntregables(entregables ?? []),
    [entregables],
  );

  const estadoAct = engagement?.estado_activacion ?? "activo";
  const enBorrador = estadoAct === "borrador";
  const pendientePago = estadoAct === "pendiente_pago";
  const puedeGenerarLink = isAdmin && (enBorrador || pendientePago);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : error || !engagement ? (
          <Card className="flex flex-col items-center gap-3 py-12">
            <p className="font-body text-muted-foreground">
              Engagement no encontrado.
            </p>
            <Button onClick={() => navigate("/dashboard/portafolio")}>
              Volver al portafolio
            </Button>
          </Card>
        ) : (
          <>
            <EngagementHeader engagement={engagement} />

            {(isSuperAdmin || isAdminOrAsesor) && (
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {puedeGenerarLink && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLinkPagoOpen(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" /> Generar link de pago
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setOrdenOpen(true)}>
                  <ClipboardList className="mr-2 h-4 w-4" /> + Crear orden de servicio
                </Button>
                {engagement?.lote_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFichaConfigOpen(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Ver ficha del lote
                  </Button>
                )}
              </div>
            )}

            {enBorrador && (
              <div className="mt-6 rounded-md border border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-950/30">
                <div className="flex items-start gap-3 text-yellow-900 dark:text-yellow-200">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <p className="font-body text-sm">
                      Este engagement está en <strong>BORRADOR</strong>. Las tareas y
                      el SLA aún no han iniciado. Un Super Admin debe activarlo
                      para que los expertos puedan trabajar.
                    </p>
                    {isSuperAdmin ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" disabled={activar.isPending}>
                            {activar.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Activar engagement
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Activar engagement?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Al activar se crearán las tareas del plan, comenzará
                              a contar el SLA y los expertos podrán empezar. Esta
                              acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => activar.mutate(engagement.id)}
                            >
                              Activar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <p className="font-body text-xs">
                        Solicita a un Super Admin que active este engagement.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {pendientePago && (
              <div className="mt-6 rounded-md border border-blue-300 bg-blue-50 p-4 dark:bg-blue-950/30">
                <div className="flex items-start gap-3 text-blue-900 dark:text-blue-200">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-body text-sm">
                      Esperando confirmación de pago. El engagement se activará
                      automáticamente cuando se confirme.
                    </p>
                    {ultimaTrans && (
                      <p className="font-body text-xs opacity-80">
                        Última transacción: <strong>{ultimaTrans.estado}</strong>
                        {" · "}
                        {new Date(ultimaTrans.fecha_creacion).toLocaleString("es-CO")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            <Separator className="my-6" />

            <ChecklistEntrega
              engagementId={id!}
              estadoEngagement={engagement.estado}
              diagnostico={diagnostico}
              presentacion={presentacion}
              tareasCompletadas={
                (tareas ?? []).filter(
                  (t) => t.estado === "entregado" || t.estado === "aprobado",
                ).length
              }
              tareasTotal={
                (tareas ?? []).filter((t) => t.estado !== "no_aplica").length
              }
              yaEntregado={engagement.estado === "entregado"}
              puedeMarcar={puedeSubir}
            />

            <Separator className="my-6" />

            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
              Entregables maestros
            </h2>
            <TarjetasMaestros
              engagementId={id!}
              diagnostico={diagnostico}
              presentacion={presentacion}
              puedeSubir={puedeSubir}
            />


            <Separator className="my-6" />

            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
              Tareas de análisis
            </h2>
            {loadingTareas ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <TareasAnalisisList
                tareas={tareas ?? []}
                engagementId={id!}
                ligadosPorAnalisis={ligadosPorAnalisis}
                puedeSubir={puedeSubir}
              />
            )}
            <p className="mt-6 font-body text-xs text-muted-foreground">
              Cambiar el estado de una tarea actualiza automáticamente el avance del engagement.
            </p>

            <Separator className="my-6" />

            <SeccionEntregables
              engagementId={id!}
              mostrarAvanceAlCliente={engagement.mostrar_avance_al_cliente}
              entregables={sueltos}
              titulo="Otros documentos"
              emptyText="No hay otros documentos. Usa el botón + Archivo en cada análisis para subir soportes."
            />
          </>
        )}
      </div>
      {engagement && (
        <>
          <CrearOrdenServicioDialog
            open={ordenOpen}
            onOpenChange={setOrdenOpen}
            loteId={engagement.lote_id}
            engagementId={engagement.id}
          />
          <GenerarLinkPagoDialog
            open={linkPagoOpen}
            onOpenChange={setLinkPagoOpen}
            engagement={engagement as any}
          />
          {engagement.lote_id && (
            <FichaConfigDialog
              open={fichaConfigOpen}
              onOpenChange={setFichaConfigOpen}
              loteId={engagement.lote_id}
              loteNombre={(engagement as any).lote_nombre ?? undefined}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default EngagementDetalle;

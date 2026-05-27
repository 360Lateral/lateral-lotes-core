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

import { ClipboardList } from "lucide-react";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";

const EngagementDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: engagement, isLoading, error } = useEngagementDetalle(id);
  const { data: tareas, isLoading: loadingTareas } = useTareasEngagement(id);
  const { data: entregables } = useEntregablesEngagement(id);
  const { isSuperAdmin, isAdminOrAsesor } = useAuth();
  const activar = useActivarEngagement();

  const puedeSubir = isSuperAdmin || isAdminOrAsesor;
  const [ordenOpen, setOrdenOpen] = useState(false);

  const { diagnostico, presentacion, ligadosPorAnalisis, sueltos } = useMemo(
    () => separarEntregables(entregables ?? []),
    [entregables],
  );

  const estadoAct = engagement?.estado_activacion ?? "activo";
  const enBorrador = estadoAct === "borrador";
  const pendientePago = estadoAct === "pendiente_pago";

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
              <div className="mt-4 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setOrdenOpen(true)}>
                  <ClipboardList className="mr-2 h-4 w-4" /> + Crear orden de servicio
                </Button>
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
                  <p className="font-body text-sm">
                    Esperando confirmación de pago. El engagement se activará
                    automáticamente cuando se confirme.
                  </p>
                </div>
              </div>
            )}

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
    </DashboardLayout>
  );
};

export default EngagementDetalle;

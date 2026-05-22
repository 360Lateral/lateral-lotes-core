import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import EngagementHeader from "@/components/portafolio/EngagementHeader";
import TareasAnalisisList from "@/components/portafolio/TareasAnalisisList";
import { useEngagementDetalle } from "@/hooks/useEngagementDetalle";
import { useTareasEngagement } from "@/hooks/useTareasEngagement";

const EngagementDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: engagement, isLoading, error } = useEngagementDetalle(id);
  const { data: tareas, isLoading: loadingTareas } = useTareasEngagement(id);

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
              <TareasAnalisisList tareas={tareas ?? []} engagementId={id!} />
            )}
            <p className="mt-6 font-body text-xs text-muted-foreground">
              Cambiar el estado de una tarea actualiza automáticamente el avance del engagement.
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EngagementDetalle;

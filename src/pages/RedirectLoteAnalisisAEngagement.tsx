import { useParams, Navigate, Link } from "react-router-dom";
import { useEngagementActivoDelLote } from "@/hooks/useEngagementActivoDelLote";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowRight } from "lucide-react";

const RedirectLoteAnalisisAEngagement = () => {
  const { id: loteId } = useParams<{ id: string }>();
  const { data: engagementId, isLoading, error } = useEngagementActivoDelLote(loteId);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (engagementId) {
    return <Navigate to={`/dashboard/engagements/${engagementId}`} replace />;
  }

  return (
    <DashboardLayout>
      <Card className="mx-auto mt-8 max-w-xl p-8 text-center">
        <FileQuestion className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="font-display text-xl font-bold text-foreground">
          Este lote no tiene engagement activo
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El análisis 360° vive dentro del engagement del lote. Crea uno para empezar
          a capturar y gestionar los análisis técnicos.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button asChild>
            <Link to={`/dashboard/lotes/${loteId}/editar`}>
              Ir al lote para crear engagement
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/lotes">Volver a lotes</Link>
          </Button>
        </div>
        {error && (
          <p className="mt-4 text-xs text-destructive">
            Error al consultar engagement: {String(error)}
          </p>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default RedirectLoteAnalisisAEngagement;

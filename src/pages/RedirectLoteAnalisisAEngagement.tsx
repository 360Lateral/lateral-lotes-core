import { useState } from "react";
import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { useEngagementActivoDelLote } from "@/hooks/useEngagementActivoDelLote";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowRight } from "lucide-react";
import CrearEngagementDialog from "@/components/portafolio/CrearEngagementDialog";
import { useAuth } from "@/contexts/AuthContext";

const RedirectLoteAnalisisAEngagement = () => {
  const { id: loteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { roles } = useAuth();
  const canCreate = roles.some((r) => ["experto", "admin", "super_admin"].includes(r));
  const [dialogOpen, setDialogOpen] = useState(false);
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
          El análisis 360° vive dentro del engagement del lote.
          {canCreate
            ? " Crea uno para empezar a capturar y gestionar los análisis técnicos."
            : " Pide a un asesor o administrador que cree el engagement para iniciar el análisis."}
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          {canCreate && (
            <Button onClick={() => setDialogOpen(true)}>
              Crear engagement ahora
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
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

      {loteId && canCreate && (
        <CrearEngagementDialog
          loteId={loteId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={(id) => navigate(`/dashboard/engagements/${id}`)}
        />
      )}
    </DashboardLayout>
  );
};

export default RedirectLoteAnalisisAEngagement;

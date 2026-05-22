import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { usePortafolioKpis } from "@/hooks/usePortafolioKpis";
import PortafolioKpiCards from "@/components/portafolio/PortafolioKpiCards";
import DistribucionPlanesChart from "@/components/portafolio/DistribucionPlanesChart";
import DistribucionEstadosChart from "@/components/portafolio/DistribucionEstadosChart";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const PortafolioDashboard = () => {
  const { isAdminOrAsesor, loading } = useAuth();
  const { data, isLoading, error, refetch } = usePortafolioKpis();

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground font-body">Cargando...</p>
      </DashboardLayout>
    );
  }

  if (!isAdminOrAsesor) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-body text-xl font-bold text-foreground">
          Tablero de portafolio
        </h1>
        <p className="mt-1 font-body text-sm text-muted-foreground">
          Estado de los diagnósticos por lote
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6">
          <p className="font-body text-sm text-destructive">
            No se pudieron cargar los KPIs. Inténtalo de nuevo.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <PortafolioKpiCards kpis={data} isLoading={isLoading} />

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DistribucionPlanesChart data={data?.engagements_por_plan ?? []} />
            <DistribucionEstadosChart data={data?.engagements_por_estado ?? []} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default PortafolioDashboard;

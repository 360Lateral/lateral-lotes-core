import { useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTendenciaMensual } from "@/hooks/useTendenciaMensual";
import { useRankingAsesores } from "@/hooks/useRankingAsesores";
import { useEmbudoConversion } from "@/hooks/useEmbudoConversion";
import SelectorPeriodo from "@/components/metricas/SelectorPeriodo";
import GraficoTendencia from "@/components/metricas/GraficoTendencia";
import CardsComparativas from "@/components/metricas/CardsComparativas";
import ResumenPeriodo from "@/components/metricas/ResumenPeriodo";
import TablaRankingAsesores from "@/components/metricas/TablaRankingAsesores";
import EmbudoConversion from "@/components/metricas/EmbudoConversion";

const MetricasEjecutivas = () => {
  const { roles, loading } = useAuth();
  const [mesesAtras, setMesesAtras] = useState(12);
  const { data = [], isLoading, error, refetch } = useTendenciaMensual(mesesAtras);
  const { data: rankingData = [], isLoading: rankingLoading } = useRankingAsesores(mesesAtras);
  const { data: embudoData = [], isLoading: embudoLoading } = useEmbudoConversion(mesesAtras);

  const isAdmin = roles.some((r) => r === "admin" || r === "super_admin");

  if (loading) {
    return (
      <DashboardLayout>
        <p className="font-body text-muted-foreground">Cargando...</p>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-body text-xl font-bold text-foreground">
            Métricas ejecutivas
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Tendencias y comparativos del portafolio
          </p>
        </div>
        <SelectorPeriodo value={mesesAtras} onChange={setMesesAtras} />
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-body text-sm text-destructive">
              No se pudieron cargar las métricas: {(error as Error).message}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[340px] w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <ResumenPeriodo data={data} mesesAtras={mesesAtras} />
          <div className="mt-6">
            <GraficoTendencia data={data} />
          </div>
          <div className="mt-6">
            <CardsComparativas data={data} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default MetricasEjecutivas;

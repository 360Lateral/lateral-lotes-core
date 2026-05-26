import { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { usePortafolioKpis } from "@/hooks/usePortafolioKpis";
import {
  useVistaPortafolio,
  type PortafolioFiltrosUI,
  type PortafolioVistaFila,
} from "@/hooks/useVistaPortafolio";
import PortafolioKpiCards from "@/components/portafolio/PortafolioKpiCards";
import DistribucionPlanesChart from "@/components/portafolio/DistribucionPlanesChart";
import DistribucionEstadosChart from "@/components/portafolio/DistribucionEstadosChart";
import FiltrosPortafolio from "@/components/portafolio/FiltrosPortafolio";
import TablaPortafolio from "@/components/portafolio/TablaPortafolio";
import PaginacionControles from "@/components/portafolio/PaginacionControles";
import { useAuth } from "@/contexts/AuthContext";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  prospecto: "Prospecto",
  en_progreso: "En progreso",
  activo: "Activo",
  en_revision: "En revisión",
  entregado: "Entregado",
  cancelado: "Cancelado",
  cerrado: "Cerrado",
};

const SEMAFORO_LABEL: Record<string, string> = {
  verde: "Verde",
  amarillo: "Amarillo",
  ambar: "Amarillo",
  rojo: "Rojo",
};

const escapeCsv = (val: unknown) => {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const exportarCsv = (filas: PortafolioVistaFila[]) => {
  const headers = [
    "Lote",
    "Dirección",
    "Ciudad",
    "Plan",
    "Cliente",
    "Asesor",
    "Estado",
    "Avance %",
    "SLA",
    "Días para SLA",
    "Días en gestión",
  ];
  const rows = filas.map((f) => [
    f.lote_nombre ?? "",
    f.lote_barrio ?? "",
    f.lote_ciudad ?? "",
    f.plan_nombre ?? f.plan_codigo ?? "",
    f.cliente_nombre ?? "",
    f.asesor_nombre ?? "",
    ESTADO_LABEL[f.estado] ?? f.estado,
    Number(f.avance_pct ?? 0).toFixed(0),
    f.semaforo_sla ? SEMAFORO_LABEL[f.semaforo_sla] ?? f.semaforo_sla : "",
    f.dias_para_sla ?? "",
    f.dias_en_gestion ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map(escapeCsv).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `portafolio_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const PortafolioDashboard = () => {
  const { isAdminOrAsesor, loading } = useAuth();
  const { data: kpis, isLoading: kpisLoading, error: kpisError, refetch } =
    usePortafolioKpis();

  const [filtros, setFiltros] = useState<PortafolioFiltrosUI>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: filas = [], isLoading: filasLoading } = useVistaPortafolio(filtros);

  const handleChangeFiltros = (f: PortafolioFiltrosUI) => {
    setFiltros(f);
    setPage(1);
  };

  const paginadas = useMemo(
    () => filas.slice((page - 1) * pageSize, page * pageSize),
    [filas, page, pageSize],
  );

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

      {kpisError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6">
          <p className="font-body text-sm text-destructive">
            No se pudieron cargar los KPIs. Inténtalo de nuevo.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <PortafolioKpiCards kpis={kpis} isLoading={kpisLoading} />

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DistribucionPlanesChart data={kpis?.engagements_por_plan ?? []} />
            <DistribucionEstadosChart data={kpis?.engagements_por_estado ?? []} />
          </div>

          <div className="mt-6 space-y-4">
            <FiltrosPortafolio filtros={filtros} onChangeFiltros={handleChangeFiltros} />

            <div className="flex items-center justify-between">
              <h2 className="font-body text-lg font-semibold text-foreground">
                Engagements activos
                <span className="ml-2 font-body text-sm font-normal text-muted-foreground">
                  ({filas.length})
                </span>
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarCsv(filas)}
                disabled={filas.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            <TablaPortafolio filas={paginadas} isLoading={filasLoading} />

            <PaginacionControles
              total={filas.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default PortafolioDashboard;

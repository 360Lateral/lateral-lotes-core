import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Upload,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Inbox,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import KanbanPortafolio from "@/components/portafolio/KanbanPortafolio";
import PaginacionControles from "@/components/portafolio/PaginacionControles";
import { EmptyState } from "@/components/ui/EmptyState";
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

const KEY_VISTA = "portafolio_vista";
const KEY_ORDEN = "portafolio_orden";
const KEY_MOSTRAR_CERRADOS = "portafolio_mostrar_cerrados";

type Vista = "tabla" | "kanban";
type Orden = "urgencia" | "dias-gestion-desc" | "avance-asc" | "sla-asc";

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
    "Experto",
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
  const { isAdminOrAsesor, isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { data: kpis, isLoading: kpisLoading, error: kpisError, refetch } =
    usePortafolioKpis();

  const [filtros, setFiltros] = useState<PortafolioFiltrosUI>({});
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [vista, setVista] = useState<Vista>(() => {
    try {
      return (localStorage.getItem(KEY_VISTA) as Vista) ?? "tabla";
    } catch {
      return "tabla";
    }
  });
  const [orden, setOrden] = useState<Orden>(() => {
    try {
      return (localStorage.getItem(KEY_ORDEN) as Orden) ?? "urgencia";
    } catch {
      return "urgencia";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY_VISTA, vista);
    } catch {}
  }, [vista]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_ORDEN, orden);
    } catch {}
  }, [orden]);

  const { data: filas = [], isLoading: filasLoading } = useVistaPortafolio(filtros);

  const filtrosActivosCount =
    (filtros.plan?.length ?? 0) +
    (filtros.estado?.length ?? 0) +
    (filtros.estado_activacion?.length ?? 0) +
    (filtros.semaforo?.length ?? 0) +
    (filtros.asesor_id ? 1 : 0);

  const filasFiltradasYOrdenadas = useMemo(() => {
    let r = [...filas];
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      r = r.filter(
        (f) =>
          (f.lote_nombre ?? "").toLowerCase().includes(q) ||
          (f.cliente_nombre ?? "").toLowerCase().includes(q) ||
          (f.asesor_nombre ?? "").toLowerCase().includes(q) ||
          (f.lote_ciudad ?? "").toLowerCase().includes(q),
      );
    }
    r.sort((a, b) => {
      if (orden === "urgencia") {
        const ua =
          a.dias_para_sla != null && Number(a.dias_para_sla) < 0
            ? -1000 + Number(a.dias_para_sla)
            : Number(a.dias_para_sla ?? 9999);
        const ub =
          b.dias_para_sla != null && Number(b.dias_para_sla) < 0
            ? -1000 + Number(b.dias_para_sla)
            : Number(b.dias_para_sla ?? 9999);
        return ua - ub;
      }
      if (orden === "dias-gestion-desc")
        return Number(b.dias_en_gestion ?? 0) - Number(a.dias_en_gestion ?? 0);
      if (orden === "avance-asc")
        return Number(a.avance_pct ?? 0) - Number(b.avance_pct ?? 0);
      if (orden === "sla-asc")
        return Number(a.dias_para_sla ?? 9999) - Number(b.dias_para_sla ?? 9999);
      return 0;
    });
    return r;
  }, [filas, busqueda, orden]);

  useEffect(() => {
    setPage(1);
  }, [filtros, busqueda, orden]);

  const paginadas = useMemo(
    () =>
      filasFiltradasYOrdenadas.slice((page - 1) * pageSize, page * pageSize),
    [filasFiltradasYOrdenadas, page, pageSize],
  );

  const enRiesgo = useMemo(
    () =>
      filas.filter(
        (f) =>
          f.semaforo_sla === "rojo" ||
          f.semaforo_sla === "amarillo" ||
          f.semaforo_sla === "ambar",
      ).length,
    [filas],
  );
  const atrasados = useMemo(
    () =>
      filas.filter(
        (f) => f.dias_para_sla != null && Number(f.dias_para_sla) < 0,
      ).length,
    [filas],
  );
  const sinAsesor = useMemo(
    () => filas.filter((f) => !f.asesor_nombre).length,
    [filas],
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

  const noResultados =
    !filasLoading && filasFiltradasYOrdenadas.length === 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-body text-xl font-bold text-foreground">
            Tablero de portafolio
          </h1>
          <p className="mt-1 font-body text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {filas.length} engagements activos
            </span>
            {atrasados > 0 && (
              <>
                {" · "}
                <span className="font-medium text-destructive">
                  {atrasados} atrasados
                </span>
              </>
            )}
            {enRiesgo > 0 && (
              <>
                {" · "}
                <span className="font-medium text-primary">
                  {enRiesgo} con SLA en riesgo
                </span>
              </>
            )}
            {sinAsesor > 0 && (
              <>
                {" · "}
                <span className="font-medium text-muted-foreground">
                  {sinAsesor} sin asesor asignado
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportarCsv(filasFiltradasYOrdenadas)}
            disabled={filasFiltradasYOrdenadas.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/engagements/importar")}
            >
              <Upload className="h-4 w-4" />
              Importar histórico
            </Button>
          )}
        </div>
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

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DistribucionPlanesChart data={kpis?.engagements_por_plan ?? []} />
            <DistribucionEstadosChart data={kpis?.engagements_por_estado ?? []} />
          </div>

          {/* Toolbar */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por lote, cliente o asesor..."
                className="h-9 pl-8 text-sm"
              />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {filtrosActivosCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {filtrosActivosCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FiltrosPortafolio
                    filtros={filtros}
                    onChangeFiltros={setFiltros}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Select value={orden} onValueChange={(v) => setOrden(v as Orden)}>
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgencia">Por urgencia</SelectItem>
                <SelectItem value="dias-gestion-desc">Más días en gestión</SelectItem>
                <SelectItem value="avance-asc">Menor avance</SelectItem>
                <SelectItem value="sla-asc">SLA más cercano</SelectItem>
              </SelectContent>
            </Select>

            <div className="inline-flex rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setVista("tabla")}
                className={`p-1.5 ${vista === "tabla" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground"}`}
                aria-label="Vista tabla"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVista("kanban")}
                className={`p-1.5 ${vista === "kanban" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground"}`}
                aria-label="Vista kanban"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            {noResultados ? (
              <EmptyState
                icon={Inbox}
                title={
                  busqueda || filtrosActivosCount > 0
                    ? "Sin resultados con estos filtros"
                    : "Sin engagements activos"
                }
                description={
                  busqueda || filtrosActivosCount > 0
                    ? "Ajusta los filtros o la búsqueda."
                    : "Aún no hay engagements en el sistema."
                }
                action={
                  busqueda || filtrosActivosCount > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBusqueda("");
                        setFiltros({});
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  ) : undefined
                }
              />
            ) : vista === "tabla" ? (
              <>
                <TablaPortafolio filas={paginadas} isLoading={filasLoading} />
                <div className="mt-3">
                  <PaginacionControles
                    total={filasFiltradasYOrdenadas.length}
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
            ) : (
              <KanbanPortafolio filas={filasFiltradasYOrdenadas} />
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default PortafolioDashboard;

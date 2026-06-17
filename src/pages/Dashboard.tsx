import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle2,
  Send,
  Clock,
  Users,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  Building2,
} from "lucide-react";
import KPIEstado from "@/components/ui/KPIEstado";
import BulkActionsBar from "@/components/ui/BulkActionsBar";
import { LoteCardUnificada } from "@/components/dashboard/LoteCardUnificada";
import { LoteDetalleDrawer } from "@/components/dashboard/LoteDetalleDrawer";
import { FiltrosAvanzadosLotesSheet } from "@/components/dashboard/FiltrosAvanzadosLotesSheet";
import { DropdownPropietario } from "@/components/dashboard/DropdownPropietario";
import { CardPropietario } from "@/components/dashboard/CardPropietario";
import { usePropietariosConActivos } from "@/hooks/usePropietariosConActivos";
import {
  useLotesUnificados,
  useResumenLeads,
  useResumenEngagementsPorEstado,
  type LoteUnificado,
  type FiltroLoteUnif,
  type FiltrosUnificados,
} from "@/hooks/useDashboardUnificado";
import { useFiltroOpcionesDisponibles } from "@/hooks/useFiltroOpcionesDisponibles";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatoRelativo } from "@/lib/format";

const FILTROS: { v: FiltroLoteUnif; label: string }[] = [
  { v: "todos", label: "Todos" },
  { v: "con_engagement", label: "Con engagement" },
  { v: "por_validar", label: "Por validar" },
  { v: "en_venta", label: "En venta" },
  { v: "sin_asesor", label: "Sin asesor" },
];

const STORAGE_KEY = "dashboard_filtros_avanzados";

const ChipActivo = ({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) => (
  <button
    type="button"
    onClick={onRemove}
    className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/25"
  >
    {children}
    <X className="h-2.5 w-2.5" />
  </button>
);

const cargarFiltrosIniciales = (): FiltrosUnificados => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { filtro: "todos" };
};

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const nombre =
    (user?.user_metadata as any)?.full_name?.split(" ")?.[0] ?? "admin";

  const [filtros, setFiltros] = useState<FiltrosUnificados>(cargarFiltrosIniciales);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vista, setVista] = useState<"grid" | "tabla" | "por_propietario">("grid");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [drawerLote, setDrawerLote] = useState<LoteUnificado | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtros));
    } catch {}
  }, [filtros]);

  const setBusqueda = (busqueda: string) =>
    setFiltros((p) => ({ ...p, busqueda }));
  const setFiltro = (filtro: FiltroLoteUnif) =>
    setFiltros((p) => ({ ...p, filtro }));
  const busqueda = filtros.busqueda ?? "";
  const filtro = filtros.filtro ?? "todos";

  const { data: lotes = [], isLoading } = useLotesUnificados(filtros);
  const { data: opciones } = useFiltroOpcionesDisponibles();
  const { data: resumenLeads } = useResumenLeads();
  const { data: resumenEngagements } = useResumenEngagementsPorEstado();
  const { data: propietarios = [] } = usePropietariosConActivos();

  const propietarioSeleccionado = filtros.propietarioId
    ? propietarios.find((p) => p.id === filtros.propietarioId) ?? null
    : null;

  const filtrosAvanzadosActivos = useMemo(() => {
    let n = 0;
    n += filtros.ciudades?.length ?? 0;
    n += filtros.barrios?.length ?? 0;
    n += filtros.tipos?.length ?? 0;
    n += filtros.categoriaArea?.length ?? 0;
    if (filtros.areaMin != null) n += 1;
    if (filtros.areaMax != null) n += 1;
    if (filtros.precioMin != null) n += 1;
    if (filtros.precioMax != null) n += 1;
    n += filtros.estratos?.length ?? 0;
    n += filtros.estadosPublicacion?.length ?? 0;
    n += filtros.estadoDisponibilidad?.length ?? 0;
    if (filtros.soloPublicos) n += 1;
    if (filtros.soloDestacados) n += 1;
    n += filtros.planesCodigos?.length ?? 0;
    n += filtros.estadosEngagement?.length ?? 0;
    n += filtros.asesoresIds?.length ?? 0;
    n += filtros.slaEstados?.length ?? 0;
    if (filtros.conEntregablesBorrador) n += 1;
    if (filtros.scoreMin != null && filtros.scoreMin > 0) n += 1;
    if (filtros.conResolutoria) n += 1;
    if (filtros.propietarioId) n += 1;
    if (filtros.conLeadsActivos) n += 1;
    if (filtros.leadsMinimo != null) n += 1;
    if (filtros.creadoDesde) n += 1;
    if (filtros.creadoHasta) n += 1;
    if (filtros.ultimaActividadDias) n += 1;
    return n;
  }, [filtros]);

  const limpiarAvanzados = () =>
    setFiltros({ busqueda: filtros.busqueda, filtro: filtros.filtro });

  const removerArrayItem = <K extends keyof FiltrosUnificados>(
    key: K,
    item: any,
  ) =>
    setFiltros((p) => {
      const arr = (p[key] as any[] | undefined) ?? [];
      const next = arr.filter((x) => x !== item);
      return { ...p, [key]: next.length ? next : undefined };
    });

  const removerCampo = (key: keyof FiltrosUnificados) =>
    setFiltros((p) => ({ ...p, [key]: undefined }));

  const nombreAsesor = (id: string) =>
    opciones?.asesores.find((a) => a.id === id)?.nombre ?? id.slice(0, 6);
  const nombrePropietario = (id: string) =>
    id === "__sin__"
      ? "Sin propietario"
      : opciones?.propietarios.find((p) => p.id === id)?.nombre ?? id.slice(0, 6);
  const nombrePlan = (cod: string) =>
    opciones?.planes.find((p) => p.codigo === cod)?.nombre ?? cod;

  const atrasados = useMemo(
    () => lotes.filter((l) => l.sla_estado === "atrasado" && !l.sla_cumplido).length,
    [lotes],
  );
  const pendientesPublicar = useMemo(
    () => lotes.filter((l) => l.tiene_entregables_borrador && !l.sla_cumplido).length,
    [lotes],
  );
  const enRiesgo = useMemo(
    () =>
      lotes.filter(
        (l) => l.sla_estado === "riesgo_fecha" || l.sla_estado === "riesgo_ritmo",
      ).length,
    [lotes],
  );
  const cumplidos = useMemo(() => lotes.filter((l) => l.sla_cumplido).length, [lotes]);
  const sinAsesor = useMemo(
    () => lotes.filter((l) => l.engagement_id && !l.asesor_id).length,
    [lotes],
  );

  const contadores = useMemo(
    () => ({
      todos: lotes.length,
      con_engagement: lotes.filter((l) => !!l.engagement_id).length,
      por_validar: lotes.filter((l) => l.estado_publicacion === "pendiente_validacion")
        .length,
      en_venta: lotes.filter(
        (l) => l.publicado_venta && l.estado_publicacion === "aprobado",
      ).length,
      sin_asesor: sinAsesor,
      atrasados,
    }),
    [lotes, sinAsesor, atrasados],
  );

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const panorama = useMemo(() => {
    const partes: string[] = [];
    if (propietarioSeleccionado) {
      partes.push(
        `${lotes.length} ${lotes.length === 1 ? "lote" : "lotes"} de ${propietarioSeleccionado.nombre}`,
      );
      if (atrasados > 0) partes.push(`${atrasados} atrasados`);
      if (pendientesPublicar > 0) partes.push(`${pendientesPublicar} pendientes de publicar`);
      return partes.join(" · ");
    }
    if (atrasados > 0)
      partes.push(
        `${atrasados} ${
          atrasados === 1 ? "engagement requiere" : "engagements requieren"
        } atención`,
      );
    partes.push(`${lotes.length} lotes activos`);
    if (resumenLeads?.nuevos)
      partes.push(`${resumenLeads.nuevos} leads sin asignar`);
    return partes.join(", ");
  }, [propietarioSeleccionado, atrasados, pendientesPublicar, lotes.length, resumenLeads?.nuevos]);

  const handleExportar = () =>
    toast({ title: "Exportar", description: "Próximamente disponible." });

  const tipoFiltroDestacado = (v: FiltroLoteUnif) => filtro === v;

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="mb-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              Hola {nombre}, este es tu panorama
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{panorama}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => navigate("/dashboard/lotes/nuevo")}>
              <Plus className="mr-1.5 h-4 w-4" /> Nuevo lote
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportar}>
              <Download className="mr-1.5 h-4 w-4" /> Reporte
            </Button>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <KPIEstado
            label="Atrasados"
            value={atrasados}
            icon={AlertTriangle}
            colorClass="text-destructive"
            destacado={atrasados > 0}
            onClick={() => setFiltro("atrasados")}
          />
          <KPIEstado
            label="Por publicar"
            value={pendientesPublicar}
            icon={Send}
            colorClass="text-primary"
            destacado={pendientesPublicar > 0}
            onClick={() => setFiltro("con_engagement")}
          />
          <KPIEstado
            label="En riesgo"
            value={enRiesgo}
            icon={Clock}
            colorClass="text-amber-600"
            onClick={() => setFiltro("con_engagement")}
          />
          <KPIEstado
            label="Cumplidos"
            value={cumplidos}
            icon={CheckCircle2}
            colorClass="text-green-600"
          />
          <KPIEstado
            label="Sin asesor"
            value={sinAsesor}
            icon={Users}
            colorClass="text-foreground"
            destacado={sinAsesor > 0}
            onClick={() => setFiltro("sin_asesor")}
          />
        </section>
      </header>

      {/* Banda de alertas */}
      {atrasados + pendientesPublicar > 0 && (
        <section
          className="mb-3 flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2"
          style={{ borderLeftWidth: 3, borderLeftColor: "hsl(var(--destructive))" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Acciones urgentes hoy
            </p>
            <p className="text-[11px] text-muted-foreground">
              {atrasados > 0 &&
                `${atrasados} ${
                  atrasados === 1 ? "engagement atrasado" : "engagements atrasados"
                }`}
              {atrasados > 0 && pendientesPublicar > 0 && " · "}
              {pendientesPublicar > 0 &&
                `${pendientesPublicar} pendientes de publicar`}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFiltro(atrasados > 0 ? "atrasados" : "con_engagement")}
          >
            Ver
          </Button>
        </section>
      )}

      {/* Banner Vista del propietario */}
      {propietarioSeleccionado && (
        <section
          className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-blue-300 bg-blue-50 px-3 py-2"
          style={{ borderLeftWidth: 3 }}
        >
          <Building2 className="h-4 w-4 shrink-0 text-blue-700" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-900">
              Vista del propietario: {propietarioSeleccionado.nombre}
            </p>
            <p className="text-[11px] text-blue-800">
              {propietarioSeleccionado.total_lotes} lotes ·{" "}
              {propietarioSeleccionado.lotes_con_engagement} en gestión ·{" "}
              {propietarioSeleccionado.total_leads} leads
              {propietarioSeleccionado.engagements_atrasados > 0 && (
                <>
                  {" "}· <span className="font-semibold text-destructive">
                    {propietarioSeleccionado.engagements_atrasados} atrasados
                  </span>
                </>
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFiltros({ ...filtros, propietarioId: undefined })}
          >
            Volver a todos
          </Button>
        </section>
      )}

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <DropdownPropietario
          propietarioId={filtros.propietarioId ?? null}
          onChange={(id) =>
            setFiltros({ ...filtros, propietarioId: id ?? undefined })
          }
        />
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar lote, ciudad, asesor..."
            className="h-8 pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setFiltro(f.v)}
              className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] transition-colors ${
                tipoFiltroDestacado(f.v)
                  ? "border-secondary bg-secondary text-white"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1 text-[9px] font-bold ${
                  tipoFiltroDestacado(f.v)
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {(contadores as Record<string, number>)[f.v] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSheetOpen(true)}
          className="relative h-8 gap-1 text-[11px]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros avanzados
          {filtrosAvanzadosActivos > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white">
              {filtrosAvanzadosActivos}
            </span>
          )}
        </Button>
        <div className="ml-auto flex gap-1 rounded-md border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setVista("grid")}
            className={`rounded p-1 ${
              vista === "grid"
                ? "bg-secondary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
            aria-label="Grid"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setVista("tabla")}
            className={`rounded p-1 ${
              vista === "tabla"
                ? "bg-secondary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
            aria-label="Tabla"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setVista("por_propietario")}
            className={`rounded p-1 ${
              vista === "por_propietario"
                ? "bg-secondary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
            aria-label="Por propietario"
            title="Por propietario"
          >
            <Building2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chips filtros activos */}
      {filtrosAvanzadosActivos > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-medium uppercase text-muted-foreground">
            Filtros activos:
          </span>
          {filtros.ciudades?.map((c) => (
            <ChipActivo key={`ciu-${c}`} onRemove={() => removerArrayItem("ciudades", c)}>
              {c}
            </ChipActivo>
          ))}
          {filtros.barrios?.map((b) => (
            <ChipActivo key={`b-${b}`} onRemove={() => removerArrayItem("barrios", b)}>
              {b}
            </ChipActivo>
          ))}
          {filtros.tipos?.map((t) => (
            <ChipActivo key={`t-${t}`} onRemove={() => removerArrayItem("tipos", t)}>
              {t}
            </ChipActivo>
          ))}
          {filtros.categoriaArea?.map((c) => (
            <ChipActivo key={`ca-${c}`} onRemove={() => removerArrayItem("categoriaArea", c)}>
              Área: {c.replace("_", " ")}
            </ChipActivo>
          ))}
          {filtros.areaMin != null && (
            <ChipActivo onRemove={() => removerCampo("areaMin")}>
              ≥ {filtros.areaMin} m²
            </ChipActivo>
          )}
          {filtros.areaMax != null && (
            <ChipActivo onRemove={() => removerCampo("areaMax")}>
              ≤ {filtros.areaMax} m²
            </ChipActivo>
          )}
          {filtros.precioMin != null && (
            <ChipActivo onRemove={() => removerCampo("precioMin")}>
              ≥ ${filtros.precioMin.toLocaleString("es-CO")}
            </ChipActivo>
          )}
          {filtros.precioMax != null && (
            <ChipActivo onRemove={() => removerCampo("precioMax")}>
              ≤ ${filtros.precioMax.toLocaleString("es-CO")}
            </ChipActivo>
          )}
          {filtros.estratos?.map((e) => (
            <ChipActivo key={`e-${e}`} onRemove={() => removerArrayItem("estratos", e)}>
              Estrato {e}
            </ChipActivo>
          ))}
          {filtros.estadosPublicacion?.map((s) => (
            <ChipActivo key={`ep-${s}`} onRemove={() => removerArrayItem("estadosPublicacion", s)}>
              {s.replace("_", " ")}
            </ChipActivo>
          ))}
          {filtros.estadoDisponibilidad?.map((s) => (
            <ChipActivo key={`ed-${s}`} onRemove={() => removerArrayItem("estadoDisponibilidad", s)}>
              {s}
            </ChipActivo>
          ))}
          {filtros.soloPublicos && (
            <ChipActivo onRemove={() => removerCampo("soloPublicos")}>Públicos</ChipActivo>
          )}
          {filtros.soloDestacados && (
            <ChipActivo onRemove={() => removerCampo("soloDestacados")}>Destacados</ChipActivo>
          )}
          {filtros.planesCodigos?.map((p) => (
            <ChipActivo key={`pl-${p}`} onRemove={() => removerArrayItem("planesCodigos", p)}>
              Plan: {nombrePlan(p)}
            </ChipActivo>
          ))}
          {filtros.estadosEngagement?.map((s) => (
            <ChipActivo key={`ee-${s}`} onRemove={() => removerArrayItem("estadosEngagement", s)}>
              {s.replace("_", " ")}
            </ChipActivo>
          ))}
          {filtros.asesoresIds?.map((a) => (
            <ChipActivo key={`a-${a}`} onRemove={() => removerArrayItem("asesoresIds", a)}>
              {nombreAsesor(a)}
            </ChipActivo>
          ))}
          {filtros.slaEstados?.map((s) => (
            <ChipActivo key={`sla-${s}`} onRemove={() => removerArrayItem("slaEstados", s)}>
              SLA: {s.replace("_", " ")}
            </ChipActivo>
          ))}
          {filtros.conEntregablesBorrador && (
            <ChipActivo onRemove={() => removerCampo("conEntregablesBorrador")}>
              Con entregables borrador
            </ChipActivo>
          )}
          {filtros.scoreMin != null && filtros.scoreMin > 0 && (
            <ChipActivo onRemove={() => removerCampo("scoreMin")}>
              Score ≥ {filtros.scoreMin}
            </ChipActivo>
          )}
          {filtros.conResolutoria && (
            <ChipActivo onRemove={() => removerCampo("conResolutoria")}>
              Con resolutoría
            </ChipActivo>
          )}
          {filtros.propietarioId && (
            <ChipActivo onRemove={() => removerCampo("propietarioId")}>
              {nombrePropietario(filtros.propietarioId)}
            </ChipActivo>
          )}
          {filtros.conLeadsActivos && (
            <ChipActivo onRemove={() => removerCampo("conLeadsActivos")}>
              Con leads
            </ChipActivo>
          )}
          {filtros.leadsMinimo != null && (
            <ChipActivo onRemove={() => removerCampo("leadsMinimo")}>
              ≥ {filtros.leadsMinimo} leads
            </ChipActivo>
          )}
          {filtros.creadoDesde && (
            <ChipActivo onRemove={() => removerCampo("creadoDesde")}>
              Desde {filtros.creadoDesde}
            </ChipActivo>
          )}
          {filtros.creadoHasta && (
            <ChipActivo onRemove={() => removerCampo("creadoHasta")}>
              Hasta {filtros.creadoHasta}
            </ChipActivo>
          )}
          {filtros.ultimaActividadDias != null && (
            <ChipActivo onRemove={() => removerCampo("ultimaActividadDias")}>
              Últimos {filtros.ultimaActividadDias}d
            </ChipActivo>
          )}
          <button
            type="button"
            onClick={limpiarAvanzados}
            className="ml-1 text-[10px] text-muted-foreground underline hover:text-foreground"
          >
            Limpiar todos
          </button>
        </div>
      )}


      {/* Bulk actions */}
      <BulkActionsBar
        count={seleccionados.size}
        onClear={() => setSeleccionados(new Set())}
        itemLabel={{ singular: "lote seleccionado", plural: "lotes seleccionados" }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            toast({ title: "Validar", description: "Próximamente." })
          }
        >
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Validar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            toast({ title: "Publicar", description: "Próximamente." })
          }
        >
          <Send className="mr-1 h-3.5 w-3.5" /> Publicar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            toast({ title: "Asignar asesor", description: "Próximamente." })
          }
        >
          <Users className="mr-1 h-3.5 w-3.5" /> Asignar asesor
        </Button>
      </BulkActionsBar>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : lotes.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background py-12 text-center text-sm text-muted-foreground">
          No hay lotes que coincidan con tus filtros.
        </div>
      ) : vista === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lotes.map((l) => (
            <LoteCardUnificada
              key={l.id}
              lote={l}
              onClick={() => setDrawerLote(l)}
              selected={seleccionados.has(l.id)}
              onToggleSelect={() => toggleSeleccion(l.id)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-background">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">Lote</th>
                <th className="px-2 py-2 text-left">Ubicación</th>
                <th className="px-2 py-2 text-left">Estado</th>
                <th className="px-2 py-2 text-left">Asesor</th>
                <th className="px-2 py-2 text-right">Avance</th>
                <th className="px-2 py-2 text-right">Leads</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr
                  key={l.id}
                  className="cursor-pointer border-t border-border hover:bg-muted/30"
                  onClick={() => setDrawerLote(l)}
                >
                  <td className="px-2 py-2 font-medium text-foreground">
                    {l.nombre_lote}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">
                    {[l.ciudad, l.barrio].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-2 py-2">
                    {l.engagement_estado ?? l.estado_publicacion}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">
                    {l.asesor_nombre ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {l.engagement_avance_pct != null
                      ? `${Math.round(l.engagement_avance_pct)}%`
                      : "—"}
                  </td>
                  <td className="px-2 py-2 text-right">{l.leads_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumen inferior */}
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Leads */}
        <div className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-foreground">Leads recientes</h2>
            <span className="text-[10px] text-muted-foreground">
              {resumenLeads?.nuevos ?? 0} nuevos
            </span>
          </div>
          <div className="space-y-1.5">
            {(resumenLeads?.leads ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin leads recientes.</p>
            ) : (
              (resumenLeads?.leads ?? []).map((lead: any) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {lead.nombre ?? "—"}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {lead.lotes?.nombre_lote ?? "—"} ·{" "}
                      {formatoRelativo(lead.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {lead.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Engagements */}
        <div className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-foreground">Engagements activos</h2>
            <span className="text-[10px] text-muted-foreground">
              {resumenEngagements?.total ?? 0} en curso
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(resumenEngagements?.porEstado ?? {}).map(
              ([estado, count]) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() =>
                    navigate(`/dashboard/portafolio?estado=${estado}`)
                  }
                  className="rounded-md bg-muted/40 p-2 text-center transition-colors hover:bg-muted"
                >
                  <p className="text-base font-bold text-foreground">
                    {count as number}
                  </p>
                  <p className="text-[9px] uppercase text-muted-foreground">
                    {estado.replace(/_/g, " ")}
                  </p>
                </button>
              ),
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-md bg-muted/30 p-1.5">
              <p className="text-[9px] uppercase text-muted-foreground">SLA cumplido</p>
              <p className="text-sm font-bold text-foreground">
                {resumenEngagements?.slaCumplidoPct ?? 0}%
              </p>
            </div>
            <div className="rounded-md bg-muted/30 p-1.5">
              <p className="text-[9px] uppercase text-muted-foreground">
                Tiempo promedio
              </p>
              <p className="text-sm font-bold text-foreground">
                {resumenEngagements?.tiempoPromedio ?? 0} días
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/portafolio")}
            className="mt-3 text-xs text-primary hover:underline"
          >
            Ir al portafolio Kanban →
          </button>
        </div>
      </div>

      <LoteDetalleDrawer
        lote={drawerLote}
        open={!!drawerLote}
        onOpenChange={(open) => !open && setDrawerLote(null)}
      />

      <FiltrosAvanzadosLotesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        valor={filtros}
        onAplicar={(f) => setFiltros(f)}
      />
    </DashboardLayout>
  );
};

export default Dashboard;

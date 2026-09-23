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
  MapPin,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { formatNumero } from "@/lib/format-moneda";

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
      <header className="mb-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hola {nombre}, este es tu panorama
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{panorama}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportar} className="rounded-xl border-2 font-semibold">
              <Download className="mr-1.5 h-4 w-4" /> Reporte
            </Button>
            <Button onClick={() => navigate("/dashboard/lotes/nuevo")} className="rounded-xl font-bold shadow-lg shadow-primary/25">
              <Plus className="mr-1.5 h-4 w-4" /> Nuevo lote
            </Button>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {([
            { label: "Atrasados", value: atrasados, icon: AlertTriangle, color: "text-destructive", onClick: () => setFiltro("atrasados") },
            { label: "Por publicar", value: pendientesPublicar, icon: Send, color: "text-primary", onClick: () => setFiltro("con_engagement") },
            { label: "En riesgo", value: enRiesgo, icon: Clock, color: "text-warning", onClick: () => setFiltro("con_engagement") },
            { label: "Cumplidos", value: cumplidos, icon: CheckCircle2, color: "", destacado: true },
            { label: "Sin asesor", value: sinAsesor, icon: Users, color: "text-muted-foreground", onClick: () => setFiltro("sin_asesor") },
          ] as { label: string; value: number; icon: typeof Users; color: string; destacado?: boolean; onClick?: () => void }[]).map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={k.onClick}
              disabled={!k.onClick}
              className={`rounded-2xl p-4 text-left transition-colors ${
                k.destacado
                  ? "bg-secondary text-secondary-foreground shadow-md"
                  : "border border-border bg-card shadow-sm hover:border-primary"
              } ${k.onClick ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wide ${k.destacado ? "opacity-60" : k.color}`}>
                  {k.label}
                </span>
                <k.icon className={`h-4 w-4 ${k.destacado ? "opacity-60" : k.color}`} />
              </div>
              <div className={`mt-1 text-2xl font-bold ${k.destacado ? "" : "text-foreground"}`}>{k.value}</div>
            </button>
          ))}
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
      <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <DropdownPropietario
            propietarioId={filtros.propietarioId ?? null}
            onChange={(id) =>
              setFiltros({ ...filtros, propietarioId: id ?? undefined })
            }
          />
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar lote, ciudad, asesor..."
              className="h-10 rounded-xl border-transparent bg-muted/60 pl-10 focus-visible:ring-secondary/20"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSheetOpen(true)}
            className="relative h-10 gap-1.5 rounded-xl text-xs font-semibold"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros avanzados
            {filtrosAvanzadosActivos > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">
                {filtrosAvanzadosActivos}
              </span>
            )}
          </Button>
          <div className="flex gap-1 rounded-xl bg-muted/60 p-1">
            {([
              { v: "grid", icon: LayoutGrid, label: "Tarjetas" },
              { v: "tabla", icon: List, label: "Tabla" },
              { v: "por_propietario", icon: Building2, label: "Por propietario" },
            ] as const).map(({ v, icon: Icon, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                aria-label={label}
                title={label}
                className={`rounded-lg p-1.5 transition-colors ${
                  vista === v
                    ? "bg-card text-secondary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
          {FILTROS.map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setFiltro(f.v)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${
                tipoFiltroDestacado(f.v)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label}
              <span className={tipoFiltroDestacado(f.v) ? "opacity-60" : "opacity-50"}>
                {(contadores as Record<string, number>)[f.v] ?? 0}
              </span>
            </button>
          ))}
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
              ≥ ${formatNumero(filtros.precioMin)}
            </ChipActivo>
          )}
          {filtros.precioMax != null && (
            <ChipActivo onRemove={() => removerCampo("precioMax")}>
              ≤ ${formatNumero(filtros.precioMax)}
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

      {/* CTA bulk contextual al propietario */}
      {seleccionados.size === 0 && propietarioSeleccionado && lotes.length > 0 && vista !== "por_propietario" && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2">
          <Building2 className="h-3.5 w-3.5 text-blue-700" />
          <p className="flex-1 text-[11px] text-blue-900">
            ¿Quieres aplicar acciones a todos los lotes de{" "}
            <span className="font-semibold">{propietarioSeleccionado.nombre}</span>?
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSeleccionados(new Set(lotes.map((l) => l.id)))}
            className="h-7 text-xs"
          >
            Seleccionar {lotes.length}
          </Button>
        </div>
      )}

      {/* Bento: lotes + columna lateral */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="min-w-0 xl:col-span-8">
      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : vista === "por_propietario" ? (
        propietarios.length === 0 ? (
          <EmptyState
            icon={Users}
            titulo="Sin propietarios con activos"
            descripcion="Aún no hay propietarios asociados a lotes. Crea o asigna lotes para verlos agrupados aquí."
            ctaLabel="Nuevo lote"
            ctaTo="/dashboard/lotes/nuevo"
            ctaVariant="default"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {propietarios.map((p) => (
              <CardPropietario
                key={p.id}
                propietario={p}
                onClick={() => {
                  setFiltros({ ...filtros, propietarioId: p.id });
                  setVista("grid");
                }}
              />
            ))}
          </div>
        )
      ) : lotes.length === 0 ? (
        <EmptyState
          icon={MapPin}
          titulo="No hay lotes que coincidan"
          descripcion="Ajusta o limpia los filtros para ver más resultados, o crea un nuevo lote."
          ctaLabel="Nuevo lote"
          ctaTo="/dashboard/lotes/nuevo"
          ctaVariant="default"
        />
      ) : vista === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

      </div>

      {/* Columna lateral */}
      <aside className="space-y-6 xl:col-span-4">
        {/* Leads */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Leads recientes</h2>
            {(resumenLeads?.nuevos ?? 0) > 0 && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                {resumenLeads?.nuevos} nuevos
              </span>
            )}
          </div>
          <div className="space-y-4">
            {(resumenLeads?.leads ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin leads recientes.</p>
            ) : (
              (resumenLeads?.leads ?? []).map((lead: any) => {
                const iniciales = (lead.nombre ?? "—")
                  .split(" ")
                  .map((p: string) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div key={lead.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {iniciales}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {lead.nombre ?? "—"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {lead.lotes?.nombre_lote ?? "—"} · {formatoRelativo(lead.created_at)}
                      </p>
                    </div>
                    {lead.estado === "nuevo" && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Engagements */}
        <div className="rounded-3xl bg-secondary p-6 text-secondary-foreground shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Engagements activos</h2>
            <span className="text-[11px] opacity-60">
              {resumenEngagements?.total ?? 0} en curso
            </span>
          </div>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{resumenEngagements?.slaCumplidoPct ?? 0}%</p>
              <p className="text-[10px] uppercase tracking-wide opacity-50">SLA cumplido</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{resumenEngagements?.tiempoPromedio ?? 0}d</p>
              <p className="text-[10px] uppercase tracking-wide opacity-50">Tiempo prom.</p>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-foreground/10">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, resumenEngagements?.slaCumplidoPct ?? 0)}%` }}
            />
          </div>
          {Object.keys(resumenEngagements?.porEstado ?? {}).length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {Object.entries(resumenEngagements?.porEstado ?? {}).map(([estado, count]) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => navigate(`/dashboard/portafolio?estado=${estado}`)}
                  className="rounded-xl bg-secondary-foreground/5 p-2 text-center transition-colors hover:bg-secondary-foreground/10"
                >
                  <p className="text-base font-bold">{count as number}</p>
                  <p className="text-[9px] uppercase opacity-60">{estado.replace(/_/g, " ")}</p>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate("/dashboard/portafolio")}
            className="mt-5 text-xs font-bold text-primary hover:underline"
          >
            Ir al portafolio Kanban →
          </button>
        </div>
      </aside>
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

import { useState, useDeferredValue, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Pencil, FolderOpen, Eye, Star, Upload, Trash2, BarChart3,
  MoreHorizontal, Briefcase, UserPlus, Store, EyeOff, ClipboardList,
  LayoutGrid, List, Search, Filter, MapPin, Check, Clock, Flag,
  AlertCircle, Download, type LucideIcon,
} from "lucide-react";
import CrearOrdenServicioDialog from "@/components/ordenes/CrearOrdenServicioDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import CrearEngagementDialog from "@/components/portafolio/CrearEngagementDialog";
import AsignarPropietarioDialog from "@/components/portafolio/AsignarPropietarioDialog";
import { useEngagementsActivosPorLotes } from "@/hooks/useEngagements";
import { usePublicarLoteMercado } from "@/hooks/useAsignarPropietario";
import { useValidarLote } from "@/hooks/useValidarLote";
import LoteCardAdmin, { LoteCardData } from "@/components/lotes/LoteCardAdmin";
import FiltrosLotesAvanzados, { FiltrosLotesState, FILTROS_INICIALES } from "@/components/lotes/FiltrosLotesAvanzados";
import { FotoLote } from "@/components/lotes/FotoLote";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOPCompact } from "@/lib/format";

const VISTA_STORAGE_KEY = "dash_lotes_vista";
type Vista = "cards" | "tabla";
type OrdenKey = "recientes" | "por-validar" | "precio-desc" | "precio-asc" | "area-desc";

const estadoVariant = (e: string) => {
  switch (e) {
    case "Disponible": return "disponible" as const;
    case "Reservado": return "reservado" as const;
    case "Vendido": return "vendido" as const;
    default: return "default" as const;
  }
};

const planBadgeClass = (codigo?: string | null) => {
  switch ((codigo ?? "").toLowerCase()) {
    case "premium": return "border-transparent bg-success text-primary-foreground hover:bg-success/90";
    case "pro":
    case "profesional": return "border-transparent bg-warning text-primary-foreground hover:bg-warning/90";
    case "basico":
    case "básico": return "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
    case "gratuito": return "border-transparent bg-muted text-muted-foreground hover:bg-muted/80";
    default: return "border-border bg-background text-muted-foreground";
  }
};

interface LoteRow {
  id: string;
  nombre_lote: string;
  ciudad: string | null;
  barrio: string | null;
  area_total_m2: number | null;
  estado_disponibilidad: string;
  destacado: boolean | null;
  es_publico: boolean;
  propietario_id: string | null;
  publicado_venta: boolean;
  estado_publicacion: string;
  tipo_lote: string | null;
  lat: number | null;
  lng: number | null;
  foto_url: string | null;
  precio_venta_estimado: number | null;
  fotos_lotes: { url: string; orden: number }[] | null;
  created_at?: string | null;
}

interface KPIEstadoProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  iconColorClass: string;
  destacado?: boolean;
  onClick?: () => void;
}

const KPIEstado = ({ label, value, icon: Icon, colorClass, iconColorClass, destacado, onClick }: KPIEstadoProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`text-left rounded-md p-2.5 transition-colors ${
      destacado
        ? "border border-primary bg-primary/10 hover:bg-primary/15"
        : "border border-border bg-background hover:bg-muted/30"
    } ${onClick ? "cursor-pointer" : "cursor-default"}`}
  >
    <div className={`text-[10px] uppercase tracking-wide ${colorClass}`}>{label}</div>
    <div className="mt-1 flex items-center justify-between">
      <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
      <Icon className={`h-4 w-4 ${iconColorClass}`} />
    </div>
  </button>
);

const sortLotes = (a: LoteRow, b: LoteRow, orden: OrdenKey): number => {
  switch (orden) {
    case "por-validar": {
      const av = a.estado_publicacion === "pendiente_validacion" ? 0 : 1;
      const bv = b.estado_publicacion === "pendiente_validacion" ? 0 : 1;
      if (av !== bv) return av - bv;
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    }
    case "precio-desc":
      return (Number(b.precio_venta_estimado) || 0) - (Number(a.precio_venta_estimado) || 0);
    case "precio-asc":
      return (Number(a.precio_venta_estimado) || 0) - (Number(b.precio_venta_estimado) || 0);
    case "area-desc":
      return (Number(b.area_total_m2) || 0) - (Number(a.area_total_m2) || 0);
    case "recientes":
    default:
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  }
};

const DashboardLotes = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userType } = useAuth();
  const isAdmin = userType === "admin" || userType === "super_admin";

  const [filtros, setFiltros] = useState<FiltrosLotesState>(FILTROS_INICIALES);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<OrdenKey>("recientes");
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [vista, setVista] = useState<Vista>(() => {
    if (typeof window === "undefined") return "tabla";
    const saved = localStorage.getItem(VISTA_STORAGE_KEY) as Vista | null;
    if (saved === "cards" || saved === "tabla") return saved;
    return typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "tabla";
  });
  useEffect(() => { localStorage.setItem(VISTA_STORAGE_KEY, vista); }, [vista]);

  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [bulkArchivar, setBulkArchivar] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [engagementLoteId, setEngagementLoteId] = useState<string | null>(null);
  const [asignarLote, setAsignarLote] = useState<{ id: string; name: string } | null>(null);
  const [publicarLote, setPublicarLote] = useState<{ id: string; name: string } | null>(null);
  const [retirarLote, setRetirarLote] = useState<{ id: string; name: string } | null>(null);
  const [ordenLoteId, setOrdenLoteId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const publicarMercado = usePublicarLoteMercado();
  const validarLote = useValidarLote();

  const { data: lotes = [], isLoading } = useQuery({
    queryKey: ["dash-lotes-list"],
    queryFn: async (): Promise<LoteRow[]> => {
      const { data, error } = await supabase
        .from("lotes")
        .select(
          `id, nombre_lote, ciudad, barrio, area_total_m2, estado_disponibilidad, destacado,
           es_publico, propietario_id, publicado_venta, estado_publicacion,
           tipo_lote, lat, lng, foto_url, precio_venta_estimado, created_at,
           fotos_lotes(url, orden)`
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LoteRow[];
    },
  });

  const propietarioIds = useMemo(
    () => Array.from(new Set(lotes.map((l) => l.propietario_id).filter(Boolean))) as string[],
    [lotes]
  );
  const { data: propietariosMap = {} } = useQuery({
    queryKey: ["dash-lotes-propietarios", propietarioIds],
    enabled: propietarioIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .in("id", propietarioIds);
      if (error) throw error;
      const map: Record<string, { nombre: string | null; email: string | null }> = {};
      (data ?? []).forEach((p: any) => { map[p.id] = { nombre: p.nombre, email: p.email }; });
      return map;
    },
  });

  const togglePublicoMutation = useMutation({
    mutationFn: async ({ id, es_publico }: { id: string; es_publico: boolean }) => {
      const { error } = await supabase.from("lotes").update({ es_publico }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-list"] });
      toast({ title: "Visibilidad actualizada" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Lote eliminado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-list"] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
      setDeleteId(null);
    },
  });

  const { data: engagementsActivos = {} } = useEngagementsActivosPorLotes(lotes.map((l) => l.id));

  const ciudades = useMemo(
    () => Array.from(new Set(lotes.map((l) => l.ciudad).filter(Boolean) as string[])).sort(),
    [lotes],
  );
  const tipos = useMemo(
    () => Array.from(new Set(lotes.map((l) => l.tipo_lote).filter(Boolean) as string[])).sort(),
    [lotes],
  );
  const estadosLista = useMemo(
    () => Array.from(new Set(lotes.map((l) => l.estado_disponibilidad).filter(Boolean))).sort(),
    [lotes],
  );
  const planes = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(engagementsActivos as any).forEach((e: any) => {
      const p = e?.planes_diagnostico;
      if (p?.codigo && !map.has(p.codigo)) map.set(p.codigo, p.nombre);
    });
    return Array.from(map.entries()).map(([codigo, nombre]) => ({ codigo, nombre }));
  }, [engagementsActivos]);

  const propietariosOptions = useMemo(() => {
    return propietarioIds
      .map((id) => {
        const p = (propietariosMap as any)[id];
        return { id, label: (p?.nombre || p?.email || id) as string };
      })
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [propietarioIds, propietariosMap]);

  const deferredFiltros = useDeferredValue(filtros);
  const deferredBusqueda = useDeferredValue(busqueda);

  const filtered = useMemo(() => {
    const list = lotes.filter((l) => {
      const q = deferredBusqueda.trim().toLowerCase();
      if (q) {
        const hay =
          l.nombre_lote.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          (l.ciudad ?? "").toLowerCase().includes(q) ||
          (l.barrio ?? "").toLowerCase().includes(q);
        if (!hay) return false;
      }
      if (deferredFiltros.q.trim()) {
        const qq = deferredFiltros.q.trim().toLowerCase();
        if (!l.nombre_lote.toLowerCase().includes(qq) && !(l.barrio ?? "").toLowerCase().includes(qq)) return false;
      }
      if (deferredFiltros.ciudad !== "__all__" && l.ciudad !== deferredFiltros.ciudad) return false;
      if (deferredFiltros.barrio.trim() && !(l.barrio ?? "").toLowerCase().includes(deferredFiltros.barrio.trim().toLowerCase())) return false;
      if (deferredFiltros.tipo !== "__all__" && l.tipo_lote !== deferredFiltros.tipo) return false;
      if (deferredFiltros.estado !== "__all__" && l.estado_disponibilidad !== deferredFiltros.estado) return false;
      if (deferredFiltros.plan !== "__all__") {
        const codigo = (engagementsActivos as any)[l.id]?.planes_diagnostico?.codigo;
        if (codigo !== deferredFiltros.plan) return false;
      }
      const area = l.area_total_m2 != null ? Number(l.area_total_m2) : null;
      if (deferredFiltros.areaMin && (area == null || area < Number(deferredFiltros.areaMin))) return false;
      if (deferredFiltros.areaMax && (area == null || area > Number(deferredFiltros.areaMax))) return false;
      const precio = l.precio_venta_estimado != null ? Number(l.precio_venta_estimado) : null;
      if (deferredFiltros.precioMin && (precio == null || precio < Number(deferredFiltros.precioMin))) return false;
      if (deferredFiltros.precioMax && (precio == null || precio > Number(deferredFiltros.precioMax))) return false;
      if (deferredFiltros.propietarioId === "__sin__" && l.propietario_id) return false;
      if (deferredFiltros.propietarioId && deferredFiltros.propietarioId !== "__sin__" && l.propietario_id !== deferredFiltros.propietarioId) return false;
      if (deferredFiltros.publicacion === "publicos" && !l.es_publico) return false;
      if (deferredFiltros.publicacion === "no_publicos" && l.es_publico) return false;
      if (deferredFiltros.soloDestacados && !l.destacado) return false;
      return true;
    });
    return [...list].sort((a, b) => sortLotes(a, b, orden));
  }, [lotes, deferredFiltros, deferredBusqueda, engagementsActivos, orden]);

  // KPIs
  const totalLotes = lotes.length;
  const lotesPorValidar = useMemo(
    () => lotes.filter((l) => l.estado_publicacion === "pendiente_validacion").length,
    [lotes],
  );
  const lotesDisponibles = useMemo(
    () => lotes.filter((l) => l.estado_disponibilidad === "Disponible").length,
    [lotes],
  );
  const lotesReservados = useMemo(
    () => lotes.filter((l) => l.estado_disponibilidad === "Reservado").length,
    [lotes],
  );
  const lotesVendidos = useMemo(
    () => lotes.filter((l) => l.estado_disponibilidad === "Vendido").length,
    [lotes],
  );
  const lotesPubPendiente = useMemo(
    () => lotes.filter((l) => l.estado_publicacion === "aprobado" && !l.publicado_venta).length,
    [lotes],
  );

  // Filtros activos count (vs FILTROS_INICIALES)
  const filtrosActivosCount = useMemo(() => {
    let c = 0;
    if (filtros.q.trim()) c++;
    if (filtros.ciudad !== "__all__") c++;
    if (filtros.barrio.trim()) c++;
    if (filtros.tipo !== "__all__") c++;
    if (filtros.plan !== "__all__") c++;
    if (filtros.estado !== "__all__") c++;
    if (filtros.areaMin) c++;
    if (filtros.areaMax) c++;
    if (filtros.precioMin) c++;
    if (filtros.precioMax) c++;
    if (filtros.propietarioId) c++;
    if (filtros.publicacion !== "todos") c++;
    if (filtros.soloDestacados) c++;
    return c;
  }, [filtros]);

  // Selección
  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSeleccionTodos = () => {
    if (seleccionados.size === filtered.length) setSeleccionados(new Set());
    else setSeleccionados(new Set(filtered.map((l) => l.id)));
  };
  // Si los filtros cambian, limpiar selección huérfana
  useEffect(() => {
    if (seleccionados.size === 0) return;
    const validIds = new Set(filtered.map((l) => l.id));
    let changed = false;
    const next = new Set<string>();
    seleccionados.forEach((id) => { if (validIds.has(id)) next.add(id); else changed = true; });
    if (changed) setSeleccionados(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  // Bulk handlers
  const handleValidarMultiple = async () => {
    const ids = Array.from(seleccionados);
    try {
      await Promise.all(
        ids.map((id) => validarLote.mutateAsync({ lote_id: id, decision: "aprobado", notas: "Validación masiva" }))
      );
      toast({ title: `${ids.length} lote${ids.length === 1 ? "" : "s"} validado${ids.length === 1 ? "" : "s"}` });
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-list"] });
    } catch (e: any) {
      toast({ title: "Error en validación masiva", description: e.message, variant: "destructive" });
    }
  };
  const handlePublicarMultiple = async () => {
    const ids = Array.from(seleccionados);
    try {
      await Promise.all(ids.map((id) => publicarMercado.mutateAsync(id)));
      toast({ title: `${ids.length} lote${ids.length === 1 ? "" : "s"} publicado${ids.length === 1 ? "" : "s"} al mercado` });
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-list"] });
    } catch (e: any) {
      toast({ title: "Error al publicar", description: e.message, variant: "destructive" });
    }
  };
  const handleDestacarMultiple = async () => {
    const ids = Array.from(seleccionados);
    try {
      const { error } = await supabase.from("lotes").update({ destacado: true }).in("id", ids);
      if (error) throw error;
      toast({ title: `${ids.length} lote${ids.length === 1 ? "" : "s"} destacado${ids.length === 1 ? "" : "s"}` });
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-list"] });
    } catch (e: any) {
      toast({ title: "Error al destacar", description: e.message, variant: "destructive" });
    }
  };
  const handleArchivarMultipleConfirm = async () => {
    const ids = Array.from(seleccionados);
    try {
      const { error } = await supabase.from("lotes").delete().in("id", ids);
      if (error) throw error;
      toast({ title: `${ids.length} lote${ids.length === 1 ? "" : "s"} archivado${ids.length === 1 ? "" : "s"}` });
      setSeleccionados(new Set());
      setBulkArchivar(false);
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-list"] });
    } catch (e: any) {
      toast({ title: "Error al archivar", description: e.message, variant: "destructive" });
      setBulkArchivar(false);
    }
  };

  const handleExportar = () => {
    const rows = filtered.map((l) => ({
      id: l.id,
      nombre: l.nombre_lote,
      ciudad: l.ciudad ?? "",
      barrio: l.barrio ?? "",
      area_m2: l.area_total_m2 ?? "",
      precio: l.precio_venta_estimado ?? "",
      estado: l.estado_disponibilidad,
      publicacion: l.estado_publicacion,
      es_publico: l.es_publico ? "si" : "no",
    }));
    if (rows.length === 0) {
      toast({ title: "No hay lotes para exportar" });
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lotes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildCard = (l: LoteRow): LoteCardData => {
    const fotoFromGallery = (l.fotos_lotes ?? [])
      .slice()
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))[0]?.url ?? null;
    const plan = (engagementsActivos as any)[l.id]?.planes_diagnostico;
    const prop = l.propietario_id ? (propietariosMap as any)[l.propietario_id] : null;
    return {
      id: l.id,
      nombre_lote: l.nombre_lote,
      ciudad: l.ciudad,
      barrio: l.barrio,
      area_total_m2: l.area_total_m2,
      tipo_lote: l.tipo_lote,
      estado_disponibilidad: l.estado_disponibilidad,
      destacado: l.destacado,
      es_publico: l.es_publico,
      propietario_id: l.propietario_id,
      publicado_venta: l.publicado_venta,
      precio_venta_estimado: l.precio_venta_estimado,
      lat: l.lat != null ? Number(l.lat) : null,
      lng: l.lng != null ? Number(l.lng) : null,
      foto_principal: fotoFromGallery ?? l.foto_url ?? null,
      propietario_nombre: prop?.nombre || prop?.email || null,
      plan_nombre: plan?.nombre ?? null,
      plan_codigo: plan?.codigo ?? null,
    };
  };

  const vistaEfectiva: Vista = isMobile ? "cards" : vista;
  const allSelected = filtered.length > 0 && seleccionados.size === filtered.length;

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Lotes</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <strong className="text-foreground">{totalLotes}</strong> en total
            {lotesPorValidar > 0 && (
              <> · <strong className="text-primary">{lotesPorValidar} por validar</strong></>
            )}
            {lotesPubPendiente > 0 && <> · {lotesPubPendiente} con publicación pendiente</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/lotes/importar"><Upload className="mr-1.5 h-3.5 w-3.5" /> Importar</Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar
          </Button>
          <Button size="sm" asChild>
            <Link to="/dashboard/lotes/nuevo"><Plus className="mr-1.5 h-3.5 w-3.5" /> Nuevo lote</Link>
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <KPIEstado label="Total" value={totalLotes} icon={MapPin} colorClass="text-foreground" iconColorClass="text-muted-foreground" />
        <KPIEstado label="Disponibles" value={lotesDisponibles} icon={Check} colorClass="text-green-600" iconColorClass="text-green-600" />
        <KPIEstado label="Reservados" value={lotesReservados} icon={Clock} colorClass="text-primary" iconColorClass="text-primary" />
        <KPIEstado label="Vendidos" value={lotesVendidos} icon={Flag} colorClass="text-foreground" iconColorClass="text-muted-foreground" />
        <KPIEstado
          label="Por validar"
          value={lotesPorValidar}
          icon={AlertCircle}
          colorClass="text-primary"
          iconColorClass="text-primary"
          destacado={lotesPorValidar > 0}
          onClick={() => navigate("/dashboard/lotes/pendientes-validacion")}
        />
      </div>

      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código o dirección..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        <Sheet open={filtrosOpen} onOpenChange={setFiltrosOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Filter className="mr-1 h-3.5 w-3.5" />
              Filtros
              {filtrosActivosCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                  {filtrosActivosCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader className="mb-4">
              <SheetTitle>Filtros avanzados</SheetTitle>
            </SheetHeader>
            <FiltrosLotesAvanzados
              value={filtros}
              onChange={setFiltros}
              onClear={() => setFiltros(FILTROS_INICIALES)}
              ciudades={ciudades}
              tipos={tipos}
              planes={planes}
              estados={estadosLista}
              propietarios={propietariosOptions}
            />
          </SheetContent>
        </Sheet>

        <Select value={orden} onValueChange={(v) => setOrden(v as OrdenKey)}>
          <SelectTrigger className="h-8 w-auto gap-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recientes">Recientes primero</SelectItem>
            <SelectItem value="por-validar">Por validar primero</SelectItem>
            <SelectItem value="precio-desc">Precio descendente</SelectItem>
            <SelectItem value="precio-asc">Precio ascendente</SelectItem>
            <SelectItem value="area-desc">Área descendente</SelectItem>
          </SelectContent>
        </Select>

        <div className="hidden overflow-hidden rounded-md border border-border md:flex">
          <button
            type="button"
            onClick={() => setVista("tabla")}
            className={`p-1.5 ${vista === "tabla" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground"}`}
            aria-label="Vista tabla"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setVista("cards")}
            className={`p-1.5 ${vista === "cards" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground"}`}
            aria-label="Vista cards"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Resultados count */}
      <div className="mb-2 text-xs text-muted-foreground">
        {isLoading
          ? "Cargando…"
          : `${filtered.length} lote${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}`}
      </div>

      {/* Bulk actions */}
      {seleccionados.size > 0 && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/40 bg-gradient-to-r from-primary/15 to-primary/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <Checkbox checked onCheckedChange={() => setSeleccionados(new Set())} />
            <span className="text-xs font-semibold text-foreground">
              {seleccionados.size} {seleccionados.size === 1 ? "lote seleccionado" : "lotes seleccionados"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleValidarMultiple} disabled={validarLote.isPending}>
              <Check className="mr-1 h-3 w-3" /> Validar
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handlePublicarMultiple} disabled={publicarMercado.isPending}>
              <Eye className="mr-1 h-3 w-3" /> Publicar
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDestacarMultiple}>
              <Star className="mr-1 h-3 w-3" /> Destacar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-destructive text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setBulkArchivar(true)}
            >
              <Trash2 className="mr-1 h-3 w-3" /> Archivar
            </Button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
              <Skeleton className="h-[140px] w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No se encontraron lotes"
          description="Ajusta la búsqueda o limpia los filtros para ver más resultados."
          action={
            filtrosActivosCount > 0 || busqueda ? (
              <Button variant="outline" size="sm" onClick={() => { setFiltros(FILTROS_INICIALES); setBusqueda(""); }}>
                Limpiar filtros
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link to="/dashboard/lotes/nuevo"><Plus className="mr-1.5 h-3.5 w-3.5" /> Nuevo lote</Link>
              </Button>
            )
          }
        />
      )}

      {/* Cards view */}
      {!isLoading && vistaEfectiva === "cards" && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => {
            const card = buildCard(l);
            return (
              <LoteCardAdmin
                key={l.id}
                lote={card}
                onAsignarPropietario={() => setAsignarLote({ id: l.id, name: l.nombre_lote })}
                onTogglePublico={(checked) => togglePublicoMutation.mutate({ id: l.id, es_publico: checked })}
                onPublicarMercado={() => setPublicarLote({ id: l.id, name: l.nombre_lote })}
                onRetirarMercado={() => setRetirarLote({ id: l.id, name: l.nombre_lote })}
                onCrearOrden={() => setOrdenLoteId(l.id)}
                onEliminar={() => { setDeleteId(l.id); setDeleteName(l.nombre_lote); }}
              />
            );
          })}
        </div>
      )}

      {/* Tabla densa */}
      {!isLoading && vistaEfectiva === "tabla" && filtered.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSeleccionTodos}
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide">Lote</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide">Ubicación</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wide">Área</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wide">Precio</TableHead>
                <TableHead className="text-center text-[10px] uppercase tracking-wide">Estado</TableHead>
                <TableHead className="text-center text-[10px] uppercase tracking-wide">Plan</TableHead>
                <TableHead className="w-12 text-center text-[10px] uppercase tracking-wide">Vis.</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const requiereAccion = l.estado_publicacion === "pendiente_validacion";
                const fotoGallery = (l.fotos_lotes ?? [])
                  .slice()
                  .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))[0]?.url ?? null;
                const planInfo = (engagementsActivos as any)[l.id]?.planes_diagnostico;
                return (
                  <TableRow key={l.id} className={requiereAccion ? "bg-primary/5" : ""}>
                    <TableCell className="py-2">
                      <Checkbox
                        checked={seleccionados.has(l.id)}
                        onCheckedChange={() => toggleSeleccion(l.id)}
                        aria-label={`Seleccionar ${l.nombre_lote}`}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <FotoLote
                          url={fotoGallery ?? l.foto_url}
                          alt=""
                          className="h-7 w-7 rounded object-cover"
                          fallbackClassName="h-7 w-7 rounded bg-gradient-to-br from-emerald-100 to-emerald-200"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/dashboard/lotes/${l.id}/editar`}
                            className="block truncate text-xs font-semibold text-foreground hover:underline"
                          >
                            {l.nombre_lote}
                          </Link>
                          <div className="font-mono text-[10px] text-muted-foreground">{l.id.slice(0, 8)}</div>
                        </div>
                        {l.destacado && <Star className="h-3 w-3 fill-primary text-primary" />}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-foreground">
                      {[l.ciudad, l.barrio].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell className="py-2 text-right text-xs text-foreground">
                      {l.area_total_m2 ? `${Number(l.area_total_m2).toLocaleString("es-CO")} m²` : "—"}
                    </TableCell>
                    <TableCell className="py-2 text-right text-xs font-semibold text-foreground">
                      {l.precio_venta_estimado != null ? formatCOPCompact(Number(l.precio_venta_estimado)) : "—"}
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <Badge variant={estadoVariant(l.estado_disponibilidad)} className="text-[10px]">
                        {l.estado_disponibilidad}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      {planInfo?.nombre ? (
                        <Badge className={`${planBadgeClass(planInfo.codigo)} text-[10px]`}>{planInfo.nombre}</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      {l.es_publico ? (
                        <Eye className="mx-auto h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="mx-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/lotes/${l.id}/editar`}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/lotes/${l.id}`} target="_blank">
                              <Eye className="mr-2 h-3.5 w-3.5" /> Ver ficha
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/lotes/${l.id}/docs`}>
                              <FolderOpen className="mr-2 h-3.5 w-3.5" /> Documentos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/lotes/${l.id}/analisis`}>
                              <BarChart3 className="mr-2 h-3.5 w-3.5" /> Análisis 360°
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!l.propietario_id && (
                            <DropdownMenuItem onClick={() => setAsignarLote({ id: l.id, name: l.nombre_lote })}>
                              <UserPlus className="mr-2 h-3.5 w-3.5" /> Asignar propietario
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setEngagementLoteId(l.id)}>
                            <Briefcase className="mr-2 h-3.5 w-3.5" /> Crear engagement
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOrdenLoteId(l.id)}>
                            <ClipboardList className="mr-2 h-3.5 w-3.5" /> Crear orden
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => togglePublicoMutation.mutate({ id: l.id, es_publico: !l.es_publico })}
                          >
                            {l.es_publico ? (
                              <><EyeOff className="mr-2 h-3.5 w-3.5" /> Ocultar al público</>
                            ) : (
                              <><Eye className="mr-2 h-3.5 w-3.5" /> Hacer público</>
                            )}
                          </DropdownMenuItem>
                          {l.publicado_venta ? (
                            <DropdownMenuItem onClick={() => setRetirarLote({ id: l.id, name: l.nombre_lote })}>
                              <EyeOff className="mr-2 h-3.5 w-3.5" /> Retirar del mercado
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setPublicarLote({ id: l.id, name: l.nombre_lote })}>
                              <Store className="mr-2 h-3.5 w-3.5" /> Publicar en mercado
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => { setDeleteId(l.id); setDeleteName(l.nombre_lote); }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Archivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Switch silenciador para evitar warning de variable Switch no usada */}
      <span className="hidden"><Switch checked={false} /></span>

      {/* Dialogs */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de archivar <strong>{deleteName}</strong>. Esta acción no se puede deshacer y eliminará también sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Archivando…" : "Archivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkArchivar} onOpenChange={setBulkArchivar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar {seleccionados.size} lote{seleccionados.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará los lotes seleccionados junto con sus datos asociados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleArchivarMultipleConfirm}
            >
              Archivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {engagementLoteId && (
        <CrearEngagementDialog
          loteId={engagementLoteId}
          open={!!engagementLoteId}
          onOpenChange={(o) => { if (!o) setEngagementLoteId(null); }}
        />
      )}

      {ordenLoteId && (
        <CrearOrdenServicioDialog
          open={!!ordenLoteId}
          onOpenChange={(o) => { if (!o) setOrdenLoteId(null); }}
          loteId={ordenLoteId}
        />
      )}

      <AsignarPropietarioDialog
        open={!!asignarLote}
        onOpenChange={(o) => { if (!o) setAsignarLote(null); }}
        loteId={asignarLote?.id ?? null}
        loteName={asignarLote?.name}
      />

      <AlertDialog open={!!publicarLote} onOpenChange={(o) => { if (!o) setPublicarLote(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Publicar en el mercado?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{publicarLote?.name}</strong> quedará visible en el mercado y los desarrolladores podrán verlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!publicarLote) return;
                publicarMercado.mutate(publicarLote.id, { onSettled: () => setPublicarLote(null) });
              }}
              disabled={publicarMercado.isPending}
            >
              {publicarMercado.isPending ? "Publicando…" : "Publicar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!retirarLote} onOpenChange={(o) => { if (!o) setRetirarLote(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Retirar del mercado?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{retirarLote?.name}</strong> dejará de aparecer en el mercado. Si tiene propietario, será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!retirarLote) return;
                validarLote.mutate(
                  { lote_id: retirarLote.id, decision: "retirado", notas: "Retirado por 360Lateral desde el panel" },
                  { onSettled: () => setRetirarLote(null) }
                );
              }}
              disabled={validarLote.isPending}
            >
              {validarLote.isPending ? "Retirando…" : "Retirar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DashboardLotes;

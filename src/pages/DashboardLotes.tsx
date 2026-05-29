import { useState, useDeferredValue, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
  LayoutGrid, List,
} from "lucide-react";
import CrearOrdenServicioDialog from "@/components/ordenes/CrearOrdenServicioDialog";
import { useToast } from "@/hooks/use-toast";
import CrearEngagementDialog from "@/components/portafolio/CrearEngagementDialog";
import AsignarPropietarioDialog from "@/components/portafolio/AsignarPropietarioDialog";
import { useEngagementsActivosPorLotes } from "@/hooks/useEngagements";
import { usePublicarLoteMercado } from "@/hooks/useAsignarPropietario";
import { useValidarLote } from "@/hooks/useValidarLote";
import LoteCardAdmin, { LoteCardData } from "@/components/lotes/LoteCardAdmin";
import FiltrosLotesAvanzados, { FiltrosLotesState, FILTROS_INICIALES } from "@/components/lotes/FiltrosLotesAvanzados";

const VISTA_STORAGE_KEY = "dash_lotes_vista";

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
}

const DashboardLotes = () => {
  const [filtros, setFiltros] = useState<FiltrosLotesState>(FILTROS_INICIALES);
  const [vista, setVista] = useState<"cards" | "tabla">(() => {
    if (typeof window === "undefined") return "cards";
    return (localStorage.getItem(VISTA_STORAGE_KEY) as "cards" | "tabla") || "cards";
  });
  useEffect(() => {
    localStorage.setItem(VISTA_STORAGE_KEY, vista);
  }, [vista]);

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
           tipo_lote, lat, lng, foto_url, precio_venta_estimado,
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

  // Derive filter options
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

  const deferredFiltros = useDeferredValue(filtros);

  const filtered = useMemo(() => {
    return lotes.filter((l) => {
      const q = deferredFiltros.q.trim().toLowerCase();
      if (q && !l.nombre_lote.toLowerCase().includes(q) && !(l.barrio ?? "").toLowerCase().includes(q)) return false;
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
      if (deferredFiltros.propietario === "con" && !l.propietario_id) return false;
      if (deferredFiltros.propietario === "sin" && l.propietario_id) return false;
      if (deferredFiltros.publicacion === "publicos" && !l.es_publico) return false;
      if (deferredFiltros.publicacion === "no_publicos" && l.es_publico) return false;
      if (deferredFiltros.soloDestacados && !l.destacado) return false;
      return true;
    });
  }, [lotes, deferredFiltros, engagementsActivos]);

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

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-body text-xl font-bold text-foreground">Lotes</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setVista("cards")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                vista === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
              title="Vista tarjetas"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setVista("tabla")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                vista === "tabla" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
              title="Vista tabla"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button variant="ghost" size="sm" asChild title="Importar Excel">
            <Link to="/dashboard/lotes/importar"><Upload className="h-4 w-4" /></Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/dashboard/lotes/nuevo"><Plus className="mr-1 h-4 w-4" /> Nuevo lote</Link>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <FiltrosLotesAvanzados
          value={filtros}
          onChange={setFiltros}
          onClear={() => setFiltros(FILTROS_INICIALES)}
          ciudades={ciudades}
          tipos={tipos}
          planes={planes}
          estados={estadosLista}
        />
      </div>

      <div className="mb-3 text-sm text-muted-foreground">
        {isLoading ? "Cargando…" : `${filtered.length} lote${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}`}
      </div>

      {isLoading && vista === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
              <Skeleton className="h-[180px] w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontraron lotes con los filtros aplicados.
          </CardContent>
        </Card>
      )}

      {!isLoading && vista === "cards" && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

      {!isLoading && vista === "tabla" && filtered.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 font-semibold text-foreground">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Propietario</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Plan</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Ciudad</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Área m²</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Estado</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Público</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Dest.</th>
                  <th className="px-4 py-3 font-semibold text-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{l.nombre_lote}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {l.propietario_id ? (
                        <span className="text-foreground">
                          {(propietariosMap as any)[l.propietario_id]?.nombre
                            || (propietariosMap as any)[l.propietario_id]?.email || "—"}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">Sin propietario</Badge>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => setAsignarLote({ id: l.id, name: l.nombre_lote })}>
                            <UserPlus className="mr-1 h-3.5 w-3.5" /> Asignar
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(engagementsActivos as any)[l.id]?.planes_diagnostico?.nombre ? (
                        <Badge className={`text-xs ${planBadgeClass((engagementsActivos as any)[l.id].planes_diagnostico.codigo)}`}>
                          {(engagementsActivos as any)[l.id].planes_diagnostico.nombre}
                        </Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.ciudad ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {l.area_total_m2 ? Number(l.area_total_m2).toLocaleString("es-CO") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={estadoVariant(l.estado_disponibilidad)} className="text-xs">
                        {l.estado_disponibilidad}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Switch checked={l.es_publico}
                        onCheckedChange={(checked) => togglePublicoMutation.mutate({ id: l.id, es_publico: checked })} />
                    </td>
                    <td className="px-4 py-3">
                      <Star className={`h-4 w-4 ${l.destacado ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/lotes/${l.id}/editar`} className="flex items-center gap-2">
                              <Pencil className="h-4 w-4" /> Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/lotes/${l.id}/docs`} className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4" /> Documentos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/lotes/${l.id}/analisis`} className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" /> Análisis 360°
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEngagementLoteId(l.id)}>
                            <Briefcase className="mr-2 h-4 w-4" /> Crear engagement
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOrdenLoteId(l.id)}>
                            <ClipboardList className="mr-2 h-4 w-4" /> Crear orden de servicio
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/lotes/${l.id}`} target="_blank" className="flex items-center gap-2">
                              <Eye className="h-4 w-4" /> Ver ficha
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {l.publicado_venta ? (
                            <DropdownMenuItem onClick={() => setRetirarLote({ id: l.id, name: l.nombre_lote })}>
                              <EyeOff className="mr-2 h-4 w-4" /> Retirar del mercado
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setPublicarLote({ id: l.id, name: l.nombre_lote })}>
                              <Store className="mr-2 h-4 w-4" /> Publicar en mercado
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive"
                            onClick={() => { setDeleteId(l.id); setDeleteName(l.nombre_lote); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar <strong>{deleteName}</strong>. Esta acción no se puede deshacer y eliminará también sus datos asociados (normativa, precios, servicios, documentos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
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

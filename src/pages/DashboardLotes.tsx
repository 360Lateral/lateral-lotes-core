import { useState, useDeferredValue, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Pencil, FolderOpen, Eye, Star, Upload, Trash2, BarChart3,
  MoreHorizontal, Briefcase, UserPlus, Store, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CrearEngagementDialog from "@/components/portafolio/CrearEngagementDialog";
import AsignarPropietarioDialog from "@/components/portafolio/AsignarPropietarioDialog";
import { useEngagementsActivosPorLotes } from "@/hooks/useEngagements";
import { usePublicarLoteMercado } from "@/hooks/useAsignarPropietario";
import { useValidarLote } from "@/hooks/useValidarLote";

const estadoVariant = (e: string) => {
  switch (e) {
    case "Disponible": return "disponible" as const;
    case "Reservado": return "reservado" as const;
    case "Vendido": return "vendido" as const;
    default: return "default" as const;
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
}

const DashboardLotes = () => {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [engagementLoteId, setEngagementLoteId] = useState<string | null>(null);
  const [asignarLote, setAsignarLote] = useState<{ id: string; name: string } | null>(null);
  const [publicarLote, setPublicarLote] = useState<{ id: string; name: string } | null>(null);
  const [retirarLote, setRetirarLote] = useState<{ id: string; name: string } | null>(null);
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
          "id, nombre_lote, ciudad, barrio, area_total_m2, estado_disponibilidad, destacado, es_publico, propietario_id, publicado_venta, estado_publicacion"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LoteRow[];
    },
  });

  // Resolve propietario names in one batch
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
      (data ?? []).forEach((p: any) => {
        map[p.id] = { nombre: p.nombre, email: p.email };
      });
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
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
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

  const deferredSearch = useDeferredValue(search);

  const filtered = lotes.filter((l) => {
    const q = deferredSearch.toLowerCase();
    return (
      l.nombre_lote.toLowerCase().includes(q) ||
      (l.barrio ?? "").toLowerCase().includes(q)
    );
  });

  const { data: engagementsActivos = {} } = useEngagementsActivosPorLotes(filtered.map((l) => l.id));

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-body text-xl font-bold text-foreground">Lotes</h1>
        <Button variant="default" size="sm" asChild>
          <Link to="/dashboard/lotes/nuevo">
            <Plus className="mr-1 h-4 w-4" /> Nuevo lote
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Buscar por nombre o barrio…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="ghost" size="sm" asChild title="Importar Excel">
          <Link to="/dashboard/lotes/importar">
            <Upload className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 font-semibold text-foreground">Nombre</th>
                <th className="px-4 py-3 font-semibold text-foreground">Propietario</th>
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
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{l.nombre_lote}</span>
                      {(engagementsActivos as any)[l.id]?.planes_diagnostico?.nombre && (
                        <Badge variant="secondary" className="text-[10px]">
                          {(engagementsActivos as any)[l.id].planes_diagnostico.nombre}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.propietario_id ? (
                      <span className="text-foreground">
                        {(propietariosMap as any)[l.propietario_id]?.nombre
                          || (propietariosMap as any)[l.propietario_id]?.email
                          || "—"}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">Sin propietario</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setAsignarLote({ id: l.id, name: l.nombre_lote })}
                        >
                          <UserPlus className="mr-1 h-3.5 w-3.5" />
                          Asignar
                        </Button>
                      </div>
                    )}
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
                    <Switch
                      checked={l.es_publico}
                      onCheckedChange={(checked) => togglePublicoMutation.mutate({ id: l.id, es_publico: checked })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Star
                      className={`h-4 w-4 ${l.destacado ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    />
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
                        <DropdownMenuItem asChild>
                          <Link to={`/lotes/${l.id}`} target="_blank" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" /> Ver ficha
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {l.publicado_venta ? (
                          <DropdownMenuItem
                            onClick={() => setRetirarLote({ id: l.id, name: l.nombre_lote })}
                          >
                            <EyeOff className="mr-2 h-4 w-4" /> Retirar del mercado
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setPublicarLote({ id: l.id, name: l.nombre_lote })}
                          >
                            <Store className="mr-2 h-4 w-4" /> Publicar en mercado
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => { setDeleteId(l.id); setDeleteName(l.nombre_lote); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron lotes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

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
                publicarMercado.mutate(publicarLote.id, {
                  onSettled: () => setPublicarLote(null),
                });
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

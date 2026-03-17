import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, FolderOpen, Eye, Star, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const estadoVariant = (e: string) => {
  switch (e) {
    case "Disponible": return "disponible" as const;
    case "Reservado": return "reservado" as const;
    case "Vendido": return "vendido" as const;
    default: return "default" as const;
  }
};

const DashboardLotes = () => {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lotes = [], isLoading } = useQuery({
    queryKey: ["dash-lotes-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("id, nombre_lote, ciudad, barrio, area_total_m2, estado_disponibilidad, destacado, nombre_propietario")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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

  const filtered = lotes.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.nombre_lote.toLowerCase().includes(q) ||
      (l.barrio ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-body text-xl font-bold text-foreground">Lotes</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/lotes/importar">
              <Upload className="mr-1 h-4 w-4" /> Importar Excel
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/dashboard/lotes/nuevo">
              <Plus className="mr-1 h-4 w-4" /> Nuevo lote
            </Link>
          </Button>
        </div>
      </div>

      <Input
        placeholder="Buscar por nombre o barrio…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 font-semibold text-foreground">Nombre</th>
                <th className="px-4 py-3 font-semibold text-foreground">Ciudad</th>
                <th className="px-4 py-3 font-semibold text-foreground">Área m²</th>
                <th className="px-4 py-3 font-semibold text-foreground">Estado</th>
                <th className="px-4 py-3 font-semibold text-foreground">Dest.</th>
                <th className="px-4 py-3 font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{l.nombre_lote}</td>
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
                    <Star
                      className={`h-4 w-4 ${l.destacado ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/dashboard/lotes/${l.id}/editar`} title="Editar">
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Link>
                      <Link to={`/dashboard/lotes/${l.id}/docs`} title="Documentos">
                        <FolderOpen className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Link>
                      <Link to={`/lotes/${l.id}`} target="_blank" title="Ver ficha">
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Link>
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => { setDeleteId(l.id); setDeleteName(l.nombre_lote); }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
    </DashboardLayout>
  );
};

export default DashboardLotes;

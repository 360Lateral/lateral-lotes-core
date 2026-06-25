import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocRequeridoAdmin {
  id: string;
  plan_id: string;
  tipo_analisis_id: string;
  nombre: string;
  descripcion: string | null;
  opcional: boolean;
  orden: number;
  activo: boolean;
  created_at: string;
}

export type DocRequeridoInput = Omit<DocRequeridoAdmin, "id" | "created_at">;

const invalidarTodos = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["docs-requeridos-admin"] });
  qc.invalidateQueries({ queryKey: ["docs-engagement-cliente"] });
  qc.invalidateQueries({ queryKey: ["resumen-engagements-cliente"] });
};

export const useDocumentosRequeridos = (planId?: string) => {
  return useQuery({
    queryKey: ["docs-requeridos-admin", planId ?? "all"],
    staleTime: 30 * 1000,
    queryFn: async (): Promise<DocRequeridoAdmin[]> => {
      let q = (supabase as any)
        .from("documentos_requeridos_plan")
        .select("*")
        .order("plan_id", { ascending: true })
        .order("tipo_analisis_id", { ascending: true })
        .order("orden", { ascending: true });
      if (planId) q = q.eq("plan_id", planId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DocRequeridoAdmin[];
    },
  });
};

export const useCrearDocumentoRequerido = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DocRequeridoInput) => {
      const { error } = await (supabase as any)
        .from("documentos_requeridos_plan")
        .insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarTodos(qc);
      toast.success("Documento agregado");
    },
    onError: (err: any) =>
      toast.error("No se pudo crear", { description: err?.message }),
  });
};

export const useActualizarDocumentoRequerido = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DocRequeridoAdmin> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("documentos_requeridos_plan")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarTodos(qc);
      toast.success("Documento actualizado");
    },
    onError: (err: any) =>
      toast.error("No se pudo actualizar", { description: err?.message }),
  });
};

export const useEliminarDocumentoRequerido = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("documentos_requeridos_plan")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarTodos(qc);
      toast.success("Documento eliminado");
    },
    onError: (err: any) =>
      toast.error("No se pudo eliminar", { description: err?.message }),
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TipoAnalisis {
  id: string;
  codigo: string;
  nombre: string;
  tabla_destino: string | null;
  orden: number | null;
  activo: boolean;
}

export const useTiposAnalisis = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["tipos_analisis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_analisis")
        .select("*")
        .order("orden", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TipoAnalisis[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: Omit<TipoAnalisis, "id">) => {
      const { data, error } = await supabase
        .from("tipos_analisis")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_analisis"] });
      toast.success("Tipo de análisis creado");
    },
    onError: (err: any) => toast.error(err.message || "Error al crear tipo"),
  });

  const update = useMutation({
    mutationFn: async ({ id, codigo: _ignored, ...patch }: Partial<TipoAnalisis> & { id: string }) => {
      const { data, error } = await supabase
        .from("tipos_analisis")
        .update(patch as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_analisis"] });
      qc.invalidateQueries({ queryKey: ["planes_analisis"] });
      toast.success("Tipo de análisis actualizado");
    },
    onError: (err: any) => toast.error(err.message || "Error al actualizar tipo"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tipos_analisis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_analisis"] });
      toast.success("Tipo de análisis eliminado");
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar tipo"),
  });

  return { ...query, create, update, remove };
};

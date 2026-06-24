import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlanDiagnostico {
  id: string;
  codigo: string;
  nombre: string;
  precio_smlmv: number | null;
  precio_cop: number | null;
  moneda: string;
  dias_sla: number | null;
  orden: number | null;
  activo: boolean;
  descripcion_corta: string | null;
  para_quien: string | null;
  recomendado: boolean;
  created_at?: string;
}

export interface PlanAnalisisRow {
  id?: string;
  plan_id: string;
  tipo_analisis_id: string;
  incluido: boolean;
  peso_avance: number;
}

export const usePlanesDiagnostico = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["planes_diagnostico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planes_diagnostico")
        .select("*")
        .order("orden", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PlanDiagnostico[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: Omit<PlanDiagnostico, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("planes_diagnostico")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planes_diagnostico"] });
      qc.invalidateQueries({ queryKey: ["planes-con-precio"] });
      toast.success("Plan creado");
    },
    onError: (err: any) => toast.error(err.message || "Error al crear plan"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PlanDiagnostico> & { id: string }) => {
      const { data, error } = await supabase
        .from("planes_diagnostico")
        .update(patch as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planes_diagnostico"] });
      qc.invalidateQueries({ queryKey: ["planes_analisis"] });
      qc.invalidateQueries({ queryKey: ["planes-con-precio"] });
      toast.success("Plan actualizado");
    },
    onError: (err: any) => toast.error(err.message || "Error al actualizar plan"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planes_diagnostico").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planes_diagnostico"] });
      qc.invalidateQueries({ queryKey: ["planes-con-precio"] });
      toast.success("Plan eliminado");
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar plan"),
  });

  return { ...query, create, update, remove };
};

export const usePlanesAnalisis = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["planes_analisis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("planes_analisis").select("*");
      if (error) throw error;
      return (data ?? []) as PlanAnalisisRow[];
    },
  });

  const upsertMany = useMutation({
    mutationFn: async (rows: PlanAnalisisRow[]) => {
      const { error } = await supabase
        .from("planes_analisis")
        .upsert(rows as any, { onConflict: "plan_id,tipo_analisis_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planes_analisis"] });
      toast.success("Matriz guardada");
    },
    onError: (err: any) => toast.error(err.message || "Error al guardar matriz"),
  });

  return { ...query, upsertMany };
};

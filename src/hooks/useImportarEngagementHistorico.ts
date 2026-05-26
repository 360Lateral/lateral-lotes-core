import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  lote_id: string;
  plan_id: string;
  cliente_id: string | null;
  asesor_id: string;
  fecha_entrega: string;
  link_diagnostico: string;
  link_presentacion: string;
  tareas_no_aplica?: string[];
  precio_cobrado?: number | null;
  notas?: string | null;
}

export const useImportarEngagementHistorico = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input): Promise<string> => {
      const { data, error } = await supabase.rpc("importar_engagement_historico", {
        p_lote_id: input.lote_id,
        p_plan_id: input.plan_id,
        p_cliente_id: input.cliente_id,
        p_asesor_id: input.asesor_id,
        p_fecha_entrega: input.fecha_entrega,
        p_link_diagnostico: input.link_diagnostico,
        p_link_presentacion: input.link_presentacion,
        p_tareas_no_aplica: input.tareas_no_aplica ?? [],
        p_precio_cobrado: input.precio_cobrado ?? null,
        p_notas: input.notas ?? null,
      });
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["engagements-list"] });
      qc.invalidateQueries({ queryKey: ["vw-portafolio-resumen"] });
      qc.invalidateQueries({ queryKey: ["engagements-por-lote"] });
      toast.success("Engagement histórico importado", {
        description: "Quedó cerrado con los dos entregables publicados.",
      });
    },
    onError: (e: any) => {
      toast.error("No se pudo importar", { description: e.message });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAdjudicarPropuesta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orden_id, propuesta_id }: { orden_id: string; propuesta_id: string }) => {
      const { error } = await (supabase as any).rpc("adjudicar_propuesta", {
        p_orden_id: orden_id,
        p_propuesta_id: propuesta_id,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["ordenes-servicio"] });
      qc.invalidateQueries({ queryKey: ["orden-detalle", vars.orden_id] });
      qc.invalidateQueries({ queryKey: ["propuestas-orden", vars.orden_id] });
      qc.invalidateQueries({ queryKey: ["mis-propuestas"] });
      qc.invalidateQueries({ queryKey: ["mis-ordenes-experto"] });
      qc.invalidateQueries({ queryKey: ["tareas-engagement"] });
      qc.invalidateQueries({ queryKey: ["propuestas-count"] });
      toast.success("Propuesta adjudicada", {
        description: "El experto ganador fue notificado y los demás también.",
      });
    },
    onError: (e: any) => {
      toast.error("No se pudo adjudicar", { description: e.message });
    },
  });
};

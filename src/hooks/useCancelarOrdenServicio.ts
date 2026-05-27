import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCancelarOrdenServicio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orden_id, motivo }: { orden_id: string; motivo?: string }) => {
      const { error } = await (supabase as any).rpc("cancelar_orden_servicio", {
        p_orden_id: orden_id,
        p_motivo: motivo ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordenes-servicio"] });
      qc.invalidateQueries({ queryKey: ["orden-detalle"] });
      qc.invalidateQueries({ queryKey: ["ordenes-counts"] });
      toast.success("Orden cancelada");
    },
    onError: (e: any) => {
      toast.error("No se pudo cancelar", { description: e.message });
    },
  });
};

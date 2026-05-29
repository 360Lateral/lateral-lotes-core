import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  negociacion_id: string;
  precio_venta_final: number;
  fee_360_pct?: number;
  comprador_externo?: string;
  notas?: string;
}

export const useCerrarVenta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { error } = await (supabase as any).rpc("cerrar_venta", {
        p_negociacion_id: input.negociacion_id,
        p_precio_venta_final: input.precio_venta_final,
        p_fee_360_pct: input.fee_360_pct ?? 2,
        p_comprador_externo: input.comprador_externo ?? null,
        p_notas: input.notas ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["negociaciones"] });
      qc.invalidateQueries({ queryKey: ["comisiones-admin"] });
      qc.invalidateQueries({ queryKey: ["mis-comisiones"] });
      qc.invalidateQueries({ queryKey: ["lotes"] });
      toast.success("Venta cerrada con éxito");
    },
    onError: (e: any) =>
      toast.error("No se pudo cerrar la venta", { description: e.message }),
  });
};

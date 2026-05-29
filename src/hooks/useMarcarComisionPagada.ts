import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  id: string;
  metodo_pago: string;
  referencia_pago?: string;
  notas?: string;
}

export const useMarcarComisionPagada = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { error } = await (supabase as any).rpc("marcar_comision_pagada", {
        p_comision_id: input.id,
        p_metodo_pago: input.metodo_pago,
        p_referencia_pago: input.referencia_pago ?? null,
        p_notas: input.notas ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comisiones-admin"] });
      qc.invalidateQueries({ queryKey: ["mis-comisiones"] });
      toast.success("Comisión marcada como pagada");
    },
    onError: (e: any) =>
      toast.error("No se pudo marcar como pagada", { description: e.message }),
  });
};

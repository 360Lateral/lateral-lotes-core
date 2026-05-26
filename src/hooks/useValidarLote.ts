import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  lote_id: string;
  decision: "aprobado" | "rechazado" | "retirado";
  notas?: string;
}

export const useValidarLote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { error } = await supabase.rpc("validar_lote", {
        p_lote_id: input.lote_id,
        p_decision: input.decision,
        p_notas: input.notas ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lotes-pendientes-validacion"] });
      qc.invalidateQueries({ queryKey: ["mis-activos"] });
      const msg = {
        aprobado: "Lote aprobado y notificado al propietario",
        rechazado: "Lote rechazado y motivo enviado al propietario",
        retirado: "Lote retirado del mercado",
      }[vars.decision];
      toast.success(msg);
    },
    onError: (e: any) => {
      toast.error("No se pudo procesar la validación", { description: e.message });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRevocarAutorizacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ autorizacionId, motivo }: { autorizacionId: string; motivo?: string }) => {
      const { error } = await supabase.rpc("revocar_autorizacion_comisionista", {
        p_autorizacion_id: autorizacionId,
        p_motivo: motivo ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["autorizaciones-lote"] });
      qc.invalidateQueries({ queryKey: ["mis-autorizaciones"] });
      toast.success("Autorización revocada");
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo revocar"),
  });
};

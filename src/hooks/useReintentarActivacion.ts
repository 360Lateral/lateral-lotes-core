import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useReintentarActivacion = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (transaccionId: string) => {
      const { data, error } = await (supabase as any).rpc(
        "reintentar_activacion_transaccion",
        { p_transaccion_id: transaccionId },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Activación reintentada exitosamente");
      qc.invalidateQueries({ queryKey: ["transacciones-admin"] });
      qc.invalidateQueries({ queryKey: ["transaccion-detalle"] });
    },
    onError: (err: any) => {
      toast.error("Error al reintentar activación", {
        description: err?.message ?? "Error desconocido",
      });
    },
  });
};

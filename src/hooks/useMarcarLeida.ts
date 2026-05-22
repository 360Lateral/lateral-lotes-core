import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMarcarLeida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p_notif_id: string) => {
      const { error } = await supabase.rpc("marcar_notificacion_leida", {
        p_notif_id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificaciones"] });
      qc.invalidateQueries({ queryKey: ["notificaciones-count"] });
    },
    onError: () => toast.error("No se pudo marcar como leída"),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMarcarTodasLeidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("marcar_todas_leidas");
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["notificaciones"] });
      qc.invalidateQueries({ queryKey: ["notificaciones-count"] });
      toast.success(`${count} ${count === 1 ? "notificación marcada" : "notificaciones marcadas"} como leídas`);
    },
    onError: () => toast.error("No se pudieron marcar como leídas"),
  });
}

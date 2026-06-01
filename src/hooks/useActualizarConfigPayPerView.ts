import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConfigPpvUpdate {
  precio_cop: number;
  dias_acceso: number;
  activo: boolean;
}

export const useActualizarConfigPayPerView = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ConfigPpvUpdate) => {
      const { error } = await supabase
        .from("config_payperview")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config-payperview"] });
      toast.success("Configuración pay-per-view actualizada");
    },
    onError: (e: any) => toast.error("No se pudo guardar la configuración", { description: e?.message }),
  });
};

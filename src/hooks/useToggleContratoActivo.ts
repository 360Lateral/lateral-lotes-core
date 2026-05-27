import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useToggleContratoActivo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await (supabase as any).rpc("toggle_contrato_activo", {
        p_contrato_id: id,
        p_activo: activo,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contratos-marco"] });
      toast.success(vars.activo ? "Contrato activado" : "Contrato desactivado");
    },
    onError: (e: any) => {
      toast.error("No se pudo cambiar el estado", { description: e.message });
    },
  });
};

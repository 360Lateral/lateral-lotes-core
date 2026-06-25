import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRevocarAccesoManual = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accesoId: string) => {
      const { error } = await supabase.rpc("revocar_acceso_manual_lote", {
        p_acceso_id: accesoId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accesos-manuales-lote"] });
      qc.invalidateQueries({ queryKey: ["accesos-manuales-usuario"] });
      qc.invalidateQueries({ queryKey: ["mis-accesos-con-datos"] });
      toast.success("Acceso revocado");
    },
    onError: (err: any) => {
      toast.error("Error al revocar", { description: err.message });
    },
  });
};

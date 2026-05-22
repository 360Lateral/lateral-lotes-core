import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Args {
  engagementId: string;
  mostrar: boolean;
}

export const useActualizarVisibilidadCliente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ engagementId, mostrar }: Args) => {
      const { error } = await supabase
        .from("engagements_lote")
        .update({ mostrar_avance_al_cliente: mostrar } as any)
        .eq("id", engagementId);
      if (error) throw error;
      return mostrar;
    },
    onSuccess: (mostrar, vars) => {
      qc.invalidateQueries({ queryKey: ["engagement-detalle", vars.engagementId] });
      toast.success(
        mostrar
          ? "El cliente ahora puede ver el avance"
          : "El cliente ya no puede ver el avance",
      );
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar"),
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PrecioUpdate {
  id: string;
  precio_cop: number;
  activo: boolean;
}

export const useActualizarPreciosSuscripcion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: PrecioUpdate[]) => {
      for (const r of rows) {
        const { error } = await supabase
          .from("precios_suscripcion")
          .update({ precio_cop: r.precio_cop, activo: r.activo })
          .eq("id", r.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["precios-suscripcion"] });
      qc.invalidateQueries({ queryKey: ["precios-suscripcion-admin"] });
      toast.success("Precios actualizados");
    },
    onError: (e: any) => toast.error("No se pudieron guardar los precios", { description: e?.message }),
  });
};

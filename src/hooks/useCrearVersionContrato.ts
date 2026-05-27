import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  contrato_id_actual: string;
  contenido_legal: string;
  precio_min: number;
  precio_max: number;
  plazo_min_dias: number;
  plazo_max_dias: number;
  moneda?: string;
  version_explicita?: string;
}

export const useCrearVersionContrato = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { data, error } = await (supabase as any).rpc("crear_nueva_version_contrato", {
        p_contrato_id_actual: input.contrato_id_actual,
        p_contenido_legal: input.contenido_legal,
        p_precio_min: input.precio_min,
        p_precio_max: input.precio_max,
        p_plazo_min_dias: input.plazo_min_dias,
        p_plazo_max_dias: input.plazo_max_dias,
        p_moneda: input.moneda ?? "COP",
        p_version_explicita: input.version_explicita ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos-marco"] });
      toast.success("Nueva versión del contrato creada");
    },
    onError: (e: any) => {
      toast.error("No se pudo crear la nueva versión", { description: e.message });
    },
  });
};

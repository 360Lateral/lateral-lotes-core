import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { NivelSuscripcion } from "@/hooks/useNivelSuscripcion";

interface Input {
  desarrollador_id: string;
  nivel_nuevo: NivelSuscripcion;
  motivo?: string;
}

export const useCambiarNivelSuscripcion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { data, error } = await supabase.rpc("cambiar_nivel_suscripcion", {
        p_desarrollador_id: input.desarrollador_id,
        p_nivel_nuevo: input.nivel_nuevo,
        p_motivo: input.motivo ?? null,
        p_origen: "admin_manual",
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["nivel-suscripcion"] });
      qc.invalidateQueries({ queryKey: ["audit-nivel-suscripcion"] });
      toast.success("Nivel de suscripción actualizado");
    },
    onError: (e: any) => {
      toast.error("No se pudo cambiar el nivel", { description: e.message });
    },
  });
};

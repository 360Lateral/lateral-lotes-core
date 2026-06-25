import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AsignarMasivoInput {
  lote_ids: string[];
  usuario_destino_id: string;
}

interface AsignarMasivoResult {
  ok: boolean;
  count_solicitados: number;
  count_asignados: number;
  count_omitidos: number;
  usuario_destino_email: string;
}

export const useAsignarLotesMasivo = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: AsignarMasivoInput): Promise<AsignarMasivoResult> => {
      const { data, error } = await (supabase as any).rpc("asignar_lotes_masivo_a_usuario", {
        p_lote_ids: input.lote_ids,
        p_usuario_destino_id: input.usuario_destino_id,
      });
      if (error) throw error;
      return data as AsignarMasivoResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["lotes-huerfanos-agrupados"] });
      qc.invalidateQueries({ queryKey: ["dash-lotes-list"] });
      qc.invalidateQueries({ queryKey: ["portafolio-propietario"] });
      qc.invalidateQueries({ queryKey: ["mis-activos"] });

      if (result.count_omitidos > 0) {
        toast.success(`${result.count_asignados} lote(s) asignados`, {
          description: `${result.count_omitidos} omitidos (ya tenían propietario)`,
        });
      } else {
        toast.success(`${result.count_asignados} lote(s) asignados a ${result.usuario_destino_email}`);
      }
    },
    onError: (err: any) => {
      toast.error("Error al asignar lotes", { description: err?.message });
    },
  });
};

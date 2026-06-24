import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NuevoSmlmvPayload {
  anio: number;
  valor_cop: number;
  decreto?: string | null;
  vigente_desde: string; // ISO date YYYY-MM-DD
  notas?: string | null;
}

export const useActualizarSmlmv = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: NuevoSmlmvPayload) => {
      // Close previous vigente record(s)
      const { error: closeErr } = await supabase
        .from("salarios_minimos")
        .update({ vigente_hasta: payload.vigente_desde } as any)
        .is("vigente_hasta", null);
      if (closeErr) throw closeErr;

      const { data, error } = await supabase
        .from("salarios_minimos")
        .insert({
          anio: payload.anio,
          valor_cop: payload.valor_cop,
          decreto: payload.decreto ?? null,
          vigente_desde: payload.vigente_desde,
          notas: payload.notas ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smlmv-vigente"] });
      qc.invalidateQueries({ queryKey: ["planes-con-precio"] });
      qc.invalidateQueries({ queryKey: ["planes_diagnostico"] });
      toast.success("SMLMV actualizado — precios recalculados");
    },
    onError: (err: any) => toast.error(err.message || "Error al actualizar SMLMV"),
  });
};

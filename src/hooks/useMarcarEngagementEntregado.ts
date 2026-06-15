import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Vars {
  engagementId: string;
  entregableDiagnosticoId?: string | null;
  entregablePresentacionId?: string | null;
}

export const useMarcarEngagementEntregado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      engagementId,
      entregableDiagnosticoId,
      entregablePresentacionId,
    }: Vars) => {
      const ahora = new Date().toISOString();

      if (entregableDiagnosticoId) {
        const { error } = await (supabase as any)
          .from("entregables_engagement")
          .update({ estado: "publicado", updated_at: ahora })
          .eq("id", entregableDiagnosticoId)
          .eq("estado", "borrador");
        if (error) throw new Error(`Diagnóstico: ${error.message}`);
      }

      if (entregablePresentacionId) {
        const { error } = await (supabase as any)
          .from("entregables_engagement")
          .update({ estado: "publicado", updated_at: ahora })
          .eq("id", entregablePresentacionId)
          .eq("estado", "borrador");
        if (error) throw new Error(`Presentación: ${error.message}`);
      }

      const { error: errEng } = await (supabase as any)
        .from("engagements_lote")
        .update({
          estado: "entregado",
          fecha_entrega: ahora,
          updated_at: ahora,
        })
        .eq("id", engagementId);
      if (errEng) throw new Error(`Engagement: ${errEng.message}`);

      return { engagementId };
    },
    onSuccess: () => {
      toast.success("Entregado al cliente. El SLA se marcó como cumplido.");
      qc.invalidateQueries({ queryKey: ["vw-portafolio-resumen"] });
      qc.invalidateQueries({ queryKey: ["engagement-detalle"] });
      qc.invalidateQueries({ queryKey: ["entregables-engagement"] });
      qc.invalidateQueries({ queryKey: ["portafolio-kpis"] });
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
};

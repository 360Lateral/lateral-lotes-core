import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  lote_id: string;
  plan_id: string;
  plan_codigo: string;
}

interface Output {
  engagement_id: string;
  es_gratuito: boolean;
  payment_url?: string;
  activado?: boolean;
}

export const useSolicitarDiagnostico = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input): Promise<Output> => {
      const { data: engagementId, error: solErr } = await (supabase as any).rpc(
        "solicitar_diagnostico",
        { p_lote_id: input.lote_id, p_plan_id: input.plan_id }
      );
      if (solErr) throw solErr;
      if (!engagementId) throw new Error("Engagement no creado");

      const engId = engagementId as string;

      if (input.plan_codigo === "gratuito") {
        const { error: actErr } = await (supabase as any).rpc(
          "activar_engagement_gratuito",
          { p_engagement_id: engId }
        );
        if (actErr) throw actErr;
        return { engagement_id: engId, es_gratuito: true, activado: true };
      }

      const { data: pagoData, error: pagoErr } = await supabase.functions.invoke(
        "crear-pago-wompi",
        { body: { engagement_id: engId } }
      );
      if (pagoErr) throw pagoErr;
      if (pagoData?.error) throw new Error(pagoData.error);

      return {
        engagement_id: engId,
        es_gratuito: false,
        payment_url: pagoData.payment_url,
      };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["mis-engagements-cliente"] });
      qc.invalidateQueries({ queryKey: ["mis-activos"] });
      if (data.es_gratuito) {
        toast.success("¡Diagnóstico Gratuito activado!", {
          description: "Las tareas iniciaron. Te avisaremos cuando esté listo.",
        });
      } else {
        toast.success("Redirigiendo a la pasarela de pago...", {
          description: "Tu engagement se activará al confirmar el pago.",
        });
      }
    },
    onError: (e: any) => {
      toast.error("No se pudo solicitar el diagnóstico", { description: e.message });
    },
  });
};

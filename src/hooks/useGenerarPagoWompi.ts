import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerarPagoResponse {
  ok: boolean;
  transaccion_id: string;
  payment_url: string;
  amount_cop: number;
  reference: string;
  reused?: boolean;
}

export const useGenerarPagoWompi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (engagementId: string): Promise<GenerarPagoResponse> => {
      const { data, error } = await supabase.functions.invoke("crear-pago-wompi", {
        body: { engagement_id: engagementId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as GenerarPagoResponse;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["engagement-detalle"] });
      qc.invalidateQueries({ queryKey: ["mis-transacciones"] });
      qc.invalidateQueries({ queryKey: ["transacciones-admin"] });
      if (data.reused) {
        toast.info("Ya existe un link de pago pendiente para este engagement", {
          description: "Reutilizamos el link existente.",
        });
      } else {
        toast.success("Link de pago generado");
      }
    },
    onError: (e: any) => {
      toast.error("No se pudo generar el link de pago", { description: e?.message });
    },
  });
};

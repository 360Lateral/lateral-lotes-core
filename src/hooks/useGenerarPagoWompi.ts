import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TipoPagoWompi = "diagnostico" | "suscripcion" | "pay_per_view";

export interface GenerarPagoInput {
  tipo: TipoPagoWompi;
  engagement_id?: string;
  nivel?: "basico" | "profesional" | "premium";
  periodo_meses?: number;
  lote_id?: string;
}

interface GenerarPagoResponse {
  ok: boolean;
  transaccion_id: string;
  payment_url: string;
  amount_cop: number;
  reference: string;
  reused?: boolean;
  suscripcion_id?: string;
  acceso_lote_id?: string;
}

// Acepta tanto el input nuevo (objeto) como el legacy (string engagement_id).
type Param = GenerarPagoInput | string;

export const useGenerarPagoWompi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Param): Promise<GenerarPagoResponse> => {
      const body: GenerarPagoInput =
        typeof input === "string"
          ? { tipo: "diagnostico", engagement_id: input }
          : input;
      const { data, error } = await supabase.functions.invoke("crear-pago-wompi", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as GenerarPagoResponse;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["engagement-detalle"] });
      qc.invalidateQueries({ queryKey: ["mis-transacciones"] });
      qc.invalidateQueries({ queryKey: ["transacciones-admin"] });
      qc.invalidateQueries({ queryKey: ["mi-suscripcion"] });
      qc.invalidateQueries({ queryKey: ["mis-accesos-lote"] });
      if (data.reused) {
        toast.info("Ya existe un link de pago pendiente", {
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

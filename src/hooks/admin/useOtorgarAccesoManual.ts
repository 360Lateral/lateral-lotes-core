import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OtorgarInput {
  lote_id: string;
  desarrollador_id: string;
  dias: number;
  motivo: string;
  notificar: boolean;
}

interface OtorgarResult {
  ok: boolean;
  acceso_id: string;
  fecha_expiracion: string;
  lote_nombre: string;
  dev_email: string | null;
  dev_nombre: string | null;
}

/**
 * Otorga acceso manual (cortesía) a un lote para un desarrollador.
 * Tras escribir en la BD, dispara el email transaccional best-effort.
 */
export const useOtorgarAccesoManual = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: OtorgarInput) => {
      const { data, error } = await supabase.rpc("otorgar_acceso_manual_lote", {
        p_lote_id: input.lote_id,
        p_desarrollador_id: input.desarrollador_id,
        p_motivo: input.motivo,
        p_dias: input.dias,
      });
      if (error) throw error;
      const result = data as unknown as OtorgarResult;

      if (input.notificar && result?.dev_email && result.acceso_id) {
        // Best-effort: no bloquear si el correo falla.
        try {
          await supabase.functions.invoke("notificar-acceso-manual", {
            body: { acceso_id: result.acceso_id, origin: window.location.origin },
          });
        } catch (e) {
          console.warn("[useOtorgarAccesoManual] email falló:", e);
        }
      }
      return result;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["accesos-manuales-lote", vars.lote_id] });
      qc.invalidateQueries({ queryKey: ["accesos-manuales-usuario", vars.desarrollador_id] });
      qc.invalidateQueries({ queryKey: ["mis-accesos-con-datos"] });
      qc.invalidateQueries({ queryKey: ["accesos-lote-vigentes"] });
      toast.success("Acceso de cortesía otorgado");
    },
    onError: (err: any) => {
      toast.error("Error al otorgar acceso", { description: err.message });
    },
  });
};

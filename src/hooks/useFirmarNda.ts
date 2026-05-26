import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NDA_VERSION, NDA_CONTENIDO } from "@/lib/nda";

export const useFirmarNda = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loteId: string) => {
      const { data, error } = await supabase.rpc("firmar_nda" as any, {
        p_lote_id: loteId,
        p_version_nda: NDA_VERSION,
        p_contenido_aceptado: NDA_CONTENIDO,
        p_user_agent: navigator.userAgent,
      });
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: (_, loteId) => {
      qc.invalidateQueries({ queryKey: ["lote-detalle-por-nivel", loteId] });
      qc.invalidateQueries({ queryKey: ["nda-firmado"] });
      toast.success("NDA firmado", { description: "Ahora tienes acceso a la información detallada del lote." });
    },
    onError: (e: any) => {
      toast.error("No se pudo firmar el NDA", { description: e.message });
    },
  });
};

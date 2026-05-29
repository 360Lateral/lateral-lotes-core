import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAutorizacionesDeLote = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["autorizaciones-lote", loteId],
    enabled: !!loteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("autorizaciones_comisionista")
        .select(
          `id, comision_pct, documento_url, estado, fecha_vencimiento, created_at,
           comisionista:perfiles!autorizaciones_comisionista_comisionista_id_fkey(id, nombre, email)`
        )
        .eq("lote_id", loteId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

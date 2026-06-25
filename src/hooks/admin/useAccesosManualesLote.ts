import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AccesoManualLote {
  id: string;
  desarrollador_id: string;
  lote_id: string;
  fecha_compra: string | null;
  fecha_expiracion: string | null;
  estado: string;
  motivo: string | null;
  otorgado_por: string | null;
  desarrollador: { nombre: string | null; email: string | null } | null;
}

export const useAccesosManualesLote = (loteId: string | undefined) => {
  return useQuery({
    queryKey: ["accesos-manuales-lote", loteId],
    enabled: !!loteId,
    queryFn: async (): Promise<AccesoManualLote[]> => {
      const { data, error } = await supabase
        .from("accesos_lote")
        .select(
          `id, desarrollador_id, lote_id, fecha_compra, fecha_expiracion,
           estado, motivo, otorgado_por,
           desarrollador:perfiles!accesos_lote_desarrollador_id_fkey(nombre, email)`,
        )
        .eq("lote_id", loteId!)
        .eq("tipo", "manual_admin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AccesoManualLote[];
    },
    staleTime: 30_000,
  });
};

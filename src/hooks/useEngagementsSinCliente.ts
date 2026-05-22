import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EngagementSinCliente {
  id: string;
  lote_nombre: string;
  estado: string;
}

export function useEngagementsSinCliente() {
  return useQuery<EngagementSinCliente[]>({
    queryKey: ["engagements-sin-cliente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagements_lote")
        .select("id, estado, lotes:lote_id ( nombre_lote )")
        .is("cliente_id", null)
        .not("estado", "in", "(entregado,cerrado,cancelado)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const lote = row.lotes as { nombre_lote: string | null } | null;
        return {
          id: row.id as string,
          lote_nombre: lote?.nombre_lote ?? "Lote sin nombre",
          estado: row.estado as string,
        };
      });
    },
  });
}

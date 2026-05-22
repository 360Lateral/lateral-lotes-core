import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { periodoToFechas } from "@/lib/periodoToFechas";

export interface EmbudoFila {
  etapa: string;
  cantidad: number;
  conversion_pct: number | null;
}

export function useEmbudoConversion(mesesAtras: number) {
  const { desde, hasta } = periodoToFechas(mesesAtras);
  return useQuery({
    queryKey: ["embudo-conversion", mesesAtras],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("obtener_embudo_conversion", {
        p_desde: desde,
        p_hasta: hasta,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as EmbudoFila[];
    },
  });
}

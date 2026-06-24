import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SmlmvData {
  id: string;
  anio: number;
  monto: number;
  decreto: string | null;
  vigente_desde: string;
  notas: string | null;
}

// Fallback used if the request fails — avoids breaking the public pricing page.
const FALLBACK: SmlmvData = {
  id: "fallback",
  anio: new Date().getFullYear(),
  monto: 1423500,
  decreto: null,
  vigente_desde: `${new Date().getFullYear()}-01-01`,
  notas: null,
};

export const useSmlmvVigente = () => {
  return useQuery({
    queryKey: ["smlmv-vigente"],
    queryFn: async (): Promise<SmlmvData> => {
      const { data, error } = await supabase
        .from("salarios_minimos")
        .select("id, anio, valor_cop, decreto, vigente_desde, notas, vigente_hasta")
        .is("vigente_hasta", null)
        .order("vigente_desde", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return FALLBACK;

      return {
        id: data.id,
        anio: data.anio,
        monto: Number(data.valor_cop),
        decreto: data.decreto,
        vigente_desde: data.vigente_desde,
        notas: data.notas,
      };
    },
    staleTime: 60 * 60 * 1000,
  });
};

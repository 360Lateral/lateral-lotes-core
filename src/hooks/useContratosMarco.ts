import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContratoMarco {
  id: string;
  tipo_analisis_id: string;
  version: string;
  contenido_legal: string;
  precio_min: number;
  precio_max: number;
  plazo_min_dias: number;
  plazo_max_dias: number;
  moneda: string;
  activo: boolean;
  created_at: string;
  creado_por?: string | null;
  tipos_analisis?: { nombre: string; codigo: string } | null;
}

export const useContratosMarco = (soloActivos = true) => {
  return useQuery({
    queryKey: ["contratos-marco", soloActivos],
    queryFn: async (): Promise<ContratoMarco[]> => {
      let q: any = (supabase as any)
        .from("contratos_marco")
        .select("*, tipos_analisis(nombre,codigo)");
      if (soloActivos) q = q.eq("activo", true);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContratoMarco[];
    },
  });
};

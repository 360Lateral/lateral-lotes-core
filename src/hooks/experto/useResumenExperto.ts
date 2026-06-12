import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ResumenExperto {
  ordenes_activas: number;
  propuestas_pendientes: number;
  propuestas_ganadas: number;
  tasa_adjudicacion_pct: number | null;
  ingresos_mes: number;
}

const DEFAULT: ResumenExperto = {
  ordenes_activas: 0,
  propuestas_pendientes: 0,
  propuestas_ganadas: 0,
  tasa_adjudicacion_pct: null,
  ingresos_mes: 0,
};

export const useResumenExperto = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["resumen-experto", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ResumenExperto> => {
      const { data, error } = await (supabase.rpc as any)("resumen_panel_experto", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return { ...DEFAULT, ...((data as Partial<ResumenExperto>) ?? {}) };
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ResumenCuentaDesarrollador {
  accesos_activos: number;
  ndas_firmados: number;
  dias_restantes: number;
  fecha_renovacion: string | null;
  gasto_mes_actual: number;
  gasto_mes_anterior: number;
  delta_gasto: number | null;
}

const DEFAULT: ResumenCuentaDesarrollador = {
  accesos_activos: 0,
  ndas_firmados: 0,
  dias_restantes: 0,
  fecha_renovacion: null,
  gasto_mes_actual: 0,
  gasto_mes_anterior: 0,
  delta_gasto: null,
};

export const useResumenCuentaDesarrollador = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["resumen-cuenta-desarrollador", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ResumenCuentaDesarrollador> => {
      const { data, error } = await (supabase.rpc as any)("resumen_cuenta_desarrollador", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return { ...DEFAULT, ...((data as Partial<ResumenCuentaDesarrollador>) ?? {}) };
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { NivelSuscripcion } from "@/hooks/useNivelSuscripcion";

export interface Suscripcion {
  id: string;
  desarrollador_id: string;
  nivel: NivelSuscripcion;
  periodo_meses: number;
  precio_cop: number;
  estado: "pendiente_pago" | "activa" | "vencida" | "cancelada";
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
}

export const useMiSuscripcion = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mi-suscripcion", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Suscripcion | null> => {
      const { data, error } = await supabase
        .from("suscripciones_desarrollador")
        .select("*")
        .eq("desarrollador_id", user!.id)
        .eq("estado", "activa")
        .gt("fecha_fin", new Date().toISOString())
        .order("fecha_fin", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Suscripcion | null;
    },
  });
};

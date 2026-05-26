import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NivelSuscripcion = "gratuito" | "basico" | "profesional" | "premium";

export const useNivelSuscripcion = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["nivel-suscripcion", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<NivelSuscripcion> => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("nivel_suscripcion")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return ((data as any)?.nivel_suscripcion ?? "gratuito") as NivelSuscripcion;
    },
  });
};

const ORDEN: Record<NivelSuscripcion, number> = {
  gratuito: 0,
  basico: 1,
  profesional: 2,
  premium: 3,
};

export const tieneNivelMinimo = (
  actual: NivelSuscripcion | undefined,
  requerido: NivelSuscripcion,
): boolean => {
  if (!actual) return ORDEN[requerido] === 0;
  return ORDEN[actual] >= ORDEN[requerido];
};

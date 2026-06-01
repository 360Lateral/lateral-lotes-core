import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AccesoLote {
  id: string;
  desarrollador_id: string;
  lote_id: string;
  precio_cop: number;
  estado: "pendiente_pago" | "activa" | "vencida" | "cancelada";
  fecha_compra: string | null;
  fecha_expiracion: string | null;
  created_at: string;
}

export const useMisAccesosLote = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mis-accesos-lote", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<AccesoLote[]> => {
      const { data, error } = await supabase
        .from("accesos_lote")
        .select("*")
        .eq("desarrollador_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AccesoLote[];
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MiSolicitudLote {
  id: string;
  estado: "pendiente" | "contactado" | "cerrado";
  created_at: string;
  fecha_procesado: string | null;
}

export const useMiSolicitudParaLote = (loteId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mi-solicitud-lote", user?.id, loteId],
    enabled: !!user?.id && !!loteId,
    queryFn: async (): Promise<MiSolicitudLote | null> => {
      const { data, error } = await supabase
        .from("solicitudes_contacto")
        .select("id, estado, created_at, fecha_procesado")
        .eq("desarrollador_id", user!.id)
        .eq("lote_id", loteId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as MiSolicitudLote | null) ?? null;
    },
  });
};

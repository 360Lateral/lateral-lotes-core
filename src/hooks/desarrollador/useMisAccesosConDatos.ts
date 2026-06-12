import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AccesoConDatos {
  id: string;
  lote_id: string;
  estado: "pendiente_pago" | "activa" | "vencida" | "cancelada";
  fecha_compra: string | null;
  fecha_expiracion: string | null;
  ciudad: string | null;
  barrio: string | null;
  nombre_lote: string | null;
  area_total_m2: number | null;
  estrato: number | null;
  tipo_lote: string | null;
}

export const useMisAccesosConDatos = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mis-accesos-con-datos", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<AccesoConDatos[]> => {
      const { data, error } = await supabase
        .from("accesos_lote")
        .select(`
          id, lote_id, estado, fecha_compra, fecha_expiracion,
          lote:lotes(nombre_lote, ciudad, barrio, area_total_m2, estrato, tipo_lote)
        `)
        .eq("desarrollador_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        id: a.id,
        lote_id: a.lote_id,
        estado: a.estado,
        fecha_compra: a.fecha_compra,
        fecha_expiracion: a.fecha_expiracion,
        nombre_lote: a.lote?.nombre_lote ?? null,
        ciudad: a.lote?.ciudad ?? null,
        barrio: a.lote?.barrio ?? null,
        area_total_m2: a.lote?.area_total_m2 ?? null,
        estrato: a.lote?.estrato ?? null,
        tipo_lote: a.lote?.tipo_lote ?? null,
      })) as AccesoConDatos[];
    },
  });
};

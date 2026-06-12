import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ItemHistorialDev {
  id: string;
  tipo_pago: "diagnostico" | "suscripcion" | "acceso_lote" | string;
  monto_cop: number;
  fecha_aprobacion: string | null;
  fecha_creacion: string;
  estado: string;
  descripcion: string;
}

export const useHistorialDesarrollador = (limit = 8) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["historial-desarrollador", user?.id, limit],
    enabled: !!user?.id,
    queryFn: async (): Promise<ItemHistorialDev[]> => {
      const { data, error } = await supabase
        .from("transacciones")
        .select("id, tipo_pago, monto_cop, fecha_aprobacion, fecha_creacion, estado")
        .eq("creada_por", user!.id)
        .eq("estado", "aprobada")
        .order("fecha_aprobacion", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        ...t,
        descripcion:
          t.tipo_pago === "suscripcion"
            ? "Suscripción"
            : t.tipo_pago === "acceso_lote"
            ? "Acceso a lote"
            : "Diagnóstico",
      })) as ItemHistorialDev[];
    },
  });
};

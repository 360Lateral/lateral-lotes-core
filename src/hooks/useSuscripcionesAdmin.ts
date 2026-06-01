import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NivelSuscripcion } from "@/hooks/useNivelSuscripcion";

export interface SuscripcionAdmin {
  id: string;
  desarrollador_id: string;
  nivel: NivelSuscripcion;
  periodo_meses: number;
  precio_cop: number;
  estado: "pendiente_pago" | "activa" | "vencida" | "cancelada";
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  desarrollador?: { nombre: string | null; email: string | null } | null;
}

export const useSuscripcionesAdmin = () => {
  return useQuery({
    queryKey: ["suscripciones-admin"],
    queryFn: async (): Promise<SuscripcionAdmin[]> => {
      const { data, error } = await supabase
        .from("suscripciones_desarrollador")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const ids = Array.from(new Set(rows.map((r) => r.desarrollador_id)));
      if (ids.length === 0) return rows as SuscripcionAdmin[];
      const { data: perfiles } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .in("id", ids);
      const map = new Map((perfiles ?? []).map((p: any) => [p.id, { nombre: p.nombre, email: p.email }]));
      return rows.map((r) => ({ ...r, desarrollador: map.get(r.desarrollador_id) ?? null })) as SuscripcionAdmin[];
    },
  });
};

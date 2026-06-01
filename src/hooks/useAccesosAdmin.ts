import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AccesoAdmin {
  id: string;
  desarrollador_id: string;
  lote_id: string;
  precio_cop: number;
  estado: "pendiente_pago" | "activa" | "vencida" | "cancelada";
  fecha_compra: string | null;
  fecha_expiracion: string | null;
  created_at: string;
  desarrollador?: { nombre: string | null; email: string | null } | null;
  lote?: { nombre_lote: string | null; ciudad: string | null } | null;
}

export const useAccesosAdmin = () => {
  return useQuery({
    queryKey: ["accesos-admin"],
    queryFn: async (): Promise<AccesoAdmin[]> => {
      const { data, error } = await supabase
        .from("accesos_lote")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const devIds = Array.from(new Set(rows.map((r) => r.desarrollador_id)));
      const loteIds = Array.from(new Set(rows.map((r) => r.lote_id)));
      const [perfiles, lotes] = await Promise.all([
        devIds.length
          ? supabase.from("perfiles").select("id, nombre, email").in("id", devIds)
          : Promise.resolve({ data: [] as any[] }),
        loteIds.length
          ? supabase.from("lotes").select("id, nombre_lote, ciudad").in("id", loteIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const dMap = new Map(((perfiles as any).data ?? []).map((p: any) => [p.id, { nombre: p.nombre, email: p.email }]));
      const lMap = new Map(((lotes as any).data ?? []).map((l: any) => [l.id, { nombre_lote: l.nombre_lote, ciudad: l.ciudad }]));
      return rows.map((r) => ({
        ...r,
        desarrollador: dMap.get(r.desarrollador_id) ?? null,
        lote: lMap.get(r.lote_id) ?? null,
      })) as AccesoAdmin[];
    },
  });
};

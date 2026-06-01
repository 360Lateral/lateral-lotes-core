import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AcuerdoFirmadoAdmin {
  id: string;
  desarrollador_id: string;
  lote_id: string;
  version_nda: string;
  fecha_firma: string;
  ip: string | null;
  user_agent: string | null;
  desarrollador?: { nombre: string | null; email: string | null } | null;
  lote?: { nombre_lote: string | null; ciudad: string | null } | null;
}

export const useAcuerdosFirmadosAdmin = () => {
  return useQuery({
    queryKey: ["acuerdos-firmados-admin"],
    queryFn: async (): Promise<AcuerdoFirmadoAdmin[]> => {
      const { data, error } = await supabase
        .from("ndas_firmados")
        .select("id, desarrollador_id, lote_id, version_nda, fecha_firma, ip, user_agent")
        .order("fecha_firma", { ascending: false });
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
      const dMap = new Map(
        ((perfiles as any).data ?? []).map((p: any) => [p.id, { nombre: p.nombre, email: p.email }]),
      );
      const lMap = new Map(
        ((lotes as any).data ?? []).map((l: any) => [l.id, { nombre_lote: l.nombre_lote, ciudad: l.ciudad }]),
      );
      return rows.map((r) => ({
        ...r,
        desarrollador: dMap.get(r.desarrollador_id) ?? null,
        lote: lMap.get(r.lote_id) ?? null,
      })) as AcuerdoFirmadoAdmin[];
    },
  });
};

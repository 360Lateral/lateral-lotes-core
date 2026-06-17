import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OpcionesFiltro {
  ciudades: string[];
  barrios: string[];
  tipos: string[];
  estratos: number[];
  planes: { codigo: string; nombre: string }[];
  propietarios: { id: string; nombre: string }[];
  asesores: { id: string; nombre: string }[];
}

export const useFiltroOpcionesDisponibles = () => {
  return useQuery<OpcionesFiltro>({
    queryKey: ["filtro-opciones-disponibles"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const sb = supabase as any;
      const [lotesRes, planesRes, propietariosRes, asesoresRes] = await Promise.all([
        sb.from("lotes").select("ciudad, barrio, tipo_lote, estrato"),
        sb.from("planes_diagnostico").select("codigo, nombre").eq("activo", true).order("orden"),
        sb.from("perfiles").select("id, nombre").eq("user_type", "propietario").eq("activo", true),
        sb.from("perfiles").select("id, nombre").in("user_type", ["super_admin", "admin", "experto"]).eq("activo", true),
      ]);

      const lotes: any[] = lotesRes.data ?? [];
      const sortStr = (arr: string[]) => arr.sort((a, b) => a.localeCompare(b));

      return {
        ciudades: sortStr(Array.from(new Set(lotes.map((l) => l.ciudad).filter(Boolean)))),
        barrios: sortStr(Array.from(new Set(lotes.map((l) => l.barrio).filter(Boolean)))),
        tipos: sortStr(Array.from(new Set(lotes.map((l) => l.tipo_lote).filter(Boolean)))),
        estratos: Array.from(
          new Set(lotes.map((l) => l.estrato).filter((s: any) => s != null)),
        ).sort((a: number, b: number) => a - b) as number[],
        planes: (planesRes.data ?? []) as { codigo: string; nombre: string }[],
        propietarios: ((propietariosRes.data ?? []) as any[])
          .map((p) => ({ id: p.id, nombre: p.nombre ?? "Sin nombre" }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        asesores: ((asesoresRes.data ?? []) as any[])
          .map((p) => ({ id: p.id, nombre: p.nombre ?? "Sin nombre" }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      };
    },
  });
};

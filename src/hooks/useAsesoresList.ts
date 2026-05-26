import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AsesorOption {
  id: string;
  nombre: string;
}

export const useAsesoresList = () => {
  return useQuery({
    queryKey: ["asesores-list"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AsesorOption[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, perfiles!inner(id, nombre)")
        .in("role", ["experto", "admin", "super_admin"]);
      if (error) throw error;
      const map = new Map<string, AsesorOption>();
      for (const r of (data ?? []) as any[]) {
        const p = r.perfiles;
        if (p?.id && !map.has(p.id)) {
          map.set(p.id, { id: p.id, nombre: p.nombre ?? "Sin nombre" });
        }
      }
      return Array.from(map.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es"),
      );
    },
  });
};

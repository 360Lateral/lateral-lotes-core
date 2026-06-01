import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVentasCerradas = () => {
  return useQuery({
    queryKey: ["ventas-cerradas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("negociaciones")
        .select(`
          id, precio_venta_final, fee_360_pct, fee_360_monto,
          comprador_externo, fecha_cierre, cerrada_por, developer_id,
          lote:lotes(id, nombre_lote, ciudad, barrio),
          cerrada_por_perfil:perfiles!negociaciones_cerrada_por_fkey(nombre)
        `)
        .eq("estado", "concretada")
        .order("fecha_cierre", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];

      // Fetch developer profiles separately (no FK alias on developer_id)
      const devIds = Array.from(
        new Set(rows.map((r) => r.developer_id).filter(Boolean))
      ) as string[];
      let devsMap: Record<string, { nombre: string | null; email: string | null }> = {};
      if (devIds.length) {
        const { data: devs } = await supabase
          .from("perfiles")
          .select("id, nombre, email")
          .in("id", devIds);
        (devs ?? []).forEach((d: any) => {
          devsMap[d.id] = { nombre: d.nombre, email: d.email };
        });
      }
      return rows.map((r) => ({ ...r, developer: devsMap[r.developer_id] ?? null }));
    },
  });
};

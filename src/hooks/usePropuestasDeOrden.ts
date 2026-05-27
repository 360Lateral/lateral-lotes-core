import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePropuestasDeOrden = (ordenId: string | undefined) => {
  return useQuery({
    queryKey: ["propuestas-orden", ordenId],
    enabled: !!ordenId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("propuestas_experto")
        .select(`
          id, precio_propuesto, plazo_propuesto_dias, mensaje_experto,
          estado, fecha_propuesta,
          experto:perfiles!propuestas_experto_experto_id_fkey(id, nombre, email, telefono)
        `)
        .eq("orden_id", ordenId!)
        .order("fecha_propuesta", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};

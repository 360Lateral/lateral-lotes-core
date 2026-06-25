import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DesarrolladorOption {
  id: string;
  nombre: string | null;
  email: string | null;
}

/**
 * Lista de desarrolladores (perfiles.user_type='desarrollador') para selectors admin.
 */
export const useDesarrolladoresList = () => {
  return useQuery({
    queryKey: ["desarrolladores-list"],
    queryFn: async (): Promise<DesarrolladorOption[]> => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .eq("user_type", "desarrollador")
        .order("nombre", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as DesarrolladorOption[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

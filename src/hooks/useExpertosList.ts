import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExpertoListItem {
  id: string;
  nombre: string | null;
  email: string | null;
}

export const useExpertosList = () => {
  return useQuery({
    queryKey: ["expertos-list"],
    queryFn: async (): Promise<ExpertoListItem[]> => {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "experto" as any);
      if (rolesError) throw rolesError;

      const ids = (rolesData ?? []).map((r: any) => r.user_id);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .in("id", ids)
        .order("nombre", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExpertoListItem[];
    },
  });
};

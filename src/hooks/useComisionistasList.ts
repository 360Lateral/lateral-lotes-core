import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ComisionistaOption {
  id: string;
  nombre: string | null;
  email: string | null;
}

export const useComisionistasList = () => {
  return useQuery({
    queryKey: ["comisionistas-list"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ComisionistaOption[]> => {
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "comisionista");
      if (rErr) throw rErr;
      const ids = (roles ?? []).map((r: any) => r.user_id);
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .in("id", ids)
        .order("nombre");
      if (error) throw error;
      return (data ?? []) as ComisionistaOption[];
    },
  });
};

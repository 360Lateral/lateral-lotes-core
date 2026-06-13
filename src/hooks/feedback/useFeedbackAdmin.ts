import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFeedbackAdmin = () => {
  return useQuery({
    queryKey: ["feedback-admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedback_tickets")
        .select(
          "*, autor:perfiles!feedback_tickets_usuario_id_fkey(id,nombre,email), asignado:perfiles!feedback_tickets_asignado_a_fkey(id,nombre)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
};

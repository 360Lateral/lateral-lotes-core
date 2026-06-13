import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFeedbackDetalle = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ["feedback-detalle", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data: ticket, error: e1 } = await (supabase as any)
        .from("feedback_tickets")
        .select(
          "*, autor:perfiles!feedback_tickets_usuario_id_fkey(id,nombre,email), asignado:perfiles!feedback_tickets_asignado_a_fkey(id,nombre)",
        )
        .eq("id", ticketId)
        .single();
      if (e1) throw e1;
      const { data: comentarios, error: e2 } = await (supabase as any)
        .from("feedback_comentarios")
        .select(
          "*, autor:perfiles!feedback_comentarios_autor_id_fkey(id,nombre)",
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (e2) throw e2;
      return { ticket, comentarios: comentarios ?? [] };
    },
  });
};

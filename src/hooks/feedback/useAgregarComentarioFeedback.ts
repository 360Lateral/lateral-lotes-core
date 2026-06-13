import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Vars {
  ticketId: string;
  mensaje: string;
  visibleParaUsuario: boolean;
}

export const useAgregarComentarioFeedback = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, mensaje, visibleParaUsuario }: Vars) => {
      if (!user) throw new Error("No autenticado.");
      const { data, error } = await (supabase as any)
        .from("feedback_comentarios")
        .insert({
          ticket_id: ticketId,
          autor_id: user.id,
          mensaje: mensaje.trim(),
          visible_para_usuario: visibleParaUsuario,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["feedback-detalle", vars.ticketId] });
    },
    onError: (e: any) =>
      toast.error(`No se pudo enviar: ${e.message ?? ""}`),
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Vars {
  engagementId: string;
  destinatarioId: string | null;
  tema: string;
  mensaje: string;
}

export const useEnviarMensajeAsesor = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ engagementId, destinatarioId, tema, mensaje }: Vars) => {
      if (!user) throw new Error("Debes iniciar sesión para enviar mensajes.");
      const { data, error } = await supabase
        .from("mensajes_asesor_engagement" as any)
        .insert({
          engagement_id: engagementId,
          remitente_id: user.id,
          destinatario_id: destinatarioId,
          tema: tema || null,
          mensaje,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      toast({
        title: "Mensaje enviado",
        description: "Tu asesor recibirá el mensaje y te responderá pronto.",
      });
      qc.invalidateQueries({ queryKey: ["mensajes-asesor", vars.engagementId] });
      qc.invalidateQueries({ queryKey: ["actividad-engagement", vars.engagementId] });
    },
    onError: (e: any) => {
      toast({
        title: "No pudimos enviar tu mensaje",
        description: e?.message ?? "Intenta de nuevo en unos minutos.",
        variant: "destructive",
      });
    },
  });
};

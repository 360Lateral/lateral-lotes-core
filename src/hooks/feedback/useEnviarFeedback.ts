import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type {
  TipoFeedback,
  SeveridadFeedback,
} from "@/lib/feedback-transitions";

export interface NuevoFeedback {
  tipo: TipoFeedback;
  severidad: SeveridadFeedback;
  titulo: string;
  descripcion: string;
  url_origen?: string;
}

export const useEnviarFeedback = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: NuevoFeedback) => {
      if (!user) throw new Error("Debes iniciar sesión.");
      const infoTecnica = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timestamp: new Date().toISOString(),
      };
      const { data, error } = await (supabase as any)
        .from("feedback_tickets")
        .insert({
          usuario_id: user.id,
          tipo: datos.tipo,
          severidad: datos.severidad,
          titulo: datos.titulo.trim(),
          descripcion: datos.descripcion.trim(),
          url_origen: datos.url_origen || window.location.href,
          info_tecnica: infoTecnica,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Gracias por tu feedback. Lo revisaremos pronto.");
      qc.invalidateQueries({ queryKey: ["mis-feedback"] });
      qc.invalidateQueries({ queryKey: ["feedback-admin"] });
    },
    onError: (e: any) =>
      toast.error(`No se pudo enviar: ${e.message ?? "intenta de nuevo"}`),
  });
};

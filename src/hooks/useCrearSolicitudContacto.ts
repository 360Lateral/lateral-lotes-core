import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  lote_id: string;
  mensaje: string;
}

export const useCrearSolicitudContacto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("solicitudes_contacto")
        .insert({
          desarrollador_id: userData.user.id,
          lote_id: input.lote_id,
          mensaje: input.mensaje,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["mis-solicitudes-contacto"] });
      qc.invalidateQueries({ queryKey: ["solicitudes-contacto-pendientes"] });
      qc.invalidateQueries({ queryKey: ["solicitudes-contacto"] });
      qc.invalidateQueries({ queryKey: ["mi-solicitud-lote"] });
      qc.invalidateQueries({ queryKey: ["mi-solicitud-lote", undefined, vars.lote_id] });
      toast.success("Solicitud enviada", {
        description: "360Lateral te contactará para coordinar con el propietario.",
      });
    },
    onError: (e: any) => {
      toast.error("No se pudo enviar la solicitud", { description: e.message });
    },
  });
};

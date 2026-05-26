import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  id: string;
  estado: "contactado" | "cerrado";
  notas_admin?: string;
}

export const useActualizarSolicitudContacto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("solicitudes_contacto")
        .update({
          estado: input.estado,
          notas_admin: input.notas_admin ?? null,
          procesado_por: userData.user?.id ?? null,
          fecha_procesado: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["solicitudes-contacto-pendientes"] });
      qc.invalidateQueries({ queryKey: ["solicitudes-contacto"] });
      qc.invalidateQueries({ queryKey: ["mis-solicitudes-contacto"] });
      qc.invalidateQueries({ queryKey: ["mi-solicitud-lote"] });
      toast.success(
        vars.estado === "contactado" ? "Solicitud marcada como atendida" : "Solicitud cerrada",
      );
    },
    onError: (e: any) => {
      toast.error("No se pudo actualizar", { description: e.message });
    },
  });
};

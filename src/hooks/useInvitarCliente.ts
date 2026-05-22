import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvitarClienteInput {
  email: string;
  nombre_completo: string;
  telefono?: string;
  engagement_id?: string;
}

interface InvitarClienteResponse {
  ok?: boolean;
  modo_seco?: boolean;
  user_id?: string;
  email_enviado?: boolean;
  invite_link?: string;
  engagement_asignado?: string | null;
  reinvitado?: boolean;
  warning?: string;
  error?: string;
  conflicto_usuario_existente?: boolean;
  roles?: string[];
}

export function useInvitarCliente() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: InvitarClienteInput): Promise<InvitarClienteResponse> => {
      const { data, error } = await supabase.functions.invoke("invitar-cliente", {
        body: input,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as InvitarClienteResponse;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      if (data.engagement_asignado) {
        qc.invalidateQueries({ queryKey: ["engagements"] });
        qc.invalidateQueries({ queryKey: ["engagements-sin-cliente"] });
      }
      if (data.conflicto_usuario_existente) {
        toast.warning("No se creó el cliente", {
          description:
            data.warning ??
            "Ese email ya pertenece a un usuario interno y no puede re-invitarse como cliente.",
        });
      } else if (data.modo_seco && data.invite_link) {
        toast.warning("Email no enviado (modo seco)", {
          description: `Link de invitación: ${data.invite_link}`,
          duration: 30000,
        });
      } else if (data.warning) {
        toast.warning(data.warning);
      } else if (data.email_enviado === false) {
        toast.warning(`Cliente creado, pero falló el envío del email a ${vars.email}.`);
      } else {
        const prefix = data.reinvitado ? "Invitación reenviada a " : "Invitación enviada a ";
        toast.success(prefix + vars.email);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "No se pudo invitar al cliente");
    },
  });
}

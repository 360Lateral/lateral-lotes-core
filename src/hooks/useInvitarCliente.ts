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
  user_id?: string;
  email_enviado?: boolean;
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
        return;
      }

      // Warning con link de respaldo: ofrecer copiar el action_link
      if (data.warning && data.action_link) {
        const link = data.action_link;
        toast.warning(data.warning, {
          duration: 30000,
          action: {
            label: "Copiar link",
            onClick: () => {
              navigator.clipboard.writeText(link);
              toast.success("Link de invitación copiado");
            },
          },
        });
        return;
      }

      if (data.warning) {
        toast.warning(data.warning);
        return;
      }

      if (data.email_enviado) {
        const prefix = data.reinvitado
          ? `Invitación reenviada a ${vars.email}. Le llegará el email en minutos.`
          : `Cliente invitado: ${vars.email}. Le llegará un email en minutos.`;
        toast.success(prefix);
        return;
      }

      toast.warning(`Cliente creado, pero falló el envío del email a ${vars.email}.`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "No se pudo invitar al cliente");
    },
  });
}

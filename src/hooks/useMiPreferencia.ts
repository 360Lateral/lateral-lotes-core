import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PreferenciaUsuario {
  user_id: string;
  email_sla_digest: boolean;
}

export const useMiPreferencia = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["mi-preferencia", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PreferenciaUsuario | null> => {
      const { data, error } = await supabase
        .from("preferencias_usuario")
        .select("user_id,email_sla_digest")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const ins = await supabase
          .from("preferencias_usuario")
          .insert({ user_id: user!.id })
          .select("user_id,email_sla_digest")
          .single();
        if (ins.error) throw ins.error;
        return ins.data as PreferenciaUsuario;
      }
      return data as PreferenciaUsuario;
    },
  });

  const mutation = useMutation({
    mutationFn: async (vals: Partial<Omit<PreferenciaUsuario, "user_id">>) => {
      const { error } = await supabase
        .from("preferencias_usuario")
        .update(vals)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mi-preferencia", user?.id] });
    },
  });

  return { ...query, actualizar: mutation };
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Vars {
  ticketId: string;
  asignadoA: string | null;
}

export const useAsignarFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, asignadoA }: Vars) => {
      const { data, error } = await (supabase as any)
        .from("feedback_tickets")
        .update({ asignado_a: asignadoA })
        .eq("id", ticketId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success("Asignación actualizada");
      qc.invalidateQueries({ queryKey: ["feedback-admin"] });
      qc.invalidateQueries({ queryKey: ["feedback-detalle", vars.ticketId] });
    },
    onError: (e: any) => toast.error(`Error: ${e.message ?? ""}`),
  });
};

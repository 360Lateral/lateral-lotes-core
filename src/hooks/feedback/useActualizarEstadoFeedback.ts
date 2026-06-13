import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EstadoFeedback } from "@/lib/feedback-transitions";

interface Vars {
  ticketId: string;
  estado: EstadoFeedback;
  razon_descarte?: string | null;
  duplicado_de?: string | null;
}

export const useActualizarEstadoFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, estado, razon_descarte, duplicado_de }: Vars) => {
      const update: Record<string, any> = { estado };
      if (estado === "resuelto") update.resuelto_en = new Date().toISOString();
      if (estado !== "resuelto") update.resuelto_en = null;
      if (razon_descarte !== undefined) update.razon_descarte = razon_descarte;
      if (duplicado_de !== undefined) update.duplicado_de = duplicado_de;

      const { data, error } = await (supabase as any)
        .from("feedback_tickets")
        .update(update)
        .eq("id", ticketId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ ticketId, estado }) => {
      await qc.cancelQueries({ queryKey: ["feedback-admin"] });
      const previo = qc.getQueryData(["feedback-admin"]);
      qc.setQueryData(["feedback-admin"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) =>
          t.id === ticketId ? { ...t, estado } : t,
        );
      });
      return { previo };
    },
    onError: (e: any, _v, ctx: any) => {
      if (ctx?.previo) qc.setQueryData(["feedback-admin"], ctx.previo);
      toast.error(`No se pudo actualizar: ${e.message ?? ""}`);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ["feedback-admin"] });
      qc.invalidateQueries({ queryKey: ["feedback-detalle", vars.ticketId] });
    },
    onSuccess: () => toast.success("Estado actualizado"),
  });
};

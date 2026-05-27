import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  orden_id: string;
  precio_propuesto: number;
  plazo_propuesto_dias: number;
  mensaje_experto?: string;
}

export const useCrearPropuesta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error("No autenticado");

      const { data, error } = await (supabase as any)
        .from("propuestas_experto")
        .insert({
          orden_id: input.orden_id,
          experto_id: userData.user.id,
          precio_propuesto: input.precio_propuesto,
          plazo_propuesto_dias: input.plazo_propuesto_dias,
          mensaje_experto: input.mensaje_experto ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mis-propuestas"] });
      qc.invalidateQueries({ queryKey: ["mis-ordenes-experto"] });
      qc.invalidateQueries({ queryKey: ["propuestas-orden"] });
      qc.invalidateQueries({ queryKey: ["tengo-propuesta"] });
      qc.invalidateQueries({ queryKey: ["propuestas-count"] });
      toast.success("Propuesta enviada", {
        description: "El admin la revisará junto a las demás postulaciones.",
      });
    },
    onError: (e: any) => {
      const msg =
        e.message?.includes("duplicate") || e.message?.includes("unique")
          ? "Ya enviaste una propuesta para esta orden. Si quieres modificarla, retírala primero."
          : e.message;
      toast.error("No se pudo enviar la propuesta", { description: msg });
    },
  });
};

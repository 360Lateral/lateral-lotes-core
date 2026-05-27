import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRetirarPropuesta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (propuestaId: string) => {
      const { error } = await (supabase as any)
        .from("propuestas_experto")
        .update({ estado: "retirada" })
        .eq("id", propuestaId)
        .eq("estado", "enviada");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mis-propuestas"] });
      qc.invalidateQueries({ queryKey: ["propuestas-orden"] });
      qc.invalidateQueries({ queryKey: ["tengo-propuesta"] });
      qc.invalidateQueries({ queryKey: ["propuestas-count"] });
      toast.success("Propuesta retirada");
    },
    onError: (e: any) => {
      toast.error("No se pudo retirar la propuesta", { description: e.message });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Vars {
  engagementId: string;
  nuevoAsesorId: string;
  nuevoAsesorNombre?: string;
}

export const useAsignarAsesorEngagement = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ engagementId, nuevoAsesorId }: Vars) => {
      const { data, error } = await (supabase as any)
        .from("engagements_lote")
        .update({ asesor_id: nuevoAsesorId })
        .eq("id", engagementId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ engagementId, nuevoAsesorId, nuevoAsesorNombre }) => {
      await qc.cancelQueries({ queryKey: ["vw-portafolio-resumen"] });
      const previo = qc.getQueryData(["vw-portafolio-resumen"]);

      qc.setQueryData(["vw-portafolio-resumen"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((f: any) =>
          f.engagement_id === engagementId
            ? {
                ...f,
                asesor_id: nuevoAsesorId,
                asesor_nombre: nuevoAsesorNombre ?? f.asesor_nombre,
              }
            : f,
        );
      });

      return { previo };
    },
    onSuccess: () => {
      toast.success("Asesor asignado");
    },
    onError: (e: any, _vars, context) => {
      if (context?.previo)
        qc.setQueryData(["vw-portafolio-resumen"], context.previo);
      toast.error(`No pudimos asignar: ${e?.message ?? "intenta de nuevo"}`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["vw-portafolio-resumen"] });
    },
  });
};

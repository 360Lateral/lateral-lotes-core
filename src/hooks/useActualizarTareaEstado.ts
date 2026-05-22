import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EstadoTarea } from "./useTareasEngagement";

interface Args {
  tareaId: string;
  nuevoEstado: EstadoTarea;
}

export const useActualizarTareaEstado = (engagementId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tareaId, nuevoEstado }: Args) => {
      const { error } = await supabase
        .from("tareas_analisis")
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq("id", tareaId);
      if (error) throw error;
    },
    onMutate: async ({ tareaId, nuevoEstado }) => {
      await qc.cancelQueries({ queryKey: ["tareas-engagement", engagementId] });
      const prev = qc.getQueryData<any[]>(["tareas-engagement", engagementId]);
      if (prev) {
        qc.setQueryData(
          ["tareas-engagement", engagementId],
          prev.map((t) => (t.id === tareaId ? { ...t, estado: nuevoEstado } : t)),
        );
      }
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tareas-engagement", engagementId], ctx.prev);
      toast.error(err?.message ?? "No se pudo actualizar el estado");
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["tareas-engagement", engagementId] });
      qc.invalidateQueries({ queryKey: ["engagement-detalle", engagementId] });
      qc.invalidateQueries({ queryKey: ["vista-portafolio"] });
      qc.invalidateQueries({ queryKey: ["portafolio-kpis"] });
    },
  });
};

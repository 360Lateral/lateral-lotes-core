import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ESTADO_LABEL,
  type EstadoEngagement,
} from "@/lib/engagement-transitions";
import type { PortafolioVistaFila } from "@/hooks/useVistaPortafolio";

interface Vars {
  engagementId: string;
  nuevoEstado: EstadoEngagement;
  estadoAnterior?: EstadoEngagement;
}

interface Context {
  snapshots: Array<[readonly unknown[], PortafolioVistaFila[] | undefined]>;
}

export const useActualizarEstadoEngagement = () => {
  const qc = useQueryClient();

  return useMutation<unknown, Error, Vars, Context>({
    mutationFn: async ({ engagementId, nuevoEstado }) => {
      const { data, error } = await (supabase as any)
        .from("engagements_lote")
        .update({ estado: nuevoEstado })
        .eq("id", engagementId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ engagementId, nuevoEstado }) => {
      await qc.cancelQueries({ queryKey: ["vw-portafolio-resumen"] });

      const queries = qc.getQueriesData<PortafolioVistaFila[]>({
        queryKey: ["vw-portafolio-resumen"],
      });
      const snapshots: Context["snapshots"] = queries.map(([key, data]) => [
        key,
        data,
      ]);

      queries.forEach(([key, data]) => {
        if (!Array.isArray(data)) return;
        qc.setQueryData(
          key,
          data.map((f) =>
            f.engagement_id === engagementId
              ? { ...f, estado: nuevoEstado }
              : f,
          ),
        );
      });

      return { snapshots };
    },
    onSuccess: (_data, vars) => {
      toast.success("Estado actualizado", {
        description: `Engagement movido a "${ESTADO_LABEL[vars.nuevoEstado]}".`,
      });
    },
    onError: (error, _vars, context) => {
      context?.snapshots.forEach(([key, prev]) => {
        qc.setQueryData(key, prev);
      });
      toast.error("No pudimos actualizar el estado", {
        description: error?.message ?? "Intenta de nuevo en unos minutos.",
      });
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["vw-portafolio-resumen"] });
      qc.invalidateQueries({ queryKey: ["portafolio-kpis"] });
      if (vars?.engagementId) {
        qc.invalidateQueries({
          queryKey: ["engagement-cliente", vars.engagementId],
        });
      }
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EstadoEntregable, TipoEntregable } from "./useEntregablesEngagement";

interface Cambios {
  estado?: EstadoEntregable;
  nombre?: string;
  notas?: string | null;
  tipo?: TipoEntregable;
}

interface Args {
  entregableId: string;
  engagementId: string;
  cambios: Cambios;
}

export const useActualizarEntregable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entregableId, cambios }: Args) => {
      const { error } = await supabase
        .from("entregables_engagement" as any)
        .update(cambios)
        .eq("id", entregableId);
      if (error) throw error;
      return cambios;
    },
    onSuccess: (cambios, vars) => {
      qc.invalidateQueries({ queryKey: ["entregables-engagement", vars.engagementId] });
      if (cambios.estado === "publicado") toast.success("Entregable publicado");
      else if (cambios.estado === "archivado") toast.success("Entregable archivado");
      else if (cambios.estado === "borrador") toast.success("Entregable despublicado");
      else toast.success("Cambios guardados");
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar"),
  });
};

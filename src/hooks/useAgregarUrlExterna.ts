import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TipoEntregable } from "./useEntregablesEngagement";

interface Args {
  engagementId: string;
  tipo: TipoEntregable;
  nombre: string;
  url: string;
  notas?: string;
}

export const useAgregarUrlExterna = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ engagementId, tipo, nombre, url, notas }: Args) => {
      if (!url.startsWith("https://")) {
        throw new Error("La URL debe comenzar con https://");
      }
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("entregables_engagement" as any).insert({
        engagement_id: engagementId,
        tipo,
        nombre,
        url_externa: url,
        estado: "borrador",
        version: 1,
        notas: notas || null,
        subido_por: userData.user?.id ?? null,
      });
      if (error) throw error;
      return { engagementId };
    },
    onSuccess: ({ engagementId }) => {
      qc.invalidateQueries({ queryKey: ["entregables-engagement", engagementId] });
      toast.success("URL externa agregada como borrador");
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo agregar la URL"),
  });
};

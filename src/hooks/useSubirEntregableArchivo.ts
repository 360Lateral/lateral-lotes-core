import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TipoEntregable } from "./useEntregablesEngagement";

interface SubirArgs {
  engagementId: string;
  tipo: TipoEntregable;
  nombre: string;
  archivo: File;
  notas?: string;
}

const BUCKET = "entregables-clientes";

export const useSubirEntregableArchivo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ engagementId, tipo, nombre, archivo, notas }: SubirArgs) => {
      const path = `${engagementId}/${Date.now()}_${archivo.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, archivo, { contentType: archivo.type });
      if (upErr) throw upErr;

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { error: insErr } = await supabase
        .from("entregables_engagement" as any)
        .insert({
          engagement_id: engagementId,
          tipo,
          nombre,
          storage_path: path,
          mime_type: archivo.type || null,
          tamano_bytes: archivo.size,
          estado: "borrador",
          version: 1,
          notas: notas || null,
          subido_por: userId ?? null,
        });

      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        throw insErr;
      }
      return { engagementId };
    },
    onSuccess: ({ engagementId }) => {
      qc.invalidateQueries({ queryKey: ["entregables-engagement", engagementId] });
      toast.success("Archivo subido como borrador");
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "No se pudo subir el archivo");
    },
  });
};

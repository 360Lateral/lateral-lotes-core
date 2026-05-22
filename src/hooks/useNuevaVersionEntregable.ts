import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Args {
  entregableAnteriorId: string;
  archivo: File;
}

const BUCKET = "entregables-clientes";

export const useNuevaVersionEntregable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entregableAnteriorId, archivo }: Args) => {
      const { data: anterior, error: errLoad } = await supabase
        .from("entregables_engagement" as any)
        .select("engagement_id, tipo, nombre, version, notas")
        .eq("id", entregableAnteriorId)
        .single();
      if (errLoad) throw errLoad;
      const ant = anterior as any;

      const path = `${ant.engagement_id}/${Date.now()}_${archivo.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, archivo, { contentType: archivo.type });
      if (upErr) throw upErr;

      const { data: userData } = await supabase.auth.getUser();
      const nuevaVersion = (ant.version ?? 1) + 1;

      const { error: insErr } = await supabase
        .from("entregables_engagement" as any)
        .insert({
          engagement_id: ant.engagement_id,
          tipo: ant.tipo,
          nombre: ant.nombre,
          storage_path: path,
          mime_type: archivo.type || null,
          tamano_bytes: archivo.size,
          estado: "borrador",
          version: nuevaVersion,
          notas: ant.notas,
          subido_por: userData.user?.id ?? null,
        });
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        throw insErr;
      }

      await supabase
        .from("entregables_engagement" as any)
        .update({ estado: "archivado" })
        .eq("id", entregableAnteriorId);

      return { engagementId: ant.engagement_id as string, nuevaVersion };
    },
    onSuccess: ({ engagementId, nuevaVersion }) => {
      qc.invalidateQueries({ queryKey: ["entregables-engagement", engagementId] });
      toast.success(`Nueva versión creada (v${nuevaVersion})`);
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo crear la nueva versión"),
  });
};

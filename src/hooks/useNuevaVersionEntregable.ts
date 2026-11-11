import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { asegurarSesion, SesionExpiradaError } from "./useSubirEntregableArchivo";

interface Args {
  entregableAnteriorId: string;
  archivo: File;
  publicar?: boolean;
}

const BUCKET = "entregables-clientes";

export const useNuevaVersionEntregable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entregableAnteriorId, archivo, publicar }: Args) => {
      // Antes de subir: si la sesión caducó no se sube nada.
      if (!(await asegurarSesion())) throw new SesionExpiradaError();

      const { data: anterior, error: errLoad } = await supabase
        .from("entregables_engagement" as any)
        .select("engagement_id, tipo, nombre, version, notas, tipo_analisis_id")
        .eq("id", entregableAnteriorId)
        .single();
      if (errLoad) throw errLoad;
      const ant = anterior as any;

      const path = `${ant.engagement_id}/${Date.now()}_${archivo.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, archivo, { contentType: archivo.type });
      if (upErr) throw upErr;

      // Después de subir y antes de guardar: comprueba y renueva la sesión.
      const userId = await asegurarSesion();
      if (!userId) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        throw new SesionExpiradaError();
      }
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
          estado: publicar ? "publicado" : "borrador",
          version: nuevaVersion,
          notas: ant.notas,
          subido_por: userId,
          tipo_analisis_id: ant.tipo_analisis_id ?? null,
        });
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        if ((insErr as any).code === "42501" || /row-level security|JWT/i.test(insErr.message ?? "")) {
          throw new SesionExpiradaError();
        }
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

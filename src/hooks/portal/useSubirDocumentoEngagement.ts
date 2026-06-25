import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Args {
  engagementId: string;
  requeridoId: string | null;
  file: File;
}

const BUCKET = "docs-cliente";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const sanitize = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);

export const useSubirDocumentoEngagement = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ engagementId, requeridoId, file }: Args) => {
      if (!user?.id) throw new Error("Usuario no autenticado");
      if (file.size > MAX_BYTES) {
        throw new Error("El archivo supera 20 MB");
      }
      if (file.type && !ALLOWED_MIME.includes(file.type)) {
        throw new Error("Formato no permitido. Usa PDF, JPG, PNG o WEBP.");
      }

      const path = `${user.id}/${engagementId}/${Date.now()}-${sanitize(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined });
      if (upErr) throw upErr;

      const { error: dbErr } = await (supabase as any)
        .from("documentos_subidos_engagement")
        .insert({
          engagement_id: engagementId,
          requerido_id: requeridoId,
          subido_por: user.id,
          archivo_path: path,
          archivo_nombre: file.name,
          archivo_size_bytes: file.size,
          archivo_mime: file.type || null,
        });
      if (dbErr) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        throw dbErr;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["docs-engagement-cliente", vars.engagementId] });
      qc.invalidateQueries({ queryKey: ["resumen-engagements-cliente"] });
      toast({ title: "Documento subido", description: "Lo recibimos correctamente." });
    },
    onError: (err: any) => {
      toast({
        title: "No se pudo subir el documento",
        description: err?.message ?? "Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });
};

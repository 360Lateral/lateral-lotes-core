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
  tipoAnalisisId?: string | null;
}

const BUCKET = "entregables-clientes";
const MSG_SESION = "Tu sesión expiró, vuelve a iniciar sesión";

class SesionExpiradaError extends Error {
  constructor() {
    super(MSG_SESION);
  }
}

/** Devuelve el id del usuario con una sesión vigente (renovándola si hace falta) o null. */
const asegurarSesion = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const expiraPronto = !session?.expires_at || session.expires_at * 1000 - Date.now() < 60_000;
  if (session && !expiraPronto) {
    const { data: u, error } = await supabase.auth.getUser();
    if (!error && u.user) return u.user.id;
  }
  const { data: r, error: rErr } = await supabase.auth.refreshSession();
  if (rErr || !r.session?.user) return null;
  return r.session.user.id;
};

export const useSubirEntregableArchivo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ engagementId, tipo, nombre, archivo, notas, tipoAnalisisId }: SubirArgs) => {
      // Antes de subir: evita dejar un archivo sin registro si la sesión ya caducó.
      if (!(await asegurarSesion())) throw new SesionExpiradaError();

      const path = `${engagementId}/${Date.now()}_${archivo.name}`;
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
          subido_por: userId,
          tipo_analisis_id: tipoAnalisisId ?? null,
        });

      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        if ((insErr as any).code === "42501" || /row-level security|JWT/i.test(insErr.message ?? "")) {
          throw new SesionExpiradaError();
        }
        throw insErr;
      }
      return { engagementId };
    },
    onSuccess: ({ engagementId }) => {
      qc.invalidateQueries({ queryKey: ["entregables-engagement", engagementId] });
      qc.invalidateQueries({ queryKey: ["vw-portafolio-resumen"] });
      toast.success("Archivo subido como borrador");
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "No se pudo subir el archivo");
    },
  });
};

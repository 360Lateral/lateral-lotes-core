import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CrearAutorizacionArgs {
  lote_id: string;
  propietario_id: string;
  comisionista_id: string;
  comision_pct: number;
  documento: File;
  fecha_vencimiento?: string | null;
  notas?: string | null;
}

const BUCKET = "documentos-comisionistas";

export const useCrearAutorizacion = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (args: CrearAutorizacionArgs) => {
      const path = `${args.lote_id}/${Date.now()}_${args.documento.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, args.documento, { contentType: args.documento.type });
      if (upErr) throw upErr;

      const { error: insErr, data } = await supabase
        .from("autorizaciones_comisionista")
        .insert({
          lote_id: args.lote_id,
          propietario_id: args.propietario_id,
          comisionista_id: args.comisionista_id,
          comision_pct: args.comision_pct,
          documento_url: path,
          fecha_vencimiento: args.fecha_vencimiento ?? null,
          notas: args.notas ?? null,
          creada_por: user?.id ?? null,
        })
        .select()
        .single();
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        throw insErr;
      }
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["autorizaciones-lote", vars.lote_id] });
      qc.invalidateQueries({ queryKey: ["mis-autorizaciones"] });
      toast.success("Autorización creada");
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo crear la autorización"),
  });
};

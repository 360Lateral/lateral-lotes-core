import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentoRequerido {
  id: string;
  nombre: string;
  descripcion: string | null;
  opcional: boolean;
  orden: number;
}

export interface DocumentoSubido {
  id: string;
  requerido_id: string | null;
  archivo_path: string;
  archivo_nombre: string;
  archivo_size_bytes: number | null;
  archivo_mime: string | null;
  estado_validacion: "pendiente_validacion" | "aprobado" | "rechazado";
  comentario_validacion: string | null;
  created_at: string;
}

export interface DocsEngagementResult {
  pendientes: DocumentoRequerido[];
  subidos: DocumentoSubido[];
  subidosPorRequerido: Map<string, DocumentoSubido[]>;
  porSubirSinCatalogo: DocumentoSubido[];
}

/**
 * Lista docs requeridos del plan del engagement y los ya subidos por el cliente.
 */
export const useDocsEngagementCliente = (
  engagementId: string | undefined,
  planId: string | undefined,
) => {
  return useQuery<DocsEngagementResult>({
    queryKey: ["docs-engagement-cliente", engagementId, planId],
    enabled: !!engagementId && !!planId,
    staleTime: 15 * 1000,
    queryFn: async () => {
      const sb = supabase as any;
      const [requeridosRes, subidosRes] = await Promise.all([
        sb
          .from("documentos_requeridos_plan")
          .select("id, nombre, descripcion, opcional, orden")
          .eq("plan_id", planId)
          .eq("activo", true)
          .order("orden", { ascending: true }),
        sb
          .from("documentos_subidos_engagement")
          .select(
            "id, requerido_id, archivo_path, archivo_nombre, archivo_size_bytes, archivo_mime, estado_validacion, comentario_validacion, created_at",
          )
          .eq("engagement_id", engagementId)
          .order("created_at", { ascending: false }),
      ]);

      if (requeridosRes.error) throw requeridosRes.error;
      if (subidosRes.error) throw subidosRes.error;

      const requeridos = (requeridosRes.data ?? []) as DocumentoRequerido[];
      const subidos = (subidosRes.data ?? []) as DocumentoSubido[];

      const subidosPorRequerido = new Map<string, DocumentoSubido[]>();
      for (const s of subidos) {
        if (!s.requerido_id) continue;
        const arr = subidosPorRequerido.get(s.requerido_id) ?? [];
        arr.push(s);
        subidosPorRequerido.set(s.requerido_id, arr);
      }

      const pendientes = requeridos.filter(
        (r) => !subidosPorRequerido.has(r.id),
      );
      const porSubirSinCatalogo = subidos.filter((s) => !s.requerido_id);

      return { pendientes, subidos, subidosPorRequerido, porSubirSinCatalogo };
    },
  });
};

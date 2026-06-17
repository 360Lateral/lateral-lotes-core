import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TABLES_WITH_UPDATED_AT = [
  "analisis_juridico",
  "analisis_ambiental",
  "analisis_sspp",
  "analisis_geotecnico",
  "analisis_mercado",
  "analisis_arquitectonico",
  "analisis_financiero",
];

/**
 * Genérico upsert por área. Invalida queries cruzadas (engagement, portafolio,
 * lote-detalle, etc.) para mantener todas las vistas sincronizadas.
 * `onSaved` se llama después del invalidate (Fase 2: refrescar grid del engagement).
 */
export function useAnalisisUpsert(
  table: string,
  loteId: string,
  qk: any[],
  onSaved?: () => void,
) {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { data: existing } = await supabase
        .from(table as any)
        .select("id")
        .eq("lote_id", loteId)
        .maybeSingle();
      const payload = TABLES_WITH_UPDATED_AT.includes(table)
        ? { ...values, updated_at: new Date().toISOString() }
        : { ...values };
      if (!TABLES_WITH_UPDATED_AT.includes(table)) delete payload.updated_at;
      if (existing) {
        const { error } = await supabase
          .from(table as any)
          .update(payload)
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table as any)
          .insert({ ...payload, lote_id: loteId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Guardado correctamente" });
      qc.invalidateQueries({ queryKey: qk });
      qc.invalidateQueries({ queryKey: ["analisis-unificado"] });
      qc.invalidateQueries({ queryKey: ["tareas-engagement"] });
      qc.invalidateQueries({ queryKey: ["engagement-detalle"] });
      qc.invalidateQueries({ queryKey: ["vw-portafolio-resumen"] });
      qc.invalidateQueries({ queryKey: ["portafolio-vista"] });
      qc.invalidateQueries({ queryKey: ["lote-detalle"] });
      qc.invalidateQueries({ queryKey: ["ficha-lote"] });
      qc.invalidateQueries({ queryKey: ["mercado-publico"] });
      qc.invalidateQueries({ queryKey: ["entregables-engagement"] });
      onSaved?.();
    },
    onError: (e: any) => {
      toast({
        title: "Error al guardar",
        description: e.message,
        variant: "destructive",
      });
    },
  });
}

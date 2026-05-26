import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PublicarActivoInput {
  nombre_lote: string;
  ciudad: string;
  barrio?: string;
  area_total_m2: number;
  precio_venta_estimado: number;
  uso_actual?: string;
  descripcion_propietario?: string;
}

export const usePublicarActivo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PublicarActivoInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("No autenticado");

      // Fold the propietario-only fields into `notas` since there's no
      // dedicated column for them in `lotes`.
      const notasParts: string[] = [];
      if (input.uso_actual) notasParts.push(`Uso actual: ${input.uso_actual}`);
      if (input.descripcion_propietario)
        notasParts.push(`Descripción del propietario: ${input.descripcion_propietario}`);
      const notas = notasParts.length ? notasParts.join("\n\n") : null;

      const { data, error } = await supabase
        .from("lotes")
        .insert({
          nombre_lote: input.nombre_lote,
          ciudad: input.ciudad,
          barrio: input.barrio ?? null,
          area_total_m2: input.area_total_m2,
          precio_venta_estimado: input.precio_venta_estimado,
          propietario_id: uid,
          publicado_venta: true,
          notas,
          // estado_publicacion lo asigna el trigger normalizar_estado_publicacion_al_crear
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mis-activos"] });
      qc.invalidateQueries({ queryKey: ["lotes-pendientes-validacion"] });
      toast.success("Activo enviado para validación", {
        description: "360Lateral revisará tu activo y te avisaremos cuando esté aprobado.",
      });
    },
    onError: (e: any) => {
      toast.error("No se pudo publicar el activo", {
        description: e?.message ?? "Verifica tu información y vuelve a intentar.",
      });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Input {
  lote_id: string;
  tipo_analisis_id: string;
  contrato_marco_id: string;
  engagement_id?: string | null;
  fecha_limite_propuestas: string;
  visibilidad: "publica" | "invitacion";
  expertos_invitados?: string[];
  notas_admin?: string | null;
}

export const useCrearOrdenServicio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error("No autenticado");

      const { data: orden, error: ordenError } = await (supabase as any)
        .from("ordenes_servicio")
        .insert({
          lote_id: input.lote_id,
          tipo_analisis_id: input.tipo_analisis_id,
          contrato_marco_id: input.contrato_marco_id,
          engagement_id: input.engagement_id ?? null,
          fecha_limite_propuestas: input.fecha_limite_propuestas,
          visibilidad: input.visibilidad,
          creado_por: userData.user.id,
          notas_admin: input.notas_admin ?? null,
        })
        .select("id")
        .single();

      if (ordenError) throw ordenError;
      const ordenId = orden.id as string;

      if (input.visibilidad === "invitacion" && input.expertos_invitados?.length) {
        const inserts = input.expertos_invitados.map((expertoId) => ({
          orden_id: ordenId,
          experto_id: expertoId,
        }));
        const { error: invError } = await (supabase as any)
          .from("invitaciones_orden")
          .insert(inserts);
        if (invError) throw invError;
      }

      return ordenId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordenes-servicio"] });
      qc.invalidateQueries({ queryKey: ["mis-ordenes-experto"] });
      toast.success("Orden de servicio creada", {
        description: "Los expertos fueron notificados.",
      });
    },
    onError: (e: any) => {
      toast.error("No se pudo crear la orden", { description: e.message });
    },
  });
};

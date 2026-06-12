import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ResumenPortafolio {
  serviciosActivos: number;
  activosPublicados: number;
  vistasTotales: number;
  vistasUltimaSemana: number;
  deltaSemanal: number;
  proximaEntregaDias: number | null;
  proximaEntregaNombre: string | null;
}

export const useResumenPortafolio = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["resumen-portafolio", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ResumenPortafolio> => {
      const [vistasRes, engagementsRes, lotesRes] = await Promise.all([
        supabase.rpc("resumen_vistas_portafolio" as any, {
          p_propietario: user!.id,
        }),
        supabase
          .from("engagements_lote")
          .select(
            "id, estado, estado_activacion, fecha_sla_objetivo, lote_id, lotes:lote_id(nombre_lote)"
          )
          .eq("cliente_id", user!.id)
          .neq("estado", "cancelado")
          .neq("estado", "cerrado"),
        supabase
          .from("lotes")
          .select("id, estado_publicacion, publicado_venta")
          .eq("propietario_id", user!.id)
          .eq("publicado_venta", true)
          .eq("estado_publicacion", "aprobado"),
      ]);

      const vistasRow = Array.isArray(vistasRes.data)
        ? (vistasRes.data as any[])[0]
        : (vistasRes.data as any);
      const engagements = (engagementsRes.data as any[]) ?? [];
      const lotes = (lotesRes.data as any[]) ?? [];

      const serviciosActivos = engagements.filter(
        (e) => e.estado_activacion === "activo"
      ).length;
      const activosPublicados = lotes.length;
      const vistasTotales = Number(vistasRow?.total_vistas ?? 0);
      const vistasUltimaSemana = Number(vistasRow?.vistas_ultima_semana ?? 0);
      const vistasSemanaAnterior = Number(vistasRow?.vistas_semana_anterior ?? 0);
      const deltaSemanal = vistasUltimaSemana - vistasSemanaAnterior;

      const proximaEntrega = engagements
        .filter((e) => e.fecha_sla_objetivo)
        .map((e) => ({
          fecha: new Date(e.fecha_sla_objetivo as string).getTime(),
          nombre: (e.lotes?.nombre_lote as string) ?? "Sin nombre",
        }))
        .filter((p) => p.fecha > Date.now())
        .sort((a, b) => a.fecha - b.fecha)[0];

      const proximaEntregaDias = proximaEntrega
        ? Math.ceil((proximaEntrega.fecha - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        serviciosActivos,
        activosPublicados,
        vistasTotales,
        vistasUltimaSemana,
        deltaSemanal,
        proximaEntregaDias,
        proximaEntregaNombre: proximaEntrega?.nombre ?? null,
      };
    },
  });
};

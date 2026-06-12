import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TipoEventoActividad =
  | "diagnostico_entregado"
  | "vista_nueva"
  | "nda_firmado";

export interface EventoActividad {
  id: string;
  tipo: TipoEventoActividad;
  titulo: string;
  fecha: string;
  loteNombre?: string;
}

const safe = async <T>(p: PromiseLike<T>): Promise<T | null> => {
  try {
    return await p;
  } catch {
    return null;
  }
};

export const useActividadReciente = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["actividad-reciente", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<EventoActividad[]> => {
      const [entregasRes, ndasRes, vistasRes] = await Promise.all([
        safe(
          supabase
            .from("engagements_lote")
            .select("id, fecha_entrega, lote_id, lotes:lote_id(nombre_lote, propietario_id)")
            .eq("cliente_id", user!.id)
            .eq("estado", "entregado")
            .order("fecha_entrega", { ascending: false })
            .limit(5)
        ),
        safe(
          supabase
            .from("ndas_firmados")
            .select("id, lote_id, fecha_firma, lotes:lote_id(nombre_lote, propietario_id, owner_id)")
            .order("fecha_firma", { ascending: false })
            .limit(10)
        ),
        safe(
          supabase.rpc("vistas_recientes_propietario" as any, {
            p_propietario: user!.id,
            p_limit: 5,
          })
        ),
      ]);

      const eventos: EventoActividad[] = [];

      ((entregasRes?.data as any[]) ?? []).forEach((e) => {
        if (!e.fecha_entrega) return;
        eventos.push({
          id: `entrega-${e.id}`,
          tipo: "diagnostico_entregado",
          titulo: `Diagnóstico entregado · ${e.lotes?.nombre_lote ?? "Sin nombre"}`,
          fecha: e.fecha_entrega,
          loteNombre: e.lotes?.nombre_lote ?? undefined,
        });
      });

      ((ndasRes?.data as any[]) ?? [])
        .filter(
          (n) =>
            n.lotes &&
            (n.lotes.propietario_id === user!.id || n.lotes.owner_id === user!.id)
        )
        .slice(0, 5)
        .forEach((n) => {
          eventos.push({
            id: `nda-${n.id}`,
            tipo: "nda_firmado",
            titulo: `Nuevo NDA firmado sobre ${n.lotes?.nombre_lote ?? "tu lote"}`,
            fecha: n.fecha_firma,
            loteNombre: n.lotes?.nombre_lote ?? undefined,
          });
        });

      ((vistasRes?.data as any[]) ?? []).forEach((v) => {
        eventos.push({
          id: `vista-${v.id}`,
          tipo: "vista_nueva",
          titulo: `Nueva vista a ${v.lote_nombre ?? "tu lote"}`,
          fecha: v.fecha,
          loteNombre: v.lote_nombre ?? undefined,
        });
      });

      return eventos
        .sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
        .slice(0, 8);
    },
  });
};

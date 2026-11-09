import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const PERMISOS_ACCIONES = [
  "publicar_activo", "contratar_diagnostico", "subir_documentos",
  "escribir_asesor", "gestionar_comisionistas", "sala_negociacion",
] as const;
export type PermisoAccion = typeof PERMISOS_ACCIONES[number];

export const usePermisosAcciones = () => {
  const { user, loading } = useAuth();
  const query = useQuery({
    queryKey: ["permisos-acciones", user?.id],
    enabled: Boolean(user?.id) && !loading,
    refetchInterval: 15_000,
    staleTime: 0,
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      const entries = await Promise.all(PERMISOS_ACCIONES.map(async (permiso) => {
        const { data, error } = await supabase.rpc("tiene_permiso", {
          _user_id: user.id, _permiso: permiso,
        });
        if (error) throw error;
        return [permiso, data === true] as const;
      }));
      return Object.fromEntries(entries) as Record<PermisoAccion, boolean>;
    },
  });
  return {
    loading: loading || (Boolean(user) && query.isPending),
    permite: (permiso: PermisoAccion) => !loading && Boolean(user) && !query.isError && query.data?.[permiso] === true,
  };
};
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PropietarioOption {
  id: string;
  nombre: string | null;
  email: string | null;
}

export const usePropietariosList = () => {
  return useQuery({
    queryKey: ["propietarios-list"],
    queryFn: async (): Promise<PropietarioOption[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, perfiles!user_roles_user_id_fkey(id, nombre, email)")
        .eq("role", "propietario");
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        user_id: string;
        perfiles: { id: string; nombre: string | null; email: string | null } | null;
      }>;
      return rows
        .filter((r) => r.perfiles)
        .map((r) => ({
          id: r.perfiles!.id,
          nombre: r.perfiles!.nombre,
          email: r.perfiles!.email,
        }))
        .sort((a, b) => (a.nombre || a.email || "").localeCompare(b.nombre || b.email || ""));
    },
  });
};

export const useAsignarPropietario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lote_id, propietario_id }: { lote_id: string; propietario_id: string }) => {
      const { error } = await supabase
        .from("lotes")
        .update({ propietario_id })
        .eq("id", lote_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-lotes-list"] });
      qc.invalidateQueries({ queryKey: ["mis-activos"] });
      toast.success("Propietario asignado");
    },
    onError: (e: any) => {
      toast.error("No se pudo asignar", { description: e?.message });
    },
  });
};

export const usePublicarLoteMercado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lote_id: string) => {
      const { error } = await supabase
        .from("lotes")
        .update({ publicado_venta: true })
        .eq("id", lote_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-lotes-list"] });
      qc.invalidateQueries({ queryKey: ["mis-activos"] });
      toast.success("Lote publicado en el mercado");
    },
    onError: (e: any) => {
      toast.error("No se pudo publicar", { description: e?.message });
    },
  });
};

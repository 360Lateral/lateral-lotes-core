import { supabase } from "@/integrations/supabase/client";

export const useFirmarUrlEntregable = () => {
  const firmar = async (entregableId: string): Promise<string> => {
    const { data, error } = await supabase.rpc("firmar_url_entregable" as any, {
      p_entregable_id: entregableId,
      p_expira_segundos: 3600,
    });
    if (error) throw new Error(error.message ?? "No se pudo generar la URL");
    if (!data) throw new Error("URL vacía");
    return data as string;
  };
  return { firmar };
};

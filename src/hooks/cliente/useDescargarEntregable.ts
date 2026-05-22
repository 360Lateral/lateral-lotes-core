import { supabase } from "@/integrations/supabase/client";

export const useDescargarEntregable = () => {
  const descargar = async (entregableId: string): Promise<string> => {
    const { data, error } = await supabase.rpc(
      "firmar_url_entregable" as any,
      { p_entregable_id: entregableId, p_expira_segundos: 3600 },
    );
    if (error) throw error;
    if (!data) throw new Error("No se pudo generar el enlace.");
    return data as string;
  };
  return { descargar };
};

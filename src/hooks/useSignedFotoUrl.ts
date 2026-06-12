import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FOTOS_BUCKET,
  FOTO_SIGNED_TTL_SECONDS,
  extractFotoPath,
} from "@/lib/foto-storage";

export const useSignedFotoUrl = (urlOrPath: string | null | undefined) => {
  const path = extractFotoPath(urlOrPath);

  return useQuery({
    queryKey: ["signed-foto-url", path],
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from(FOTOS_BUCKET)
        .createSignedUrl(path, FOTO_SIGNED_TTL_SECONDS);
      if (error) {
        console.warn("createSignedUrl falló:", error.message, "path:", path);
        return null;
      }
      return data?.signedUrl ?? null;
    },
    enabled: !!path,
    staleTime: FOTO_SIGNED_TTL_SECONDS * 1000 * 0.8,
    gcTime: FOTO_SIGNED_TTL_SECONDS * 1000,
    retry: 1,
  });
};

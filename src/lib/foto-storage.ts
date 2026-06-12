import { supabase } from "@/integrations/supabase/client";

export const FOTOS_BUCKET = "fotos-lotes";
export const FOTO_SIGNED_TTL_SECONDS = 3600;

/**
 * Extracts the object path inside the fotos-lotes bucket from a public URL.
 * If the input is already a bare path (no `/object/` segment), returns it as-is.
 * Returns null for unrelated URLs (logos, unsplash, placeholders, etc.).
 */
export const extractFotoPath = (urlOrPath: string | null | undefined): string | null => {
  if (!urlOrPath) return null;
  if (!urlOrPath.includes("/object/")) {
    // assume already a bare path within the bucket
    return urlOrPath.replace(/^\/+/, "");
  }
  const m = urlOrPath.match(/\/object\/(?:public|sign)\/fotos-lotes\/([^?]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
};

/**
 * Async one-shot: returns a signed URL for a stored photo, or the original URL
 * if it isn't a fotos-lotes object (so external/legacy URLs keep working).
 */
export const getSignedFotoUrl = async (
  urlOrPath: string | null | undefined,
  ttlSeconds = FOTO_SIGNED_TTL_SECONDS,
): Promise<string | null> => {
  if (!urlOrPath) return null;
  const path = extractFotoPath(urlOrPath);
  if (!path) return urlOrPath;
  const { data, error } = await supabase.storage
    .from(FOTOS_BUCKET)
    .createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) {
    console.warn("createSignedUrl falló:", error?.message, "path:", path);
    return null;
  }
  return data.signedUrl;
};

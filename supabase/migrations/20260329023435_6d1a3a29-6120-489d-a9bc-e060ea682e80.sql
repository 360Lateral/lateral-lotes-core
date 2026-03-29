
-- Fix 1: analisis_documentos - restrict to lot-scoped access
DROP POLICY IF EXISTS "Documentos visibles para autenticados" ON public.analisis_documentos;
CREATE POLICY "Lot-scoped select analisis_documentos"
  ON public.analisis_documentos FOR SELECT TO authenticated
  USING (public.has_lot_access(auth.uid(), lote_id));

-- Fix 2: Recreate lotes_publicos as SECURITY INVOKER (linter still flagging it)
DROP VIEW IF EXISTS public.lotes_publicos;
CREATE VIEW public.lotes_publicos
WITH (security_invoker = on) AS
SELECT
  id, nombre_lote, ciudad, barrio, departamento, direccion,
  area_total_m2, lat, lng, estado_disponibilidad, tipo_lote,
  estrato, frente_ml, fondo_ml, destacado, foto_url, video_url,
  score_juridico, score_normativo, score_servicios,
  has_resolutoria, es_publico, owner_id, created_at, updated_at
FROM public.lotes
WHERE es_publico = true;
GRANT SELECT ON public.lotes_publicos TO anon, authenticated;

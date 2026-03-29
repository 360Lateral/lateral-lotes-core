
-- Use SECURITY DEFINER view (intentional: view restricts columns+rows, anon has no direct table access)
DROP VIEW public.lotes_publicos;

CREATE VIEW public.lotes_publicos
WITH (security_invoker = false)
AS
SELECT
  id, nombre_lote, ciudad, barrio, departamento, direccion,
  area_total_m2, lat, lng, estado_disponibilidad, tipo_lote,
  estrato, frente_ml, fondo_ml, destacado, foto_url, video_url,
  score_juridico, score_normativo, score_servicios, has_resolutoria,
  es_publico, owner_id, created_at, updated_at
FROM public.lotes
WHERE es_publico = true;

GRANT SELECT ON public.lotes_publicos TO anon;
GRANT SELECT ON public.lotes_publicos TO authenticated;

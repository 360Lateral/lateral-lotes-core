
-- Recreate lotes_publicos as SECURITY INVOKER (default) instead of SECURITY DEFINER
DROP VIEW IF EXISTS public.lotes_publicos;

CREATE VIEW public.lotes_publicos
WITH (security_invoker = on) AS
SELECT
  id,
  nombre_lote,
  ciudad,
  barrio,
  departamento,
  direccion,
  area_total_m2,
  lat,
  lng,
  estado_disponibilidad,
  tipo_lote,
  estrato,
  frente_ml,
  fondo_ml,
  destacado,
  foto_url,
  video_url,
  score_juridico,
  score_normativo,
  score_servicios,
  has_resolutoria,
  es_publico,
  owner_id,
  created_at,
  updated_at
FROM public.lotes
WHERE es_publico = true;

-- Grant access so anon/authenticated can query the view
GRANT SELECT ON public.lotes_publicos TO anon, authenticated;

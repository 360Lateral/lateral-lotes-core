
-- C1: drop any legacy permissive USING(true) policy on perfiles (idempotent)
DROP POLICY IF EXISTS "Perfiles visibles para autenticados" ON public.perfiles;

-- A2: obfuscate lat/lng in public lotes view (~500m grid)
CREATE OR REPLACE VIEW public.vw_lotes_publicos AS
SELECT
  id,
  nombre_lote,
  ciudad,
  barrio,
  departamento,
  estrato,
  ROUND(lat::numeric / 0.005) * 0.005 AS lat,
  ROUND(lng::numeric / 0.005) * 0.005 AS lng,
  area_total_m2,
  frente_ml,
  fondo_ml,
  estado_disponibilidad,
  destacado,
  score_juridico,
  score_normativo,
  score_servicios,
  score_ambiental,
  score_geotecnico,
  score_mercado,
  score_arquitectonico,
  score_financiero,
  has_resolutoria,
  foto_url,
  video_url,
  tipo_lote,
  es_publico,
  publicado_venta,
  estado_publicacion,
  precio_venta_estimado,
  created_at,
  updated_at
FROM public.lotes
WHERE es_publico = true;

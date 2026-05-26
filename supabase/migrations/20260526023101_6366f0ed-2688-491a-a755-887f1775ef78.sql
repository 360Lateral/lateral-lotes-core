CREATE OR REPLACE VIEW public.vw_mercado_publico
WITH (security_invoker = false)
AS
SELECT
  l.id AS lote_id,
  'LOTE-' || UPPER(SUBSTR(MD5(l.id::text), 1, 4)) AS codigo_anonimo,
  l.ciudad,
  l.barrio,
  (ROUND(COALESCE(l.area_total_m2, 0) / 100.0) * 100)::int AS area_m2_redondeada,
  CASE
    WHEN l.area_total_m2 IS NULL THEN 'desconocida'
    WHEN l.area_total_m2 < 500 THEN 'pequeño'
    WHEN l.area_total_m2 < 1500 THEN 'mediano'
    WHEN l.area_total_m2 < 5000 THEN 'grande'
    ELSE 'extra_grande'
  END AS categoria_area,
  ROUND(l.lat::numeric, 2) AS latitud_zona,
  ROUND(l.lng::numeric, 2) AS longitud_zona,
  CASE
    WHEN l.precio_venta_estimado IS NULL THEN 'no_disponible'
    WHEN l.precio_venta_estimado < 200000000 THEN 'rango_1'
    WHEN l.precio_venta_estimado < 500000000 THEN 'rango_2'
    WHEN l.precio_venta_estimado < 1000000000 THEN 'rango_3'
    WHEN l.precio_venta_estimado < 3000000000 THEN 'rango_4'
    ELSE 'rango_5'
  END AS rango_precio,
  l.tipo_lote AS uso_actual,
  l.created_at AS publicado_en
FROM public.lotes l
WHERE l.publicado_venta = true
  AND l.estado_publicacion = 'aprobado';

GRANT SELECT ON public.vw_mercado_publico TO anon, authenticated;
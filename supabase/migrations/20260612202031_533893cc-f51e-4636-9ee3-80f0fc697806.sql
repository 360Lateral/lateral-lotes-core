CREATE OR REPLACE VIEW public.vw_mercado_publico AS
SELECT
  l.id AS lote_id,
  ('LOTE-' || upper(substr(md5(l.id::text), 1, 4))) AS codigo_anonimo,
  l.ciudad,
  l.barrio,
  ((round(COALESCE(l.area_total_m2, 0::numeric) / 100.0)) * 100::numeric)::integer AS area_m2_redondeada,
  CASE
    WHEN l.area_total_m2 IS NULL THEN 'desconocida'
    WHEN l.area_total_m2 < 500 THEN 'pequeño'
    WHEN l.area_total_m2 < 1500 THEN 'mediano'
    WHEN l.area_total_m2 < 5000 THEN 'grande'
    ELSE 'extra_grande'
  END AS categoria_area,
  round(l.lat, 2) AS latitud_zona,
  round(l.lng, 2) AS longitud_zona,
  CASE
    WHEN l.precio_venta_estimado IS NULL THEN 'no_disponible'
    WHEN l.precio_venta_estimado < 200000000 THEN 'rango_1'
    WHEN l.precio_venta_estimado < 500000000 THEN 'rango_2'
    WHEN l.precio_venta_estimado < 1000000000 THEN 'rango_3'
    WHEN l.precio_venta_estimado < 3000000000::numeric THEN 'rango_4'
    ELSE 'rango_5'
  END AS rango_precio,
  l.tipo_lote AS uso_actual,
  l.created_at AS publicado_en,
  ROUND((
    SELECT AVG(s)::numeric
    FROM unnest(ARRAY[
      l.score_juridico, l.score_normativo, l.score_servicios,
      l.score_ambiental, l.score_arquitectonico, l.score_financiero,
      l.score_geotecnico, l.score_mercado
    ]) AS s
    WHERE s IS NOT NULL
  ), 1) AS score_360,
  COALESCE(l.has_resolutoria, false) AS has_resolutoria
FROM public.lotes l
WHERE l.publicado_venta = true
  AND l.estado_publicacion = 'aprobado'::estado_publicacion_lote;

GRANT SELECT ON public.vw_mercado_publico TO anon, authenticated;
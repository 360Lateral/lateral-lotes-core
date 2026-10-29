DROP FUNCTION IF EXISTS public.listar_mercado_publico();
CREATE FUNCTION public.listar_mercado_publico()
RETURNS TABLE(
  lote_id uuid, codigo_anonimo text, ciudad text, barrio text, area_m2_redondeada integer,
  categoria_area text, latitud_zona numeric, longitud_zona numeric, rango_precio text,
  uso_actual text, publicado_en timestamptz, score_360 numeric, has_resolutoria boolean,
  es_ejemplo boolean,
  score_juridico numeric, score_normativo numeric, score_servicios numeric, score_ambiental numeric,
  score_arquitectonico numeric, score_financiero numeric, score_geotecnico numeric, score_mercado numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_full boolean := false;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT COALESCE(
             (SELECT COALESCE(p.nivel_suscripcion, 'gratuito') <> 'gratuito'
                FROM public.perfiles p WHERE p.id = v_uid), false)
           OR public.is_admin_or_experto(v_uid)
           OR EXISTS (SELECT 1 FROM public.accesos_lote a
                       WHERE a.desarrollador_id = v_uid
                         AND a.estado = 'activa'
                         AND (a.fecha_expiracion IS NULL OR a.fecha_expiracion > now()))
      INTO v_full;
  END IF;

  RETURN QUERY
  SELECT l.id,
         'LOTE-' || upper(substr(md5(l.id::text), 1, 4)),
         l.ciudad,
         l.barrio,
         (round(COALESCE(l.area_total_m2, 0::numeric) / 100.0) * 100::numeric)::integer,
         CASE
           WHEN l.area_total_m2 IS NULL THEN 'desconocida'
           WHEN l.area_total_m2 < 500 THEN 'pequeño'
           WHEN l.area_total_m2 < 1500 THEN 'mediano'
           WHEN l.area_total_m2 < 5000 THEN 'grande'
           ELSE 'extra_grande'
         END,
         round(l.lat, 2),
         round(l.lng, 2),
         CASE
           WHEN l.precio_venta_estimado IS NULL THEN 'no_disponible'
           WHEN l.precio_venta_estimado < 200000000 THEN 'rango_1'
           WHEN l.precio_venta_estimado < 500000000 THEN 'rango_2'
           WHEN l.precio_venta_estimado < 1000000000 THEN 'rango_3'
           WHEN l.precio_venta_estimado < 3000000000 THEN 'rango_4'
           ELSE 'rango_5'
         END,
         l.tipo_lote,
         l.created_at,
         round((SELECT avg(s.s) FROM unnest(ARRAY[l.score_juridico, l.score_normativo, l.score_servicios,
                                                  l.score_ambiental, l.score_arquitectonico, l.score_financiero,
                                                  l.score_geotecnico, l.score_mercado]) s(s)
                 WHERE s.s IS NOT NULL), 1),
         COALESCE(l.has_resolutoria, false),
         l.es_ejemplo,
         l.score_juridico::numeric, l.score_normativo::numeric, l.score_servicios::numeric,
         l.score_ambiental::numeric, l.score_arquitectonico::numeric, l.score_financiero::numeric,
         l.score_geotecnico::numeric, l.score_mercado::numeric
    FROM public.lotes l
   WHERE (l.es_publico AND l.es_ejemplo)
      OR (v_full AND l.publicado_venta = true AND l.estado_publicacion = 'aprobado')
      OR (v_uid IS NOT NULL AND (l.owner_id = v_uid OR l.propietario_id = v_uid));
END;
$function$;

REVOKE ALL ON FUNCTION public.listar_mercado_publico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_mercado_publico() TO anon, authenticated;
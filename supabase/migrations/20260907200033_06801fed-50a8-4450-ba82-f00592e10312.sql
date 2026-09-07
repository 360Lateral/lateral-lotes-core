-- 1) Mercado filtrado por niveles
CREATE OR REPLACE FUNCTION public.listar_mercado_publico()
RETURNS TABLE(
  lote_id uuid,
  codigo_anonimo text,
  ciudad text,
  barrio text,
  area_m2_redondeada integer,
  categoria_area text,
  latitud_zona numeric,
  longitud_zona numeric,
  rango_precio text,
  uso_actual text,
  publicado_en timestamptz,
  score_360 numeric,
  has_resolutoria boolean,
  es_ejemplo boolean
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
         l.es_ejemplo
    FROM public.lotes l
   WHERE (l.es_publico AND l.es_ejemplo)
      OR (v_full AND l.publicado_venta = true AND l.estado_publicacion = 'aprobado')
      OR (v_uid IS NOT NULL AND (l.owner_id = v_uid OR l.propietario_id = v_uid));
END;
$function$;

GRANT EXECUTE ON FUNCTION public.listar_mercado_publico() TO anon, authenticated;
REVOKE SELECT ON public.vw_mercado_publico FROM anon;

-- 2) Cifras públicas agregadas
CREATE OR REPLACE FUNCTION public.obtener_stats_publicas()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'lotes_disponibles', (SELECT count(*) FROM public.lotes
                           WHERE publicado_venta = true
                             AND estado_publicacion = 'aprobado'
                             AND estado_disponibilidad = 'Disponible'),
    'ciudades', (SELECT count(DISTINCT ciudad) FROM public.lotes
                  WHERE publicado_venta = true AND estado_publicacion = 'aprobado' AND ciudad IS NOT NULL),
    'diagnosticos', (SELECT count(*) FROM public.diagnosticos),
    'con_resolutoria', (SELECT count(*) FROM public.lotes
                         WHERE publicado_venta = true AND estado_publicacion = 'aprobado'
                           AND COALESCE(has_resolutoria, false))
  );
$function$;

GRANT EXECUTE ON FUNCTION public.obtener_stats_publicas() TO anon, authenticated;

-- 3) Ficha pública enriquecida: solo con acceso
CREATE OR REPLACE FUNCTION public.obtener_ficha_publica_enriquecida(p_lote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_es_publico boolean;
  v_arq jsonb;
BEGIN
  SELECT es_publico INTO v_es_publico FROM public.lotes WHERE id = p_lote_id;
  IF NOT COALESCE(v_es_publico, false) THEN
    RETURN jsonb_build_object('es_publico', false);
  END IF;

  IF NOT public.tiene_acceso_ficha(auth.uid(), p_lote_id) THEN
    RETURN jsonb_build_object('es_publico', true, 'acceso', false,
                              'arquitectonico', NULL, 'financiero', NULL, 'mercado', NULL);
  END IF;

  SELECT to_jsonb(a) - 'id' - 'lote_id' - 'engagement_id' - 'experto_id' - 'completado_por'
    INTO v_arq
    FROM public.analisis_arquitectonico a
    WHERE a.lote_id = p_lote_id
    ORDER BY a.updated_at DESC NULLS LAST
    LIMIT 1;

  RETURN jsonb_build_object(
    'es_publico', true,
    'acceso', true,
    'arquitectonico', v_arq,
    'financiero', NULL,
    'mercado', NULL
  );
END;
$function$;
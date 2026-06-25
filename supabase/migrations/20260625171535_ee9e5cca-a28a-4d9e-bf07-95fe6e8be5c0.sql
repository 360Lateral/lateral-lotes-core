
-- 1. Plusvalía fields
ALTER TABLE public.lotes
  ADD COLUMN IF NOT EXISTS precio_compra_original NUMERIC,
  ADD COLUMN IF NOT EXISTS fecha_compra DATE,
  ADD COLUMN IF NOT EXISTS moneda_compra TEXT DEFAULT 'COP';

COMMENT ON COLUMN public.lotes.precio_compra_original IS 'Precio al que el propietario adquirió el lote. Permite calcular plusvalía vs valoración actual.';
COMMENT ON COLUMN public.lotes.fecha_compra IS 'Fecha de adquisición del lote. Permite calcular plusvalía anualizada.';
COMMENT ON COLUMN public.lotes.moneda_compra IS 'Moneda original de compra (COP, USD). Por defecto COP.';

-- 2. RPC: obtener_portafolio_propietario
CREATE OR REPLACE FUNCTION public.obtener_portafolio_propietario(
  p_propietario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kpis        JSONB;
  v_lentes      JSONB;
  v_lotes       JSONB;
  v_salud_areas JSONB;
  v_alertas     JSONB;
  v_total_lotes INTEGER;
BEGIN
  -- Permisos
  IF NOT (
    auth.uid() = p_propietario_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Sin permisos';
  END IF;

  SELECT COUNT(*) INTO v_total_lotes
  FROM public.lotes WHERE propietario_id = p_propietario_id;

  -- KPIs
  WITH lp AS (
    SELECT
      l.*,
      af.precio_estimado_promedio AS avaluo,
      af.vpn AS vpn_lote,
      af.tir_pct AS tir_lote,
      el.estado_activacion AS engagement_estado,
      el.id AS engagement_id,
      pd.codigo AS plan_codigo,
      pd.nombre AS plan_nombre,
      (
        COALESCE(l.score_juridico,0) + COALESCE(l.score_normativo,0) +
        COALESCE(l.score_ambiental,0) + COALESCE(l.score_servicios,0) +
        COALESCE(l.score_geotecnico,0) + COALESCE(l.score_mercado,0) +
        COALESCE(l.score_arquitectonico,0) + COALESCE(l.score_financiero,0)
      ) / NULLIF(
        (CASE WHEN l.score_juridico IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_normativo IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_ambiental IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_servicios IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_geotecnico IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_mercado IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_arquitectonico IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_financiero IS NULL THEN 0 ELSE 1 END), 0)::numeric AS score_promedio_lote
    FROM public.lotes l
    LEFT JOIN public.analisis_financiero af ON af.lote_id = l.id
    LEFT JOIN public.engagements_lote el ON el.lote_id = l.id
    LEFT JOIN public.planes_diagnostico pd ON pd.id = el.plan_id
    WHERE l.propietario_id = p_propietario_id
  )
  SELECT jsonb_build_object(
    'total_lotes', COUNT(*),
    'ciudades_distintas', COUNT(DISTINCT ciudad),
    'score_portafolio', COALESCE(AVG(score_promedio_lote) FILTER (WHERE score_promedio_lote IS NOT NULL), 0),
    'analisis_completos_pct', CASE WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE engagement_estado = 'entregado') * 100.0 / COUNT(*)) END,
    'valor_avaluo_total', COALESCE(SUM(avaluo), 0),
    'vpn_total_proyectado', COALESCE(SUM(vpn_lote) FILTER (WHERE plan_codigo = 'premium'), 0),
    'lotes_con_vpn', COUNT(*) FILTER (WHERE vpn_lote IS NOT NULL AND plan_codigo = 'premium'),
    'tir_promedio_ponderada', COALESCE(
      SUM(tir_lote * avaluo) FILTER (WHERE tir_lote IS NOT NULL AND avaluo IS NOT NULL)
      / NULLIF(SUM(avaluo) FILTER (WHERE tir_lote IS NOT NULL), 0), 0)
  ) INTO v_kpis FROM lp;

  -- Lentes
  WITH lp AS (
    SELECT
      l.id, l.nombre_lote, l.area_total_m2, l.precio_compra_original, l.fecha_compra,
      af.precio_estimado_promedio AS avaluo,
      af.vpn AS vpn_lote,
      aa.unidades_estimadas,
      aa.m2_construibles_total
    FROM public.lotes l
    LEFT JOIN public.analisis_financiero af ON af.lote_id = l.id
    LEFT JOIN public.analisis_arquitectonico aa ON aa.lote_id = l.id
    WHERE l.propietario_id = p_propietario_id
  ),
  agg AS (
    SELECT
      COALESCE(SUM(avaluo),0) AS valor_avaluo_total,
      COALESCE(SUM(area_total_m2),0) AS area_total,
      CASE WHEN COALESCE(SUM(area_total_m2),0) > 0
        THEN COALESCE(SUM(avaluo),0) / SUM(area_total_m2) ELSE 0 END AS valor_m2_promedio,
      COALESCE(SUM(vpn_lote),0) AS vpn_total,
      COALESCE(SUM(unidades_estimadas),0) AS unidades_totales,
      COALESCE(SUM(m2_construibles_total),0) AS area_construible_total,
      SUM(precio_compra_original) FILTER (WHERE precio_compra_original IS NOT NULL) AS inversion_original,
      MIN(fecha_compra) FILTER (WHERE fecha_compra IS NOT NULL) AS primera_compra
    FROM lp
  ),
  top_lote AS (
    SELECT id, nombre_lote, avaluo
    FROM lp WHERE avaluo IS NOT NULL
    ORDER BY avaluo DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'avaluo', jsonb_build_object(
      'valor_total', (SELECT valor_avaluo_total FROM agg),
      'valor_m2_promedio', (SELECT valor_m2_promedio FROM agg),
      'lote_mas_valioso', (SELECT to_jsonb(top_lote) FROM top_lote),
      'plusvalia_absoluta', CASE
        WHEN (SELECT inversion_original FROM agg) IS NOT NULL
        THEN (SELECT valor_avaluo_total - inversion_original FROM agg) ELSE NULL END,
      'plusvalia_pct', CASE
        WHEN COALESCE((SELECT inversion_original FROM agg),0) > 0
        THEN ((SELECT valor_avaluo_total - inversion_original FROM agg) / (SELECT inversion_original FROM agg)) * 100
        ELSE NULL END,
      'anios_tenencia', CASE
        WHEN (SELECT primera_compra FROM agg) IS NOT NULL
        THEN EXTRACT(YEAR FROM age(CURRENT_DATE, (SELECT primera_compra FROM agg)))::int
        ELSE NULL END
    ),
    'desarrollo', jsonb_build_object(
      'vpn_total', (SELECT vpn_total FROM agg),
      'unidades_totales', (SELECT unidades_totales FROM agg),
      'area_construible_total', (SELECT area_construible_total FROM agg)
    )
  ) INTO v_lentes;

  -- Lotes table
  WITH lc AS (
    SELECT
      l.id, l.nombre_lote, l.ciudad, l.barrio AS sector, l.area_total_m2, l.foto_url, l.lat, l.lng,
      af.precio_estimado_promedio AS valoracion,
      (
        COALESCE(l.score_juridico,0) + COALESCE(l.score_normativo,0) +
        COALESCE(l.score_ambiental,0) + COALESCE(l.score_servicios,0) +
        COALESCE(l.score_geotecnico,0) + COALESCE(l.score_mercado,0) +
        COALESCE(l.score_arquitectonico,0) + COALESCE(l.score_financiero,0)
      ) / NULLIF(
        (CASE WHEN l.score_juridico IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_normativo IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_ambiental IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_servicios IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_geotecnico IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_mercado IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_arquitectonico IS NULL THEN 0 ELSE 1 END +
         CASE WHEN l.score_financiero IS NULL THEN 0 ELSE 1 END), 0)::numeric AS score_promedio,
      el.estado_activacion::text AS estado,
      el.id AS engagement_id,
      pd.codigo AS plan_codigo,
      pd.nombre AS plan_nombre
    FROM public.lotes l
    LEFT JOIN public.analisis_financiero af ON af.lote_id = l.id
    LEFT JOIN public.engagements_lote el ON el.lote_id = l.id
    LEFT JOIN public.planes_diagnostico pd ON pd.id = el.plan_id
    WHERE l.propietario_id = p_propietario_id
    ORDER BY af.precio_estimado_promedio DESC NULLS LAST
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(lc)), '[]'::jsonb) INTO v_lotes FROM lc;

  -- Salud por área (8 áreas)
  WITH ad AS (
    SELECT 'juridico'::text AS codigo, 'Jurídico'::text AS nombre,
      AVG(score_juridico) AS promedio,
      COUNT(*) FILTER (WHERE score_juridico < 4) AS criticos,
      COUNT(*) FILTER (WHERE score_juridico BETWEEN 4 AND 7) AS warnings
    FROM public.lotes WHERE propietario_id = p_propietario_id
    UNION ALL
    SELECT 'normativo','Normativo', AVG(score_normativo),
      COUNT(*) FILTER (WHERE score_normativo < 4),
      COUNT(*) FILTER (WHERE score_normativo BETWEEN 4 AND 7)
    FROM public.lotes WHERE propietario_id = p_propietario_id
    UNION ALL
    SELECT 'ambiental','Ambiental', AVG(score_ambiental),
      COUNT(*) FILTER (WHERE score_ambiental < 4),
      COUNT(*) FILTER (WHERE score_ambiental BETWEEN 4 AND 7)
    FROM public.lotes WHERE propietario_id = p_propietario_id
    UNION ALL
    SELECT 'sspp','Servicios públicos', AVG(score_servicios),
      COUNT(*) FILTER (WHERE score_servicios < 4),
      COUNT(*) FILTER (WHERE score_servicios BETWEEN 4 AND 7)
    FROM public.lotes WHERE propietario_id = p_propietario_id
    UNION ALL
    SELECT 'geotecnico','Geotécnico', AVG(score_geotecnico),
      COUNT(*) FILTER (WHERE score_geotecnico < 4),
      COUNT(*) FILTER (WHERE score_geotecnico BETWEEN 4 AND 7)
    FROM public.lotes WHERE propietario_id = p_propietario_id
    UNION ALL
    SELECT 'mercado','Mercado', AVG(score_mercado),
      COUNT(*) FILTER (WHERE score_mercado < 4),
      COUNT(*) FILTER (WHERE score_mercado BETWEEN 4 AND 7)
    FROM public.lotes WHERE propietario_id = p_propietario_id
    UNION ALL
    SELECT 'arquitectonico','Arquitectónico', AVG(score_arquitectonico),
      COUNT(*) FILTER (WHERE score_arquitectonico < 4),
      COUNT(*) FILTER (WHERE score_arquitectonico BETWEEN 4 AND 7)
    FROM public.lotes WHERE propietario_id = p_propietario_id
    UNION ALL
    SELECT 'financiero','Financiero', AVG(score_financiero),
      COUNT(*) FILTER (WHERE score_financiero < 4),
      COUNT(*) FILTER (WHERE score_financiero BETWEEN 4 AND 7)
    FROM public.lotes WHERE propietario_id = p_propietario_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'codigo', codigo, 'nombre', nombre,
    'promedio', COALESCE(promedio, 0),
    'criticos', criticos, 'warnings', warnings
  )), '[]'::jsonb) INTO v_salud_areas FROM ad;

  -- Alertas
  WITH atrasados AS (
    SELECT COUNT(*)::int AS n
    FROM public.engagements_lote el
    JOIN public.lotes l ON l.id = el.lote_id
    WHERE l.propietario_id = p_propietario_id
      AND el.fecha_sla_objetivo < NOW()
      AND el.estado_activacion::text <> 'entregado'
  ),
  mejorables AS (
    SELECT COUNT(*)::int AS n
    FROM public.lotes l
    JOIN public.engagements_lote el ON el.lote_id = l.id
    JOIN public.planes_diagnostico pd ON pd.id = el.plan_id
    WHERE l.propietario_id = p_propietario_id
      AND pd.codigo IN ('basico', 'pro')
  ),
  oportunidades AS (
    SELECT COUNT(*)::int AS n
    FROM public.lotes l
    WHERE l.propietario_id = p_propietario_id
      AND (COALESCE(l.score_juridico,0) + COALESCE(l.score_normativo,0) +
           COALESCE(l.score_ambiental,0) + COALESCE(l.score_servicios,0) +
           COALESCE(l.score_geotecnico,0) + COALESCE(l.score_mercado,0) +
           COALESCE(l.score_arquitectonico,0) + COALESCE(l.score_financiero,0)) / 8.0 >= 8
  )
  SELECT jsonb_strip_nulls(jsonb_build_array(
    CASE WHEN (SELECT n FROM atrasados) > 0 THEN jsonb_build_object(
      'tipo','atrasado','titulo','Lotes con análisis atrasado',
      'count',(SELECT n FROM atrasados),'icon','AlertTriangle',
      'cta','/portal','cta_label','Ver detalle') END,
    CASE WHEN (SELECT n FROM mejorables) > 0 THEN jsonb_build_object(
      'tipo','mejorar_plan','titulo','Lotes pueden mejorar análisis',
      'count',(SELECT n FROM mejorables),'icon','Sparkles',
      'cta','/planes','cta_label','Ver planes') END,
    CASE WHEN (SELECT n FROM oportunidades) > 0 THEN jsonb_build_object(
      'tipo','oportunidad_venta','titulo','Lotes en momento ideal de venta',
      'count',(SELECT n FROM oportunidades),'icon','TrendingUp',
      'cta','/portal/portafolio','cta_label','Ver lotes') END
  )) INTO v_alertas;

  RETURN jsonb_build_object(
    'kpis', v_kpis,
    'lentes', v_lentes,
    'lotes', COALESCE(v_lotes, '[]'::jsonb),
    'salud_areas', COALESCE(v_salud_areas, '[]'::jsonb),
    'alertas', COALESCE(v_alertas, '[]'::jsonb),
    'total_lotes', v_total_lotes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_portafolio_propietario(UUID) TO authenticated;

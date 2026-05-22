-- =========================================================
-- Métricas ejecutivas: tendencia, ranking de asesores, embudo
-- =========================================================

-- 1) Tendencia mensual ------------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_tendencia_mensual(p_meses_atras INT DEFAULT 12)
RETURNS TABLE(
  mes DATE,
  mes_label TEXT,
  engagements_creados INT,
  engagements_completados INT,
  ingresos_cop BIGINT,
  leads_nuevos INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_asesor(auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  WITH meses AS (
    SELECT generate_series(
      date_trunc('month', now() - ((p_meses_atras) || ' months')::interval),
      date_trunc('month', now()),
      '1 month'::interval
    )::date AS mes
  ),
  eng_creados AS (
    SELECT date_trunc('month', e.created_at)::date AS mes,
           COUNT(*)::int AS cant,
           COALESCE(SUM(p.precio_cop), 0)::bigint AS ingresos
      FROM public.engagements_lote e
      LEFT JOIN public.planes_diagnostico p ON p.id = e.plan_id
     GROUP BY 1
  ),
  eng_entregados AS (
    SELECT date_trunc('month', e.updated_at)::date AS mes,
           COUNT(*)::int AS cant
      FROM public.engagements_lote e
     WHERE e.estado = 'entregado'
     GROUP BY 1
  ),
  ld AS (
    SELECT date_trunc('month', l.created_at)::date AS mes,
           COUNT(*)::int AS cant
      FROM public.leads l
     GROUP BY 1
  )
  SELECT
    m.mes,
    (CASE EXTRACT(MONTH FROM m.mes)::int
       WHEN 1 THEN 'ene' WHEN 2 THEN 'feb' WHEN 3 THEN 'mar'
       WHEN 4 THEN 'abr' WHEN 5 THEN 'may' WHEN 6 THEN 'jun'
       WHEN 7 THEN 'jul' WHEN 8 THEN 'ago' WHEN 9 THEN 'sep'
       WHEN 10 THEN 'oct' WHEN 11 THEN 'nov' WHEN 12 THEN 'dic'
     END || ' ' || EXTRACT(YEAR FROM m.mes)::int)::text AS mes_label,
    COALESCE(ec.cant, 0) AS engagements_creados,
    COALESCE(ee.cant, 0) AS engagements_completados,
    COALESCE(ec.ingresos, 0) AS ingresos_cop,
    COALESCE(ld.cant, 0) AS leads_nuevos
  FROM meses m
  LEFT JOIN eng_creados ec ON ec.mes = m.mes
  LEFT JOIN eng_entregados ee ON ee.mes = m.mes
  LEFT JOIN ld ON ld.mes = m.mes
  ORDER BY m.mes ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_tendencia_mensual(INT) TO authenticated;

-- 2) Ranking de asesores ----------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_ranking_asesores(
  p_desde TIMESTAMPTZ DEFAULT NULL,
  p_hasta TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  asesor_id UUID,
  asesor_nombre TEXT,
  engagements_totales INT,
  engagements_activos INT,
  engagements_entregados INT,
  avance_promedio NUMERIC(5,2),
  tiempo_medio_cierre_dias NUMERIC(6,1),
  sla_cumplidos_pct NUMERIC(5,2),
  ingresos_generados_cop BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_asesor(auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    e.asesor_asignado_id AS asesor_id,
    COALESCE(pf.nombre, 'Sin nombre')::text AS asesor_nombre,
    COUNT(*)::int AS engagements_totales,
    COUNT(*) FILTER (WHERE e.estado NOT IN ('entregado','cancelado','cerrado'))::int AS engagements_activos,
    COUNT(*) FILTER (WHERE e.estado = 'entregado')::int AS engagements_entregados,
    ROUND(COALESCE(AVG(e.avance_pct), 0), 2)::numeric(5,2) AS avance_promedio,
    ROUND(
      COALESCE(
        AVG(EXTRACT(EPOCH FROM (e.updated_at - e.fecha_inicio)) / 86400.0)
          FILTER (WHERE e.estado = 'entregado' AND e.fecha_inicio IS NOT NULL),
        0
      ), 1
    )::numeric(6,1) AS tiempo_medio_cierre_dias,
    ROUND(
      CASE
        WHEN COUNT(*) FILTER (WHERE e.estado = 'entregado') > 0 THEN
          (COUNT(*) FILTER (
             WHERE e.estado = 'entregado'
               AND e.fecha_sla_objetivo IS NOT NULL
               AND e.updated_at <= e.fecha_sla_objetivo
           )::numeric
           / COUNT(*) FILTER (WHERE e.estado = 'entregado')::numeric) * 100
        ELSE 0
      END, 2
    )::numeric(5,2) AS sla_cumplidos_pct,
    COALESCE(SUM(p.precio_cop), 0)::bigint AS ingresos_generados_cop
  FROM public.engagements_lote e
  LEFT JOIN public.perfiles pf ON pf.id = e.asesor_asignado_id
  LEFT JOIN public.planes_diagnostico p ON p.id = e.plan_id
  WHERE e.asesor_asignado_id IS NOT NULL
    AND (p_desde IS NULL OR e.created_at >= p_desde)
    AND (p_hasta IS NULL OR e.created_at <= p_hasta)
  GROUP BY e.asesor_asignado_id, pf.nombre
  HAVING COUNT(*) > 0
  ORDER BY ingresos_generados_cop DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_ranking_asesores(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- 3) Embudo de conversión ---------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_embudo_conversion(
  p_desde TIMESTAMPTZ DEFAULT NULL,
  p_hasta TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  etapa TEXT,
  cantidad INT,
  conversion_pct NUMERIC(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leads_nuevos    INT;
  v_contactados     INT;
  v_negociacion     INT;
  v_eng_creados     INT;
  v_eng_entregados  INT;
BEGIN
  IF NOT public.is_admin_or_asesor(auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT COUNT(*)::int INTO v_leads_nuevos
    FROM public.leads l
   WHERE (p_desde IS NULL OR l.created_at >= p_desde)
     AND (p_hasta IS NULL OR l.created_at <= p_hasta);

  SELECT COUNT(*)::int INTO v_contactados
    FROM public.leads l
   WHERE l.estado IN ('contactado','negociacion','cerrado')
     AND (p_desde IS NULL OR l.created_at >= p_desde)
     AND (p_hasta IS NULL OR l.created_at <= p_hasta);

  SELECT COUNT(*)::int INTO v_negociacion
    FROM public.leads l
   WHERE l.estado IN ('negociacion','cerrado')
     AND (p_desde IS NULL OR l.created_at >= p_desde)
     AND (p_hasta IS NULL OR l.created_at <= p_hasta);

  SELECT COUNT(*)::int INTO v_eng_creados
    FROM public.engagements_lote e
   WHERE (p_desde IS NULL OR e.created_at >= p_desde)
     AND (p_hasta IS NULL OR e.created_at <= p_hasta);

  SELECT COUNT(*)::int INTO v_eng_entregados
    FROM public.engagements_lote e
   WHERE e.estado = 'entregado'
     AND (p_desde IS NULL OR e.created_at >= p_desde)
     AND (p_hasta IS NULL OR e.created_at <= p_hasta);

  RETURN QUERY
  SELECT 'Leads nuevos'::text, v_leads_nuevos, 100.00::numeric(5,2)
  UNION ALL
  SELECT 'Contactados'::text, v_contactados,
         CASE WHEN v_leads_nuevos > 0
              THEN ROUND((v_contactados::numeric / v_leads_nuevos) * 100, 2)
              ELSE 0 END::numeric(5,2)
  UNION ALL
  SELECT 'En negociación'::text, v_negociacion,
         CASE WHEN v_contactados > 0
              THEN ROUND((v_negociacion::numeric / v_contactados) * 100, 2)
              ELSE 0 END::numeric(5,2)
  UNION ALL
  SELECT 'Engagement creado'::text, v_eng_creados,
         CASE WHEN v_negociacion > 0
              THEN ROUND((v_eng_creados::numeric / v_negociacion) * 100, 2)
              ELSE 0 END::numeric(5,2)
  UNION ALL
  SELECT 'Engagement entregado'::text, v_eng_entregados,
         CASE WHEN v_eng_creados > 0
              THEN ROUND((v_eng_entregados::numeric / v_eng_creados) * 100, 2)
              ELSE 0 END::numeric(5,2);
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_embudo_conversion(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- TEST: SELECT * FROM obtener_tendencia_mensual();
-- TEST: SELECT * FROM obtener_ranking_asesores();
-- TEST: SELECT * FROM obtener_embudo_conversion();


-- =====================================================
-- Function: obtener_kpis_portafolio
-- =====================================================
CREATE OR REPLACE FUNCTION public.obtener_kpis_portafolio()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_lotes_activos int;
  v_avance numeric;
  v_sla_vencidos int;
  v_ingresos_cop numeric;
  v_ingresos_usd numeric;
  v_ticket_cop numeric;
  v_conversion numeric;
  v_por_plan jsonb;
  v_por_estado jsonb;
  v_total_gratuito int;
  v_convertidos int;
BEGIN
  SELECT COUNT(*) INTO v_lotes_activos
    FROM engagements_lote
   WHERE estado NOT IN ('cerrado','cancelado');

  SELECT COALESCE(AVG(avance_pct), 0) INTO v_avance
    FROM engagements_lote
   WHERE estado NOT IN ('cerrado','cancelado');

  SELECT COUNT(*) INTO v_sla_vencidos
    FROM engagements_lote
   WHERE fecha_sla_objetivo IS NOT NULL
     AND fecha_sla_objetivo < now()
     AND estado NOT IN ('entregado','cerrado','cancelado');

  SELECT COALESCE(SUM(precio_cobrado), 0) INTO v_ingresos_cop
    FROM engagements_lote
   WHERE moneda = 'COP'
     AND estado_pago = 'pagado'
     AND created_at >= date_trunc('month', now());

  SELECT COALESCE(SUM(precio_cobrado), 0) INTO v_ingresos_usd
    FROM engagements_lote
   WHERE moneda = 'USD'
     AND estado_pago = 'pagado'
     AND created_at >= date_trunc('month', now());

  SELECT COALESCE(AVG(precio_cobrado), 0) INTO v_ticket_cop
    FROM engagements_lote
   WHERE moneda = 'COP'
     AND estado_pago = 'pagado'
     AND created_at >= now() - INTERVAL '90 days';

  -- Conversion gratuito -> pago (últimos 90 días)
  WITH cli AS (
    SELECT COALESCE(cliente_id::text, lead_id::text) AS cid,
           p.codigo AS plan_codigo
      FROM engagements_lote e
      LEFT JOIN planes_diagnostico p ON p.id = e.plan_id
     WHERE e.created_at >= now() - INTERVAL '90 days'
       AND COALESCE(cliente_id::text, lead_id::text) IS NOT NULL
  ),
  agrup AS (
    SELECT cid,
           bool_or(plan_codigo = 'gratuito') AS tuvo_gratuito,
           bool_or(plan_codigo IN ('basico','pro','premium')) AS tuvo_pago
      FROM cli
     GROUP BY cid
  )
  SELECT
    COUNT(*) FILTER (WHERE tuvo_gratuito),
    COUNT(*) FILTER (WHERE tuvo_gratuito AND tuvo_pago)
  INTO v_total_gratuito, v_convertidos
  FROM agrup;

  v_conversion := CASE WHEN v_total_gratuito > 0
                       THEN ROUND((v_convertidos::numeric / v_total_gratuito) * 100, 2)
                       ELSE 0 END;

  -- Engagements por plan
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'plan_codigo', p.codigo,
            'plan_nombre', p.nombre,
            'cantidad', COALESCE(c.cnt, 0)
         ) ORDER BY p.orden NULLS LAST, p.codigo), '[]'::jsonb)
    INTO v_por_plan
    FROM planes_diagnostico p
    LEFT JOIN (
      SELECT plan_id, COUNT(*) AS cnt
        FROM engagements_lote
       GROUP BY plan_id
    ) c ON c.plan_id = p.id;

  -- Engagements por estado (en orden fijo)
  WITH estados(estado) AS (
    VALUES ('prospecto'::estado_engagement),('activo'),('en_revision'),
           ('entregado'),('cerrado'),('cancelado')
  )
  SELECT jsonb_agg(jsonb_build_object(
           'estado', e.estado,
           'cantidad', COALESCE(c.cnt, 0)
         ))
    INTO v_por_estado
    FROM estados e
    LEFT JOIN (
      SELECT estado, COUNT(*) AS cnt FROM engagements_lote GROUP BY estado
    ) c ON c.estado = e.estado;

  RETURN jsonb_build_object(
    'lotes_activos', v_lotes_activos,
    'avance_promedio_pct', ROUND(v_avance, 2),
    'sla_vencidos', v_sla_vencidos,
    'ingresos_mes_cop', v_ingresos_cop,
    'ingresos_mes_usd', v_ingresos_usd,
    'ticket_promedio_cop', ROUND(v_ticket_cop, 2),
    'conversion_gratuito_a_pago_pct', v_conversion,
    'engagements_por_plan', v_por_plan,
    'engagements_por_estado', v_por_estado
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_kpis_portafolio() TO authenticated;

-- =====================================================
-- View: vw_portafolio_resumen
-- =====================================================
CREATE OR REPLACE VIEW public.vw_portafolio_resumen
WITH (security_invoker = true)
AS
SELECT
  e.id                                AS engagement_id,
  e.lote_id,
  l.nombre_lote                       AS lote_nombre,
  l.ciudad                            AS lote_ciudad,
  l.barrio                            AS lote_barrio,
  p.codigo                            AS plan_codigo,
  p.nombre                            AS plan_nombre,
  e.estado,
  e.avance_pct,
  e.asesor_asignado_id                AS asesor_id,
  pa.nombre                           AS asesor_nombre,
  COALESCE(pc.nombre, lc.nombre)      AS cliente_nombre,
  GREATEST(0, (CURRENT_DATE - e.fecha_solicitud::date))::int AS dias_en_gestion,
  CASE
    WHEN e.fecha_sla_objetivo IS NULL THEN NULL
    ELSE (e.fecha_sla_objetivo::date - CURRENT_DATE)::int
  END                                 AS dias_para_sla,
  CASE
    WHEN e.fecha_sla_objetivo IS NULL THEN NULL
    WHEN (e.fecha_sla_objetivo::date - CURRENT_DATE) > 5 THEN 'verde'
    WHEN (e.fecha_sla_objetivo::date - CURRENT_DATE) >= 0 THEN 'ambar'
    ELSE 'rojo'
  END                                 AS semaforo_sla,
  e.estado_pago,
  e.precio_cobrado,
  e.moneda,
  GREATEST(e.updated_at, COALESCE((
    SELECT MAX(t.updated_at) FROM tareas_analisis t WHERE t.engagement_id = e.id
  ), e.updated_at))                   AS ultima_actualizacion
FROM engagements_lote e
LEFT JOIN lotes l               ON l.id = e.lote_id
LEFT JOIN planes_diagnostico p  ON p.id = e.plan_id
LEFT JOIN perfiles pa           ON pa.id = e.asesor_asignado_id
LEFT JOIN perfiles pc           ON pc.id = e.cliente_id
LEFT JOIN leads lc              ON lc.id = e.lead_id
WHERE e.estado NOT IN ('cerrado','cancelado');

GRANT SELECT ON public.vw_portafolio_resumen TO authenticated;

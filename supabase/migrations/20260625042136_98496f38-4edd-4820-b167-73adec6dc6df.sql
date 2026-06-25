
CREATE OR REPLACE FUNCTION public.obtener_metricas_clientes_ejecutivo(p_rango TEXT DEFAULT '3m')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ahora TIMESTAMPTZ := NOW();
  v_desde TIMESTAMPTZ;
  v_intervalo TEXT;
  v_kpis jsonb;
  v_evo_activos jsonb;
  v_evo_nuevos jsonb;
  v_evo_cancel jsonb;
  v_planes jsonb;
  v_riesgo jsonb;
  v_total INTEGER;
BEGIN
  IF NOT public.is_admin_or_experto(auth.uid()) THEN
    RAISE EXCEPTION 'Sin permisos';
  END IF;

  v_desde := CASE p_rango
    WHEN '30d' THEN v_ahora - INTERVAL '30 days'
    WHEN '12m' THEN v_ahora - INTERVAL '12 months'
    ELSE v_ahora - INTERVAL '3 months'
  END;
  v_intervalo := CASE p_rango
    WHEN '30d' THEN 'day'
    WHEN '12m' THEN 'month'
    ELSE 'week'
  END;

  -- KPIs
  WITH activos_actual AS (
    SELECT COUNT(DISTINCT uid) AS n FROM (
      SELECT desarrollador_id AS uid FROM suscripciones_desarrollador
        WHERE estado='activa' AND (fecha_fin IS NULL OR fecha_fin > v_ahora)
      UNION
      SELECT desarrollador_id FROM accesos_lote
        WHERE estado='activa' AND (fecha_expiracion IS NULL OR fecha_expiracion > v_ahora)
    ) s
  ),
  activos_anterior AS (
    SELECT COUNT(DISTINCT uid) AS n FROM (
      SELECT desarrollador_id AS uid FROM suscripciones_desarrollador
        WHERE created_at <= v_desde AND (fecha_fin IS NULL OR fecha_fin > v_desde)
      UNION
      SELECT desarrollador_id FROM accesos_lote
        WHERE fecha_compra <= v_desde AND (fecha_expiracion IS NULL OR fecha_expiracion > v_desde)
    ) s
  ),
  nuevos_mes AS (
    SELECT COUNT(DISTINCT uid) AS n FROM (
      SELECT desarrollador_id AS uid FROM suscripciones_desarrollador WHERE created_at > v_ahora - INTERVAL '30 days'
      UNION
      SELECT desarrollador_id FROM accesos_lote WHERE created_at > v_ahora - INTERVAL '30 days'
    ) s
  ),
  nuevos_mes_anterior AS (
    SELECT COUNT(DISTINCT uid) AS n FROM (
      SELECT desarrollador_id AS uid FROM suscripciones_desarrollador
        WHERE created_at > v_ahora - INTERVAL '60 days' AND created_at <= v_ahora - INTERVAL '30 days'
      UNION
      SELECT desarrollador_id FROM accesos_lote
        WHERE created_at > v_ahora - INTERVAL '60 days' AND created_at <= v_ahora - INTERVAL '30 days'
    ) s
  ),
  cancel_mes AS (
    SELECT COUNT(*) AS n FROM suscripciones_desarrollador
    WHERE estado IN ('vencida','cancelada') AND updated_at > v_ahora - INTERVAL '30 days'
  ),
  cancel_mes_anterior AS (
    SELECT COUNT(*) AS n FROM suscripciones_desarrollador
    WHERE estado IN ('vencida','cancelada')
      AND updated_at > v_ahora - INTERVAL '60 days' AND updated_at <= v_ahora - INTERVAL '30 days'
  ),
  ltv AS (
    SELECT COALESCE(AVG(total),0) AS v FROM (
      SELECT desarrollador_id, SUM(precio_cop) AS total FROM (
        SELECT desarrollador_id, precio_cop FROM suscripciones_desarrollador WHERE estado IN ('activa','vencida')
        UNION ALL
        SELECT desarrollador_id, precio_cop FROM accesos_lote WHERE estado IN ('activa','vencida')
      ) all_pagos GROUP BY desarrollador_id
    ) s
  ),
  lotes_prom AS (
    SELECT COALESCE(AVG(n),0) AS v FROM (
      SELECT desarrollador_id, COUNT(*) AS n FROM accesos_lote
      WHERE estado='activa' AND (fecha_expiracion IS NULL OR fecha_expiracion > v_ahora)
      GROUP BY desarrollador_id
    ) s
  )
  SELECT jsonb_build_object(
    'clientes_activos', (SELECT n FROM activos_actual),
    'clientes_activos_delta', (SELECT n FROM activos_actual) - (SELECT n FROM activos_anterior),
    'clientes_nuevos_mes', (SELECT n FROM nuevos_mes),
    'clientes_nuevos_delta', (SELECT n FROM nuevos_mes) - (SELECT n FROM nuevos_mes_anterior),
    'churn_rate', CASE WHEN (SELECT n FROM activos_actual)=0 THEN 0
      ELSE ROUND(((SELECT n FROM cancel_mes)::NUMERIC / NULLIF((SELECT n FROM activos_actual),0)::NUMERIC)*100, 2) END,
    'churn_rate_delta', (SELECT n FROM cancel_mes) - (SELECT n FROM cancel_mes_anterior),
    'promedio_lotes_desarrollador', ROUND((SELECT v FROM lotes_prom)::NUMERIC, 2),
    'ltv_estimado', ROUND((SELECT v FROM ltv)::NUMERIC, 0)
  ) INTO v_kpis;

  -- Evolución activos (snapshot por periodo)
  WITH periodos AS (
    SELECT generate_series(
      date_trunc(v_intervalo, v_desde),
      date_trunc(v_intervalo, v_ahora),
      ('1 ' || v_intervalo)::INTERVAL
    ) AS pi
  )
  SELECT jsonb_agg(jsonb_build_object(
    'periodo', to_char(pi, CASE v_intervalo WHEN 'month' THEN 'Mon YY' WHEN 'day' THEN 'DD Mon' ELSE 'DD Mon' END),
    'activos', (
      SELECT COUNT(DISTINCT uid) FROM (
        SELECT desarrollador_id AS uid FROM suscripciones_desarrollador
          WHERE created_at <= pi + ('1 '||v_intervalo)::INTERVAL
            AND (fecha_fin IS NULL OR fecha_fin >= pi)
            AND estado IN ('activa','vencida','cancelada')
        UNION
        SELECT desarrollador_id FROM accesos_lote
          WHERE created_at <= pi + ('1 '||v_intervalo)::INTERVAL
            AND (fecha_expiracion IS NULL OR fecha_expiracion >= pi)
      ) s
    )
  ) ORDER BY pi)
  INTO v_evo_activos FROM periodos;

  -- Evolución nuevos
  WITH periodos AS (
    SELECT generate_series(date_trunc(v_intervalo, v_desde), date_trunc(v_intervalo, v_ahora), ('1 '||v_intervalo)::INTERVAL) AS pi
  ),
  nuevos AS (
    SELECT date_trunc(v_intervalo, created_at) AS p, COUNT(DISTINCT desarrollador_id) AS n
    FROM (
      SELECT desarrollador_id, created_at FROM suscripciones_desarrollador WHERE created_at >= v_desde
      UNION ALL
      SELECT desarrollador_id, created_at FROM accesos_lote WHERE created_at >= v_desde
    ) s GROUP BY 1
  )
  SELECT jsonb_agg(jsonb_build_object(
    'periodo', to_char(p.pi, CASE v_intervalo WHEN 'month' THEN 'Mon YY' ELSE 'DD Mon' END),
    'nuevos', COALESCE(n.n, 0)
  ) ORDER BY p.pi)
  INTO v_evo_nuevos
  FROM periodos p LEFT JOIN nuevos n ON n.p = p.pi;

  -- Evolución cancelaciones
  WITH periodos AS (
    SELECT generate_series(date_trunc(v_intervalo, v_desde), date_trunc(v_intervalo, v_ahora), ('1 '||v_intervalo)::INTERVAL) AS pi
  ),
  cancel AS (
    SELECT date_trunc(v_intervalo, updated_at) AS p, COUNT(*) AS n
    FROM suscripciones_desarrollador
    WHERE estado IN ('vencida','cancelada') AND updated_at >= v_desde
    GROUP BY 1
  )
  SELECT jsonb_agg(jsonb_build_object(
    'periodo', to_char(p.pi, CASE v_intervalo WHEN 'month' THEN 'Mon YY' ELSE 'DD Mon' END),
    'cancelaciones', COALESCE(c.n, 0)
  ) ORDER BY p.pi)
  INTO v_evo_cancel
  FROM periodos p LEFT JOIN cancel c ON c.p = p.pi;

  -- Distribución de planes activos (sus + ppv)
  WITH sus AS (
    SELECT nivel::text AS plan, COUNT(*) AS c
    FROM suscripciones_desarrollador
    WHERE estado='activa' AND (fecha_fin IS NULL OR fecha_fin > v_ahora)
    GROUP BY nivel
  ),
  ppv AS (
    SELECT 'pay_per_view'::text AS plan, COUNT(DISTINCT desarrollador_id) AS c
    FROM accesos_lote
    WHERE estado='activa' AND (fecha_expiracion IS NULL OR fecha_expiracion > v_ahora)
      AND desarrollador_id NOT IN (SELECT desarrollador_id FROM suscripciones_desarrollador WHERE estado='activa' AND (fecha_fin IS NULL OR fecha_fin > v_ahora))
  )
  SELECT jsonb_agg(jsonb_build_object('plan', plan, 'count', c))
  INTO v_planes
  FROM (SELECT * FROM sus UNION ALL SELECT * FROM ppv WHERE c > 0) t;

  -- Clientes en riesgo
  WITH venc AS (
    SELECT s.id, p.email, p.nombre, s.nivel::text AS plan, 'vencimiento'::text AS motivo, s.fecha_fin AS fecha_riesgo, p.id AS user_id
    FROM suscripciones_desarrollador s
    JOIN perfiles p ON p.id = s.desarrollador_id
    WHERE s.estado='activa' AND s.fecha_fin BETWEEN v_ahora AND v_ahora + INTERVAL '7 days'
  ),
  inact AS (
    SELECT s.id, p.email, p.nombre, s.nivel::text AS plan, 'inactivo'::text AS motivo, u.last_sign_in_at AS fecha_riesgo, p.id AS user_id
    FROM suscripciones_desarrollador s
    JOIN perfiles p ON p.id = s.desarrollador_id
    JOIN auth.users u ON u.id = p.id
    WHERE s.estado='activa'
      AND (s.fecha_fin IS NULL OR s.fecha_fin > v_ahora)
      AND (u.last_sign_in_at IS NULL OR u.last_sign_in_at < v_ahora - INTERVAL '30 days')
      AND s.id NOT IN (SELECT id FROM venc)
  )
  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'user_id', user_id, 'email', email, 'nombre', nombre,
    'tipo', 'desarrollador', 'plan', plan, 'motivo', motivo, 'fecha_riesgo', fecha_riesgo
  )) INTO v_riesgo
  FROM (SELECT * FROM venc UNION ALL SELECT * FROM inact) t;

  -- Total histórico
  SELECT COUNT(DISTINCT uid) INTO v_total FROM (
    SELECT desarrollador_id AS uid FROM suscripciones_desarrollador
    UNION SELECT desarrollador_id FROM accesos_lote
  ) s;

  RETURN jsonb_build_object(
    'kpis', v_kpis,
    'evolucion_activos', COALESCE(v_evo_activos, '[]'::jsonb),
    'evolucion_nuevos', COALESCE(v_evo_nuevos, '[]'::jsonb),
    'evolucion_cancelaciones', COALESCE(v_evo_cancel, '[]'::jsonb),
    'distribucion_planes', COALESCE(v_planes, '[]'::jsonb),
    'clientes_riesgo', COALESCE(v_riesgo, '[]'::jsonb),
    'total_clientes', v_total,
    'rango', p_rango,
    'desde', v_desde,
    'hasta', v_ahora
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_metricas_clientes_ejecutivo(TEXT) TO authenticated;

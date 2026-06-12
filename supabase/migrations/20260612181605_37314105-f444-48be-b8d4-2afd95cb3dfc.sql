
CREATE OR REPLACE FUNCTION public.resumen_cuenta_desarrollador(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_accesos_activos int;
  v_ndas_firmados int;
  v_dias_restantes int;
  v_fecha_renovacion timestamptz;
  v_gasto_mes_actual bigint;
  v_gasto_mes_anterior bigint;
BEGIN
  SELECT count(*) INTO v_accesos_activos
  FROM public.accesos_lote
  WHERE desarrollador_id = p_user_id
    AND estado = 'activa'
    AND fecha_expiracion > now();

  SELECT count(*) INTO v_ndas_firmados
  FROM public.ndas_firmados
  WHERE desarrollador_id = p_user_id;

  SELECT
    GREATEST(EXTRACT(DAY FROM (fecha_fin - now()))::int, 0),
    fecha_fin
  INTO v_dias_restantes, v_fecha_renovacion
  FROM public.suscripciones_desarrollador
  WHERE desarrollador_id = p_user_id
    AND estado = 'activa'
    AND fecha_fin > now()
  ORDER BY fecha_fin DESC LIMIT 1;

  SELECT
    COALESCE(SUM(CASE WHEN fecha_aprobacion >= date_trunc('month', now()) THEN monto_cop END), 0),
    COALESCE(SUM(CASE WHEN fecha_aprobacion >= date_trunc('month', now()) - interval '1 month'
                       AND fecha_aprobacion < date_trunc('month', now()) THEN monto_cop END), 0)
  INTO v_gasto_mes_actual, v_gasto_mes_anterior
  FROM public.transacciones
  WHERE creada_por = p_user_id
    AND estado = 'aprobada';

  RETURN jsonb_build_object(
    'accesos_activos', COALESCE(v_accesos_activos, 0),
    'ndas_firmados', COALESCE(v_ndas_firmados, 0),
    'dias_restantes', COALESCE(v_dias_restantes, 0),
    'fecha_renovacion', v_fecha_renovacion,
    'gasto_mes_actual', COALESCE(v_gasto_mes_actual, 0),
    'gasto_mes_anterior', COALESCE(v_gasto_mes_anterior, 0),
    'delta_gasto', CASE
      WHEN v_gasto_mes_anterior > 0
      THEN ROUND(((v_gasto_mes_actual - v_gasto_mes_anterior)::numeric / v_gasto_mes_anterior) * 100, 1)
      ELSE NULL
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resumen_cuenta_desarrollador(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.lotes_recomendados_desarrollador(
  p_user_id uuid,
  p_limit int DEFAULT 6
)
RETURNS TABLE (
  lote_id uuid,
  ciudad text,
  barrio text,
  area_total_m2 numeric,
  estrato int,
  tipo_lote text,
  nombre_lote text,
  similitud_score numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH mis_intereses AS (
    SELECT DISTINCT l.ciudad, l.estrato, l.tipo_lote, l.area_total_m2
    FROM public.lotes l
    WHERE l.id IN (
      SELECT lote_id FROM public.accesos_lote WHERE desarrollador_id = p_user_id
      UNION
      SELECT lote_id FROM public.ndas_firmados WHERE desarrollador_id = p_user_id
    )
  ),
  ya_vistos AS (
    SELECT lote_id FROM public.accesos_lote WHERE desarrollador_id = p_user_id
    UNION
    SELECT lote_id FROM public.ndas_firmados WHERE desarrollador_id = p_user_id
  )
  SELECT
    p.id AS lote_id,
    p.ciudad,
    p.barrio,
    p.area_total_m2,
    p.estrato,
    p.tipo_lote,
    p.nombre_lote,
    (
      (CASE WHEN p.ciudad IN (SELECT ciudad FROM mis_intereses WHERE ciudad IS NOT NULL) THEN 1.0 ELSE 0 END) +
      (CASE WHEN p.estrato IN (SELECT estrato FROM mis_intereses WHERE estrato IS NOT NULL) THEN 0.5 ELSE 0 END) +
      (CASE WHEN p.tipo_lote IN (SELECT tipo_lote FROM mis_intereses WHERE tipo_lote IS NOT NULL) THEN 0.3 ELSE 0 END) +
      (CASE WHEN EXISTS (
        SELECT 1 FROM mis_intereses mi
        WHERE mi.area_total_m2 IS NOT NULL AND p.area_total_m2 IS NOT NULL
          AND ABS(p.area_total_m2 - mi.area_total_m2) / NULLIF(GREATEST(p.area_total_m2, mi.area_total_m2), 0) < 0.3
      ) THEN 0.2 ELSE 0 END)
    )::numeric AS similitud_score
  FROM public.lotes p
  WHERE p.es_publico = true
    AND p.estado_publicacion = 'aprobado'
    AND p.id NOT IN (SELECT lote_id FROM ya_vistos)
  ORDER BY similitud_score DESC, RANDOM()
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.lotes_recomendados_desarrollador(uuid, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.resumen_panel_experto(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ordenes_activas int;
  v_propuestas_pendientes int;
  v_total_propuestas int;
  v_ganadas int;
  v_ingresos_mes bigint;
BEGIN
  SELECT count(*) INTO v_ordenes_activas
  FROM public.ordenes_servicio
  WHERE estado = 'abierta';

  SELECT count(*) INTO v_propuestas_pendientes
  FROM public.propuestas_experto
  WHERE experto_id = p_user_id AND estado = 'enviada';

  SELECT count(*) INTO v_total_propuestas
  FROM public.propuestas_experto
  WHERE experto_id = p_user_id AND estado <> 'retirada';

  SELECT count(*) INTO v_ganadas
  FROM public.propuestas_experto
  WHERE experto_id = p_user_id AND estado = 'ganadora';

  SELECT COALESCE(SUM(monto_neto), 0) INTO v_ingresos_mes
  FROM public.liquidaciones_experto
  WHERE experto_id = p_user_id
    AND estado = 'pagada'
    AND fecha_pago >= date_trunc('month', now());

  RETURN jsonb_build_object(
    'ordenes_activas', COALESCE(v_ordenes_activas, 0),
    'propuestas_pendientes', COALESCE(v_propuestas_pendientes, 0),
    'tasa_adjudicacion_pct', CASE
      WHEN v_total_propuestas > 0 THEN ROUND((v_ganadas::numeric / v_total_propuestas) * 100, 1)
      ELSE NULL END,
    'propuestas_ganadas', COALESCE(v_ganadas, 0),
    'ingresos_mes', COALESCE(v_ingresos_mes, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resumen_panel_experto(uuid) TO authenticated;

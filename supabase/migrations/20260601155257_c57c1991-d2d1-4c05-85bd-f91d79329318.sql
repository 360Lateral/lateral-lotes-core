CREATE OR REPLACE FUNCTION public.obtener_resumen_financiero(
  p_desde date DEFAULT NULL,
  p_hasta date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_admin boolean;
  v_desde timestamptz := COALESCE(p_desde, '1900-01-01')::timestamptz;
  v_hasta timestamptz := COALESCE(p_hasta, '2999-12-31')::timestamptz;
  v_diag_ingresos numeric;
  v_diag_count int;
  v_exp_pagado numeric;
  v_exp_pendiente numeric;
  v_exp_fee numeric;
  v_exp_count int;
  v_ventas_count int;
  v_ventas_valor numeric;
  v_ventas_fee numeric;
  v_com_pagado numeric;
  v_com_pendiente numeric;
  v_com_count int;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RAISE EXCEPTION 'Solo admin/super_admin pueden ver el resumen financiero';
  END IF;

  SELECT COALESCE(SUM(monto_cop),0), COUNT(*)
    INTO v_diag_ingresos, v_diag_count
    FROM public.transacciones
   WHERE estado = 'aprobada'
     AND COALESCE(fecha_aprobacion, fecha_creacion) BETWEEN v_desde AND v_hasta;

  SELECT
    COALESCE(SUM(monto_neto) FILTER (WHERE estado='pagada'), 0),
    COALESCE(SUM(monto_neto) FILTER (WHERE estado='pendiente'), 0),
    COALESCE(SUM(fee_monto), 0),
    COUNT(*)
    INTO v_exp_pagado, v_exp_pendiente, v_exp_fee, v_exp_count
    FROM public.liquidaciones_experto
   WHERE fecha_generacion BETWEEN v_desde AND v_hasta;

  SELECT COUNT(*), COALESCE(SUM(precio_venta_final),0), COALESCE(SUM(fee_360_monto),0)
    INTO v_ventas_count, v_ventas_valor, v_ventas_fee
    FROM public.negociaciones
   WHERE estado = 'concretada'
     AND fecha_cierre BETWEEN v_desde AND v_hasta;

  SELECT
    COALESCE(SUM(comision_monto) FILTER (WHERE estado='pagada'),0),
    COALESCE(SUM(comision_monto) FILTER (WHERE estado='pendiente'),0),
    COUNT(*)
    INTO v_com_pagado, v_com_pendiente, v_com_count
    FROM public.comisiones_venta
   WHERE fecha_generacion BETWEEN v_desde AND v_hasta;

  RETURN jsonb_build_object(
    'diagnosticos', jsonb_build_object(
      'ingresos', v_diag_ingresos,
      'num_transacciones', v_diag_count
    ),
    'expertos', jsonb_build_object(
      'pagado', v_exp_pagado,
      'pendiente', v_exp_pendiente,
      'fee_retenido_360', v_exp_fee,
      'num_liquidaciones', v_exp_count
    ),
    'ventas', jsonb_build_object(
      'num_ventas', v_ventas_count,
      'valor_transado', v_ventas_valor,
      'fee_360', v_ventas_fee
    ),
    'comisiones', jsonb_build_object(
      'pagado', v_com_pagado,
      'pendiente', v_com_pendiente,
      'num', v_com_count
    ),
    'balance', jsonb_build_object(
      'entradas', v_diag_ingresos + v_ventas_fee,
      'salidas_pagadas', v_exp_pagado + v_com_pagado,
      'pendiente_por_pagar', v_exp_pendiente + v_com_pendiente,
      'margen_diagnosticos', v_diag_ingresos - (v_exp_pagado + v_exp_pendiente)
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_resumen_financiero(date, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.obtener_tendencia_financiera(
  p_meses int DEFAULT 12
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_admin boolean;
  v_resultado jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RAISE EXCEPTION 'Solo admin/super_admin pueden ver la tendencia financiera';
  END IF;

  WITH meses AS (
    SELECT to_char(date_trunc('month', (CURRENT_DATE - (n || ' months')::interval)), 'YYYY-MM') AS mes
    FROM generate_series(0, GREATEST(p_meses - 1, 0)) n
  ),
  diag AS (
    SELECT to_char(date_trunc('month', COALESCE(fecha_aprobacion, fecha_creacion)), 'YYYY-MM') AS mes,
           SUM(monto_cop) AS ingresos
      FROM public.transacciones WHERE estado='aprobada'
     GROUP BY 1
  ),
  vts AS (
    SELECT to_char(date_trunc('month', fecha_cierre), 'YYYY-MM') AS mes,
           SUM(fee_360_monto) AS fee_ventas, SUM(precio_venta_final) AS valor
      FROM public.negociaciones WHERE estado='concretada'
     GROUP BY 1
  ),
  exp AS (
    SELECT to_char(date_trunc('month', fecha_generacion), 'YYYY-MM') AS mes,
           SUM(monto_neto) AS pagos_expertos
      FROM public.liquidaciones_experto
     GROUP BY 1
  ),
  com AS (
    SELECT to_char(date_trunc('month', fecha_generacion), 'YYYY-MM') AS mes,
           SUM(comision_monto) AS comisiones
      FROM public.comisiones_venta
     GROUP BY 1
  )
  SELECT jsonb_agg(jsonb_build_object(
    'mes', m.mes,
    'ingresos_diagnostico', COALESCE(diag.ingresos, 0),
    'fee_ventas', COALESCE(vts.fee_ventas, 0),
    'valor_transado', COALESCE(vts.valor, 0),
    'pagos_expertos', COALESCE(exp.pagos_expertos, 0),
    'comisiones', COALESCE(com.comisiones, 0)
  ) ORDER BY m.mes)
  INTO v_resultado
  FROM meses m
  LEFT JOIN diag ON diag.mes = m.mes
  LEFT JOIN vts  ON vts.mes = m.mes
  LEFT JOIN exp  ON exp.mes = m.mes
  LEFT JOIN com  ON com.mes = m.mes;

  RETURN COALESCE(v_resultado, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_tendencia_financiera(int) TO authenticated;
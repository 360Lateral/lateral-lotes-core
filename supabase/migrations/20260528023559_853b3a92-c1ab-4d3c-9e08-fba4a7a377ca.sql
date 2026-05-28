
CREATE OR REPLACE FUNCTION public.activar_engagement_post_pago(
  p_transaccion_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaccion   record;
  v_engagement    record;
  v_plan          record;
  v_sla_objetivo  timestamptz;
  v_nombre_lote   text;
BEGIN
  SELECT * INTO v_transaccion FROM public.transacciones WHERE id = p_transaccion_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transacción no encontrada: %', p_transaccion_id;
  END IF;

  SELECT * INTO v_engagement FROM public.engagements_lote WHERE id = v_transaccion.engagement_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement no encontrado: %', v_transaccion.engagement_id;
  END IF;

  IF v_engagement.estado_activacion = 'activo' THEN
    RETURN;
  END IF;

  IF v_engagement.estado_activacion NOT IN ('borrador','pendiente_pago') THEN
    RAISE EXCEPTION 'No se puede activar engagement en estado %', v_engagement.estado_activacion;
  END IF;

  IF v_engagement.plan_id IS NULL THEN
    RAISE EXCEPTION 'Engagement sin plan asignado';
  END IF;

  SELECT * INTO v_plan FROM public.planes_diagnostico WHERE id = v_engagement.plan_id;

  v_sla_objetivo := now() + (COALESCE(v_plan.dias_sla, 0) || ' days')::interval;

  INSERT INTO public.tareas_analisis (
    engagement_id, tipo_analisis_id, estado, fecha_objetivo
  )
  SELECT v_engagement.id, pa.tipo_analisis_id, 'pendiente'::estado_analisis, v_sla_objetivo
    FROM public.planes_analisis pa
   WHERE pa.plan_id = v_engagement.plan_id
     AND pa.incluido = true
     AND NOT EXISTS (
       SELECT 1 FROM public.tareas_analisis t
        WHERE t.engagement_id = v_engagement.id
          AND t.tipo_analisis_id = pa.tipo_analisis_id
     );

  UPDATE public.engagements_lote
     SET estado_activacion = 'activo',
         fecha_inicio = COALESCE(fecha_inicio, now()),
         fecha_sla_objetivo = COALESCE(fecha_sla_objetivo, v_sla_objetivo),
         updated_at = now()
   WHERE id = v_engagement.id;

  UPDATE public.transacciones
     SET estado = 'aprobada',
         fecha_aprobacion = COALESCE(fecha_aprobacion, now()),
         updated_at = now()
   WHERE id = p_transaccion_id;

  SELECT nombre_lote INTO v_nombre_lote FROM public.lotes WHERE id = v_engagement.lote_id;

  IF v_transaccion.propietario_id IS NOT NULL THEN
    INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
    VALUES (
      v_transaccion.propietario_id,
      v_engagement.lote_id,
      'pago_aprobado',
      'Tu pago fue aprobado. El diagnóstico inmobiliario del lote "' ||
        COALESCE(v_nombre_lote,'(sin nombre)') ||
        '" arrancó. Te avisaremos cuando esté listo.',
      false
    );
  END IF;

  INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
  SELECT
    ur.user_id,
    v_engagement.lote_id,
    'pago_aprobado_admin',
    'Pago aprobado: engagement del lote "' || COALESCE(v_nombre_lote,'(sin nombre)') ||
      '" pasó a activo. Las tareas se crearon y el SLA arrancó.',
    false
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_admin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.activar_engagement_post_pago(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.marcar_transaccion_fallida(
  p_transaccion_id uuid,
  p_estado_nuevo public.estado_transaccion,
  p_error_msg text DEFAULT NULL,
  p_wompi_status text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaccion  record;
  v_nombre_lote  text;
BEGIN
  SELECT * INTO v_transaccion FROM public.transacciones WHERE id = p_transaccion_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transacción no encontrada';
  END IF;

  UPDATE public.transacciones
     SET estado = p_estado_nuevo,
         error_msg = p_error_msg,
         wompi_status = p_wompi_status,
         updated_at = now()
   WHERE id = p_transaccion_id;

  SELECT l.nombre_lote INTO v_nombre_lote
    FROM public.engagements_lote e
    JOIN public.lotes l ON l.id = e.lote_id
   WHERE e.id = v_transaccion.engagement_id;

  IF v_transaccion.propietario_id IS NOT NULL THEN
    INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
    SELECT
      v_transaccion.propietario_id,
      e.lote_id,
      'pago_fallido',
      'El pago para el diagnóstico del lote "' || COALESCE(v_nombre_lote,'(sin nombre)') ||
        '" no se completó (' || p_estado_nuevo || '). Puedes intentar de nuevo desde el portal.',
      false
     FROM public.engagements_lote e
    WHERE e.id = v_transaccion.engagement_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_transaccion_fallida(uuid, public.estado_transaccion, text, text) TO service_role;

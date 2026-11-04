CREATE OR REPLACE FUNCTION public.activar_engagement_post_pago(p_transaccion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    RAISE EXCEPTION 'Diagnóstico no encontrado: %', v_transaccion.engagement_id;
  END IF;

  IF v_engagement.estado_activacion = 'activo' THEN
    RETURN;
  END IF;

  IF v_engagement.estado_activacion NOT IN ('borrador','pendiente_pago') THEN
    RAISE EXCEPTION 'No se puede activar el diagnóstico en estado %', v_engagement.estado_activacion;
  END IF;

  IF v_engagement.plan_id IS NULL THEN
    RAISE EXCEPTION 'Diagnóstico sin plan asignado';
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
    'Pago aprobado: diagnóstico del lote "' || COALESCE(v_nombre_lote,'(sin nombre)') ||
      '" pasó a activo. Las tareas se crearon y el SLA arrancó.',
    false
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_admin');
END;
$function$;

CREATE OR REPLACE FUNCTION public.detectar_sla_en_riesgo()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_dias INT;
  v_nivel public.nivel_notificacion;
  v_tipo TEXT;
  v_titulo TEXT;
  v_mensaje TEXT;
  v_data JSONB;
  v_destinatario UUID;
  v_count INT := 0;
  v_inserted INT;
BEGIN
  FOR r IN
    SELECT e.id           AS engagement_id,
           e.lote_id,
           e.asesor_asignado_id,
           e.fecha_sla_objetivo,
           l.nombre_lote,
           p.codigo        AS plan_codigo
      FROM public.engagements_lote e
      LEFT JOIN public.lotes l ON l.id = e.lote_id
      LEFT JOIN public.planes_diagnostico p ON p.id = e.plan_id
     WHERE e.estado NOT IN ('entregado','cancelado','cerrado')
       AND e.fecha_sla_objetivo IS NOT NULL
  LOOP
    v_dias := EXTRACT(DAY FROM (r.fecha_sla_objetivo - now()))::int;

    IF v_dias < 0 THEN
      v_nivel := 'rojo';
      v_tipo  := 'sla_rojo';
      v_titulo := 'SLA vencido';
      v_mensaje := 'El diagnóstico del lote ' || COALESCE(r.nombre_lote,'sin nombre') ||
                   ' venció hace ' || ABS(v_dias) || ' días.';
    ELSIF v_dias <= 7 THEN
      v_nivel := 'amarillo';
      v_tipo  := 'sla_amarillo';
      v_titulo := 'SLA próximo a vencer';
      v_mensaje := 'Quedan ' || v_dias || ' días para entregar el diagnóstico del lote ' ||
                   COALESCE(r.nombre_lote,'sin nombre') || '.';
    ELSE
      CONTINUE;
    END IF;

    v_data := jsonb_build_object(
      'engagement_id', r.engagement_id,
      'lote_id', r.lote_id,
      'lote_nombre', r.nombre_lote,
      'plan_codigo', r.plan_codigo,
      'dias_restantes', v_dias,
      'fecha_sla', r.fecha_sla_objetivo
    );

    IF r.asesor_asignado_id IS NOT NULL THEN
      INSERT INTO public.notificaciones_sla(
        destinatario_id, tipo, nivel, titulo, mensaje, entidad_tipo, entidad_id, data
      ) VALUES (
        r.asesor_asignado_id, v_tipo, v_nivel, v_titulo, v_mensaje, 'engagement', r.engagement_id, v_data
      )
      ON CONFLICT (destinatario_id, tipo, entidad_id) DO NOTHING;
      GET DIAGNOSTICS v_inserted = ROW_COUNT;
      v_count := v_count + v_inserted;
    ELSE
      FOR v_destinatario IN
        SELECT DISTINCT ur.user_id
          FROM public.user_roles ur
          JOIN public.perfiles pf ON pf.id = ur.user_id
         WHERE ur.role IN ('admin','super_admin')
      LOOP
        INSERT INTO public.notificaciones_sla(
          destinatario_id, tipo, nivel, titulo, mensaje, entidad_tipo, entidad_id, data
        ) VALUES (
          v_destinatario, v_tipo, v_nivel, v_titulo, v_mensaje, 'engagement', r.engagement_id, v_data
        )
        ON CONFLICT (destinatario_id, tipo, entidad_id) DO NOTHING;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        v_count := v_count + v_inserted;
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$function$;

-- 1) Extender RPC de suscripción: notificar a admins también
CREATE OR REPLACE FUNCTION public.activar_suscripcion_post_pago(p_transaccion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trans record; v_susc record; v_nivel_actual public.nivel_suscripcion;
  v_fecha_fin timestamptz;
BEGIN
  SELECT * INTO v_trans FROM public.transacciones WHERE id = p_transaccion_id;
  IF NOT FOUND OR v_trans.suscripcion_id IS NULL THEN RETURN; END IF;
  SELECT * INTO v_susc FROM public.suscripciones_desarrollador WHERE id = v_trans.suscripcion_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_susc.estado = 'activa' THEN RETURN; END IF;

  v_fecha_fin := now() + (v_susc.periodo_meses || ' months')::interval;

  UPDATE public.suscripciones_desarrollador
     SET estado='activa', fecha_inicio=now(),
         fecha_fin = v_fecha_fin,
         updated_at=now()
   WHERE id = v_susc.id;

  UPDATE public.transacciones
     SET estado='aprobada', fecha_aprobacion=COALESCE(fecha_aprobacion,now()), updated_at=now()
   WHERE id = p_transaccion_id;

  SELECT nivel_suscripcion INTO v_nivel_actual FROM public.perfiles WHERE id = v_susc.desarrollador_id;
  IF v_nivel_actual IS DISTINCT FROM v_susc.nivel THEN
    PERFORM public.cambiar_nivel_suscripcion(v_susc.desarrollador_id, v_susc.nivel, 'Suscripción pagada', 'wompi_webhook');
  END IF;

  -- Notificación al desarrollador
  INSERT INTO public.notificaciones (user_id, tipo, mensaje, leida)
  VALUES (v_susc.desarrollador_id, 'suscripcion_activada',
    'Tu suscripción nivel ' || v_susc.nivel || ' está activa hasta ' ||
    to_char(v_fecha_fin, 'DD/MM/YYYY') || '.', false);

  -- Notificación a admins
  INSERT INTO public.notificaciones (user_id, tipo, mensaje, leida)
  SELECT ur.user_id, 'suscripcion_activada_admin',
    'Nueva suscripción activa: nivel ' || v_susc.nivel || ' por ' || v_susc.periodo_meses || ' meses.',
    false
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_admin');
END;
$function$;

-- 2) Extender RPC de acceso PPV: notificar también a admins
CREATE OR REPLACE FUNCTION public.activar_acceso_lote_post_pago(p_transaccion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trans record; v_acc record; v_dias int; v_nombre_lote text;
BEGIN
  SELECT * INTO v_trans FROM public.transacciones WHERE id = p_transaccion_id;
  IF NOT FOUND OR v_trans.acceso_lote_id IS NULL THEN RETURN; END IF;
  SELECT * INTO v_acc FROM public.accesos_lote WHERE id = v_trans.acceso_lote_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_acc.estado = 'activa' THEN RETURN; END IF;

  SELECT dias_acceso INTO v_dias FROM public.config_payperview WHERE id = 1;

  UPDATE public.accesos_lote
     SET estado='activa', fecha_compra=now(),
         fecha_expiracion = now() + (COALESCE(v_dias,30) || ' days')::interval, updated_at=now()
   WHERE id = v_acc.id;

  UPDATE public.transacciones
     SET estado='aprobada', fecha_aprobacion=COALESCE(fecha_aprobacion,now()), updated_at=now()
   WHERE id = p_transaccion_id;

  SELECT nombre_lote INTO v_nombre_lote FROM public.lotes WHERE id = v_acc.lote_id;

  INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
  VALUES (v_acc.desarrollador_id, v_acc.lote_id, 'acceso_lote_activado',
    'Desbloqueaste el acceso a "' || COALESCE(v_nombre_lote,'(sin nombre)') ||
    '" por ' || COALESCE(v_dias,30) || ' días.', false);

  -- Notificación a admins
  INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
  SELECT ur.user_id, v_acc.lote_id, 'acceso_lote_activado_admin',
    'PPV vendido: lote "' || COALESCE(v_nombre_lote,'(sin nombre)') || '".',
    false
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_admin');
END;
$function$;

-- 3) Nueva función para que admins reintenten una activación fallida
CREATE OR REPLACE FUNCTION public.reintentar_activacion_transaccion(p_transaccion_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trans record;
  v_result jsonb;
BEGIN
  -- Solo admins
  IF NOT public.is_admin_or_experto(auth.uid()) THEN
    RAISE EXCEPTION 'Sin permisos: se requiere rol admin';
  END IF;

  SELECT * INTO v_trans FROM public.transacciones WHERE id = p_transaccion_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transacción no encontrada';
  END IF;

  IF v_trans.wompi_status IS DISTINCT FROM 'APPROVED' AND v_trans.estado <> 'aprobada' THEN
    RAISE EXCEPTION 'La transacción no está aprobada por Wompi (status: %, estado: %)',
      COALESCE(v_trans.wompi_status,'null'), v_trans.estado;
  END IF;

  -- Limpiar error previo
  UPDATE public.transacciones SET error_msg = NULL, updated_at = now()
   WHERE id = p_transaccion_id;

  CASE v_trans.tipo_pago
    WHEN 'diagnostico' THEN
      PERFORM public.activar_engagement_post_pago(p_transaccion_id);
      v_result := jsonb_build_object('tipo','diagnostico','ok',true);
    WHEN 'suscripcion' THEN
      PERFORM public.activar_suscripcion_post_pago(p_transaccion_id);
      v_result := jsonb_build_object('tipo','suscripcion','ok',true);
    WHEN 'pay_per_view' THEN
      PERFORM public.activar_acceso_lote_post_pago(p_transaccion_id);
      v_result := jsonb_build_object('tipo','pay_per_view','ok',true);
    ELSE
      RAISE EXCEPTION 'Tipo de pago desconocido: %', v_trans.tipo_pago;
  END CASE;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  UPDATE public.transacciones SET error_msg = SQLERRM, updated_at = now()
   WHERE id = p_transaccion_id;
  RAISE;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.reintentar_activacion_transaccion(uuid) TO authenticated;

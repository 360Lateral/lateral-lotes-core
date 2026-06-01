
CREATE OR REPLACE FUNCTION public.obtener_transaccion_publica(p_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_trans record;
  v_nombre_lote text;
BEGIN
  IF p_reference IS NULL OR length(trim(p_reference)) = 0 THEN
    RETURN jsonb_build_object('encontrada', false);
  END IF;

  IF p_reference !~ '^(eng|sub|ppv)_[a-f0-9]{12}_[0-9]+$' THEN
    RETURN jsonb_build_object('encontrada', false);
  END IF;

  SELECT id, estado, monto_cop, fecha_creacion, fecha_aprobacion, engagement_id, tipo_pago, suscripcion_id, acceso_lote_id
    INTO v_trans
    FROM public.transacciones
   WHERE wompi_reference = p_reference;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('encontrada', false);
  END IF;

  IF v_trans.engagement_id IS NOT NULL THEN
    SELECT l.nombre_lote INTO v_nombre_lote
      FROM public.engagements_lote e
      JOIN public.lotes l ON l.id = e.lote_id
     WHERE e.id = v_trans.engagement_id;
  ELSIF v_trans.acceso_lote_id IS NOT NULL THEN
    SELECT l.nombre_lote INTO v_nombre_lote
      FROM public.accesos_lote a
      JOIN public.lotes l ON l.id = a.lote_id
     WHERE a.id = v_trans.acceso_lote_id;
  END IF;

  RETURN jsonb_build_object(
    'encontrada', true,
    'id', v_trans.id,
    'estado', v_trans.estado,
    'monto_cop', v_trans.monto_cop,
    'fecha_creacion', v_trans.fecha_creacion,
    'fecha_aprobacion', v_trans.fecha_aprobacion,
    'engagement_id', v_trans.engagement_id,
    'tipo_pago', v_trans.tipo_pago,
    'suscripcion_id', v_trans.suscripcion_id,
    'acceso_lote_id', v_trans.acceso_lote_id,
    'lote_nombre', v_nombre_lote
  );
END;
$function$;

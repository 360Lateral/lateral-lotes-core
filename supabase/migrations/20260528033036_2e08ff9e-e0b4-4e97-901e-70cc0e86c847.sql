CREATE OR REPLACE FUNCTION public.obtener_transaccion_publica(p_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trans record;
  v_nombre_lote text;
BEGIN
  IF p_reference IS NULL OR length(trim(p_reference)) = 0 THEN
    RETURN jsonb_build_object('encontrada', false);
  END IF;

  IF p_reference !~ '^eng_[a-f0-9]{12}_\d+$' THEN
    RETURN jsonb_build_object('encontrada', false);
  END IF;

  SELECT id, estado, monto_cop, fecha_creacion, fecha_aprobacion, engagement_id
    INTO v_trans
    FROM public.transacciones
   WHERE wompi_reference = p_reference;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('encontrada', false);
  END IF;

  SELECT l.nombre_lote INTO v_nombre_lote
    FROM public.engagements_lote e
    JOIN public.lotes l ON l.id = e.lote_id
   WHERE e.id = v_trans.engagement_id;

  RETURN jsonb_build_object(
    'encontrada', true,
    'id', v_trans.id,
    'estado', v_trans.estado,
    'monto_cop', v_trans.monto_cop,
    'fecha_creacion', v_trans.fecha_creacion,
    'fecha_aprobacion', v_trans.fecha_aprobacion,
    'engagement_id', v_trans.engagement_id,
    'lote_nombre', v_nombre_lote
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_transaccion_publica(text) TO anon, authenticated;
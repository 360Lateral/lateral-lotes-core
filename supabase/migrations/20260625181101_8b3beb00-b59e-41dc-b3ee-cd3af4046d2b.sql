
CREATE OR REPLACE VIEW public.vw_lotes_huerfanos_agrupados AS
SELECT
  nombre_propietario,
  COUNT(*)::int AS cantidad_lotes,
  COALESCE(SUM(area_total_m2), 0)::numeric AS area_total_m2,
  SUM(precio_venta_estimado)::numeric AS valoracion_total,
  MIN(created_at) AS primer_lote_creado,
  MAX(created_at) AS ultimo_lote_creado,
  array_agg(id ORDER BY nombre_lote) AS lote_ids,
  array_agg(nombre_lote ORDER BY nombre_lote) AS nombres_lotes
FROM public.lotes
WHERE propietario_id IS NULL
  AND nombre_propietario IS NOT NULL
  AND length(trim(nombre_propietario)) > 0
GROUP BY nombre_propietario
ORDER BY COUNT(*) DESC, MAX(created_at) DESC;

GRANT SELECT ON public.vw_lotes_huerfanos_agrupados TO authenticated;

CREATE OR REPLACE FUNCTION public.asignar_lotes_masivo_a_usuario(
  p_lote_ids uuid[],
  p_usuario_destino_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_destino_email text;
  v_es_propietario boolean;
  v_es_desarrollador boolean;
  v_count_asignados int := 0;
  v_count_total int := COALESCE(array_length(p_lote_ids, 1), 0);
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NOT (public.has_role(v_admin_id, 'admin'::app_role) OR public.has_role(v_admin_id, 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo admins pueden asignar lotes masivamente';
  END IF;

  IF v_count_total = 0 THEN
    RAISE EXCEPTION 'Debes seleccionar al menos un lote';
  END IF;

  SELECT email INTO v_destino_email FROM auth.users WHERE id = p_usuario_destino_id;
  IF v_destino_email IS NULL THEN
    RAISE EXCEPTION 'Usuario destino no encontrado';
  END IF;

  v_es_propietario := public.has_role(p_usuario_destino_id, 'propietario'::app_role);
  v_es_desarrollador := public.has_role(p_usuario_destino_id, 'desarrollador'::app_role);

  IF NOT (v_es_propietario OR v_es_desarrollador) THEN
    RAISE EXCEPTION 'El usuario destino debe ser propietario o desarrollador';
  END IF;

  WITH actualizados AS (
    UPDATE public.lotes
    SET propietario_id = p_usuario_destino_id,
        updated_at = now()
    WHERE id = ANY(p_lote_ids)
      AND propietario_id IS NULL
    RETURNING id
  )
  SELECT COUNT(*)::int INTO v_count_asignados FROM actualizados;

  IF v_count_asignados > 0 THEN
    BEGIN
      INSERT INTO public.notificaciones (
        destinatario_id, titulo, mensaje, link, tipo, created_at
      ) VALUES (
        p_usuario_destino_id,
        'Se te asignaron lotes',
        format('El equipo de 360Lateral te asignó %s lote(s) a tu cuenta', v_count_asignados),
        CASE WHEN v_es_propietario THEN '/portal/portafolio' ELSE '/mi-cuenta' END,
        'lotes_asignados',
        now()
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'count_solicitados', v_count_total,
    'count_asignados', v_count_asignados,
    'count_omitidos', v_count_total - v_count_asignados,
    'usuario_destino_email', v_destino_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.asignar_lotes_masivo_a_usuario(uuid[], uuid) TO authenticated;

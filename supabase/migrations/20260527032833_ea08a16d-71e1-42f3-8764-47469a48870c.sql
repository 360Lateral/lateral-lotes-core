
-- A. Adjudicar propuesta
CREATE OR REPLACE FUNCTION public.adjudicar_propuesta(
  p_orden_id uuid,
  p_propuesta_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid              uuid;
  v_es_admin         boolean;
  v_orden            record;
  v_propuesta        record;
  v_nombre_lote      text;
  v_perdedor         uuid;
BEGIN
  v_uid := auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = v_uid AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RAISE EXCEPTION 'Solo admin/super_admin pueden adjudicar';
  END IF;

  SELECT * INTO v_orden FROM public.ordenes_servicio WHERE id = p_orden_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;
  IF v_orden.estado <> 'abierta' THEN
    RAISE EXCEPTION 'Solo se pueden adjudicar órdenes abiertas (estado actual: %)', v_orden.estado;
  END IF;

  SELECT * INTO v_propuesta FROM public.propuestas_experto
   WHERE id = p_propuesta_id AND orden_id = p_orden_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Propuesta no encontrada o no pertenece a esta orden';
  END IF;
  IF v_propuesta.estado <> 'enviada' THEN
    RAISE EXCEPTION 'Solo se pueden adjudicar propuestas en estado enviada';
  END IF;

  SELECT nombre_lote INTO v_nombre_lote FROM public.lotes WHERE id = v_orden.lote_id;

  UPDATE public.propuestas_experto
     SET estado = 'ganadora', updated_at = now()
   WHERE id = p_propuesta_id;

  UPDATE public.propuestas_experto
     SET estado = 'rechazada', updated_at = now()
   WHERE orden_id = p_orden_id
     AND id <> p_propuesta_id
     AND estado = 'enviada';

  UPDATE public.ordenes_servicio
     SET estado = 'adjudicada',
         ganador_propuesta_id = p_propuesta_id,
         updated_at = now()
   WHERE id = p_orden_id;

  IF v_orden.engagement_id IS NOT NULL THEN
    UPDATE public.tareas_analisis
       SET responsable_id = v_propuesta.experto_id,
           updated_at = now()
     WHERE engagement_id = v_orden.engagement_id
       AND tipo_analisis_id = v_orden.tipo_analisis_id;
  END IF;

  INSERT INTO public.notificaciones (
    user_id, lote_id, tipo, mensaje, leida
  ) VALUES (
    v_propuesta.experto_id,
    v_orden.lote_id,
    'propuesta_ganadora',
    'Tu propuesta fue adjudicada para el lote "' || COALESCE(v_nombre_lote,'(sin nombre)') ||
      '". Ya puedes comenzar el trabajo.',
    false
  );

  FOR v_perdedor IN
    SELECT experto_id FROM public.propuestas_experto
     WHERE orden_id = p_orden_id
       AND id <> p_propuesta_id
       AND estado = 'rechazada'
  LOOP
    INSERT INTO public.notificaciones (
      user_id, lote_id, tipo, mensaje, leida
    ) VALUES (
      v_perdedor,
      v_orden.lote_id,
      'propuesta_rechazada',
      'Tu propuesta para el lote "' || COALESCE(v_nombre_lote,'(sin nombre)') ||
        '" no fue seleccionada esta vez. Sigue postulando.',
      false
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjudicar_propuesta(uuid, uuid) TO authenticated;

-- B. Cancelar orden
CREATE OR REPLACE FUNCTION public.cancelar_orden_servicio(
  p_orden_id uuid,
  p_motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          uuid;
  v_es_admin     boolean;
  v_orden        record;
  v_nombre_lote  text;
  v_postulante   uuid;
BEGIN
  v_uid := auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = v_uid AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RAISE EXCEPTION 'Solo admin/super_admin pueden cancelar órdenes';
  END IF;

  SELECT * INTO v_orden FROM public.ordenes_servicio WHERE id = p_orden_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;

  IF v_orden.estado IN ('completada','cancelada') THEN
    RAISE EXCEPTION 'No se puede cancelar una orden en estado %', v_orden.estado;
  END IF;

  SELECT nombre_lote INTO v_nombre_lote FROM public.lotes WHERE id = v_orden.lote_id;

  UPDATE public.ordenes_servicio
     SET estado = 'cancelada',
         notas_admin = COALESCE(notas_admin, '') ||
           CASE WHEN p_motivo IS NOT NULL
                THEN E'\n[CANCELACIÓN]: ' || p_motivo
                ELSE E'\n[CANCELACIÓN]: sin motivo registrado'
           END,
         updated_at = now()
   WHERE id = p_orden_id;

  FOR v_postulante IN
    SELECT DISTINCT experto_id FROM public.propuestas_experto WHERE orden_id = p_orden_id
  LOOP
    INSERT INTO public.notificaciones (
      user_id, lote_id, tipo, mensaje, leida
    ) VALUES (
      v_postulante,
      v_orden.lote_id,
      'orden_cancelada',
      'La orden de servicio para el lote "' || COALESCE(v_nombre_lote,'(sin nombre)') ||
        '" fue cancelada por 360Lateral' ||
        CASE WHEN p_motivo IS NOT NULL THEN '. Motivo: ' || p_motivo ELSE '.' END,
      false
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancelar_orden_servicio(uuid, text) TO authenticated;

-- C. Trigger completar orden al entregar tarea
CREATE OR REPLACE FUNCTION public.completar_orden_al_entregar_tarea()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado IN ('entregado','aprobado') AND OLD.estado NOT IN ('entregado','aprobado') THEN
    UPDATE public.ordenes_servicio
       SET estado = 'completada',
           updated_at = now()
     WHERE engagement_id = NEW.engagement_id
       AND tipo_analisis_id = NEW.tipo_analisis_id
       AND estado IN ('adjudicada','en_ejecucion');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_completar_orden_al_entregar_tarea ON public.tareas_analisis;
CREATE TRIGGER trg_completar_orden_al_entregar_tarea
  AFTER UPDATE OF estado ON public.tareas_analisis
  FOR EACH ROW EXECUTE FUNCTION public.completar_orden_al_entregar_tarea();

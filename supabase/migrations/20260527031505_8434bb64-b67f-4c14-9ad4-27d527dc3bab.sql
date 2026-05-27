
CREATE OR REPLACE FUNCTION public.notificar_orden_publica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_experto_uid uuid;
  v_nombre_lote text;
  v_nombre_tipo text;
BEGIN
  IF NEW.visibilidad <> 'publica' THEN
    RETURN NEW;
  END IF;

  SELECT nombre_lote INTO v_nombre_lote FROM public.lotes WHERE id = NEW.lote_id;
  SELECT nombre INTO v_nombre_tipo FROM public.tipos_analisis WHERE id = NEW.tipo_analisis_id;

  FOR v_experto_uid IN
    SELECT user_id FROM public.user_roles WHERE role = 'experto'
  LOOP
    INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
    VALUES (
      v_experto_uid,
      NEW.lote_id,
      'orden_servicio_publica',
      'Nueva orden de servicio abierta para análisis "' || COALESCE(v_nombre_tipo, 'desconocido') ||
        '" en lote "' || COALESCE(v_nombre_lote, '(sin nombre)') || '". Postúlate antes del ' ||
        to_char(NEW.fecha_limite_propuestas, 'DD/MM/YYYY'),
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_orden_publica ON public.ordenes_servicio;
CREATE TRIGGER trg_notificar_orden_publica
  AFTER INSERT ON public.ordenes_servicio
  FOR EACH ROW EXECUTE FUNCTION public.notificar_orden_publica();

CREATE OR REPLACE FUNCTION public.notificar_invitacion_orden()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote_id uuid;
  v_tipo_id uuid;
  v_fecha timestamptz;
  v_nombre_lote text;
  v_nombre_tipo text;
BEGIN
  SELECT lote_id, tipo_analisis_id, fecha_limite_propuestas
    INTO v_lote_id, v_tipo_id, v_fecha
    FROM public.ordenes_servicio
   WHERE id = NEW.orden_id;

  SELECT nombre_lote INTO v_nombre_lote FROM public.lotes WHERE id = v_lote_id;
  SELECT nombre INTO v_nombre_tipo FROM public.tipos_analisis WHERE id = v_tipo_id;

  INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
  VALUES (
    NEW.experto_id,
    v_lote_id,
    'orden_servicio_invitacion',
    'Te invitaron a postular para el análisis "' || COALESCE(v_nombre_tipo, 'desconocido') ||
      '" del lote "' || COALESCE(v_nombre_lote, '(sin nombre)') ||
      '". Plazo hasta: ' || to_char(v_fecha, 'DD/MM/YYYY'),
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_invitacion_orden ON public.invitaciones_orden;
CREATE TRIGGER trg_notificar_invitacion_orden
  AFTER INSERT ON public.invitaciones_orden
  FOR EACH ROW EXECUTE FUNCTION public.notificar_invitacion_orden();

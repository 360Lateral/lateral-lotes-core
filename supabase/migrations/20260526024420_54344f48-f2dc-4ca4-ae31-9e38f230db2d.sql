CREATE OR REPLACE FUNCTION public.notificar_admin_solicitud_contacto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_uid uuid;
  v_nombre_lote text;
  v_nombre_dev text;
BEGIN
  SELECT nombre_lote INTO v_nombre_lote
    FROM public.lotes WHERE id = NEW.lote_id;

  SELECT nombre INTO v_nombre_dev
    FROM public.perfiles WHERE id = NEW.desarrollador_id;

  FOR v_admin_uid IN
    SELECT DISTINCT user_id
      FROM public.user_roles
     WHERE role IN ('admin','super_admin')
  LOOP
    INSERT INTO public.notificaciones (
      user_id, lote_id, tipo, mensaje, leida
    ) VALUES (
      v_admin_uid,
      NEW.lote_id,
      'solicitud_contacto',
      COALESCE(v_nombre_dev, 'Un desarrollador') ||
        ' solicitó contactar al propietario del lote "' ||
        COALESCE(v_nombre_lote, '(sin nombre)') || '"',
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_admin_solicitud_contacto ON public.solicitudes_contacto;
CREATE TRIGGER trg_notificar_admin_solicitud_contacto
  AFTER INSERT ON public.solicitudes_contacto
  FOR EACH ROW EXECUTE FUNCTION public.notificar_admin_solicitud_contacto();
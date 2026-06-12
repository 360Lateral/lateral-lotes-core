CREATE OR REPLACE FUNCTION public.notificar_mensaje_asesor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remitente_nombre text;
  v_lote_nombre text;
  v_mensaje_preview text;
BEGIN
  IF NEW.destinatario_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.destinatario_id = NEW.remitente_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.nombre, 'Alguien')
    INTO v_remitente_nombre
    FROM public.perfiles p
   WHERE p.id = NEW.remitente_id;

  SELECT COALESCE(l.nombre_lote, 'lote sin nombre')
    INTO v_lote_nombre
    FROM public.engagements_lote e
    JOIN public.lotes l ON l.id = e.lote_id
   WHERE e.id = NEW.engagement_id;

  v_mensaje_preview := CASE
    WHEN length(NEW.mensaje) > 120 THEN substring(NEW.mensaje from 1 for 117) || '...'
    ELSE NEW.mensaje
  END;

  INSERT INTO public.notificaciones_sla (
    destinatario_id, tipo, nivel, estado, titulo, mensaje, entidad_tipo, entidad_id, data
  ) VALUES (
    NEW.destinatario_id,
    'mensaje_asesor',
    'amarillo'::nivel_notificacion,
    'pendiente'::estado_notificacion,
    COALESCE(v_remitente_nombre, 'Alguien') || ' te envió un mensaje',
    'Sobre ' || COALESCE(v_lote_nombre, 'tu engagement') || ': ' || v_mensaje_preview,
    'mensaje_asesor',
    NEW.id,
    jsonb_build_object(
      'engagement_id', NEW.engagement_id,
      'remitente_id', NEW.remitente_id,
      'tema', NEW.tema
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_mensaje_asesor ON public.mensajes_asesor_engagement;
CREATE TRIGGER trg_notificar_mensaje_asesor
  AFTER INSERT ON public.mensajes_asesor_engagement
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_mensaje_asesor();
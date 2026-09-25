CREATE OR REPLACE FUNCTION public.notificar_respuesta_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_usuario_id uuid;
  v_titulo text;
  v_autor text;
BEGIN
  IF NOT NEW.visible_para_usuario THEN RETURN NEW; END IF;

  SELECT t.usuario_id, t.titulo INTO v_usuario_id, v_titulo
  FROM public.feedback_tickets t WHERE t.id = NEW.ticket_id;

  IF v_usuario_id IS NULL OR NEW.autor_id = v_usuario_id THEN RETURN NEW; END IF;

  SELECT COALESCE(nombre, '360Lateral') INTO v_autor
  FROM public.perfiles WHERE id = NEW.autor_id;

  INSERT INTO public.notificaciones_sla (
    destinatario_id, tipo, nivel, estado, titulo, mensaje,
    entidad_tipo, entidad_id, data
  ) VALUES (
    v_usuario_id,
    'feedback_respuesta',
    'amarillo'::public.nivel_notificacion,
    'pendiente'::public.estado_notificacion,
    COALESCE(v_autor, '360Lateral') || ' respondió a tu feedback',
    v_titulo,
    'feedback_ticket',
    NEW.ticket_id,
    jsonb_build_object('comentario_id', NEW.id)
  );
  RETURN NEW;
END $function$;
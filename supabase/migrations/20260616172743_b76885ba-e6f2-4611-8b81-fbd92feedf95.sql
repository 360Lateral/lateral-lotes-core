CREATE OR REPLACE FUNCTION public.notificar_nuevo_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_autor text;
  v_admin uuid;
BEGIN
  SELECT COALESCE(nombre, 'Usuario') INTO v_autor
  FROM public.perfiles WHERE id = NEW.usuario_id;

  FOR v_admin IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'super_admin')
  LOOP
    INSERT INTO public.notificaciones_sla (
      destinatario_id, tipo, nivel, estado, titulo, mensaje,
      entidad_tipo, entidad_id, data
    ) VALUES (
      v_admin,
      'feedback_nuevo',
      CASE NEW.severidad
        WHEN 'critica' THEN 'rojo'::nivel_notificacion
        WHEN 'alta' THEN 'rojo'::nivel_notificacion
        ELSE 'amarillo'::nivel_notificacion
      END,
      'pendiente'::estado_notificacion,
      'Nuevo feedback: ' || NEW.tipo::text,
      v_autor || ': ' || NEW.titulo,
      'feedback_ticket',
      NEW.id,
      jsonb_build_object('tipo', NEW.tipo, 'severidad', NEW.severidad)
    );
  END LOOP;
  RETURN NEW;
END $function$;
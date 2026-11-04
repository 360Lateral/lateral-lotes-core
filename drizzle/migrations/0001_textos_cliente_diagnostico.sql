CREATE OR REPLACE FUNCTION public.notificar_mensaje_asesor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'Sobre ' || COALESCE(v_lote_nombre, 'tu diagnóstico') || ': ' || v_mensaje_preview,
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
$function$;

CREATE OR REPLACE FUNCTION public.activar_engagement_gratuito(p_engagement_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid              uuid;
  v_es_admin         boolean;
  v_engagement       record;
  v_plan             record;
  v_lote             record;
  v_sla_objetivo     timestamptz;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Debes estar autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = v_uid AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  SELECT * INTO v_engagement FROM public.engagements_lote WHERE id = p_engagement_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Diagnóstico no encontrado';
  END IF;

  SELECT * INTO v_lote FROM public.lotes WHERE id = v_engagement.lote_id;
  IF NOT v_es_admin AND v_lote.propietario_id <> v_uid AND v_engagement.cliente_id <> v_uid THEN
    RAISE EXCEPTION 'No tienes permiso sobre este diagnóstico';
  END IF;

  SELECT * INTO v_plan FROM public.planes_diagnostico WHERE id = v_engagement.plan_id;
  IF v_plan.codigo <> 'gratuito' THEN
    RAISE EXCEPTION 'Esta opción solo activa diagnósticos con plan gratuito';
  END IF;

  IF v_engagement.estado_activacion = 'activo' THEN
    RETURN;
  END IF;

  v_sla_objetivo := now() + (COALESCE(v_plan.dias_sla, 0) || ' days')::interval;

  INSERT INTO public.tareas_analisis (engagement_id, tipo_analisis_id, estado, fecha_objetivo)
  SELECT p_engagement_id, pa.tipo_analisis_id, 'pendiente'::estado_analisis, v_sla_objetivo
    FROM public.planes_analisis pa
   WHERE pa.plan_id = v_engagement.plan_id
     AND pa.incluido = true
     AND NOT EXISTS (
       SELECT 1 FROM public.tareas_analisis t
        WHERE t.engagement_id = p_engagement_id
          AND t.tipo_analisis_id = pa.tipo_analisis_id
     );

  UPDATE public.engagements_lote
     SET estado_activacion = 'activo',
         fecha_inicio = now(),
         fecha_sla_objetivo = v_sla_objetivo,
         updated_at = now()
   WHERE id = p_engagement_id;
END;
$function$;
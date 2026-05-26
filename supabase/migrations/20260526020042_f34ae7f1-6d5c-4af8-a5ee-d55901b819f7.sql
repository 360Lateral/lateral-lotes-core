-- Parte A: trigger BEFORE INSERT normaliza estado_publicacion según rol
CREATE OR REPLACE FUNCTION public.normalizar_estado_publicacion_al_crear()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid()
       AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF NEW.publicado_venta = true THEN
    IF NOT v_es_admin THEN
      NEW.estado_publicacion := 'pendiente_validacion';
    END IF;
  ELSE
    NEW.estado_publicacion := 'aprobado';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalizar_estado_publicacion_al_crear ON public.lotes;
CREATE TRIGGER trg_normalizar_estado_publicacion_al_crear
  BEFORE INSERT ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.normalizar_estado_publicacion_al_crear();

-- Parte B: RPC validar_lote
CREATE OR REPLACE FUNCTION public.validar_lote(
  p_lote_id uuid,
  p_decision text,
  p_notas text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_admin     boolean;
  v_propietario  uuid;
  v_estado_prev  public.estado_publicacion_lote;
  v_nombre_lote  text;
  v_mensaje      text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid()
       AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RAISE EXCEPTION 'Solo admin/super_admin pueden validar lotes';
  END IF;

  IF p_decision NOT IN ('aprobado','rechazado','retirado') THEN
    RAISE EXCEPTION 'Decisión inválida: %', p_decision;
  END IF;

  IF p_decision = 'rechazado' AND (p_notas IS NULL OR length(trim(p_notas)) = 0) THEN
    RAISE EXCEPTION 'Para rechazar se requiere indicar el motivo en notas';
  END IF;

  SELECT propietario_id, estado_publicacion, nombre_lote
    INTO v_propietario, v_estado_prev, v_nombre_lote
    FROM public.lotes
   WHERE id = p_lote_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote no encontrado';
  END IF;

  UPDATE public.lotes
     SET estado_publicacion = p_decision::public.estado_publicacion_lote,
         notas_publicacion = COALESCE(p_notas, notas_publicacion),
         updated_at = now()
   WHERE id = p_lote_id;

  IF v_propietario IS NOT NULL THEN
    v_mensaje := CASE p_decision
      WHEN 'aprobado'  THEN 'Tu lote "' || COALESCE(v_nombre_lote,'(sin nombre)') || '" fue aprobado y ya está visible en el mercado.'
      WHEN 'rechazado' THEN 'Tu lote "' || COALESCE(v_nombre_lote,'(sin nombre)') || '" requiere ajustes. Motivo: ' || COALESCE(p_notas, '—')
      WHEN 'retirado'  THEN 'Tu lote "' || COALESCE(v_nombre_lote,'(sin nombre)') || '" fue retirado del mercado por 360Lateral.'
    END;

    INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
    VALUES (v_propietario, p_lote_id, 'validacion_lote', v_mensaje, false);

    BEGIN
      EXECUTE format(
        'INSERT INTO public.email_queue (destinatario_id, asunto, cuerpo_html, prioridad, estado) VALUES (%L, %L, %L, %L, %L)',
        v_propietario,
        '360Lateral — Estado de tu lote actualizado',
        '<p>Hola,</p><p>El estado de tu lote <b>' || COALESCE(v_nombre_lote,'(sin nombre)') ||
          '</b> cambió a: <b>' || p_decision || '</b>.</p>' ||
          CASE WHEN p_notas IS NOT NULL THEN '<p>Mensaje del equipo 360Lateral: ' || p_notas || '</p>' ELSE '' END ||
          '<p>Ingresa a <a href="https://urbanix360.com/portal">tu portal</a> para más detalles.</p>',
        'normal',
        'pendiente'
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validar_lote(uuid, text, text) TO authenticated;
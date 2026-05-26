
CREATE TABLE IF NOT EXISTS public.audit_nivel_suscripcion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desarrollador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  nivel_anterior public.nivel_suscripcion,
  nivel_nuevo public.nivel_suscripcion NOT NULL,
  cambiado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  motivo text,
  origen text NOT NULL DEFAULT 'admin_manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_nivel_desarrollador
  ON public.audit_nivel_suscripcion(desarrollador_id, created_at DESC);

ALTER TABLE public.audit_nivel_suscripcion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve audit nivel"
  ON public.audit_nivel_suscripcion FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

CREATE POLICY "Desarrollador ve su propio audit"
  ON public.audit_nivel_suscripcion FOR SELECT TO authenticated
  USING (desarrollador_id = auth.uid());

CREATE OR REPLACE FUNCTION public.cambiar_nivel_suscripcion(
  p_desarrollador_id uuid,
  p_nivel_nuevo public.nivel_suscripcion,
  p_motivo text DEFAULT NULL,
  p_origen text DEFAULT 'admin_manual'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid            uuid;
  v_es_admin       boolean;
  v_nivel_anterior public.nivel_suscripcion;
  v_es_dev         boolean;
  v_audit_id       uuid;
BEGIN
  v_uid := auth.uid();

  IF p_origen = 'admin_manual' THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Debes estar autenticado';
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
       WHERE user_id = v_uid
         AND role IN ('admin','super_admin')
    ) INTO v_es_admin;
    IF NOT v_es_admin THEN
      RAISE EXCEPTION 'Solo admin/super_admin pueden cambiar nivel de suscripción';
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = p_desarrollador_id
       AND role = 'desarrollador'
  ) INTO v_es_dev;

  IF NOT v_es_dev THEN
    RAISE EXCEPTION 'Solo se puede cambiar el nivel a usuarios con rol desarrollador';
  END IF;

  SELECT nivel_suscripcion INTO v_nivel_anterior
    FROM public.perfiles
   WHERE id = p_desarrollador_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  IF v_nivel_anterior = p_nivel_nuevo THEN
    RAISE EXCEPTION 'El usuario ya tiene el nivel %', p_nivel_nuevo;
  END IF;

  UPDATE public.perfiles
     SET nivel_suscripcion = p_nivel_nuevo,
         updated_at = now()
   WHERE id = p_desarrollador_id;

  INSERT INTO public.audit_nivel_suscripcion (
    desarrollador_id, nivel_anterior, nivel_nuevo, cambiado_por, motivo, origen
  ) VALUES (
    p_desarrollador_id, v_nivel_anterior, p_nivel_nuevo, v_uid, p_motivo, p_origen
  )
  RETURNING id INTO v_audit_id;

  INSERT INTO public.notificaciones (
    user_id, tipo, mensaje, leida
  ) VALUES (
    p_desarrollador_id,
    'nivel_suscripcion',
    'Tu nivel de suscripción cambió a "' || p_nivel_nuevo || '"' ||
      COALESCE(' — ' || p_motivo, ''),
    false
  );

  RETURN v_audit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cambiar_nivel_suscripcion(uuid, public.nivel_suscripcion, text, text) TO authenticated;

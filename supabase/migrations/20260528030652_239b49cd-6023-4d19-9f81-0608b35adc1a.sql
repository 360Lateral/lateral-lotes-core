
CREATE OR REPLACE FUNCTION public.solicitar_diagnostico(
  p_lote_id uuid,
  p_plan_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid              uuid;
  v_es_admin         boolean;
  v_lote             record;
  v_plan             record;
  v_engagement_id    uuid;
  v_existe           boolean;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Debes estar autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = v_uid AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote no encontrado';
  END IF;

  IF NOT v_es_admin AND v_lote.propietario_id <> v_uid THEN
    RAISE EXCEPTION 'No tienes permiso sobre este lote';
  END IF;

  SELECT * INTO v_plan FROM public.planes_diagnostico WHERE id = p_plan_id AND activo = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan no encontrado o inactivo';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.engagements_lote
     WHERE lote_id = p_lote_id
       AND estado_activacion IN ('borrador','pendiente_pago','activo')
       AND estado NOT IN ('cerrado','cancelado')
  ) INTO v_existe;

  IF v_existe THEN
    RAISE EXCEPTION 'Ya existe un diagnóstico en curso para este lote. Espera a que termine antes de solicitar otro.';
  END IF;

  INSERT INTO public.engagements_lote (
    lote_id, plan_id, cliente_id,
    estado, estado_activacion,
    fecha_solicitud, moneda
  ) VALUES (
    p_lote_id,
    p_plan_id,
    COALESCE(v_lote.propietario_id, v_uid),
    'prospecto',
    'borrador',
    now(),
    COALESCE(v_plan.moneda, 'COP')
  )
  RETURNING id INTO v_engagement_id;

  RETURN v_engagement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.solicitar_diagnostico(uuid, uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.activar_engagement_gratuito(
  p_engagement_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    RAISE EXCEPTION 'Engagement no encontrado';
  END IF;

  SELECT * INTO v_lote FROM public.lotes WHERE id = v_engagement.lote_id;
  IF NOT v_es_admin AND v_lote.propietario_id <> v_uid AND v_engagement.cliente_id <> v_uid THEN
    RAISE EXCEPTION 'No tienes permiso sobre este engagement';
  END IF;

  SELECT * INTO v_plan FROM public.planes_diagnostico WHERE id = v_engagement.plan_id;
  IF v_plan.codigo <> 'gratuito' THEN
    RAISE EXCEPTION 'Esta función solo activa engagements con plan gratuito';
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
$$;

GRANT EXECUTE ON FUNCTION public.activar_engagement_gratuito(uuid) TO authenticated;

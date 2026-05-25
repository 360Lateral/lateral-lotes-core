-- Parte A: refactor crear_engagement
CREATE OR REPLACE FUNCTION public.crear_engagement(
  p_lote_id uuid,
  p_plan_id uuid,
  p_cliente_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan          RECORD;
  v_engagement_id uuid;
  v_es_admin      boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid()
       AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RAISE EXCEPTION 'Solo admin o super_admin pueden crear engagements';
  END IF;

  SELECT id, dias_sla, moneda
    INTO v_plan
    FROM public.planes_diagnostico
   WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan no encontrado: %', p_plan_id;
  END IF;

  INSERT INTO public.engagements_lote (
    lote_id, plan_id, cliente_id, estado, estado_activacion,
    fecha_solicitud, moneda
  ) VALUES (
    p_lote_id, p_plan_id, p_cliente_id, 'prospecto', 'borrador',
    now(), COALESCE(v_plan.moneda, 'COP')
  )
  RETURNING id INTO v_engagement_id;

  RETURN v_engagement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_engagement(uuid, uuid, uuid) TO authenticated;

-- Parte B: nuevo activar_engagement
CREATE OR REPLACE FUNCTION public.activar_engagement(
  p_engagement_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement   RECORD;
  v_plan         RECORD;
  v_sla_objetivo timestamptz;
  v_es_super     boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid()
       AND role = 'super_admin'
  ) INTO v_es_super;

  IF NOT v_es_super THEN
    RAISE EXCEPTION 'Solo super_admin puede activar engagements';
  END IF;

  SELECT id, plan_id, estado_activacion, fecha_inicio
    INTO v_engagement
    FROM public.engagements_lote
   WHERE id = p_engagement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement no encontrado: %', p_engagement_id;
  END IF;

  IF v_engagement.estado_activacion <> 'borrador' THEN
    RAISE EXCEPTION 'Solo se pueden activar engagements en estado borrador (actual: %)', v_engagement.estado_activacion;
  END IF;

  IF v_engagement.plan_id IS NULL THEN
    RAISE EXCEPTION 'El engagement no tiene plan asignado';
  END IF;

  SELECT id, dias_sla
    INTO v_plan
    FROM public.planes_diagnostico
   WHERE id = v_engagement.plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan del engagement no encontrado';
  END IF;

  v_sla_objetivo := now() + (COALESCE(v_plan.dias_sla, 0) || ' days')::interval;

  INSERT INTO public.tareas_analisis (
    engagement_id, tipo_analisis_id, estado, fecha_objetivo
  )
  SELECT p_engagement_id, pa.tipo_analisis_id, 'pendiente'::estado_analisis, v_sla_objetivo
    FROM public.planes_analisis pa
   WHERE pa.plan_id = v_engagement.plan_id
     AND pa.incluido = true;

  UPDATE public.engagements_lote
     SET estado_activacion = 'activo',
         fecha_inicio = now(),
         fecha_sla_objetivo = v_sla_objetivo,
         updated_at = now()
   WHERE id = p_engagement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activar_engagement(uuid) TO authenticated;

-- Parte F (RPC side): filtrar borrador y pendiente_pago para el cliente
CREATE OR REPLACE FUNCTION public.listar_mis_engagements_cliente()
RETURNS TABLE(engagement_id uuid, lote_nombre text, lote_direccion text, lote_ciudad text, plan_nombre text, plan_codigo text, asesor_nombre text, estado estado_engagement, avance_pct numeric, fecha_inicio timestamp with time zone, fecha_sla timestamp with time zone, dias_para_sla integer, mostrar_avance_al_cliente boolean, total_entregables_publicados integer)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    e.id,
    l.nombre_lote,
    l.direccion,
    l.ciudad,
    pd.nombre,
    pd.codigo,
    pf.nombre,
    e.estado,
    e.avance_pct,
    e.fecha_inicio,
    e.fecha_sla_objetivo,
    CASE WHEN e.fecha_sla_objetivo IS NULL THEN NULL
         ELSE EXTRACT(DAY FROM (e.fecha_sla_objetivo - now()))::int END,
    e.mostrar_avance_al_cliente,
    COALESCE((
      SELECT COUNT(*)::int FROM public.entregables_engagement en
      WHERE en.engagement_id = e.id AND en.estado = 'publicado'
    ), 0)
  FROM public.engagements_lote e
  LEFT JOIN public.lotes l ON l.id = e.lote_id
  LEFT JOIN public.planes_diagnostico pd ON pd.id = e.plan_id
  LEFT JOIN public.perfiles pf ON pf.id = e.asesor_asignado_id
  WHERE e.cliente_id = auth.uid()
    AND e.estado_activacion = 'activo'
  ORDER BY e.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.obtener_engagement_para_cliente(p_engagement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_eng RECORD;
  v_result JSONB;
  v_tareas JSONB;
  v_entregables JSONB;
BEGIN
  SELECT e.*, l.nombre_lote, l.direccion, l.ciudad, l.barrio, l.area_total_m2,
         pd.nombre AS plan_nombre, pd.codigo AS plan_codigo,
         pf.nombre AS asesor_nombre, pf.email AS asesor_email
    INTO v_eng
    FROM public.engagements_lote e
    LEFT JOIN public.lotes l ON l.id = e.lote_id
    LEFT JOIN public.planes_diagnostico pd ON pd.id = e.plan_id
    LEFT JOIN public.perfiles pf ON pf.id = e.asesor_asignado_id
   WHERE e.id = p_engagement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement no encontrado';
  END IF;

  IF v_eng.cliente_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF v_eng.estado_activacion <> 'activo' THEN
    RAISE EXCEPTION 'Engagement no disponible';
  END IF;

  IF v_eng.mostrar_avance_al_cliente THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', t.id,
      'tipo_codigo', ta.codigo,
      'tipo_nombre', ta.nombre,
      'estado', t.estado
    ) ORDER BY ta.nombre), '[]'::jsonb)
    INTO v_tareas
    FROM public.tareas_analisis t
    LEFT JOIN public.tipos_analisis ta ON ta.id = t.tipo_analisis_id
    WHERE t.engagement_id = p_engagement_id;
  ELSE
    v_tareas := NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', en.id,
    'tipo', en.tipo,
    'nombre', en.nombre,
    'mime_type', en.mime_type,
    'tamano_bytes', en.tamano_bytes,
    'version', en.version,
    'tiene_archivo', en.storage_path IS NOT NULL,
    'tiene_url_externa', en.url_externa IS NOT NULL,
    'created_at', en.created_at,
    'updated_at', en.updated_at
  ) ORDER BY en.created_at DESC), '[]'::jsonb)
  INTO v_entregables
  FROM public.entregables_engagement en
  WHERE en.engagement_id = p_engagement_id
    AND en.estado = 'publicado';

  v_result := jsonb_build_object(
    'engagement', jsonb_build_object(
      'id', v_eng.id,
      'estado', v_eng.estado,
      'avance_pct', v_eng.avance_pct,
      'fecha_inicio', v_eng.fecha_inicio,
      'fecha_sla', v_eng.fecha_sla_objetivo,
      'created_at', v_eng.created_at
    ),
    'lote', jsonb_build_object(
      'id', v_eng.lote_id,
      'nombre', v_eng.nombre_lote,
      'direccion', v_eng.direccion,
      'ciudad', v_eng.ciudad,
      'barrio', v_eng.barrio,
      'area_total_m2', v_eng.area_total_m2
    ),
    'plan', jsonb_build_object(
      'id', v_eng.plan_id,
      'nombre', v_eng.plan_nombre,
      'codigo', v_eng.plan_codigo
    ),
    'asesor', jsonb_build_object(
      'nombre', v_eng.asesor_nombre,
      'email', v_eng.asesor_email
    ),
    'avance', jsonb_build_object(
      'pct', v_eng.avance_pct,
      'mostrar_detalle', v_eng.mostrar_avance_al_cliente,
      'tareas', v_tareas
    ),
    'entregables_publicados', v_entregables
  );

  RETURN v_result;
END;
$$;
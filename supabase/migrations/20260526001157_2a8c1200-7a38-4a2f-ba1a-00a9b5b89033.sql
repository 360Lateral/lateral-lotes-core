DROP FUNCTION IF EXISTS public.listar_mis_engagements_cliente();

CREATE FUNCTION public.listar_mis_engagements_cliente()
RETURNS TABLE(
  engagement_id uuid,
  lote_nombre text,
  lote_direccion text,
  lote_ciudad text,
  plan_nombre text,
  plan_codigo text,
  asesor_nombre text,
  estado estado_engagement,
  avance_pct numeric,
  fecha_inicio timestamp with time zone,
  fecha_sla timestamp with time zone,
  dias_para_sla integer,
  mostrar_avance_al_cliente boolean,
  total_entregables_publicados integer,
  tiene_diagnostico boolean,
  tiene_presentacion boolean
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
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
    ), 0),
    EXISTS (
      SELECT 1 FROM public.entregables_engagement en
      WHERE en.engagement_id = e.id
        AND en.estado = 'publicado'
        AND en.tipo = 'diagnostico_inmobiliario'
    ),
    EXISTS (
      SELECT 1 FROM public.entregables_engagement en
      WHERE en.engagement_id = e.id
        AND en.estado = 'publicado'
        AND en.tipo = 'presentacion_diagnostico'
    )
  FROM public.engagements_lote e
  LEFT JOIN public.lotes l ON l.id = e.lote_id
  LEFT JOIN public.planes_diagnostico pd ON pd.id = e.plan_id
  LEFT JOIN public.perfiles pf ON pf.id = e.asesor_asignado_id
  WHERE e.cliente_id = auth.uid()
    AND e.estado_activacion = 'activo'
  ORDER BY e.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.obtener_engagement_para_cliente(p_engagement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      'tipo_analisis_id', t.tipo_analisis_id,
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
    'tipo_analisis_id', en.tipo_analisis_id,
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
$function$;
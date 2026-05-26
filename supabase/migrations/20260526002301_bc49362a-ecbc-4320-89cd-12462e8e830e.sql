CREATE OR REPLACE FUNCTION public.importar_engagement_historico(
  p_lote_id uuid,
  p_plan_id uuid,
  p_cliente_id uuid,
  p_asesor_id uuid,
  p_fecha_entrega timestamptz,
  p_link_diagnostico text,
  p_link_presentacion text,
  p_tareas_no_aplica uuid[] DEFAULT '{}',
  p_precio_cobrado numeric DEFAULT NULL,
  p_notas text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_id uuid;
  v_es_super      boolean;
  v_plan          RECORD;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid()
       AND role = 'super_admin'
  ) INTO v_es_super;

  IF NOT v_es_super THEN
    RAISE EXCEPTION 'Solo super_admin puede importar engagements históricos';
  END IF;

  IF p_lote_id IS NULL THEN RAISE EXCEPTION 'lote_id requerido'; END IF;
  IF p_plan_id IS NULL THEN RAISE EXCEPTION 'plan_id requerido'; END IF;
  IF p_fecha_entrega IS NULL THEN RAISE EXCEPTION 'fecha_entrega requerida'; END IF;
  IF p_link_diagnostico IS NULL OR NOT p_link_diagnostico ~* '^https://' THEN
    RAISE EXCEPTION 'link_diagnostico debe ser una URL https válida';
  END IF;
  IF p_link_presentacion IS NULL OR NOT p_link_presentacion ~* '^https://' THEN
    RAISE EXCEPTION 'link_presentacion debe ser una URL https válida';
  END IF;

  SELECT id, dias_sla, moneda
    INTO v_plan
    FROM public.planes_diagnostico
   WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan no encontrado';
  END IF;

  INSERT INTO public.engagements_lote (
    lote_id, plan_id, cliente_id, asesor_asignado_id,
    estado, estado_activacion,
    fecha_solicitud, fecha_inicio, fecha_sla_objetivo, fecha_entrega,
    precio_cobrado, moneda, notas
  ) VALUES (
    p_lote_id, p_plan_id, p_cliente_id, p_asesor_id,
    'prospecto', 'activo',
    p_fecha_entrega, p_fecha_entrega, p_fecha_entrega, p_fecha_entrega,
    p_precio_cobrado, COALESCE(v_plan.moneda, 'COP'), p_notas
  )
  RETURNING id INTO v_engagement_id;

  INSERT INTO public.tareas_analisis (
    engagement_id, tipo_analisis_id, estado,
    fecha_inicio, fecha_objetivo, fecha_completado, responsable_id, avance_pct
  )
  SELECT
    v_engagement_id,
    pa.tipo_analisis_id,
    CASE WHEN pa.tipo_analisis_id = ANY(p_tareas_no_aplica)
         THEN 'no_aplica'::estado_analisis
         ELSE 'entregado'::estado_analisis
    END,
    p_fecha_entrega, p_fecha_entrega, p_fecha_entrega,
    p_asesor_id,
    CASE WHEN pa.tipo_analisis_id = ANY(p_tareas_no_aplica) THEN 0 ELSE 100 END
  FROM public.planes_analisis pa
  WHERE pa.plan_id = p_plan_id
    AND pa.incluido = true;

  INSERT INTO public.entregables_engagement (
    engagement_id, tipo, nombre, url_externa, estado, version, subido_por, notas
  ) VALUES
    (v_engagement_id, 'diagnostico_inmobiliario', 'Diagnóstico Inmobiliario',
     p_link_diagnostico, 'publicado', 1, auth.uid(), 'Importado desde Drive'),
    (v_engagement_id, 'presentacion_diagnostico', 'Presentación del Diagnóstico',
     p_link_presentacion, 'publicado', 1, auth.uid(), 'Importado desde Drive');

  UPDATE public.engagements_lote
     SET estado = 'cerrado',
         updated_at = now()
   WHERE id = v_engagement_id;

  RETURN v_engagement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.importar_engagement_historico(uuid, uuid, uuid, uuid, timestamptz, text, text, uuid[], numeric, text) TO authenticated;
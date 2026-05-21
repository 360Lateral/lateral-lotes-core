
-- 1) crear_engagement
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
  v_plan       RECORD;
  v_engagement_id uuid;
  v_sla_objetivo  timestamptz;
BEGIN
  SELECT id, dias_sla, moneda
    INTO v_plan
    FROM public.planes_diagnostico
   WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan no encontrado: %', p_plan_id;
  END IF;

  v_sla_objetivo := now() + (COALESCE(v_plan.dias_sla, 0) || ' days')::interval;

  INSERT INTO public.engagements_lote (
    lote_id, plan_id, cliente_id, estado,
    fecha_solicitud, fecha_sla_objetivo, moneda
  ) VALUES (
    p_lote_id, p_plan_id, p_cliente_id, 'prospecto',
    now(), v_sla_objetivo, COALESCE(v_plan.moneda, 'COP')
  )
  RETURNING id INTO v_engagement_id;

  INSERT INTO public.tareas_analisis (
    engagement_id, tipo_analisis_id, estado, fecha_objetivo
  )
  SELECT v_engagement_id, pa.tipo_analisis_id, 'pendiente'::estado_analisis, v_sla_objetivo
    FROM public.planes_analisis pa
   WHERE pa.plan_id = p_plan_id
     AND pa.incluido = true;

  RETURN v_engagement_id;
END;
$$;

-- 2) factor_avance_por_estado
CREATE OR REPLACE FUNCTION public.factor_avance_por_estado(p_estado public.estado_analisis)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_estado
    WHEN 'no_aplica'   THEN 0
    WHEN 'pendiente'   THEN 0
    WHEN 'en_progreso' THEN 0.4
    WHEN 'en_revision' THEN 0.7
    WHEN 'aprobado'    THEN 0.9
    WHEN 'rechazado'   THEN 0
    WHEN 'entregado'   THEN 1.0
    ELSE 0
  END::numeric;
$$;

-- 3) Trigger recalcular_avance_engagement
CREATE OR REPLACE FUNCTION public.recalcular_avance_engagement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_id uuid;
  v_plan_id       uuid;
  v_num           numeric;
  v_den           numeric;
  v_avance        numeric;
BEGIN
  v_engagement_id := COALESCE(NEW.engagement_id, OLD.engagement_id);

  SELECT plan_id INTO v_plan_id
    FROM public.engagements_lote
   WHERE id = v_engagement_id;

  SELECT
    COALESCE(SUM(COALESCE(pa.peso_avance, 1.0) * public.factor_avance_por_estado(t.estado)), 0),
    COALESCE(SUM(COALESCE(pa.peso_avance, 1.0)), 0)
  INTO v_num, v_den
  FROM public.tareas_analisis t
  LEFT JOIN public.planes_analisis pa
    ON pa.plan_id = v_plan_id
   AND pa.tipo_analisis_id = t.tipo_analisis_id
  WHERE t.engagement_id = v_engagement_id
    AND t.estado <> 'no_aplica';

  IF v_den > 0 THEN
    v_avance := ROUND((v_num / v_den) * 100);
  ELSE
    v_avance := 0;
  END IF;

  UPDATE public.engagements_lote
     SET avance_pct = v_avance,
         updated_at = now()
   WHERE id = v_engagement_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recalcular_avance_engagement
AFTER INSERT OR UPDATE OR DELETE ON public.tareas_analisis
FOR EACH ROW EXECUTE FUNCTION public.recalcular_avance_engagement();

-- 4) Triggers en tablas analisis_*
-- Función genérica parametrizada por TG_ARGV[0] = código del tipo_analisis
CREATE OR REPLACE FUNCTION public.avanzar_tarea_desde_analisis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_codigo         text := TG_ARGV[0];
  v_tipo_id        uuid;
  v_engagement_id  uuid;
  v_tarea_id       uuid;
  v_estado_actual  public.estado_analisis;
  v_tiene_datos    boolean := false;
  v_row            jsonb;
  v_key            text;
  v_val            jsonb;
BEGIN
  -- Determinar si la fila tiene al menos un dato relevante
  v_row := to_jsonb(NEW);
  FOR v_key, v_val IN SELECT * FROM jsonb_each(v_row) LOOP
    CONTINUE WHEN v_key IN ('id','lote_id','observaciones','updated_at',
                            'completado','completado_at','completado_por');
    IF v_val IS NOT NULL AND v_val <> 'null'::jsonb THEN
      IF jsonb_typeof(v_val) = 'boolean' THEN
        IF (v_val)::text = 'true' THEN
          v_tiene_datos := true; EXIT;
        END IF;
      ELSIF jsonb_typeof(v_val) = 'string' THEN
        IF length(trim(both '"' from v_val::text)) > 0 THEN
          v_tiene_datos := true; EXIT;
        END IF;
      ELSE
        v_tiene_datos := true; EXIT;
      END IF;
    END IF;
  END LOOP;

  IF NOT v_tiene_datos THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_tipo_id FROM public.tipos_analisis WHERE codigo = v_codigo;
  IF v_tipo_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Engagement vigente más reciente para el lote
  SELECT id INTO v_engagement_id
    FROM public.engagements_lote
   WHERE lote_id = NEW.lote_id
     AND estado NOT IN ('cerrado','cancelado')
   ORDER BY created_at DESC
   LIMIT 1;

  IF v_engagement_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, estado INTO v_tarea_id, v_estado_actual
    FROM public.tareas_analisis
   WHERE engagement_id = v_engagement_id
     AND tipo_analisis_id = v_tipo_id;

  IF v_tarea_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_estado_actual IN ('aprobado','entregado') THEN
    RETURN NEW;
  END IF;

  IF v_estado_actual = 'pendiente' THEN
    UPDATE public.tareas_analisis
       SET estado = 'en_progreso',
           link_detalle_id = NEW.id,
           fecha_inicio = COALESCE(fecha_inicio, now()),
           updated_at = now()
     WHERE id = v_tarea_id;
  ELSIF v_estado_actual = 'en_progreso' THEN
    UPDATE public.tareas_analisis
       SET estado = 'en_revision',
           link_detalle_id = NEW.id,
           updated_at = now()
     WHERE id = v_tarea_id;
  ELSE
    UPDATE public.tareas_analisis
       SET link_detalle_id = NEW.id,
           updated_at = now()
     WHERE id = v_tarea_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_avanzar_tarea_juridico
AFTER INSERT OR UPDATE ON public.analisis_juridico
FOR EACH ROW EXECUTE FUNCTION public.avanzar_tarea_desde_analisis('juridico');

CREATE TRIGGER trg_avanzar_tarea_ambiental
AFTER INSERT OR UPDATE ON public.analisis_ambiental
FOR EACH ROW EXECUTE FUNCTION public.avanzar_tarea_desde_analisis('ambiental');

CREATE TRIGGER trg_avanzar_tarea_sspp
AFTER INSERT OR UPDATE ON public.analisis_sspp
FOR EACH ROW EXECUTE FUNCTION public.avanzar_tarea_desde_analisis('sspp');

CREATE TRIGGER trg_avanzar_tarea_geotecnico
AFTER INSERT OR UPDATE ON public.analisis_geotecnico
FOR EACH ROW EXECUTE FUNCTION public.avanzar_tarea_desde_analisis('geotecnico');

CREATE TRIGGER trg_avanzar_tarea_mercado
AFTER INSERT OR UPDATE ON public.analisis_mercado
FOR EACH ROW EXECUTE FUNCTION public.avanzar_tarea_desde_analisis('mercado');

CREATE TRIGGER trg_avanzar_tarea_arquitectonico
AFTER INSERT OR UPDATE ON public.analisis_arquitectonico
FOR EACH ROW EXECUTE FUNCTION public.avanzar_tarea_desde_analisis('arquitectonico');

CREATE TRIGGER trg_avanzar_tarea_financiero
AFTER INSERT OR UPDATE ON public.analisis_financiero
FOR EACH ROW EXECUTE FUNCTION public.avanzar_tarea_desde_analisis('financiero');

-- 5) Permisos
GRANT EXECUTE ON FUNCTION public.crear_engagement(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.factor_avance_por_estado(public.estado_analisis) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalcular_avance_engagement() TO authenticated;

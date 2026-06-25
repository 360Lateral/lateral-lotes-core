
-- ============================================================
-- Sprint 2.A gap-closer: RPC agregado + módulo documentos cliente
-- ============================================================

-- ---------- 1. Tabla: catálogo de documentos requeridos por plan/análisis
CREATE TABLE IF NOT EXISTS public.documentos_requeridos_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.planes_diagnostico(id) ON DELETE CASCADE,
  tipo_analisis_id UUID REFERENCES public.tipos_analisis(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  opcional BOOLEAN NOT NULL DEFAULT FALSE,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_req_plan ON public.documentos_requeridos_plan(plan_id);
CREATE INDEX IF NOT EXISTS idx_docs_req_tipo ON public.documentos_requeridos_plan(tipo_analisis_id);

GRANT SELECT ON public.documentos_requeridos_plan TO authenticated;
GRANT SELECT ON public.documentos_requeridos_plan TO anon;
GRANT ALL ON public.documentos_requeridos_plan TO service_role;

ALTER TABLE public.documentos_requeridos_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catálogo legible por usuarios autenticados"
  ON public.documentos_requeridos_plan
  FOR SELECT
  TO authenticated
  USING (activo = TRUE);

CREATE POLICY "Solo admin gestiona catálogo"
  ON public.documentos_requeridos_plan
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- NOTA: el catálogo inicial debe ser cargado por el equipo desde panel admin.
-- Ejemplo (descomentar y ajustar tipo_analisis_id real cuando 360Lateral defina los docs):
-- INSERT INTO public.documentos_requeridos_plan (plan_id, tipo_analisis_id, nombre, descripcion, opcional, orden)
-- SELECT p.id, ta.id, 'Escritura del lote', 'Documento legal de propiedad', false, 1
-- FROM public.planes_diagnostico p CROSS JOIN public.tipos_analisis ta WHERE ta.codigo = 'juridico';


-- ---------- 2. Tabla: documentos subidos por el cliente
CREATE TABLE IF NOT EXISTS public.documentos_subidos_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements_lote(id) ON DELETE CASCADE,
  requerido_id UUID REFERENCES public.documentos_requeridos_plan(id) ON DELETE SET NULL,
  subido_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archivo_path TEXT NOT NULL,
  archivo_nombre TEXT NOT NULL,
  archivo_size_bytes BIGINT,
  archivo_mime TEXT,
  estado_validacion TEXT NOT NULL DEFAULT 'pendiente_validacion'
    CHECK (estado_validacion IN ('pendiente_validacion', 'aprobado', 'rechazado')),
  comentario_validacion TEXT,
  validado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_sub_eng ON public.documentos_subidos_engagement(engagement_id);
CREATE INDEX IF NOT EXISTS idx_docs_sub_req ON public.documentos_subidos_engagement(requerido_id);

GRANT SELECT, INSERT ON public.documentos_subidos_engagement TO authenticated;
GRANT ALL ON public.documentos_subidos_engagement TO service_role;

ALTER TABLE public.documentos_subidos_engagement ENABLE ROW LEVEL SECURITY;

-- Cliente del engagement, asesor asignado, admin y super_admin ven los docs
CREATE POLICY "Cliente y equipo ven docs del engagement"
  ON public.documentos_subidos_engagement
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = subido_por
    OR EXISTS (
      SELECT 1 FROM public.engagements_lote e
      WHERE e.id = documentos_subidos_engagement.engagement_id
        AND (e.cliente_id = auth.uid() OR e.asesor_asignado_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Solo cliente dueño del engagement puede subir
CREATE POLICY "Cliente sube docs de su engagement"
  ON public.documentos_subidos_engagement
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = subido_por
    AND EXISTS (
      SELECT 1 FROM public.engagements_lote e
      WHERE e.id = engagement_id AND e.cliente_id = auth.uid()
    )
  );

-- Admin/asesor pueden validar
CREATE POLICY "Equipo valida docs"
  ON public.documentos_subidos_engagement
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.engagements_lote e
      WHERE e.id = documentos_subidos_engagement.engagement_id
        AND e.asesor_asignado_id = auth.uid()
    )
  )
  WITH CHECK (TRUE);

-- ---------- 3. Trigger: notificar al asesor cuando cliente sube doc
CREATE OR REPLACE FUNCTION public.notificar_asesor_doc_subido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asesor_id UUID;
  v_lote_id UUID;
  v_lote_nombre TEXT;
BEGIN
  SELECT e.asesor_asignado_id, l.id, COALESCE(l.nombre_lote, l.direccion, 'sin nombre')
  INTO v_asesor_id, v_lote_id, v_lote_nombre
  FROM public.engagements_lote e
  JOIN public.lotes l ON l.id = e.lote_id
  WHERE e.id = NEW.engagement_id;

  IF v_asesor_id IS NOT NULL THEN
    INSERT INTO public.notificaciones (user_id, lote_id, mensaje, tipo)
    VALUES (
      v_asesor_id,
      v_lote_id,
      format('El cliente subió un documento para el lote "%s"', v_lote_nombre),
      'doc_cliente_subido'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_doc_subido ON public.documentos_subidos_engagement;
CREATE TRIGGER trg_notificar_doc_subido
AFTER INSERT ON public.documentos_subidos_engagement
FOR EACH ROW EXECUTE FUNCTION public.notificar_asesor_doc_subido();


-- ---------- 4. RPC agregado: resumen de engagements del cliente
CREATE OR REPLACE FUNCTION public.obtener_resumen_engagements_cliente()
RETURNS TABLE (
  engagement_id UUID,
  lote_id UUID,
  plan_id UUID,
  plan_codigo TEXT,
  plan_nombre TEXT,
  estado TEXT,
  estado_activacion TEXT,
  avance_pct NUMERIC,
  fecha_inicio TIMESTAMPTZ,
  fecha_sla_objetivo TIMESTAMPTZ,
  fecha_entrega TIMESTAMPTZ,
  publicado_venta BOOLEAN,
  lote_nombre TEXT,
  lote_direccion TEXT,
  lote_ciudad TEXT,
  lote_foto_url TEXT,
  lote_lat NUMERIC,
  lote_lng NUMERIC,
  analisis_totales_plan INTEGER,
  analisis_completados INTEGER,
  analisis_en_progreso INTEGER,
  analisis_pendientes INTEGER,
  score_promedio NUMERIC,
  score_viabilidad NUMERIC,
  valoracion_estimada NUMERIC,
  documentos_pendientes_count INTEGER,
  dias_sla INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      e.id AS engagement_id,
      e.lote_id,
      e.plan_id,
      pd.codigo AS plan_codigo,
      pd.nombre AS plan_nombre,
      e.estado::TEXT AS estado,
      e.estado_activacion::TEXT AS estado_activacion,
      COALESCE(e.avance_pct, 0)::NUMERIC AS avance_pct,
      e.fecha_inicio,
      e.fecha_sla_objetivo,
      e.fecha_entrega,
      COALESCE(l.publicado_venta, FALSE) AS publicado_venta,
      l.nombre_lote AS lote_nombre,
      l.direccion AS lote_direccion,
      l.ciudad AS lote_ciudad,
      l.foto_url AS lote_foto_url,
      l.lat AS lote_lat,
      l.lng AS lote_lng,
      l.score_juridico, l.score_ambiental, l.score_normativo,
      l.score_arquitectonico, l.score_financiero, l.score_geotecnico,
      l.score_mercado, l.score_servicios,
      e.created_at
    FROM public.engagements_lote e
    JOIN public.lotes l ON l.id = e.lote_id
    LEFT JOIN public.planes_diagnostico pd ON pd.id = e.plan_id
    WHERE e.cliente_id = auth.uid()
  )
  SELECT
    b.engagement_id, b.lote_id, b.plan_id, b.plan_codigo, b.plan_nombre,
    b.estado, b.estado_activacion, b.avance_pct,
    b.fecha_inicio, b.fecha_sla_objetivo, b.fecha_entrega, b.publicado_venta,
    b.lote_nombre, b.lote_direccion, b.lote_ciudad, b.lote_foto_url, b.lote_lat, b.lote_lng,

    -- Totales del plan
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.planes_analisis pa
      WHERE pa.plan_id = b.plan_id AND pa.incluido = TRUE
    ), 0) AS analisis_totales_plan,

    -- Completados (entregado/aprobado)
    COALESCE((
      SELECT COUNT(*)::INTEGER FROM public.tareas_analisis t
      WHERE t.engagement_id = b.engagement_id AND t.estado IN ('entregado','aprobado')
    ), 0) AS analisis_completados,

    -- En progreso (en_progreso/en_revision)
    COALESCE((
      SELECT COUNT(*)::INTEGER FROM public.tareas_analisis t
      WHERE t.engagement_id = b.engagement_id AND t.estado IN ('en_progreso','en_revision')
    ), 0) AS analisis_en_progreso,

    -- Pendientes
    COALESCE((
      SELECT COUNT(*)::INTEGER FROM public.tareas_analisis t
      WHERE t.engagement_id = b.engagement_id AND t.estado = 'pendiente'
    ), 0) AS analisis_pendientes,

    -- Score promedio (solo si entregado) — replica useAnalisisUnificadoEngagement: avg de scores no nulos
    CASE WHEN b.estado = 'entregado' THEN (
      SELECT NULLIF(AVG(s)::NUMERIC, 0)
      FROM unnest(ARRAY[
        b.score_juridico, b.score_ambiental, b.score_normativo, b.score_arquitectonico,
        b.score_financiero, b.score_geotecnico, b.score_mercado, b.score_servicios
      ]) AS s WHERE s IS NOT NULL
    ) ELSE NULL END AS score_promedio,

    -- score_viabilidad = mismo promedio (virtual, igual que el hook)
    CASE WHEN b.estado = 'entregado' THEN (
      SELECT NULLIF(AVG(s)::NUMERIC, 0)
      FROM unnest(ARRAY[
        b.score_juridico, b.score_ambiental, b.score_normativo, b.score_arquitectonico,
        b.score_financiero, b.score_geotecnico, b.score_mercado, b.score_servicios
      ]) AS s WHERE s IS NOT NULL
    ) ELSE NULL END AS score_viabilidad,

    -- Valoración: precio_estimado_promedio del análisis financiero
    CASE WHEN b.estado = 'entregado' THEN (
      SELECT af.precio_estimado_promedio
      FROM public.analisis_financiero af
      WHERE af.lote_id = b.lote_id
      ORDER BY af.updated_at DESC NULLS LAST
      LIMIT 1
    ) ELSE NULL END AS valoracion_estimada,

    -- Documentos pendientes (catálogo del plan - subidos)
    GREATEST(0, COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.documentos_requeridos_plan dr
      WHERE dr.plan_id = b.plan_id AND dr.activo = TRUE AND dr.opcional = FALSE
    ), 0) - COALESCE((
      SELECT COUNT(DISTINCT ds.requerido_id)::INTEGER
      FROM public.documentos_subidos_engagement ds
      WHERE ds.engagement_id = b.engagement_id AND ds.requerido_id IS NOT NULL
    ), 0)) AS documentos_pendientes_count,

    CASE WHEN b.fecha_sla_objetivo IS NULL THEN NULL
         ELSE EXTRACT(DAY FROM (b.fecha_sla_objetivo - NOW()))::INTEGER END AS dias_sla

  FROM base b
  ORDER BY b.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_resumen_engagements_cliente() TO authenticated;

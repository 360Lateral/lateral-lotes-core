
-- ============================================================
-- Parte A: visibilidad de avance al cliente
-- ============================================================
ALTER TABLE public.engagements_lote
  ADD COLUMN IF NOT EXISTS mostrar_avance_al_cliente BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- Parte B: tabla de entregables
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.tipo_entregable AS ENUM (
    'informe_final_pdf',
    'presentacion_gamma',
    'informe_area',
    'documento_soporte',
    'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_entregable AS ENUM ('borrador','publicado','archivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- set_updated_at function (create if missing)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.entregables_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements_lote(id) ON DELETE CASCADE,
  tipo public.tipo_entregable NOT NULL,
  nombre TEXT NOT NULL,
  storage_path TEXT,
  url_externa TEXT,
  mime_type TEXT,
  tamano_bytes BIGINT,
  estado public.estado_entregable NOT NULL DEFAULT 'borrador',
  version INT NOT NULL DEFAULT 1,
  subido_por UUID REFERENCES public.perfiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_path_o_url CHECK (
    (storage_path IS NOT NULL AND url_externa IS NULL) OR
    (storage_path IS NULL AND url_externa IS NOT NULL)
  )
);

ALTER TABLE public.entregables_engagement ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_entregables_engagement
  ON public.entregables_engagement(engagement_id);

CREATE INDEX IF NOT EXISTS idx_entregables_publicados
  ON public.entregables_engagement(engagement_id, estado)
  WHERE estado = 'publicado';

DROP TRIGGER IF EXISTS trg_entregables_updated_at ON public.entregables_engagement;
CREATE TRIGGER trg_entregables_updated_at
  BEFORE UPDATE ON public.entregables_engagement
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Parte C: RLS de entregables
-- ============================================================
DROP POLICY IF EXISTS "Asesor admin ve entregables" ON public.entregables_engagement;
CREATE POLICY "Asesor admin ve entregables" ON public.entregables_engagement
  FOR SELECT TO authenticated
  USING (public.is_admin_or_asesor(auth.uid()));

DROP POLICY IF EXISTS "Cliente ve sus entregables publicados" ON public.entregables_engagement;
CREATE POLICY "Cliente ve sus entregables publicados" ON public.entregables_engagement
  FOR SELECT TO authenticated
  USING (
    estado = 'publicado'
    AND engagement_id IN (
      SELECT id FROM public.engagements_lote WHERE cliente_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Asesor admin inserta entregables" ON public.entregables_engagement;
CREATE POLICY "Asesor admin inserta entregables" ON public.entregables_engagement
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_asesor(auth.uid()));

DROP POLICY IF EXISTS "Asesor admin actualiza entregables" ON public.entregables_engagement;
CREATE POLICY "Asesor admin actualiza entregables" ON public.entregables_engagement
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_asesor(auth.uid()))
  WITH CHECK (public.is_admin_or_asesor(auth.uid()));

DROP POLICY IF EXISTS "Super admin borra entregables" ON public.entregables_engagement;
CREATE POLICY "Super admin borra entregables" ON public.entregables_engagement
  FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- ============================================================
-- Parte D: Bucket Storage + policies
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('entregables-clientes','entregables-clientes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Asesor admin sube entregables" ON storage.objects;
CREATE POLICY "Asesor admin sube entregables" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'entregables-clientes'
    AND public.is_admin_or_asesor(auth.uid())
  );

DROP POLICY IF EXISTS "Asesor admin ve entregables storage" ON storage.objects;
CREATE POLICY "Asesor admin ve entregables storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'entregables-clientes'
    AND public.is_admin_or_asesor(auth.uid())
  );

DROP POLICY IF EXISTS "Cliente ve sus entregables storage" ON storage.objects;
CREATE POLICY "Cliente ve sus entregables storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'entregables-clientes'
    AND EXISTS (
      SELECT 1 FROM public.entregables_engagement e
      JOIN public.engagements_lote eg ON eg.id = e.engagement_id
      WHERE e.storage_path = storage.objects.name
        AND e.estado = 'publicado'
        AND eg.cliente_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Asesor admin borra entregables storage" ON storage.objects;
CREATE POLICY "Asesor admin borra entregables storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'entregables-clientes'
    AND public.is_admin_or_asesor(auth.uid())
  );

DROP POLICY IF EXISTS "Asesor admin actualiza entregables storage" ON storage.objects;
CREATE POLICY "Asesor admin actualiza entregables storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'entregables-clientes'
    AND public.is_admin_or_asesor(auth.uid())
  );

-- ============================================================
-- Parte E: Funciones para el portal del cliente
-- ============================================================

-- 11) listar_mis_engagements_cliente
CREATE OR REPLACE FUNCTION public.listar_mis_engagements_cliente()
RETURNS TABLE(
  engagement_id UUID,
  lote_nombre TEXT,
  lote_direccion TEXT,
  lote_ciudad TEXT,
  plan_nombre TEXT,
  plan_codigo TEXT,
  asesor_nombre TEXT,
  estado public.estado_engagement,
  avance_pct NUMERIC,
  fecha_inicio TIMESTAMPTZ,
  fecha_sla TIMESTAMPTZ,
  dias_para_sla INT,
  mostrar_avance_al_cliente BOOLEAN,
  total_entregables_publicados INT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
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
  ORDER BY e.created_at DESC;
$$;

-- 12) obtener_engagement_para_cliente
CREATE OR REPLACE FUNCTION public.obtener_engagement_para_cliente(p_engagement_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 13) firmar_url_entregable
CREATE OR REPLACE FUNCTION public.firmar_url_entregable(
  p_entregable_id UUID,
  p_expira_segundos INT DEFAULT 3600
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, extensions
AS $$
DECLARE
  v_ent RECORD;
  v_eng RECORD;
  v_puede BOOLEAN := false;
  v_signed TEXT;
  v_expira INT;
BEGIN
  v_expira := LEAST(GREATEST(COALESCE(p_expira_segundos, 3600), 60), 3600);

  SELECT * INTO v_ent FROM public.entregables_engagement WHERE id = p_entregable_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entregable no encontrado';
  END IF;

  SELECT * INTO v_eng FROM public.engagements_lote WHERE id = v_ent.engagement_id;

  IF public.is_admin_or_asesor(auth.uid()) THEN
    v_puede := true;
  ELSIF v_ent.estado = 'publicado' AND v_eng.cliente_id = auth.uid() THEN
    v_puede := true;
  END IF;

  IF NOT v_puede THEN
    RAISE EXCEPTION 'No autorizado para ver este entregable';
  END IF;

  IF v_ent.url_externa IS NOT NULL THEN
    RETURN v_ent.url_externa;
  END IF;

  -- Generar signed URL usando la API de storage
  SELECT storage_url INTO v_signed
  FROM storage.create_signed_url('entregables-clientes', v_ent.storage_path, v_expira) AS storage_url;

  RETURN v_signed;
EXCEPTION WHEN undefined_function THEN
  -- Fallback: devolver el path para que el cliente firme via SDK
  RETURN 'storage://entregables-clientes/' || v_ent.storage_path;
END;
$$;

-- ============================================================
-- Parte F: Tests manuales
-- ============================================================
-- TEST después de subir manualmente un entregable de prueba:
-- SELECT * FROM public.listar_mis_engagements_cliente();
-- SELECT public.obtener_engagement_para_cliente('<engagement-id>');
-- SELECT public.firmar_url_entregable('<entregable-id>');

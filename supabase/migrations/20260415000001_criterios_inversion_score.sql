-- =============================================
-- Criterios de Inversión + Score de Match
-- Inspirado en Nodo Eafit / Análisis de Lotes
-- =============================================

-- 1. Ampliar tabla alertas con campos de criterios avanzados
ALTER TABLE public.alertas
  ADD COLUMN IF NOT EXISTS nombre TEXT,
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS presupuesto_min BIGINT,
  ADD COLUMN IF NOT EXISTS presupuesto_max BIGINT,
  ADD COLUMN IF NOT EXISTS tratamientos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estratos INT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived'));

-- 2. Tabla criteria_matches: registra lotes que coinciden con cada alerta y su score
CREATE TABLE IF NOT EXISTS public.criteria_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alerta_id UUID NOT NULL REFERENCES public.alertas(id) ON DELETE CASCADE,
  lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  detalles JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(alerta_id, lote_id)
);
ALTER TABLE public.criteria_matches ENABLE ROW LEVEL SECURITY;

-- El developer solo ve los matches de sus propias alertas
CREATE POLICY "Dev ve sus matches" ON public.criteria_matches
  FOR SELECT TO authenticated
  USING (
    alerta_id IN (
      SELECT id FROM public.alertas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dev inserta sus matches" ON public.criteria_matches
  FOR INSERT TO authenticated
  WITH CHECK (
    alerta_id IN (
      SELECT id FROM public.alertas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dev borra sus matches" ON public.criteria_matches
  FOR DELETE TO authenticated
  USING (
    alerta_id IN (
      SELECT id FROM public.alertas WHERE user_id = auth.uid()
    )
  );

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_criteria_matches_alerta_score
  ON public.criteria_matches(alerta_id, score DESC);

-- 3. Función: calcula score (0-100) entre una alerta y un lote
CREATE OR REPLACE FUNCTION public.calcular_match_score(
  p_alerta_id UUID,
  p_lote_id   UUID
)
RETURNS TABLE(score INTEGER, detalles JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alerta     RECORD;
  v_lote       RECORD;
  v_normativa  RECORD;
  v_precio     RECORD;
  v_score      INTEGER := 0;
  v_det        JSONB   := '{}';
  v_pts        INTEGER;
BEGIN
  SELECT * INTO v_alerta FROM public.alertas WHERE id = p_alerta_id;
  IF NOT FOUND THEN RETURN QUERY SELECT 0, '{}'::JSONB; RETURN; END IF;

  SELECT * INTO v_lote
    FROM public.lotes
   WHERE id = p_lote_id
     AND estado_disponibilidad = 'Disponible';
  IF NOT FOUND THEN RETURN QUERY SELECT 0, '{}'::JSONB; RETURN; END IF;

  SELECT * INTO v_normativa
    FROM public.normativa_urbana WHERE lote_id = p_lote_id LIMIT 1;

  SELECT * INTO v_precio
    FROM public.precios
   WHERE lote_id = p_lote_id
   ORDER BY vigencia DESC NULLS LAST LIMIT 1;

  -- ── Ciudad (25 pts) ─────────────────────────────────────
  v_pts := 0;
  IF v_alerta.ciudad IS NULL OR trim(v_alerta.ciudad) = ''
     OR lower(v_lote.ciudad) ILIKE '%' || lower(trim(v_alerta.ciudad)) || '%'
  THEN
    v_pts := 25;
  END IF;
  v_score := v_score + v_pts;
  v_det   := v_det || jsonb_build_object('ciudad', v_pts);

  -- ── Área (25 pts) ────────────────────────────────────────
  v_pts := 0;
  IF (v_alerta.area_min IS NULL OR v_lote.area_total_m2 >= v_alerta.area_min)
  AND (v_alerta.area_max IS NULL OR v_lote.area_total_m2 <= v_alerta.area_max)
  THEN
    v_pts := 25;
  END IF;
  v_score := v_score + v_pts;
  v_det   := v_det || jsonb_build_object('area', v_pts);

  -- ── Precio/m² (20 pts) ───────────────────────────────────
  v_pts := 0;
  IF v_alerta.precio_max_m2 IS NULL
     OR v_precio IS NULL
     OR v_precio.precio_m2_cop IS NULL
     OR v_precio.precio_m2_cop <= v_alerta.precio_max_m2
  THEN
    v_pts := 20;
  END IF;
  v_score := v_score + v_pts;
  v_det   := v_det || jsonb_build_object('precio_m2', v_pts);

  -- ── Uso de suelo (15 pts) ────────────────────────────────
  v_pts := 0;
  IF v_alerta.uso_suelo IS NULL
     OR lower(v_alerta.uso_suelo) = 'cualquiera'
     OR v_normativa IS NULL
     OR lower(COALESCE(v_normativa.uso_principal,'')) ILIKE '%' || lower(v_alerta.uso_suelo) || '%'
  THEN
    v_pts := 15;
  END IF;
  v_score := v_score + v_pts;
  v_det   := v_det || jsonb_build_object('uso_suelo', v_pts);

  -- ── Estrato (10 pts) ─────────────────────────────────────
  v_pts := 0;
  IF v_alerta.estratos IS NULL
     OR array_length(v_alerta.estratos, 1) IS NULL
     OR v_lote.estrato IS NULL
     OR v_lote.estrato = ANY(v_alerta.estratos)
  THEN
    v_pts := 10;
  END IF;
  v_score := v_score + v_pts;
  v_det   := v_det || jsonb_build_object('estrato', v_pts);

  -- ── Tratamiento urbanístico (5 pts) ──────────────────────
  v_pts := 0;
  IF v_alerta.tratamientos IS NULL
     OR array_length(v_alerta.tratamientos, 1) IS NULL
     OR v_normativa IS NULL
     OR COALESCE(v_normativa.tratamiento,'') = ANY(v_alerta.tratamientos)
  THEN
    v_pts := 5;
  END IF;
  v_score := v_score + v_pts;
  v_det   := v_det || jsonb_build_object('tratamiento', v_pts);

  RETURN QUERY SELECT v_score, v_det;
END;
$$;

-- 4. Función: recalcula y persiste todos los matches para una alerta
CREATE OR REPLACE FUNCTION public.refresh_matches_alerta(p_alerta_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote   RECORD;
  v_result RECORD;
BEGIN
  DELETE FROM public.criteria_matches WHERE alerta_id = p_alerta_id;

  FOR v_lote IN
    SELECT id FROM public.lotes WHERE estado_disponibilidad = 'Disponible'
  LOOP
    SELECT * INTO v_result
      FROM public.calcular_match_score(p_alerta_id, v_lote.id);

    IF v_result.score > 0 THEN
      INSERT INTO public.criteria_matches(alerta_id, lote_id, score, detalles, calculated_at)
      VALUES (p_alerta_id, v_lote.id, v_result.score, v_result.detalles, now())
      ON CONFLICT (alerta_id, lote_id)
      DO UPDATE SET score = EXCLUDED.score,
                    detalles = EXCLUDED.detalles,
                    calculated_at = now();
    END IF;
  END LOOP;
END;
$$;

-- Parte A: columnas engagement_id + experto_id en las 7 tablas analisis_*
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'analisis_juridico','analisis_ambiental','analisis_sspp',
    'analisis_geotecnico','analisis_mercado','analisis_arquitectonico','analisis_financiero'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS engagement_id uuid REFERENCES public.engagements_lote(id) ON DELETE SET NULL', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS experto_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_engagement ON public.%I(engagement_id)', tbl, tbl);
  END LOOP;
END $$;

-- Parte B: tipo_analisis_id en entregables_engagement
ALTER TABLE public.entregables_engagement
  ADD COLUMN IF NOT EXISTS tipo_analisis_id uuid REFERENCES public.tipos_analisis(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_entregables_tipo_analisis ON public.entregables_engagement(tipo_analisis_id);

-- Parte C: rename enum values tipo_entregable
ALTER TYPE public.tipo_entregable RENAME VALUE 'informe_final_pdf' TO 'diagnostico_inmobiliario';
ALTER TYPE public.tipo_entregable RENAME VALUE 'presentacion_gamma' TO 'presentacion_diagnostico';

-- Parte D: enum estado_activacion + columna
DO $$ BEGIN
  CREATE TYPE public.estado_activacion AS ENUM ('borrador', 'pendiente_pago', 'activo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.engagements_lote
  ADD COLUMN IF NOT EXISTS estado_activacion public.estado_activacion NOT NULL DEFAULT 'activo';

CREATE INDEX IF NOT EXISTS idx_engagements_estado_activacion ON public.engagements_lote(estado_activacion);

-- Parte E: trigger validar_cierre_engagement
CREATE OR REPLACE FUNCTION public.validar_cierre_engagement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tiene_diag boolean;
  v_tiene_pres boolean;
BEGIN
  IF NEW.estado = 'cerrado' AND (OLD.estado IS DISTINCT FROM 'cerrado') THEN
    IF NEW.estado_activacion <> 'activo' THEN
      RAISE EXCEPTION 'No se puede cerrar un engagement que no está activo (estado_activacion actual: %)', NEW.estado_activacion;
    END IF;
    SELECT EXISTS(
      SELECT 1 FROM public.entregables_engagement
      WHERE engagement_id = NEW.id
        AND tipo = 'diagnostico_inmobiliario'
        AND estado = 'publicado'
    ) INTO v_tiene_diag;
    SELECT EXISTS(
      SELECT 1 FROM public.entregables_engagement
      WHERE engagement_id = NEW.id
        AND tipo = 'presentacion_diagnostico'
        AND estado = 'publicado'
    ) INTO v_tiene_pres;
    IF NOT v_tiene_diag OR NOT v_tiene_pres THEN
      RAISE EXCEPTION 'Para cerrar el engagement se requieren publicados: Diagnóstico Inmobiliario y Presentación del Diagnóstico';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_cierre_engagement ON public.engagements_lote;
CREATE TRIGGER trg_validar_cierre_engagement
BEFORE UPDATE ON public.engagements_lote
FOR EACH ROW EXECUTE FUNCTION public.validar_cierre_engagement();

-- Parte F: backfill engagement_id
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'analisis_juridico','analisis_ambiental','analisis_sspp',
    'analisis_geotecnico','analisis_mercado','analisis_arquitectonico','analisis_financiero'
  ]) LOOP
    EXECUTE format($f$
      UPDATE public.%I a
         SET engagement_id = sub.engagement_id
        FROM (
          SELECT DISTINCT ON (e.lote_id)
                 e.lote_id, e.id AS engagement_id
            FROM public.engagements_lote e
           WHERE e.estado NOT IN ('cerrado','cancelado')
           ORDER BY e.lote_id, e.created_at DESC
        ) sub
       WHERE a.lote_id = sub.lote_id
         AND a.engagement_id IS NULL
    $f$, tbl);
  END LOOP;
END $$;
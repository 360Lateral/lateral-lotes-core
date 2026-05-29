-- Part A: Enum
DO $$ BEGIN
  CREATE TYPE public.estado_liquidacion AS ENUM ('pendiente','pagada','cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Part B: Table
CREATE TABLE IF NOT EXISTS public.liquidaciones_experto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experto_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
  orden_id uuid REFERENCES public.ordenes_servicio(id) ON DELETE SET NULL,
  engagement_id uuid REFERENCES public.engagements_lote(id) ON DELETE SET NULL,
  tipo_analisis_id uuid REFERENCES public.tipos_analisis(id) ON DELETE SET NULL,
  monto_bruto numeric NOT NULL CHECK (monto_bruto >= 0),
  fee_pct numeric NOT NULL DEFAULT 5 CHECK (fee_pct >= 0 AND fee_pct <= 100),
  fee_monto numeric NOT NULL CHECK (fee_monto >= 0),
  monto_neto numeric NOT NULL CHECK (monto_neto >= 0),
  moneda text NOT NULL DEFAULT 'COP',
  estado public.estado_liquidacion NOT NULL DEFAULT 'pendiente',
  metodo_pago text,
  referencia_pago text,
  pagado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  notas text,
  fecha_generacion timestamptz NOT NULL DEFAULT now(),
  fecha_pago timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (orden_id)
);

CREATE INDEX IF NOT EXISTS idx_liquidaciones_experto ON public.liquidaciones_experto(experto_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_estado ON public.liquidaciones_experto(estado);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_pendientes ON public.liquidaciones_experto(experto_id, estado) WHERE estado = 'pendiente';

GRANT SELECT ON public.liquidaciones_experto TO authenticated;
GRANT ALL ON public.liquidaciones_experto TO service_role;

ALTER TABLE public.liquidaciones_experto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experto ve sus liquidaciones"
  ON public.liquidaciones_experto FOR SELECT TO authenticated
  USING (experto_id = auth.uid());

CREATE POLICY "Admin ve todas las liquidaciones"
  ON public.liquidaciones_experto FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

CREATE TRIGGER trg_liquidaciones_updated_at
  BEFORE UPDATE ON public.liquidaciones_experto
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Part C: Trigger on order completion
CREATE OR REPLACE FUNCTION public.generar_liquidacion_al_completar_orden()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_propuesta  record;
  v_fee_pct    numeric := 5;
  v_fee_monto  numeric;
  v_monto_neto numeric;
BEGIN
  IF NEW.estado = 'completada' AND (OLD.estado IS DISTINCT FROM 'completada') THEN
    IF NEW.ganador_propuesta_id IS NOT NULL THEN
      SELECT * INTO v_propuesta
        FROM public.propuestas_experto
       WHERE id = NEW.ganador_propuesta_id;

      IF FOUND AND NOT EXISTS (
        SELECT 1 FROM public.liquidaciones_experto WHERE orden_id = NEW.id
      ) THEN
        v_fee_monto  := ROUND(v_propuesta.precio_propuesto * v_fee_pct / 100.0);
        v_monto_neto := v_propuesta.precio_propuesto - v_fee_monto;

        INSERT INTO public.liquidaciones_experto (
          experto_id, orden_id, engagement_id, tipo_analisis_id,
          monto_bruto, fee_pct, fee_monto, monto_neto, moneda, estado
        ) VALUES (
          v_propuesta.experto_id, NEW.id, NEW.engagement_id, NEW.tipo_analisis_id,
          v_propuesta.precio_propuesto, v_fee_pct, v_fee_monto, v_monto_neto, 'COP', 'pendiente'
        );

        INSERT INTO public.notificaciones (user_id, tipo, mensaje, leida)
        VALUES (
          v_propuesta.experto_id,
          'liquidacion_generada',
          'Completaste un análisis. Se generó tu liquidación por $' ||
            to_char(v_monto_neto, 'FM999,999,999') || ' (neto, tras fee 5%). 360Lateral procesará el pago.',
          false
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generar_liquidacion_al_completar_orden ON public.ordenes_servicio;
CREATE TRIGGER trg_generar_liquidacion_al_completar_orden
  AFTER UPDATE OF estado ON public.ordenes_servicio
  FOR EACH ROW EXECUTE FUNCTION public.generar_liquidacion_al_completar_orden();

-- Part D: RPC
CREATE OR REPLACE FUNCTION public.marcar_liquidacion_pagada(
  p_liquidacion_id uuid,
  p_metodo_pago text,
  p_referencia_pago text DEFAULT NULL,
  p_notas text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_admin boolean;
  v_liq      record;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RAISE EXCEPTION 'Solo admin/super_admin pueden marcar liquidaciones como pagadas';
  END IF;

  SELECT * INTO v_liq FROM public.liquidaciones_experto WHERE id = p_liquidacion_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Liquidación no encontrada'; END IF;
  IF v_liq.estado = 'pagada' THEN RAISE EXCEPTION 'La liquidación ya está pagada'; END IF;
  IF p_metodo_pago IS NULL OR length(trim(p_metodo_pago)) = 0 THEN
    RAISE EXCEPTION 'Debes indicar el método de pago';
  END IF;

  UPDATE public.liquidaciones_experto
     SET estado = 'pagada',
         metodo_pago = p_metodo_pago,
         referencia_pago = p_referencia_pago,
         notas = COALESCE(p_notas, notas),
         pagado_por = auth.uid(),
         fecha_pago = now(),
         updated_at = now()
   WHERE id = p_liquidacion_id;

  INSERT INTO public.notificaciones (user_id, tipo, mensaje, leida)
  VALUES (
    v_liq.experto_id,
    'liquidacion_pagada',
    '360Lateral procesó el pago de tu liquidación por $' ||
      to_char(v_liq.monto_neto, 'FM999,999,999') || ' vía ' || p_metodo_pago || '.',
    false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_liquidacion_pagada(uuid, text, text, text) TO authenticated;
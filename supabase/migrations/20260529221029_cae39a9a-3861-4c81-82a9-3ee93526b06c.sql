
-- A: extender negociaciones
ALTER TABLE public.negociaciones
  ADD COLUMN IF NOT EXISTS precio_venta_final numeric CHECK (precio_venta_final >= 0),
  ADD COLUMN IF NOT EXISTS fecha_cierre timestamptz,
  ADD COLUMN IF NOT EXISTS fee_360_pct numeric CHECK (fee_360_pct >= 0 AND fee_360_pct <= 100),
  ADD COLUMN IF NOT EXISTS fee_360_monto numeric CHECK (fee_360_monto >= 0),
  ADD COLUMN IF NOT EXISTS comprador_externo text,
  ADD COLUMN IF NOT EXISTS notas_cierre text,
  ADD COLUMN IF NOT EXISTS cerrada_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL;

-- B: enum + tabla
DO $$ BEGIN
  CREATE TYPE public.estado_comision AS ENUM ('pendiente', 'pagada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.comisiones_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacion_id uuid NOT NULL REFERENCES public.negociaciones(id) ON DELETE CASCADE,
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  comisionista_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
  autorizacion_id uuid REFERENCES public.autorizaciones_comisionista(id) ON DELETE SET NULL,
  base_calculo numeric NOT NULL,
  comision_pct numeric NOT NULL,
  comision_monto numeric NOT NULL,
  estado public.estado_comision NOT NULL DEFAULT 'pendiente',
  metodo_pago text,
  referencia_pago text,
  pagada_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  notas text,
  fecha_generacion timestamptz NOT NULL DEFAULT now(),
  fecha_pago timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.comisiones_venta TO authenticated;
GRANT ALL ON public.comisiones_venta TO service_role;

CREATE INDEX IF NOT EXISTS idx_comisiones_comisionista ON public.comisiones_venta(comisionista_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_estado ON public.comisiones_venta(estado);
CREATE INDEX IF NOT EXISTS idx_comisiones_negociacion ON public.comisiones_venta(negociacion_id);

ALTER TABLE public.comisiones_venta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comisionista ve sus comisiones"
  ON public.comisiones_venta FOR SELECT TO authenticated
  USING (comisionista_id = auth.uid());

CREATE POLICY "Admin ve comisiones"
  ON public.comisiones_venta FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

DROP TRIGGER IF EXISTS trg_comisiones_venta_updated_at ON public.comisiones_venta;
CREATE TRIGGER trg_comisiones_venta_updated_at
  BEFORE UPDATE ON public.comisiones_venta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- C: RPC cerrar_venta
CREATE OR REPLACE FUNCTION public.cerrar_venta(
  p_negociacion_id uuid,
  p_precio_venta_final numeric,
  p_fee_360_pct numeric DEFAULT 2,
  p_comprador_externo text DEFAULT NULL,
  p_notas text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_admin    boolean;
  v_neg         record;
  v_fee_monto   numeric;
  v_autoriz     record;
  v_comision    numeric;
  v_nombre_lote text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ) INTO v_es_admin;
  IF NOT v_es_admin THEN
    RAISE EXCEPTION 'Solo admin/super_admin pueden cerrar ventas';
  END IF;

  SELECT * INTO v_neg FROM public.negociaciones WHERE id = p_negociacion_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Negociación no encontrada'; END IF;
  IF v_neg.estado = 'concretada' THEN RAISE EXCEPTION 'Esta venta ya fue cerrada'; END IF;
  IF p_precio_venta_final IS NULL OR p_precio_venta_final <= 0 THEN
    RAISE EXCEPTION 'El precio de venta final debe ser mayor a 0';
  END IF;

  v_fee_monto := ROUND(p_precio_venta_final * p_fee_360_pct / 100.0);
  SELECT nombre_lote INTO v_nombre_lote FROM public.lotes WHERE id = v_neg.lote_id;

  UPDATE public.negociaciones
     SET estado = 'concretada',
         precio_venta_final = p_precio_venta_final,
         fee_360_pct = p_fee_360_pct,
         fee_360_monto = v_fee_monto,
         comprador_externo = p_comprador_externo,
         notas_cierre = p_notas,
         fecha_cierre = now(),
         cerrada_por = auth.uid()
   WHERE id = p_negociacion_id;

  SELECT * INTO v_autoriz
    FROM public.autorizaciones_comisionista
   WHERE lote_id = v_neg.lote_id
     AND estado = 'activa'
   ORDER BY created_at DESC
   LIMIT 1;

  IF FOUND THEN
    v_comision := ROUND(p_precio_venta_final * v_autoriz.comision_pct / 100.0);
    INSERT INTO public.comisiones_venta (
      negociacion_id, lote_id, comisionista_id, autorizacion_id,
      base_calculo, comision_pct, comision_monto, estado
    ) VALUES (
      p_negociacion_id, v_neg.lote_id, v_autoriz.comisionista_id, v_autoriz.id,
      p_precio_venta_final, v_autoriz.comision_pct, v_comision, 'pendiente'
    );

    INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
    VALUES (
      v_autoriz.comisionista_id, v_neg.lote_id, 'comision_generada',
      'Se cerró la venta del lote "' || COALESCE(v_nombre_lote,'(sin nombre)') ||
        '". Tu comisión de $' || to_char(v_comision,'FM999,999,999') || ' será procesada por 360Lateral.',
      false
    );
  END IF;

  UPDATE public.lotes
     SET publicado_venta = false,
         estado_publicacion = 'retirado',
         updated_at = now()
   WHERE id = v_neg.lote_id;

  INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
  SELECT ur.user_id, v_neg.lote_id, 'venta_cerrada',
    'Venta cerrada: lote "' || COALESCE(v_nombre_lote,'(sin nombre)') || '" por $' ||
      to_char(p_precio_venta_final,'FM999,999,999') || '. Fee 360Lateral: $' || to_char(v_fee_monto,'FM999,999,999') || '.',
    false
  FROM public.user_roles ur WHERE ur.role IN ('admin','super_admin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.cerrar_venta(uuid, numeric, numeric, text, text) TO authenticated;

-- D: RPC marcar_comision_pagada
CREATE OR REPLACE FUNCTION public.marcar_comision_pagada(
  p_comision_id uuid,
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
  v_com record;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','super_admin')) INTO v_es_admin;
  IF NOT v_es_admin THEN RAISE EXCEPTION 'Solo admin/super_admin pueden marcar comisiones pagadas'; END IF;
  SELECT * INTO v_com FROM public.comisiones_venta WHERE id = p_comision_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comisión no encontrada'; END IF;
  IF v_com.estado = 'pagada' THEN RAISE EXCEPTION 'La comisión ya está pagada'; END IF;
  IF p_metodo_pago IS NULL OR length(trim(p_metodo_pago))=0 THEN RAISE EXCEPTION 'Indica el método de pago'; END IF;

  UPDATE public.comisiones_venta
     SET estado='pagada', metodo_pago=p_metodo_pago, referencia_pago=p_referencia_pago,
         notas=COALESCE(p_notas,notas), pagada_por=auth.uid(), fecha_pago=now(), updated_at=now()
   WHERE id = p_comision_id;

  INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
  VALUES (v_com.comisionista_id, v_com.lote_id, 'comision_pagada',
    '360Lateral procesó el pago de tu comisión por $' || to_char(v_com.comision_monto,'FM999,999,999') || ' vía ' || p_metodo_pago || '.',
    false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_comision_pagada(uuid, text, text, text) TO authenticated;

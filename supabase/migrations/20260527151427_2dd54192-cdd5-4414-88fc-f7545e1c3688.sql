
-- Parte A: salarios_minimos
CREATE TABLE IF NOT EXISTS public.salarios_minimos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anio int NOT NULL UNIQUE,
  valor_cop bigint NOT NULL CHECK (valor_cop > 0),
  vigente_desde date NOT NULL,
  vigente_hasta date,
  decreto text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salarios_vigente
  ON public.salarios_minimos(vigente_desde, vigente_hasta);

GRANT SELECT ON public.salarios_minimos TO anon, authenticated;
GRANT ALL ON public.salarios_minimos TO service_role;

ALTER TABLE public.salarios_minimos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos ven SMLMV"
  ON public.salarios_minimos FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Super admin modifica SMLMV"
  ON public.salarios_minimos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

INSERT INTO public.salarios_minimos (anio, valor_cop, vigente_desde, vigente_hasta, decreto, notas)
VALUES
  (2025, 1423500, '2025-01-01', '2025-12-31', 'Decreto 1572 de 2024',
   'Valor histórico — referencia para cálculos retrospectivos.'),
  (2026, 1750905, '2026-01-01', NULL, 'Decreto 0159 de 2026',
   'Aumento del 23% sobre 2025. Decreto 1469 de 2025 (original) ratificado por Decreto 0159 de 2026 tras suspensión provisional del Consejo de Estado.')
ON CONFLICT (anio) DO NOTHING;

-- Parte B: obtener_smlmv_vigente
CREATE OR REPLACE FUNCTION public.obtener_smlmv_vigente(p_fecha date DEFAULT CURRENT_DATE)
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT valor_cop
    FROM public.salarios_minimos
   WHERE vigente_desde <= p_fecha
     AND (vigente_hasta IS NULL OR vigente_hasta >= p_fecha)
   ORDER BY vigente_desde DESC
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_smlmv_vigente(date) TO authenticated, anon;

-- Parte C: vw_planes_con_precio (security_invoker = true por consistencia con resto del proyecto)
CREATE OR REPLACE VIEW public.vw_planes_con_precio
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.codigo,
  p.nombre,
  p.precio_smlmv,
  p.precio_cop AS precio_cop_legacy,
  (p.precio_smlmv * public.obtener_smlmv_vigente())::bigint AS precio_cop_actual,
  p.moneda,
  p.dias_sla,
  p.orden,
  p.activo,
  public.obtener_smlmv_vigente() AS smlmv_referencia,
  (SELECT anio FROM public.salarios_minimos
    WHERE vigente_desde <= CURRENT_DATE
      AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
    ORDER BY vigente_desde DESC LIMIT 1) AS smlmv_anio
FROM public.planes_diagnostico p
WHERE p.activo = true
ORDER BY p.orden;

GRANT SELECT ON public.vw_planes_con_precio TO authenticated, anon;

-- Parte D: transacciones
DO $$ BEGIN
  CREATE TYPE public.estado_transaccion AS ENUM (
    'pendiente','aprobada','declinada','expirada','reembolsada','error'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.engagements_lote(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.planes_diagnostico(id) ON DELETE RESTRICT,
  propietario_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  creada_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  monto_cop bigint NOT NULL CHECK (monto_cop >= 0),
  monto_smlmv numeric NOT NULL,
  smlmv_referencia bigint NOT NULL,
  moneda text NOT NULL DEFAULT 'COP',
  wompi_reference text UNIQUE,
  wompi_transaction_id text,
  wompi_payment_link_url text,
  wompi_status text,
  estado public.estado_transaccion NOT NULL DEFAULT 'pendiente',
  error_msg text,
  metadata jsonb,
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  fecha_aprobacion timestamptz,
  fecha_expiracion timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transacciones_engagement ON public.transacciones(engagement_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_propietario ON public.transacciones(propietario_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON public.transacciones(estado);
CREATE INDEX IF NOT EXISTS idx_transacciones_wompi_ref ON public.transacciones(wompi_reference);
CREATE INDEX IF NOT EXISTS idx_transacciones_wompi_tx ON public.transacciones(wompi_transaction_id) WHERE wompi_transaction_id IS NOT NULL;

GRANT SELECT ON public.transacciones TO authenticated;
GRANT ALL ON public.transacciones TO service_role;

ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietario ve sus transacciones"
  ON public.transacciones FOR SELECT TO authenticated
  USING (propietario_id = auth.uid());

CREATE POLICY "Admin ve todas las transacciones"
  ON public.transacciones FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

CREATE TRIGGER trg_transacciones_updated_at
  BEFORE UPDATE ON public.transacciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Parte E: eventos_wompi
CREATE TABLE IF NOT EXISTS public.eventos_wompi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id_externo text NOT NULL UNIQUE,
  tipo_evento text NOT NULL,
  transaccion_id uuid REFERENCES public.transacciones(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  procesado boolean NOT NULL DEFAULT false,
  error_procesamiento text,
  recibido_en timestamptz NOT NULL DEFAULT now(),
  procesado_en timestamptz
);

CREATE INDEX IF NOT EXISTS idx_eventos_wompi_procesado ON public.eventos_wompi(procesado) WHERE procesado = false;
CREATE INDEX IF NOT EXISTS idx_eventos_wompi_transaccion ON public.eventos_wompi(transaccion_id);

GRANT SELECT ON public.eventos_wompi TO authenticated;
GRANT ALL ON public.eventos_wompi TO service_role;

ALTER TABLE public.eventos_wompi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve eventos wompi"
  ON public.eventos_wompi FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

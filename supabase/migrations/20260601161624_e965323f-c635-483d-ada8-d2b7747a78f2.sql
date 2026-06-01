
-- Parte A: precios_suscripcion
CREATE TABLE IF NOT EXISTS public.precios_suscripcion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel public.nivel_suscripcion NOT NULL,
  periodo_meses int NOT NULL CHECK (periodo_meses > 0),
  precio_cop bigint NOT NULL CHECK (precio_cop >= 0),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nivel, periodo_meses)
);
GRANT SELECT ON public.precios_suscripcion TO anon, authenticated;
GRANT ALL ON public.precios_suscripcion TO service_role;
ALTER TABLE public.precios_suscripcion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos ven precios suscripcion activos"
  ON public.precios_suscripcion FOR SELECT TO authenticated, anon
  USING (activo = true OR public.is_admin_or_experto(auth.uid()));
CREATE POLICY "Super admin gestiona precios suscripcion"
  ON public.precios_suscripcion FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='super_admin'));
CREATE TRIGGER trg_precios_suscripcion_updated_at
  BEFORE UPDATE ON public.precios_suscripcion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.precios_suscripcion (nivel, periodo_meses, precio_cop, activo) VALUES
  ('basico',1,50000,true),('basico',3,135000,true),('basico',12,480000,true),
  ('profesional',1,150000,true),('profesional',3,405000,true),('profesional',12,1440000,true),
  ('premium',1,400000,true),('premium',3,1080000,true),('premium',12,3840000,true)
ON CONFLICT (nivel, periodo_meses) DO NOTHING;

-- Parte B: config_payperview
CREATE TABLE IF NOT EXISTS public.config_payperview (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  precio_cop bigint NOT NULL DEFAULT 30000,
  dias_acceso int NOT NULL DEFAULT 30,
  activo boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.config_payperview TO anon, authenticated;
GRANT ALL ON public.config_payperview TO service_role;
INSERT INTO public.config_payperview (id, precio_cop, dias_acceso, activo)
  VALUES (1, 30000, 30, true) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.config_payperview ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos ven config payperview" ON public.config_payperview FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Super admin edita payperview" ON public.config_payperview FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='super_admin'));

-- Parte C: suscripciones_desarrollador
CREATE TYPE public.estado_suscripcion AS ENUM ('pendiente_pago','activa','vencida','cancelada');

CREATE TABLE IF NOT EXISTS public.suscripciones_desarrollador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desarrollador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  nivel public.nivel_suscripcion NOT NULL,
  periodo_meses int NOT NULL,
  precio_cop bigint NOT NULL,
  estado public.estado_suscripcion NOT NULL DEFAULT 'pendiente_pago',
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.suscripciones_desarrollador TO authenticated;
GRANT ALL ON public.suscripciones_desarrollador TO service_role;
CREATE INDEX IF NOT EXISTS idx_suscripciones_dev ON public.suscripciones_desarrollador(desarrollador_id, estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_activas ON public.suscripciones_desarrollador(fecha_fin) WHERE estado='activa';
ALTER TABLE public.suscripciones_desarrollador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev ve sus suscripciones" ON public.suscripciones_desarrollador FOR SELECT TO authenticated
  USING (desarrollador_id = auth.uid());
CREATE POLICY "Admin ve suscripciones" ON public.suscripciones_desarrollador FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));
CREATE TRIGGER trg_suscripciones_updated_at BEFORE UPDATE ON public.suscripciones_desarrollador
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Parte D: accesos_lote
CREATE TABLE IF NOT EXISTS public.accesos_lote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desarrollador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  precio_cop bigint NOT NULL,
  estado public.estado_suscripcion NOT NULL DEFAULT 'pendiente_pago',
  fecha_compra timestamptz,
  fecha_expiracion timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.accesos_lote TO authenticated;
GRANT ALL ON public.accesos_lote TO service_role;
CREATE INDEX IF NOT EXISTS idx_accesos_dev_lote ON public.accesos_lote(desarrollador_id, lote_id, estado);
ALTER TABLE public.accesos_lote ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev ve sus accesos" ON public.accesos_lote FOR SELECT TO authenticated
  USING (desarrollador_id = auth.uid());
CREATE POLICY "Admin ve accesos" ON public.accesos_lote FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));
CREATE TRIGGER trg_accesos_updated_at BEFORE UPDATE ON public.accesos_lote
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Parte E: extender transacciones
CREATE TYPE public.tipo_pago AS ENUM ('diagnostico','suscripcion','pay_per_view');
ALTER TABLE public.transacciones
  ADD COLUMN IF NOT EXISTS tipo_pago public.tipo_pago NOT NULL DEFAULT 'diagnostico',
  ADD COLUMN IF NOT EXISTS suscripcion_id uuid REFERENCES public.suscripciones_desarrollador(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acceso_lote_id uuid REFERENCES public.accesos_lote(id) ON DELETE SET NULL;

-- Parte F: activar_suscripcion_post_pago
CREATE OR REPLACE FUNCTION public.activar_suscripcion_post_pago(p_transaccion_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trans record; v_susc record; v_nivel_actual public.nivel_suscripcion;
BEGIN
  SELECT * INTO v_trans FROM public.transacciones WHERE id = p_transaccion_id;
  IF NOT FOUND OR v_trans.suscripcion_id IS NULL THEN RETURN; END IF;
  SELECT * INTO v_susc FROM public.suscripciones_desarrollador WHERE id = v_trans.suscripcion_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_susc.estado = 'activa' THEN RETURN; END IF;
  UPDATE public.suscripciones_desarrollador
     SET estado='activa', fecha_inicio=now(),
         fecha_fin = now() + (v_susc.periodo_meses || ' months')::interval,
         updated_at=now()
   WHERE id = v_susc.id;
  UPDATE public.transacciones SET estado='aprobada', fecha_aprobacion=COALESCE(fecha_aprobacion,now()), updated_at=now()
   WHERE id = p_transaccion_id;
  SELECT nivel_suscripcion INTO v_nivel_actual FROM public.perfiles WHERE id = v_susc.desarrollador_id;
  IF v_nivel_actual IS DISTINCT FROM v_susc.nivel THEN
    PERFORM public.cambiar_nivel_suscripcion(v_susc.desarrollador_id, v_susc.nivel, 'Suscripción pagada', 'wompi_webhook');
  END IF;
  INSERT INTO public.notificaciones (user_id, tipo, mensaje, leida)
  VALUES (v_susc.desarrollador_id, 'suscripcion_activada',
    'Tu suscripción nivel ' || v_susc.nivel || ' está activa hasta ' ||
    to_char(now() + (v_susc.periodo_meses || ' months')::interval, 'DD/MM/YYYY') || '.', false);
END;
$$;
GRANT EXECUTE ON FUNCTION public.activar_suscripcion_post_pago(uuid) TO service_role;

-- Parte G: activar_acceso_lote_post_pago
CREATE OR REPLACE FUNCTION public.activar_acceso_lote_post_pago(p_transaccion_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trans record; v_acc record; v_dias int;
BEGIN
  SELECT * INTO v_trans FROM public.transacciones WHERE id = p_transaccion_id;
  IF NOT FOUND OR v_trans.acceso_lote_id IS NULL THEN RETURN; END IF;
  SELECT * INTO v_acc FROM public.accesos_lote WHERE id = v_trans.acceso_lote_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_acc.estado = 'activa' THEN RETURN; END IF;
  SELECT dias_acceso INTO v_dias FROM public.config_payperview WHERE id = 1;
  UPDATE public.accesos_lote
     SET estado='activa', fecha_compra=now(),
         fecha_expiracion = now() + (COALESCE(v_dias,30) || ' days')::interval, updated_at=now()
   WHERE id = v_acc.id;
  UPDATE public.transacciones SET estado='aprobada', fecha_aprobacion=COALESCE(fecha_aprobacion,now()), updated_at=now()
   WHERE id = p_transaccion_id;
  INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
  VALUES (v_acc.desarrollador_id, v_acc.lote_id, 'acceso_lote_activado',
    'Desbloqueaste el acceso a un lote por ' || COALESCE(v_dias,30) || ' días.', false);
END;
$$;
GRANT EXECUTE ON FUNCTION public.activar_acceso_lote_post_pago(uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.prevent_perfil_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_experto(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_type IS DISTINCT FROM OLD.user_type THEN NEW.user_type := OLD.user_type; END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN NEW.plan := OLD.plan; END IF;
  IF NEW.nivel_suscripcion IS DISTINCT FROM OLD.nivel_suscripcion THEN NEW.nivel_suscripcion := OLD.nivel_suscripcion; END IF;
  IF NEW.activo IS DISTINCT FROM OLD.activo THEN NEW.activo := OLD.activo; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_perfil_privilege_escalation_trg ON public.perfiles;
CREATE TRIGGER prevent_perfil_privilege_escalation_trg
BEFORE UPDATE ON public.perfiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_perfil_privilege_escalation();

DROP POLICY IF EXISTS "Precios visibles para todos" ON public.precios;
CREATE POLICY "Precios visibles para lotes publicos"
ON public.precios FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.lotes l WHERE l.id = precios.lote_id AND l.es_publico = true));
CREATE POLICY "Precios visibles para usuarios autorizados"
ON public.precios FOR SELECT TO authenticated
USING (public.has_lot_access(auth.uid(), lote_id));

DROP POLICY IF EXISTS "Servicios visibles para todos" ON public.servicios_publicos;
CREATE POLICY "Servicios visibles para lotes publicos"
ON public.servicios_publicos FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.lotes l WHERE l.id = servicios_publicos.lote_id AND l.es_publico = true));
CREATE POLICY "Servicios visibles para usuarios autorizados"
ON public.servicios_publicos FOR SELECT TO authenticated
USING (public.has_lot_access(auth.uid(), lote_id));

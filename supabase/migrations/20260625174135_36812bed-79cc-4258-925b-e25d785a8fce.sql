
-- 1) Extender accesos_lote
ALTER TABLE public.accesos_lote
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'ppv',
  ADD COLUMN IF NOT EXISTS otorgado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motivo TEXT;

DO $$ BEGIN
  ALTER TABLE public.accesos_lote
    ADD CONSTRAINT accesos_lote_tipo_check CHECK (tipo IN ('ppv','manual_admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.accesos_lote
    ADD CONSTRAINT accesos_manuales_requeridos CHECK (
      tipo <> 'manual_admin'
      OR (otorgado_por IS NOT NULL AND motivo IS NOT NULL AND length(trim(motivo)) > 0)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE public.accesos_lote SET tipo = 'ppv' WHERE tipo IS NULL;

CREATE INDEX IF NOT EXISTS idx_accesos_otorgados_por
  ON public.accesos_lote(otorgado_por) WHERE tipo = 'manual_admin';

COMMENT ON COLUMN public.accesos_lote.tipo IS
  'Origen del acceso: "ppv" (compra del desarrollador) o "manual_admin" (cortesía del equipo)';
COMMENT ON COLUMN public.accesos_lote.otorgado_por IS
  'Para tipo=manual_admin: id del admin que otorgó el acceso. NULL para ppv.';
COMMENT ON COLUMN public.accesos_lote.motivo IS
  'Para tipo=manual_admin: motivo del otorgamiento (audit trail).';

-- 2) RLS: admins pueden gestionar cortesías (SELECT ya cubierto por política existente "Admin ve accesos")
DROP POLICY IF EXISTS "Admin gestiona accesos manuales insert" ON public.accesos_lote;
CREATE POLICY "Admin gestiona accesos manuales insert" ON public.accesos_lote
  FOR INSERT TO authenticated
  WITH CHECK (
    tipo = 'manual_admin'
    AND (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'super_admin'::app_role))
  );

DROP POLICY IF EXISTS "Admin gestiona accesos manuales update" ON public.accesos_lote;
CREATE POLICY "Admin gestiona accesos manuales update" ON public.accesos_lote
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 3) RPC: otorgar acceso manual
CREATE OR REPLACE FUNCTION public.otorgar_acceso_manual_lote(
  p_lote_id UUID,
  p_desarrollador_id UUID,
  p_motivo TEXT,
  p_dias INTEGER DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acceso_id UUID;
  v_admin_id UUID := auth.uid();
  v_lote_nombre TEXT;
  v_dev_email TEXT;
  v_dev_nombre TEXT;
  v_fecha_expiracion TIMESTAMPTZ;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF NOT (public.has_role(v_admin_id, 'admin'::app_role)
          OR public.has_role(v_admin_id, 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo administradores pueden otorgar accesos manuales';
  END IF;
  IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN
    RAISE EXCEPTION 'El motivo es obligatorio para accesos manuales';
  END IF;
  IF p_dias < 1 OR p_dias > 365 THEN
    RAISE EXCEPTION 'Los días deben estar entre 1 y 365';
  END IF;

  SELECT nombre_lote INTO v_lote_nombre FROM public.lotes WHERE id = p_lote_id;
  IF v_lote_nombre IS NULL THEN
    RAISE EXCEPTION 'Lote no encontrado';
  END IF;

  SELECT email, nombre
    INTO v_dev_email, v_dev_nombre
    FROM public.perfiles WHERE id = p_desarrollador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Desarrollador no encontrado';
  END IF;

  v_fecha_expiracion := now() + (p_dias || ' days')::INTERVAL;

  -- Cancelar accesos manuales activos previos para evitar duplicados
  UPDATE public.accesos_lote
     SET estado = 'cancelada'
   WHERE desarrollador_id = p_desarrollador_id
     AND lote_id = p_lote_id
     AND tipo = 'manual_admin'
     AND estado = 'activa';

  INSERT INTO public.accesos_lote (
    desarrollador_id, lote_id, tipo, fecha_compra, fecha_expiracion,
    estado, otorgado_por, motivo, precio_cop
  ) VALUES (
    p_desarrollador_id, p_lote_id, 'manual_admin', now(), v_fecha_expiracion,
    'activa', v_admin_id, trim(p_motivo), 0
  )
  RETURNING id INTO v_acceso_id;

  -- Notificación in-app
  INSERT INTO public.notificaciones (user_id, lote_id, mensaje, tipo)
  VALUES (
    p_desarrollador_id,
    p_lote_id,
    format('360Lateral te dio acceso a "%s" por %s días', v_lote_nombre, p_dias),
    'acceso_manual_otorgado'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'acceso_id', v_acceso_id,
    'fecha_expiracion', v_fecha_expiracion,
    'lote_nombre', v_lote_nombre,
    'dev_email', v_dev_email,
    'dev_nombre', v_dev_nombre
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.otorgar_acceso_manual_lote(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- 4) RPC: revocar acceso manual
CREATE OR REPLACE FUNCTION public.revocar_acceso_manual_lote(p_acceso_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF NOT (public.has_role(v_admin_id, 'admin'::app_role)
          OR public.has_role(v_admin_id, 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo administradores pueden revocar accesos';
  END IF;

  UPDATE public.accesos_lote
     SET estado = 'cancelada', fecha_expiracion = now()
   WHERE id = p_acceso_id AND tipo = 'manual_admin';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Acceso no encontrado o no es manual';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.revocar_acceso_manual_lote(UUID) TO authenticated;

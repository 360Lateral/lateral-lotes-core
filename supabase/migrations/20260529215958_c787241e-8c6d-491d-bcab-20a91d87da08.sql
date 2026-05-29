-- Enum
DO $$ BEGIN
  CREATE TYPE public.estado_autorizacion_comisionista AS ENUM ('activa', 'revocada', 'vencida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla
CREATE TABLE IF NOT EXISTS public.autorizaciones_comisionista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propietario_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  comisionista_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  comision_pct numeric NOT NULL CHECK (comision_pct >= 0 AND comision_pct <= 100),
  documento_url text NOT NULL,
  estado public.estado_autorizacion_comisionista NOT NULL DEFAULT 'activa',
  fecha_vencimiento date,
  notas text,
  creada_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comisionista_id, lote_id, estado)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.autorizaciones_comisionista TO authenticated;
GRANT ALL ON public.autorizaciones_comisionista TO service_role;

CREATE INDEX IF NOT EXISTS idx_autoriz_comisionista ON public.autorizaciones_comisionista(comisionista_id);
CREATE INDEX IF NOT EXISTS idx_autoriz_propietario ON public.autorizaciones_comisionista(propietario_id);
CREATE INDEX IF NOT EXISTS idx_autoriz_lote ON public.autorizaciones_comisionista(lote_id);
CREATE INDEX IF NOT EXISTS idx_autoriz_activas ON public.autorizaciones_comisionista(lote_id, estado) WHERE estado = 'activa';

ALTER TABLE public.autorizaciones_comisionista ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietario ve sus autorizaciones"
  ON public.autorizaciones_comisionista FOR SELECT TO authenticated
  USING (propietario_id = auth.uid());

CREATE POLICY "Comisionista ve sus autorizaciones"
  ON public.autorizaciones_comisionista FOR SELECT TO authenticated
  USING (comisionista_id = auth.uid());

CREATE POLICY "Admin ve autorizaciones"
  ON public.autorizaciones_comisionista FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

CREATE POLICY "Propietario crea autorizacion"
  ON public.autorizaciones_comisionista FOR INSERT TO authenticated
  WITH CHECK (
    propietario_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.lotes WHERE id = lote_id AND propietario_id = auth.uid())
  );

CREATE POLICY "Admin crea autorizacion"
  ON public.autorizaciones_comisionista FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_experto(auth.uid()));

CREATE POLICY "Propietario actualiza autorizacion"
  ON public.autorizaciones_comisionista FOR UPDATE TO authenticated
  USING (propietario_id = auth.uid())
  WITH CHECK (propietario_id = auth.uid());

CREATE POLICY "Admin actualiza autorizacion"
  ON public.autorizaciones_comisionista FOR UPDATE TO authenticated
  USING (public.is_admin_or_experto(auth.uid()))
  WITH CHECK (public.is_admin_or_experto(auth.uid()));

CREATE TRIGGER trg_autoriz_comisionista_updated_at
  BEFORE UPDATE ON public.autorizaciones_comisionista
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-comisionistas', 'documentos-comisionistas', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth upload doc comisionista"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-comisionistas');

CREATE POLICY "auth read doc comisionista"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-comisionistas');

CREATE POLICY "auth update doc comisionista"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-comisionistas' AND owner = auth.uid());

CREATE POLICY "auth delete doc comisionista"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-comisionistas' AND owner = auth.uid());

-- RPC revocar
CREATE OR REPLACE FUNCTION public.revocar_autorizacion_comisionista(
  p_autorizacion_id uuid,
  p_motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth record;
  v_es_admin boolean;
BEGIN
  SELECT * INTO v_auth FROM public.autorizaciones_comisionista WHERE id = p_autorizacion_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Autorización no encontrada'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ) INTO v_es_admin;

  IF v_auth.propietario_id <> auth.uid() AND NOT v_es_admin THEN
    RAISE EXCEPTION 'No tienes permiso para revocar esta autorización';
  END IF;

  UPDATE public.autorizaciones_comisionista
     SET estado = 'revocada',
         notas = COALESCE(notas, '') || E'\n[REVOCADA]: ' || COALESCE(p_motivo, 'sin motivo'),
         updated_at = now()
   WHERE id = p_autorizacion_id;

  INSERT INTO public.notificaciones (user_id, lote_id, tipo, mensaje, leida)
  VALUES (
    v_auth.comisionista_id,
    v_auth.lote_id,
    'autorizacion_revocada',
    'Una autorización para representar un lote fue revocada por el propietario.',
    false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.revocar_autorizacion_comisionista(uuid, text) TO authenticated;
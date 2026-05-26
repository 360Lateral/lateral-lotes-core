-- Parte A: nivel_suscripcion enum and column
CREATE TYPE public.nivel_suscripcion AS ENUM ('gratuito','basico','profesional','premium');

ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS nivel_suscripcion public.nivel_suscripcion NOT NULL DEFAULT 'gratuito';

CREATE INDEX IF NOT EXISTS idx_perfiles_nivel_suscripcion ON public.perfiles(nivel_suscripcion);

-- Parte B: ndas_firmados
CREATE TABLE IF NOT EXISTS public.ndas_firmados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desarrollador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  version_nda text NOT NULL,
  contenido_aceptado text NOT NULL,
  fecha_firma timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (desarrollador_id, lote_id, version_nda)
);

CREATE INDEX IF NOT EXISTS idx_ndas_desarrollador ON public.ndas_firmados(desarrollador_id);
CREATE INDEX IF NOT EXISTS idx_ndas_lote ON public.ndas_firmados(lote_id);

ALTER TABLE public.ndas_firmados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Desarrollador ve sus NDAs"
  ON public.ndas_firmados FOR SELECT TO authenticated
  USING (desarrollador_id = auth.uid());

CREATE POLICY "Desarrollador firma su NDA"
  ON public.ndas_firmados FOR INSERT TO authenticated
  WITH CHECK (
    desarrollador_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid()
         AND role = 'desarrollador'
    )
  );

CREATE POLICY "Admin ve todos los NDAs"
  ON public.ndas_firmados FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

-- Parte C: solicitudes_contacto
CREATE TYPE public.estado_solicitud_contacto AS ENUM ('pendiente','contactado','cerrado');

CREATE TABLE IF NOT EXISTS public.solicitudes_contacto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desarrollador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  mensaje text NOT NULL,
  estado public.estado_solicitud_contacto NOT NULL DEFAULT 'pendiente',
  procesado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  fecha_procesado timestamptz,
  notas_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_desarrollador ON public.solicitudes_contacto(desarrollador_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_lote ON public.solicitudes_contacto(lote_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes_contacto(estado)
  WHERE estado = 'pendiente';

DROP TRIGGER IF EXISTS trg_solicitudes_contacto_updated_at ON public.solicitudes_contacto;
CREATE TRIGGER trg_solicitudes_contacto_updated_at
  BEFORE UPDATE ON public.solicitudes_contacto
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.solicitudes_contacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Desarrollador ve sus solicitudes"
  ON public.solicitudes_contacto FOR SELECT TO authenticated
  USING (desarrollador_id = auth.uid());

CREATE POLICY "Desarrollador crea su solicitud"
  ON public.solicitudes_contacto FOR INSERT TO authenticated
  WITH CHECK (
    desarrollador_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid()
         AND role = 'desarrollador'
    )
  );

CREATE POLICY "Admin ve todas las solicitudes"
  ON public.solicitudes_contacto FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

CREATE POLICY "Admin procesa solicitudes"
  ON public.solicitudes_contacto FOR UPDATE TO authenticated
  USING (public.is_admin_or_experto(auth.uid()))
  WITH CHECK (public.is_admin_or_experto(auth.uid()));
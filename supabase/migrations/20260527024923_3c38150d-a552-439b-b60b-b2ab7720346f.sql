-- Parte A: Enums
DO $$ BEGIN
  CREATE TYPE public.estado_orden_servicio AS ENUM ('abierta','adjudicada','en_ejecucion','completada','cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_propuesta AS ENUM ('enviada','ganadora','rechazada','retirada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.visibilidad_orden AS ENUM ('publica','invitacion');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Parte B: contratos_marco
CREATE TABLE IF NOT EXISTS public.contratos_marco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_analisis_id uuid NOT NULL REFERENCES public.tipos_analisis(id) ON DELETE CASCADE,
  version text NOT NULL,
  contenido_legal text NOT NULL,
  precio_min numeric NOT NULL CHECK (precio_min >= 0),
  precio_max numeric NOT NULL CHECK (precio_max >= precio_min),
  plazo_min_dias int NOT NULL CHECK (plazo_min_dias >= 1),
  plazo_max_dias int NOT NULL CHECK (plazo_max_dias >= plazo_min_dias),
  moneda text NOT NULL DEFAULT 'COP' CHECK (moneda IN ('COP','USD')),
  activo boolean NOT NULL DEFAULT true,
  creado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo_analisis_id, version)
);

CREATE INDEX IF NOT EXISTS idx_contratos_tipo ON public.contratos_marco(tipo_analisis_id, activo) WHERE activo = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_marco TO authenticated;
GRANT ALL ON public.contratos_marco TO service_role;

ALTER TABLE public.contratos_marco ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth ve contratos activos" ON public.contratos_marco;
CREATE POLICY "Auth ve contratos activos"
  ON public.contratos_marco FOR SELECT TO authenticated
  USING (activo = true OR public.is_admin_or_experto(auth.uid()));

DROP POLICY IF EXISTS "Super admin crea contratos" ON public.contratos_marco;
CREATE POLICY "Super admin crea contratos"
  ON public.contratos_marco FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "Super admin actualiza contratos" ON public.contratos_marco;
CREATE POLICY "Super admin actualiza contratos"
  ON public.contratos_marco FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

DROP TRIGGER IF EXISTS trg_contratos_marco_updated_at ON public.contratos_marco;
CREATE TRIGGER trg_contratos_marco_updated_at
  BEFORE UPDATE ON public.contratos_marco
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Parte C: ordenes_servicio
CREATE TABLE IF NOT EXISTS public.ordenes_servicio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  tipo_analisis_id uuid NOT NULL REFERENCES public.tipos_analisis(id) ON DELETE RESTRICT,
  contrato_marco_id uuid NOT NULL REFERENCES public.contratos_marco(id) ON DELETE RESTRICT,
  engagement_id uuid REFERENCES public.engagements_lote(id) ON DELETE SET NULL,
  estado public.estado_orden_servicio NOT NULL DEFAULT 'abierta',
  visibilidad public.visibilidad_orden NOT NULL DEFAULT 'publica',
  fecha_limite_propuestas timestamptz NOT NULL,
  creado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  ganador_propuesta_id uuid,
  notas_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_lote ON public.ordenes_servicio(lote_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON public.ordenes_servicio(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_engagement ON public.ordenes_servicio(engagement_id) WHERE engagement_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ordenes_abiertas ON public.ordenes_servicio(fecha_limite_propuestas) WHERE estado = 'abierta';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordenes_servicio TO authenticated;
GRANT ALL ON public.ordenes_servicio TO service_role;

ALTER TABLE public.ordenes_servicio ENABLE ROW LEVEL SECURITY;

-- Parte D: propuestas_experto
CREATE TABLE IF NOT EXISTS public.propuestas_experto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id uuid NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  experto_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  precio_propuesto numeric NOT NULL CHECK (precio_propuesto >= 0),
  plazo_propuesto_dias int NOT NULL CHECK (plazo_propuesto_dias >= 1),
  mensaje_experto text,
  estado public.estado_propuesta NOT NULL DEFAULT 'enviada',
  fecha_propuesta timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (orden_id, experto_id)
);

CREATE INDEX IF NOT EXISTS idx_propuestas_orden ON public.propuestas_experto(orden_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_experto ON public.propuestas_experto(experto_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propuestas_experto TO authenticated;
GRANT ALL ON public.propuestas_experto TO service_role;

ALTER TABLE public.propuestas_experto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Experto ve sus propuestas" ON public.propuestas_experto;
CREATE POLICY "Experto ve sus propuestas"
  ON public.propuestas_experto FOR SELECT TO authenticated
  USING (experto_id = auth.uid());

DROP POLICY IF EXISTS "Admin ve todas las propuestas" ON public.propuestas_experto;
CREATE POLICY "Admin ve todas las propuestas"
  ON public.propuestas_experto FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

DROP POLICY IF EXISTS "Experto crea su propuesta" ON public.propuestas_experto;
CREATE POLICY "Experto crea su propuesta"
  ON public.propuestas_experto FOR INSERT TO authenticated
  WITH CHECK (
    experto_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'experto')
    AND EXISTS (SELECT 1 FROM public.ordenes_servicio WHERE id = orden_id AND estado = 'abierta')
  );

DROP POLICY IF EXISTS "Experto actualiza su propuesta antes de adjudicar" ON public.propuestas_experto;
CREATE POLICY "Experto actualiza su propuesta antes de adjudicar"
  ON public.propuestas_experto FOR UPDATE TO authenticated
  USING (experto_id = auth.uid() AND estado = 'enviada')
  WITH CHECK (experto_id = auth.uid());

DROP POLICY IF EXISTS "Admin actualiza propuestas" ON public.propuestas_experto;
CREATE POLICY "Admin actualiza propuestas"
  ON public.propuestas_experto FOR UPDATE TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

DROP TRIGGER IF EXISTS trg_propuestas_updated_at ON public.propuestas_experto;
CREATE TRIGGER trg_propuestas_updated_at
  BEFORE UPDATE ON public.propuestas_experto
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FK circular
DO $$ BEGIN
  ALTER TABLE public.ordenes_servicio
    ADD CONSTRAINT fk_ordenes_ganador
    FOREIGN KEY (ganador_propuesta_id)
    REFERENCES public.propuestas_experto(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Parte E: invitaciones_orden
CREATE TABLE IF NOT EXISTS public.invitaciones_orden (
  orden_id uuid NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  experto_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  fecha_invitacion timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (orden_id, experto_id)
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_experto ON public.invitaciones_orden(experto_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitaciones_orden TO authenticated;
GRANT ALL ON public.invitaciones_orden TO service_role;

ALTER TABLE public.invitaciones_orden ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Experto ve sus invitaciones" ON public.invitaciones_orden;
CREATE POLICY "Experto ve sus invitaciones"
  ON public.invitaciones_orden FOR SELECT TO authenticated
  USING (experto_id = auth.uid());

DROP POLICY IF EXISTS "Admin ve todas las invitaciones" ON public.invitaciones_orden;
CREATE POLICY "Admin ve todas las invitaciones"
  ON public.invitaciones_orden FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

DROP POLICY IF EXISTS "Admin crea invitaciones" ON public.invitaciones_orden;
CREATE POLICY "Admin crea invitaciones"
  ON public.invitaciones_orden FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));

DROP POLICY IF EXISTS "Admin elimina invitaciones" ON public.invitaciones_orden;
CREATE POLICY "Admin elimina invitaciones"
  ON public.invitaciones_orden FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));

-- Policies de ordenes_servicio (después de invitaciones_orden para referencia)
DROP POLICY IF EXISTS "Admin ve todas las ordenes" ON public.ordenes_servicio;
CREATE POLICY "Admin ve todas las ordenes"
  ON public.ordenes_servicio FOR SELECT TO authenticated
  USING (public.is_admin_or_experto(auth.uid()));

DROP POLICY IF EXISTS "Expertos ven sus ordenes disponibles" ON public.ordenes_servicio;
CREATE POLICY "Expertos ven sus ordenes disponibles"
  ON public.ordenes_servicio FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'experto')
    AND (
      visibilidad = 'publica'
      OR EXISTS (
        SELECT 1 FROM public.invitaciones_orden
         WHERE orden_id = public.ordenes_servicio.id
           AND experto_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admin crea ordenes" ON public.ordenes_servicio;
CREATE POLICY "Admin crea ordenes"
  ON public.ordenes_servicio FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));

DROP POLICY IF EXISTS "Admin actualiza ordenes" ON public.ordenes_servicio;
CREATE POLICY "Admin actualiza ordenes"
  ON public.ordenes_servicio FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));

DROP TRIGGER IF EXISTS trg_ordenes_servicio_updated_at ON public.ordenes_servicio;
CREATE TRIGGER trg_ordenes_servicio_updated_at
  BEFORE UPDATE ON public.ordenes_servicio
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Parte F: Seed contratos marco
INSERT INTO public.contratos_marco (
  tipo_analisis_id, version, contenido_legal,
  precio_min, precio_max, plazo_min_dias, plazo_max_dias,
  moneda, activo
)
SELECT
  id,
  'v1.0',
  'Contrato marco inicial para análisis "' || nombre || '". ' ||
  'Define los términos legales, comerciales y de entrega que el experto acepta al postular. ' ||
  'Este es un texto borrador — el super_admin debe revisarlo y reemplazarlo por la versión legal definitiva antes de operar en producción. ' ||
  'Versión v1.0 generada automáticamente el ' || to_char(now(), 'YYYY-MM-DD') || '.',
  500000, 3000000, 5, 21, 'COP', true
FROM public.tipos_analisis ta
WHERE activo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.contratos_marco cm
     WHERE cm.tipo_analisis_id = ta.id AND cm.version = 'v1.0'
  );
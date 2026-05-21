
-- 1) Enums
CREATE TYPE public.estado_engagement AS ENUM ('prospecto','activo','en_revision','entregado','cerrado','cancelado');
CREATE TYPE public.estado_analisis AS ENUM ('no_aplica','pendiente','en_progreso','en_revision','aprobado','rechazado','entregado');

-- 2) planes_diagnostico
CREATE TABLE public.planes_diagnostico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  precio_smlmv numeric,
  precio_cop bigint,
  moneda text NOT NULL DEFAULT 'COP' CHECK (moneda IN ('COP','USD')),
  dias_sla integer,
  orden integer,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) tipos_analisis
CREATE TABLE public.tipos_analisis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  tabla_destino text,
  orden integer,
  activo boolean NOT NULL DEFAULT true
);

-- 4) planes_analisis
CREATE TABLE public.planes_analisis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.planes_diagnostico(id) ON DELETE CASCADE,
  tipo_analisis_id uuid NOT NULL REFERENCES public.tipos_analisis(id) ON DELETE CASCADE,
  incluido boolean NOT NULL DEFAULT false,
  peso_avance numeric NOT NULL DEFAULT 1.0,
  UNIQUE (plan_id, tipo_analisis_id)
);

-- 5) engagements_lote
CREATE TABLE public.engagements_lote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.planes_diagnostico(id),
  cliente_id uuid REFERENCES public.perfiles(id),
  lead_id uuid REFERENCES public.leads(id),
  asesor_asignado_id uuid REFERENCES public.perfiles(id),
  gerente_id uuid REFERENCES public.perfiles(id),
  estado public.estado_engagement NOT NULL DEFAULT 'prospecto',
  fecha_solicitud timestamptz NOT NULL DEFAULT now(),
  fecha_inicio timestamptz,
  fecha_sla_objetivo timestamptz,
  fecha_entrega timestamptz,
  precio_cobrado numeric,
  moneda text NOT NULL DEFAULT 'COP' CHECK (moneda IN ('COP','USD')),
  estado_pago text NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','parcial','pagado')),
  avance_pct numeric NOT NULL DEFAULT 0 CHECK (avance_pct >= 0 AND avance_pct <= 100),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6) tareas_analisis
CREATE TABLE public.tareas_analisis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.engagements_lote(id) ON DELETE CASCADE,
  tipo_analisis_id uuid NOT NULL REFERENCES public.tipos_analisis(id),
  estado public.estado_analisis NOT NULL DEFAULT 'pendiente',
  responsable_id uuid REFERENCES public.perfiles(id),
  fecha_inicio timestamptz,
  fecha_objetivo timestamptz,
  fecha_completado timestamptz,
  avance_pct numeric NOT NULL DEFAULT 0 CHECK (avance_pct >= 0 AND avance_pct <= 100),
  bloqueado boolean NOT NULL DEFAULT false,
  motivo_bloqueo text,
  link_detalle_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, tipo_analisis_id)
);

-- 8) Índices
CREATE INDEX idx_engagements_lote_lote_id ON public.engagements_lote(lote_id);
CREATE INDEX idx_engagements_lote_estado ON public.engagements_lote(estado);
CREATE INDEX idx_engagements_lote_asesor ON public.engagements_lote(asesor_asignado_id);
CREATE INDEX idx_tareas_analisis_engagement ON public.tareas_analisis(engagement_id);
CREATE INDEX idx_tareas_analisis_estado ON public.tareas_analisis(estado);

-- 9) Triggers updated_at (usa public.update_updated_at_column existente)
CREATE TRIGGER trg_engagements_lote_updated_at
  BEFORE UPDATE ON public.engagements_lote
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_tareas_analisis_updated_at
  BEFORE UPDATE ON public.tareas_analisis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Seeds
INSERT INTO public.planes_diagnostico (codigo, nombre, precio_smlmv, precio_cop, moneda, dias_sla, orden, activo) VALUES
  ('gratuito', 'Gratuito', 0,  0,         'COP', 30, 1, true),
  ('basico',   'Básico',   4,  7003620,   'COP', 21, 2, true),
  ('pro',      'Pro',      6,  10505430,  'COP', 14, 3, true),
  ('premium',  'Premium',  12, 21010860,  'COP', 10, 4, true);

INSERT INTO public.tipos_analisis (codigo, nombre, tabla_destino, orden, activo) VALUES
  ('valoracion_referencial', 'Valoración referencial por m²', NULL,                       1, true),
  ('score_viabilidad',       'Score de viabilidad visual',     NULL,                       2, true),
  ('normativo',              'Análisis Normativo',             'normativa_urbana',         3, true),
  ('juridico',               'Análisis Jurídico',              'analisis_juridico',        4, true),
  ('sspp',                   'Análisis SSPP',                  'analisis_sspp',            5, true),
  ('geotecnico',             'Análisis de Suelos',             'analisis_geotecnico',      6, true),
  ('ambiental',              'Análisis Ambiental',             'analisis_ambiental',       7, true),
  ('mercado',                'Análisis de Mercado',            'analisis_mercado',         8, true),
  ('arquitectonico',         'Análisis Arquitectónico',        'analisis_arquitectonico',  9, true),
  ('financiero',             'Modelo Financiero Dinámico',     'analisis_financiero',     10, true);

-- planes_analisis: matriz incluido/excluido según Planes.tsx
-- Gratuito: 2, Básico: 5, Pro: 7, Premium: 10 (en orden)
INSERT INTO public.planes_analisis (plan_id, tipo_analisis_id, incluido, peso_avance)
SELECT p.id, t.id,
  CASE p.codigo
    WHEN 'gratuito' THEN t.orden <= 2
    WHEN 'basico'   THEN t.orden <= 5
    WHEN 'pro'      THEN t.orden <= 7
    WHEN 'premium'  THEN true
  END,
  1.0
FROM public.planes_diagnostico p
CROSS JOIN public.tipos_analisis t;

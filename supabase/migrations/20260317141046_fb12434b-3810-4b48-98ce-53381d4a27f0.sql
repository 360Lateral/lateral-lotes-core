
-- analisis_juridico
CREATE TABLE IF NOT EXISTS public.analisis_juridico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  cadena_tradicion text,
  gravamenes boolean DEFAULT false,
  hipoteca_activa boolean DEFAULT false,
  servidumbres boolean DEFAULT false,
  deuda_predial boolean DEFAULT false,
  discrepancia_areas boolean DEFAULT false,
  proceso_sucesion boolean DEFAULT false,
  litigio_activo boolean DEFAULT false,
  observaciones text,
  updated_at timestamptz DEFAULT now()
);

-- analisis_ambiental
CREATE TABLE IF NOT EXISTS public.analisis_ambiental (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  ronda_hidrica boolean DEFAULT false,
  distancia_ronda_m numeric,
  reserva_forestal boolean DEFAULT false,
  amenaza_inundacion text DEFAULT 'sin_amenaza',
  amenaza_remocion text DEFAULT 'sin_amenaza',
  pasivo_ambiental boolean DEFAULT false,
  requiere_licencia_ambiental boolean DEFAULT false,
  observaciones text,
  updated_at timestamptz DEFAULT now()
);

-- analisis_sspp
CREATE TABLE IF NOT EXISTS public.analisis_sspp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  acueducto_disponible boolean DEFAULT false,
  alcantarillado_disponible boolean DEFAULT false,
  energia_disponible boolean DEFAULT false,
  gas_disponible boolean DEFAULT false,
  capacidad_red_kva numeric,
  distancia_red_matriz_m numeric,
  costo_extension_estimado numeric,
  via_pavimentada boolean DEFAULT false,
  observaciones text,
  updated_at timestamptz DEFAULT now()
);

-- analisis_geotecnico
CREATE TABLE IF NOT EXISTS public.analisis_geotecnico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  tipo_suelo text,
  capacidad_portante_ton_m2 numeric,
  nivel_freatico_m numeric,
  pendiente_pct numeric,
  sistema_cimentacion text,
  sobrecosto_cimentacion_estimado numeric,
  observaciones text,
  updated_at timestamptz DEFAULT now()
);

-- analisis_mercado
CREATE TABLE IF NOT EXISTS public.analisis_mercado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  precio_venta_m2_zona numeric,
  precio_unidad_promedio numeric,
  proyectos_competidores integer,
  velocidad_absorcion_unidades_mes numeric,
  perfil_comprador text,
  valorizacion_anual_pct numeric,
  observaciones text,
  updated_at timestamptz DEFAULT now()
);

-- analisis_arquitectonico
CREATE TABLE IF NOT EXISTS public.analisis_arquitectonico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  m2_construibles_total numeric,
  unidades_estimadas integer,
  area_vendible_pct numeric,
  tipologias text,
  eficiencia_lote_pct numeric,
  forma_lote text,
  permite_sotano boolean DEFAULT false,
  observaciones text,
  updated_at timestamptz DEFAULT now()
);

-- analisis_financiero
CREATE TABLE IF NOT EXISTS public.analisis_financiero (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  valor_compra_lote numeric,
  costo_construccion_m2 numeric,
  ingresos_proyectados numeric,
  margen_bruto_pct numeric,
  tir_pct numeric,
  vpn numeric,
  punto_equilibrio_pct numeric,
  observaciones text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.analisis_juridico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_ambiental ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_sspp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_geotecnico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_mercado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_arquitectonico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_financiero ENABLE ROW LEVEL SECURITY;

-- RLS policies: visible to all, editable by admin/asesor
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'analisis_juridico','analisis_ambiental','analisis_sspp',
    'analisis_geotecnico','analisis_mercado','analisis_arquitectonico','analisis_financiero'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Visible para todos" ON public.%I FOR SELECT TO public USING (true)', tbl);
    EXECUTE format('CREATE POLICY "Admin/asesor insertan" ON public.%I FOR INSERT TO authenticated WITH CHECK (is_admin_or_asesor(auth.uid()))', tbl);
    EXECUTE format('CREATE POLICY "Admin/asesor actualizan" ON public.%I FOR UPDATE TO authenticated USING (is_admin_or_asesor(auth.uid()))', tbl);
    EXECUTE format('CREATE POLICY "Admin/asesor eliminan" ON public.%I FOR DELETE TO authenticated USING (is_admin_or_asesor(auth.uid()))', tbl);
  END LOOP;
END $$;

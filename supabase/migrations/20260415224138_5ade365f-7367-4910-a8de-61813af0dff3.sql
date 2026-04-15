-- 1. Agregar columna cbml a lotes
ALTER TABLE public.lotes
  ADD COLUMN IF NOT EXISTS cbml TEXT;

-- 2. Tabla de cache de consultas MapGIS
CREATE TABLE IF NOT EXISTS public.mapgis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cbml TEXT NOT NULL,
  tipo_entrada TEXT NOT NULL DEFAULT 'cbml',
  valor_entrada TEXT NOT NULL,
  datos JSONB NOT NULL DEFAULT '{}',
  consultado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  es_valido BOOLEAN NOT NULL DEFAULT true,
  user_id UUID
);

ALTER TABLE public.mapgis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven cache mapgis" ON public.mapgis_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios insertan cache mapgis" ON public.mapgis_cache
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios actualizan su cache" ON public.mapgis_cache
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mapgis_cache_cbml
  ON public.mapgis_cache(cbml) WHERE es_valido = true;
CREATE INDEX IF NOT EXISTS idx_mapgis_cache_valor
  ON public.mapgis_cache(tipo_entrada, valor_entrada) WHERE es_valido = true;
CREATE INDEX IF NOT EXISTS idx_mapgis_cache_expira
  ON public.mapgis_cache(expira_at);
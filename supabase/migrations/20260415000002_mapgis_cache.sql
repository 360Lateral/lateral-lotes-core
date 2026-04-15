-- =============================================
-- MapGIS Cache — almacena resultados de consultas
-- Soporta búsqueda por CBML, matrícula, dirección y ubicación
-- =============================================

-- 1. Agregar columna cbml a lotes (si no existe)
ALTER TABLE public.lotes
  ADD COLUMN IF NOT EXISTS cbml TEXT;

-- 2. Tabla de cache de consultas MapGIS
CREATE TABLE IF NOT EXISTS public.mapgis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Clave de búsqueda (cbml es siempre el resultado final)
  cbml TEXT NOT NULL,
  -- Tipo de entrada con que se originó la consulta
  tipo_entrada TEXT NOT NULL DEFAULT 'cbml'
    CHECK (tipo_entrada IN ('cbml', 'matricula', 'direccion', 'ubicacion')),
  -- Valor original ingresado por el usuario
  valor_entrada TEXT NOT NULL,
  -- Datos completos de MapGIS
  datos JSONB NOT NULL DEFAULT '{}',
  -- Control de caché
  consultado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  es_valido BOOLEAN NOT NULL DEFAULT true,
  -- Quién lo consultó
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.mapgis_cache ENABLE ROW LEVEL SECURITY;

-- Usuarios ven su propio cache y el de su organización
CREATE POLICY "Usuarios ven cache mapgis" ON public.mapgis_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios insertan cache mapgis" ON public.mapgis_cache
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios actualizan su cache" ON public.mapgis_cache
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_mapgis_cache_cbml
  ON public.mapgis_cache(cbml) WHERE es_valido = true;
CREATE INDEX IF NOT EXISTS idx_mapgis_cache_valor
  ON public.mapgis_cache(tipo_entrada, valor_entrada) WHERE es_valido = true;
CREATE INDEX IF NOT EXISTS idx_mapgis_cache_expira
  ON public.mapgis_cache(expira_at);

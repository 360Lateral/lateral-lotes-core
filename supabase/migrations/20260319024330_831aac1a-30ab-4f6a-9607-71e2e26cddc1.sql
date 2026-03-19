ALTER TABLE analisis_financiero 
  ADD COLUMN IF NOT EXISTS precio_estimado_min numeric,
  ADD COLUMN IF NOT EXISTS precio_estimado_promedio numeric,
  ADD COLUMN IF NOT EXISTS precio_estimado_max numeric;
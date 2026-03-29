ALTER TABLE public.normativa_urbana
  ADD COLUMN IF NOT EXISTS zona_homogenea text,
  ADD COLUMN IF NOT EXISTS cesion_tipo_b numeric,
  ADD COLUMN IF NOT EXISTS densidad_max text,
  ADD COLUMN IF NOT EXISTS altura_texto text;
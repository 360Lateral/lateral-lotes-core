ALTER TABLE public.diagnosticos
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS tiene_escritura boolean,
  ADD COLUMN IF NOT EXISTS problema_juridico text,
  ADD COLUMN IF NOT EXISTS servicios text[],
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'nuevo',
  ADD COLUMN IF NOT EXISTS tipo_lote text;
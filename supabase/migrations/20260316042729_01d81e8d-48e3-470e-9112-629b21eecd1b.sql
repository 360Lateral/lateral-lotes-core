
-- Add new columns to lotes
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS tipo_lote text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS departamento text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS tiene_escritura boolean;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS tiene_deudas text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS problema_juridico text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS video_url text;

-- Add 'En revisión' to estado_disponibilidad enum
ALTER TYPE public.estado_disponibilidad ADD VALUE IF NOT EXISTS 'En revisión';

-- Table for multiple photos per lot
CREATE TABLE IF NOT EXISTS public.fotos_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  url text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fotos_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fotos visibles para todos" ON public.fotos_lotes FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert fotos" ON public.fotos_lotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update fotos" ON public.fotos_lotes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete fotos" ON public.fotos_lotes FOR DELETE TO authenticated USING (true);

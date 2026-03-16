
-- Table for diagnosticos
CREATE TABLE public.diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  nombre text,
  email text,
  ciudad text,
  area_m2 numeric,
  notas text
);

ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Cualquiera puede crear diagnostico"
ON public.diagnosticos FOR INSERT TO public
WITH CHECK (true);

-- Admin/asesor can view
CREATE POLICY "Admin/asesor ven diagnosticos"
ON public.diagnosticos FOR SELECT TO authenticated
USING (is_admin_or_asesor(auth.uid()));

-- Public can count (for the landing stats)
CREATE POLICY "Conteo publico diagnosticos"
ON public.diagnosticos FOR SELECT TO anon
USING (true);

-- Add has_resolutoria to lotes
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS has_resolutoria boolean DEFAULT false;

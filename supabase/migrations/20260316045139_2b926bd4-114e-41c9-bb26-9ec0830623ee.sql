
-- Add owner_id and es_publico columns to lotes
ALTER TABLE public.lotes ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.lotes ADD COLUMN es_publico boolean NOT NULL DEFAULT true;

-- Drop existing RLS policies on lotes
DROP POLICY IF EXISTS "Lotes visibles para todos" ON public.lotes;
DROP POLICY IF EXISTS "Admin/asesor insertan lotes" ON public.lotes;
DROP POLICY IF EXISTS "Admin/asesor actualizan lotes" ON public.lotes;
DROP POLICY IF EXISTS "Admin/asesor eliminan lotes" ON public.lotes;

-- SELECT: anon sees only public lots; authenticated sees public + own + admin sees all
CREATE POLICY "Anon ven lotes publicos"
ON public.lotes FOR SELECT TO anon
USING (es_publico = true);

CREATE POLICY "Auth ven lotes publicos y propios"
ON public.lotes FOR SELECT TO authenticated
USING (
  es_publico = true
  OR owner_id = auth.uid()
  OR is_admin_or_asesor(auth.uid())
);

-- INSERT: admin/asesor can insert anything; authenticated users can insert with their own owner_id
CREATE POLICY "Admin/asesor insertan lotes"
ON public.lotes FOR INSERT TO authenticated
WITH CHECK (
  is_admin_or_asesor(auth.uid())
  OR owner_id = auth.uid()
);

-- UPDATE: admin/asesor or owner
CREATE POLICY "Admin/asesor o dueno actualizan lotes"
ON public.lotes FOR UPDATE TO authenticated
USING (
  is_admin_or_asesor(auth.uid())
  OR owner_id = auth.uid()
);

-- DELETE: admin/asesor or owner
CREATE POLICY "Admin/asesor o dueno eliminan lotes"
ON public.lotes FOR DELETE TO authenticated
USING (
  is_admin_or_asesor(auth.uid())
  OR owner_id = auth.uid()
);

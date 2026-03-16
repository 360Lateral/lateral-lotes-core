
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated insert fotos" ON public.fotos_lotes;
DROP POLICY IF EXISTS "Authenticated update fotos" ON public.fotos_lotes;
DROP POLICY IF EXISTS "Authenticated delete fotos" ON public.fotos_lotes;

-- Recreate with proper restrictions
CREATE POLICY "Authenticated insert fotos" ON public.fotos_lotes
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_asesor(auth.uid()));

CREATE POLICY "Authenticated update fotos" ON public.fotos_lotes
  FOR UPDATE TO authenticated
  USING (is_admin_or_asesor(auth.uid()));

CREATE POLICY "Authenticated delete fotos" ON public.fotos_lotes
  FOR DELETE TO authenticated
  USING (is_admin_or_asesor(auth.uid()));

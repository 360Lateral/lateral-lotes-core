
-- Drop public SELECT policies on all 7 analisis_* tables
DROP POLICY IF EXISTS "Visible para todos" ON public.analisis_juridico;
DROP POLICY IF EXISTS "Visible para todos" ON public.analisis_ambiental;
DROP POLICY IF EXISTS "Visible para todos" ON public.analisis_sspp;
DROP POLICY IF EXISTS "Visible para todos" ON public.analisis_geotecnico;
DROP POLICY IF EXISTS "Visible para todos" ON public.analisis_mercado;
DROP POLICY IF EXISTS "Visible para todos" ON public.analisis_arquitectonico;
DROP POLICY IF EXISTS "Visible para todos" ON public.analisis_financiero;

-- Create authenticated-only SELECT policies
CREATE POLICY "Authenticated select analisis_juridico" ON public.analisis_juridico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated select analisis_ambiental" ON public.analisis_ambiental FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated select analisis_sspp" ON public.analisis_sspp FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated select analisis_geotecnico" ON public.analisis_geotecnico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated select analisis_mercado" ON public.analisis_mercado FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated select analisis_arquitectonico" ON public.analisis_arquitectonico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated select analisis_financiero" ON public.analisis_financiero FOR SELECT TO authenticated USING (true);

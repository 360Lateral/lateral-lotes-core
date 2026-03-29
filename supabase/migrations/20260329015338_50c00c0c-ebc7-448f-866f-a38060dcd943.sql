
DROP POLICY "Conteo publico diagnosticos" ON public.diagnosticos;

CREATE POLICY "Anon no lee diagnosticos"
ON public.diagnosticos
FOR SELECT
TO anon
USING (false);

CREATE OR REPLACE FUNCTION public.count_diagnosticos()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.diagnosticos;
$$;

CREATE OR REPLACE FUNCTION public.listar_barrios_municipio(_departamento text, _ciudad text)
RETURNS TABLE(barrio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT initcap(trim(l.barrio))
  FROM public.lotes l
  WHERE auth.uid() IS NOT NULL
    AND l.barrio IS NOT NULL AND trim(l.barrio) <> ''
    AND lower(trim(l.ciudad)) = lower(trim(_ciudad))
    AND (_departamento IS NULL OR l.departamento IS NULL OR lower(trim(l.departamento)) = lower(trim(_departamento)))
  ORDER BY 1
  LIMIT 500;
$$;
REVOKE ALL ON FUNCTION public.listar_barrios_municipio(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_barrios_municipio(text, text) TO authenticated;
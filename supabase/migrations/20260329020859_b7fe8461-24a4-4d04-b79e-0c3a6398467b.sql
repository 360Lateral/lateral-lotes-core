
-- Fix pot_poligonos: restrict INSERT to admin only (was public)
DROP POLICY IF EXISTS "pot_insercion_anon" ON public.pot_poligonos;
CREATE POLICY "Admin insert pot_poligonos"
  ON public.pot_poligonos FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_asesor(auth.uid()));

-- Fix search_path format (remove space that may trigger linter)
CREATE OR REPLACE FUNCTION public.consultar_norma_por_punto(p_lat double precision, p_lng double precision)
 RETURNS TABLE(poligono_norma text, tratamiento text, uso_principal text, usos_compatibles text[], ic_base numeric, ic_maximo numeric, io numeric, altura_max_pisos integer, altura_max_m numeric, densidad_max integer, cesion_tipo_a numeric, cesion_tipo_b numeric, zona_homogenea text, norma_vigente text, municipio text, fuente text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  select
    p.poligono_norma, p.tratamiento, p.uso_principal, p.usos_compatibles,
    p.ic_base, p.ic_maximo, p.io, p.altura_max_pisos, p.altura_max_m,
    p.densidad_max, p.cesion_tipo_a, p.cesion_tipo_b, p.zona_homogenea,
    p.norma_vigente, p.municipio, p.fuente
  from public.pot_poligonos p
  where extensions.st_within(
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326),
    p.geom
  )
  limit 1;
END;
$$;

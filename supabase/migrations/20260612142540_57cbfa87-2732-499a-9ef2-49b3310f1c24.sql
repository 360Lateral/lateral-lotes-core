
GRANT SELECT ON public.precios_suscripcion TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.precios_suscripcion TO authenticated;
GRANT ALL ON public.precios_suscripcion TO service_role;

GRANT SELECT ON public.planes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planes TO authenticated;
GRANT ALL ON public.planes TO service_role;

GRANT SELECT ON public.salarios_minimos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salarios_minimos TO authenticated;
GRANT ALL ON public.salarios_minimos TO service_role;

GRANT SELECT ON public.vw_planes_con_precio TO anon, authenticated;
GRANT ALL ON public.vw_planes_con_precio TO service_role;

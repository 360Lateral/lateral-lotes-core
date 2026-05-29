CREATE OR REPLACE FUNCTION public.obtener_ficha_lote(p_lote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote      record;
  v_fotos     jsonb;
  v_propietario_nombre text;
BEGIN
  SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('encontrada', false);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('url', f.url, 'orden', f.orden) ORDER BY f.orden), '[]'::jsonb)
    INTO v_fotos
    FROM public.fotos_lotes f
   WHERE f.lote_id = p_lote_id;

  SELECT p.nombre INTO v_propietario_nombre
    FROM public.perfiles p
   WHERE p.id = v_lote.propietario_id;

  RETURN jsonb_build_object(
    'encontrada', true,
    'id', v_lote.id,
    'nombre_lote', v_lote.nombre_lote,
    'ciudad', v_lote.ciudad,
    'barrio', v_lote.barrio,
    'direccion', v_lote.direccion,
    'area_total_m2', v_lote.area_total_m2,
    'tipo_lote', v_lote.tipo_lote,
    'lat', v_lote.lat,
    'lng', v_lote.lng,
    'foto_url', v_lote.foto_url,
    'fotos', v_fotos,
    'precio_venta_estimado', CASE WHEN v_lote.publicado_venta THEN v_lote.precio_venta_estimado ELSE NULL END,
    'publicado_venta', v_lote.publicado_venta,
    'estado_publicacion', v_lote.estado_publicacion,
    'propietario_nombre', v_propietario_nombre,
    'tiene_analisis_juridico', EXISTS(SELECT 1 FROM public.analisis_juridico WHERE lote_id = p_lote_id),
    'tiene_analisis_ambiental', EXISTS(SELECT 1 FROM public.analisis_ambiental WHERE lote_id = p_lote_id),
    'tiene_analisis_arquitectonico', EXISTS(SELECT 1 FROM public.analisis_arquitectonico WHERE lote_id = p_lote_id),
    'tiene_analisis_financiero', EXISTS(SELECT 1 FROM public.analisis_financiero WHERE lote_id = p_lote_id),
    'tiene_analisis_geotecnico', EXISTS(SELECT 1 FROM public.analisis_geotecnico WHERE lote_id = p_lote_id),
    'tiene_analisis_mercado', EXISTS(SELECT 1 FROM public.analisis_mercado WHERE lote_id = p_lote_id),
    'tiene_analisis_sspp', EXISTS(SELECT 1 FROM public.analisis_sspp WHERE lote_id = p_lote_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_ficha_lote(uuid) TO anon, authenticated;
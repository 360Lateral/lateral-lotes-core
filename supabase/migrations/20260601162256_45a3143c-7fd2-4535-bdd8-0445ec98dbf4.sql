CREATE OR REPLACE FUNCTION public.obtener_lote_para_usuario(p_lote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid            uuid;
  v_nivel          public.nivel_suscripcion;
  v_es_propietario boolean;
  v_es_admin       boolean;
  v_tiene_nda      boolean;
  v_tiene_ppv      boolean := false;
  v_ppv_expira     timestamptz;
  v_lote           record;
  v_resultado      jsonb;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    v_nivel := 'gratuito';
  ELSE
    SELECT COALESCE(nivel_suscripcion, 'gratuito')
      INTO v_nivel
      FROM public.perfiles
     WHERE id = v_uid;
    IF v_nivel IS NULL THEN v_nivel := 'gratuito'; END IF;
  END IF;

  SELECT * INTO v_lote FROM public.lotes WHERE id = p_lote_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lote no encontrado');
  END IF;

  v_es_propietario := (v_uid IS NOT NULL AND v_lote.propietario_id = v_uid);
  v_es_admin := (v_uid IS NOT NULL AND public.is_admin_or_experto(v_uid));

  IF NOT v_es_propietario AND NOT v_es_admin THEN
    IF v_lote.publicado_venta IS NOT TRUE OR v_lote.estado_publicacion <> 'aprobado' THEN
      RETURN jsonb_build_object('error', 'Lote no disponible públicamente');
    END IF;
  END IF;

  IF v_uid IS NULL THEN
    v_tiene_nda := false;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.ndas_firmados
       WHERE desarrollador_id = v_uid
         AND lote_id = p_lote_id
    ) INTO v_tiene_nda;
  END IF;

  -- Pay-per-view: si tiene acceso vigente a este lote, elevar el nivel efectivo a premium
  IF v_uid IS NOT NULL THEN
    SELECT fecha_expiracion
      INTO v_ppv_expira
      FROM public.accesos_lote
     WHERE desarrollador_id = v_uid
       AND lote_id = p_lote_id
       AND estado = 'activa'
       AND fecha_expiracion > now()
     ORDER BY fecha_expiracion DESC
     LIMIT 1;
    IF v_ppv_expira IS NOT NULL THEN
      v_tiene_ppv := true;
      v_nivel := 'premium';
    END IF;
  END IF;

  v_resultado := jsonb_build_object(
    'lote_id', v_lote.id,
    'codigo_anonimo', 'LOTE-' || UPPER(SUBSTR(MD5(v_lote.id::text), 1, 4)),
    'ciudad', v_lote.ciudad,
    'barrio', v_lote.barrio,
    'nivel_usuario', v_nivel::text,
    'es_propietario', v_es_propietario,
    'es_admin', v_es_admin,
    'tiene_nda_firmado', v_tiene_nda,
    'requiere_nda_para_profesional', NOT v_tiene_nda,
    'acceso_por_ppv', v_tiene_ppv,
    'ppv_expira', v_ppv_expira,
    'categoria_area',
      CASE
        WHEN v_lote.area_total_m2 IS NULL THEN 'desconocida'
        WHEN v_lote.area_total_m2 < 500 THEN 'pequeño'
        WHEN v_lote.area_total_m2 < 1500 THEN 'mediano'
        WHEN v_lote.area_total_m2 < 5000 THEN 'grande'
        ELSE 'extra_grande'
      END,
    'rango_precio',
      CASE
        WHEN v_lote.precio_venta_estimado IS NULL THEN 'no_disponible'
        WHEN v_lote.precio_venta_estimado < 200000000 THEN 'rango_1'
        WHEN v_lote.precio_venta_estimado < 500000000 THEN 'rango_2'
        WHEN v_lote.precio_venta_estimado < 1000000000 THEN 'rango_3'
        WHEN v_lote.precio_venta_estimado < 3000000000 THEN 'rango_4'
        ELSE 'rango_5'
      END,
    'tipo_lote', v_lote.tipo_lote
  );

  IF v_es_propietario OR v_es_admin THEN
    v_resultado := v_resultado || jsonb_build_object(
      'nombre_lote', v_lote.nombre_lote,
      'direccion', v_lote.direccion,
      'matricula', v_lote.matricula_inmobiliaria,
      'area_total_m2', v_lote.area_total_m2,
      'lat', v_lote.lat,
      'lng', v_lote.lng,
      'estrato', v_lote.estrato,
      'precio_venta_estimado', v_lote.precio_venta_estimado,
      'foto_url', v_lote.foto_url,
      'notas', v_lote.notas,
      'propietario_id', v_lote.propietario_id,
      'estado_publicacion', v_lote.estado_publicacion,
      'publicado_venta', v_lote.publicado_venta,
      'acceso_completo', true
    );
    RETURN v_resultado;
  END IF;

  IF v_nivel IN ('basico','profesional','premium') THEN
    v_resultado := v_resultado || jsonb_build_object(
      'area_total_m2', v_lote.area_total_m2,
      'lat_zona', ROUND(v_lote.lat::numeric, 3),
      'lng_zona', ROUND(v_lote.lng::numeric, 3),
      'estrato', v_lote.estrato,
      'tipo_lote_detallado', v_lote.tipo_lote
    );
  END IF;

  IF v_nivel IN ('profesional','premium') AND v_tiene_nda THEN
    v_resultado := v_resultado || jsonb_build_object(
      'direccion', v_lote.direccion,
      'matricula', v_lote.matricula_inmobiliaria,
      'lat', v_lote.lat,
      'lng', v_lote.lng,
      'foto_url', v_lote.foto_url,
      'nombre_lote', v_lote.nombre_lote
    );
  END IF;

  IF v_nivel = 'premium' AND v_tiene_nda THEN
    v_resultado := v_resultado || jsonb_build_object(
      'precio_venta_estimado', v_lote.precio_venta_estimado,
      'notas', v_lote.notas,
      'tiene_analisis_juridico', EXISTS(SELECT 1 FROM public.analisis_juridico WHERE lote_id = p_lote_id),
      'tiene_analisis_ambiental', EXISTS(SELECT 1 FROM public.analisis_ambiental WHERE lote_id = p_lote_id),
      'tiene_analisis_arquitectonico', EXISTS(SELECT 1 FROM public.analisis_arquitectonico WHERE lote_id = p_lote_id),
      'tiene_analisis_financiero', EXISTS(SELECT 1 FROM public.analisis_financiero WHERE lote_id = p_lote_id),
      'tiene_analisis_geotecnico', EXISTS(SELECT 1 FROM public.analisis_geotecnico WHERE lote_id = p_lote_id),
      'tiene_analisis_mercado', EXISTS(SELECT 1 FROM public.analisis_mercado WHERE lote_id = p_lote_id),
      'tiene_analisis_sspp', EXISTS(SELECT 1 FROM public.analisis_sspp WHERE lote_id = p_lote_id)
    );
  END IF;

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_lote_para_usuario(uuid) TO anon, authenticated;
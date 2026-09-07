ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS es_ejemplo boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_lotes_es_ejemplo ON public.lotes (es_ejemplo) WHERE es_ejemplo;

CREATE OR REPLACE FUNCTION public.tiene_acceso_ficha(_user_id uuid, _lote_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.lotes l WHERE l.id = _lote_id AND l.es_ejemplo)
      OR (_user_id IS NOT NULL AND public.has_lot_access(_user_id, _lote_id))
      OR (_user_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.accesos_lote a
             WHERE a.lote_id = _lote_id
               AND a.desarrollador_id = _user_id
               AND a.estado = 'activa'
               AND (a.fecha_expiracion IS NULL OR a.fecha_expiracion > now())))
      OR (_user_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.perfiles p
             WHERE p.id = _user_id
               AND COALESCE(p.nivel_suscripcion, 'gratuito') <> 'gratuito'));
$$;

CREATE OR REPLACE FUNCTION public.listar_catalogo_lotes()
RETURNS TABLE (
  id uuid,
  nombre_lote text,
  ciudad text,
  barrio text,
  departamento text,
  area_total_m2 numeric,
  estado_disponibilidad public.estado_disponibilidad,
  lat numeric,
  lng numeric,
  score_juridico numeric,
  score_normativo numeric,
  score_servicios numeric,
  es_publico boolean,
  es_ejemplo boolean,
  foto_url text,
  tipo_lote text,
  created_at timestamptz,
  precio_m2 numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_full boolean := false;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT COALESCE(
             (SELECT COALESCE(p.nivel_suscripcion, 'gratuito') <> 'gratuito'
                FROM public.perfiles p WHERE p.id = v_uid), false)
           OR public.is_admin_or_experto(v_uid)
           OR EXISTS (SELECT 1 FROM public.accesos_lote a
                       WHERE a.desarrollador_id = v_uid
                         AND a.estado = 'activa'
                         AND (a.fecha_expiracion IS NULL OR a.fecha_expiracion > now()))
      INTO v_full;
  END IF;

  RETURN QUERY
  SELECT l.id,
         l.nombre_lote,
         l.ciudad,
         l.barrio,
         l.departamento,
         l.area_total_m2,
         l.estado_disponibilidad,
         (round(l.lat / 0.005) * 0.005)::numeric,
         (round(l.lng / 0.005) * 0.005)::numeric,
         l.score_juridico,
         l.score_normativo,
         l.score_servicios,
         l.es_publico,
         l.es_ejemplo,
         l.foto_url,
         l.tipo_lote,
         l.created_at,
         (SELECT pr.precio_m2_cop FROM public.precios pr WHERE pr.lote_id = l.id LIMIT 1)
    FROM public.lotes l
   WHERE (l.es_publico AND l.es_ejemplo)
      OR (v_full AND l.es_publico)
      OR (v_uid IS NOT NULL AND (l.owner_id = v_uid OR l.propietario_id = v_uid));
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_catalogo_lotes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tiene_acceso_ficha(uuid, uuid) TO anon, authenticated;

REVOKE SELECT ON public.vw_lotes_publicos FROM anon;

DROP POLICY IF EXISTS "Fotos de lotes publicos visibles a todos" ON public.fotos_lotes;
CREATE POLICY "Fotos de lotes de ejemplo visibles a todos"
ON public.fotos_lotes FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.lotes l WHERE l.id = fotos_lotes.lote_id AND l.es_publico AND l.es_ejemplo));

DROP POLICY IF EXISTS "Precios visibles para lotes publicos" ON public.precios;
CREATE POLICY "Precios visibles para lotes de ejemplo"
ON public.precios FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.lotes l WHERE l.id = precios.lote_id AND l.es_publico AND l.es_ejemplo));

CREATE OR REPLACE FUNCTION public.obtener_ficha_lote(p_lote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
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

  IF NOT public.tiene_acceso_ficha(auth.uid(), p_lote_id) THEN
    RETURN jsonb_build_object(
      'encontrada', true,
      'acceso', false,
      'id', v_lote.id,
      'nombre_lote', v_lote.nombre_lote,
      'ciudad', v_lote.ciudad
    );
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
    'acceso', true,
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
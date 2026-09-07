DROP FUNCTION IF EXISTS public.listar_catalogo_lotes();
CREATE FUNCTION public.listar_catalogo_lotes()
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
  score_juridico integer,
  score_normativo integer,
  score_servicios integer,
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
         (SELECT pr.precio_m2_cop FROM public.precios pr WHERE pr.lote_id = l.id LIMIT 1)::numeric
    FROM public.lotes l
   WHERE (l.es_publico AND l.es_ejemplo)
      OR (v_full AND l.es_publico)
      OR (v_uid IS NOT NULL AND (l.owner_id = v_uid OR l.propietario_id = v_uid));
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_catalogo_lotes() TO anon, authenticated;
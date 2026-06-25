
CREATE OR REPLACE FUNCTION public.obtener_ficha_publica_enriquecida(p_lote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_publico boolean;
  v_arq jsonb;
  v_fin jsonb;
  v_mkt jsonb;
BEGIN
  SELECT es_publico INTO v_es_publico FROM public.lotes WHERE id = p_lote_id;
  IF NOT COALESCE(v_es_publico, false) THEN
    RETURN jsonb_build_object('es_publico', false);
  END IF;

  SELECT to_jsonb(a) - 'id' - 'lote_id' - 'engagement_id' - 'experto_id' - 'completado_por'
    INTO v_arq
    FROM public.analisis_arquitectonico a
    WHERE a.lote_id = p_lote_id
    ORDER BY a.updated_at DESC NULLS LAST
    LIMIT 1;

  SELECT to_jsonb(f) - 'id' - 'lote_id' - 'engagement_id' - 'experto_id' - 'completado_por'
    INTO v_fin
    FROM public.analisis_financiero f
    WHERE f.lote_id = p_lote_id
    ORDER BY f.updated_at DESC NULLS LAST
    LIMIT 1;

  SELECT to_jsonb(m) - 'id' - 'lote_id' - 'engagement_id' - 'experto_id' - 'completado_por'
    INTO v_mkt
    FROM public.analisis_mercado m
    WHERE m.lote_id = p_lote_id
    ORDER BY m.updated_at DESC NULLS LAST
    LIMIT 1;

  RETURN jsonb_build_object(
    'es_publico', true,
    'arquitectonico', v_arq,
    'financiero', v_fin,
    'mercado', v_mkt
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_ficha_publica_enriquecida(uuid) TO anon, authenticated;

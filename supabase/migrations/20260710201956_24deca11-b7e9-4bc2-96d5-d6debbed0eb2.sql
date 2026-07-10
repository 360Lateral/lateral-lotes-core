CREATE OR REPLACE FUNCTION public.obtener_ficha_publica_enriquecida(p_lote_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_es_publico boolean;
  v_arq jsonb;
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

  RETURN jsonb_build_object(
    'es_publico', true,
    'arquitectonico', v_arq,
    'financiero', NULL,
    'mercado', NULL
  );
END;
$function$;
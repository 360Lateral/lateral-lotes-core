do $$
declare d text;
begin
  d := pg_get_functiondef('public.obtener_lote_para_usuario'::regproc);
  d := replace(d, $r$  IF v_es_propietario OR v_es_admin THEN
    v_resultado := v_resultado || jsonb_build_object($r$, $r$  IF v_es_propietario OR v_es_admin OR COALESCE(v_lote.es_ejemplo, false) THEN
    v_resultado := v_resultado || jsonb_build_object(
      'es_ejemplo', COALESCE(v_lote.es_ejemplo, false),$r$);
  if position('''es_ejemplo'', COALESCE' in d) = 0 then raise exception 'patron no encontrado'; end if;
  execute d;
end $$;
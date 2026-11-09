CREATE POLICY permiso_solicitar_diagnostico ON public.diagnosticos AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.tiene_permiso(auth.uid(), 'contratar_diagnostico'));
CREATE TRIGGER permiso_solicitar_diagnostico BEFORE INSERT ON public.diagnosticos
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('contratar_diagnostico');
CREATE POLICY permiso_subir_documento_comisionista ON public.documentos_comisionista AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.tiene_permiso(auth.uid(), 'subir_documentos'));
CREATE TRIGGER permiso_subir_documento_comisionista BEFORE INSERT ON public.documentos_comisionista
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('subir_documentos');

CREATE OR REPLACE FUNCTION public.permite_cambio_publicacion_lote(p_id uuid, p_publicado boolean, p_publico boolean, p_estado public.estado_publicacion_lote)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.tiene_permiso(auth.uid(), 'publicar_activo') OR EXISTS (
    SELECT 1 FROM public.lotes l WHERE l.id = p_id
      AND NOT (COALESCE(p_publicado, false) AND p_publicado IS DISTINCT FROM l.publicado_venta)
      AND NOT (COALESCE(p_publico, false) AND p_publico IS DISTINCT FROM l.es_publico)
      AND NOT (p_estado IN ('pendiente_validacion', 'aprobado') AND p_estado IS DISTINCT FROM l.estado_publicacion)
  );
$$;
REVOKE ALL ON FUNCTION public.permite_cambio_publicacion_lote(uuid, boolean, boolean, public.estado_publicacion_lote) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.permite_cambio_publicacion_lote(uuid, boolean, boolean, public.estado_publicacion_lote) TO authenticated, service_role;
CREATE POLICY permiso_publicar_update ON public.lotes AS RESTRICTIVE FOR UPDATE TO authenticated
WITH CHECK (public.permite_cambio_publicacion_lote(id, publicado_venta, es_publico, estado_publicacion));

DO $$
DECLARE r record; v_def text;
BEGIN
  FOR r IN SELECT oid,proname FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname IN ('activar_engagement', 'importar_engagement_historico')
  LOOP
    v_def := regexp_replace(pg_get_functiondef(r.oid), E'\\mBEGIN\\M', 'BEGIN' || chr(10) || '  PERFORM public.exigir_permiso_accion(''contratar_diagnostico'');', 'i');
    EXECUTE v_def;
  END LOOP;
END $$;
-- Internal payment activation remains available to system callbacks without a user session.
DO $$
DECLARE r record; v_def text;
BEGIN
  FOR r IN SELECT oid FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname IN ('activar_engagement_post_pago', 'reintentar_activacion_transaccion')
  LOOP
    v_def := regexp_replace(pg_get_functiondef(r.oid), E'\\mBEGIN\\M', 'BEGIN' || chr(10) || '  IF auth.uid() IS NOT NULL THEN PERFORM public.exigir_permiso_accion(''contratar_diagnostico''); END IF;', 'i');
    EXECUTE v_def;
  END LOOP;
END $$;
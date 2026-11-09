CREATE OR REPLACE FUNCTION public.exigir_permiso_accion(p_permiso text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.tiene_permiso(auth.uid(), p_permiso) THEN
    RAISE EXCEPTION 'Acción no permitida: %', p_permiso USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.exigir_permiso_accion(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exigir_permiso_accion(text) TO authenticated, service_role;

-- Keep the existing authorization and business logic; prepend the permission guard.
DO $$
DECLARE r record; v_def text; v_permission text;
BEGIN
  FOR r IN SELECT p.oid, p.proname FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('solicitar_diagnostico', 'crear_engagement', 'activar_engagement_gratuito', 'revocar_autorizacion_comisionista', 'cerrar_venta')
  LOOP
    v_permission := CASE
      WHEN r.proname = 'revocar_autorizacion_comisionista' THEN 'gestionar_comisionistas'
      WHEN r.proname = 'cerrar_venta' THEN 'sala_negociacion'
      ELSE 'contratar_diagnostico' END;
    v_def := pg_get_functiondef(r.oid);
    v_def := regexp_replace(v_def, E'\\mBEGIN\\M', 'BEGIN' || chr(10) || format('  PERFORM public.exigir_permiso_accion(%L);', v_permission), 'i');
    EXECUTE v_def;
  END LOOP;
END $$;

-- Restrictive policies intersect every existing permissive policy, without widening access.
CREATE POLICY permiso_publicar_insert ON public.lotes AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.tiene_permiso(auth.uid(), 'publicar_activo'));
CREATE POLICY permiso_contratar_insert ON public.engagements_lote AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.tiene_permiso(auth.uid(), 'contratar_diagnostico'));
CREATE POLICY permiso_subir_docs ON public.documentos_subidos_engagement AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.tiene_permiso(auth.uid(), 'subir_documentos'));
CREATE POLICY permiso_escribir_asesor ON public.mensajes_asesor_engagement AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.tiene_permiso(auth.uid(), 'escribir_asesor'));
CREATE POLICY permiso_gestionar_comisionistas ON public.autorizaciones_comisionista AS RESTRICTIVE FOR ALL TO authenticated
USING (public.tiene_permiso(auth.uid(), 'gestionar_comisionistas'))
WITH CHECK (public.tiene_permiso(auth.uid(), 'gestionar_comisionistas'));
CREATE POLICY permiso_sala_negociaciones ON public.negociaciones AS RESTRICTIVE FOR ALL TO authenticated
USING (public.tiene_permiso(auth.uid(), 'sala_negociacion'))
WITH CHECK (public.tiene_permiso(auth.uid(), 'sala_negociacion'));
CREATE POLICY permiso_sala_mensajes ON public.mensajes AS RESTRICTIVE FOR ALL TO authenticated
USING (public.tiene_permiso(auth.uid(), 'sala_negociacion'))
WITH CHECK (public.tiene_permiso(auth.uid(), 'sala_negociacion'));
CREATE POLICY permiso_subir_analisis_docs ON public.analisis_documentos AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.tiene_permiso(auth.uid(), 'subir_documentos'));
CREATE POLICY permiso_pago_diagnostico ON public.transacciones AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (tipo_pago <> 'diagnostico' OR public.tiene_permiso(auth.uid(), 'contratar_diagnostico'));

CREATE POLICY permiso_subir_storage ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (
  (bucket_id NOT IN ('docs-cliente', 'documentos') OR public.tiene_permiso(auth.uid(), 'subir_documentos'))
  AND (bucket_id <> 'documentos-comisionistas' OR public.tiene_permiso(auth.uid(), 'gestionar_comisionistas'))
);
CREATE POLICY permiso_actualizar_storage ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (
  (bucket_id NOT IN ('docs-cliente', 'documentos') OR public.tiene_permiso(auth.uid(), 'subir_documentos'))
  AND (bucket_id <> 'documentos-comisionistas' OR public.tiene_permiso(auth.uid(), 'gestionar_comisionistas'))
)
WITH CHECK (
  (bucket_id NOT IN ('docs-cliente', 'documentos') OR public.tiene_permiso(auth.uid(), 'subir_documentos'))
  AND (bucket_id <> 'documentos-comisionistas' OR public.tiene_permiso(auth.uid(), 'gestionar_comisionistas'))
);

-- Triggers enforce direct writes even from security-definer functions that bypass RLS.
CREATE OR REPLACE FUNCTION public.validar_permiso_escritura_accion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Background payment webhooks and system processes have no authenticated actor.
  IF auth.uid() IS NOT NULL THEN
    IF TG_TABLE_NAME = 'lotes' THEN
      IF TG_OP = 'INSERT' THEN
        PERFORM public.exigir_permiso_accion('publicar_activo');
      ELSIF (NEW.publicado_venta AND NEW.publicado_venta IS DISTINCT FROM OLD.publicado_venta)
         OR (NEW.es_publico AND NEW.es_publico IS DISTINCT FROM OLD.es_publico)
         OR (NEW.estado_publicacion IN ('pendiente_validacion', 'aprobado') AND NEW.estado_publicacion IS DISTINCT FROM OLD.estado_publicacion) THEN
        PERFORM public.exigir_permiso_accion('publicar_activo');
      END IF;
    ELSIF TG_TABLE_NAME = 'engagements_lote' THEN
      IF TG_OP = 'INSERT' OR NEW.estado_activacion IS DISTINCT FROM OLD.estado_activacion THEN
        PERFORM public.exigir_permiso_accion('contratar_diagnostico');
      END IF;
    ELSE
      PERFORM public.exigir_permiso_accion(TG_ARGV[0]);
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validar_permiso_escritura_accion() FROM PUBLIC;
CREATE TRIGGER permiso_publicar_activo BEFORE INSERT OR UPDATE ON public.lotes
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('publicar_activo');
CREATE TRIGGER permiso_contratar_diagnostico BEFORE INSERT OR UPDATE ON public.engagements_lote
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('contratar_diagnostico');
CREATE TRIGGER permiso_subir_documentos BEFORE INSERT ON public.documentos_subidos_engagement
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('subir_documentos');
CREATE TRIGGER permiso_escribir_asesor BEFORE INSERT ON public.mensajes_asesor_engagement
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('escribir_asesor');
CREATE TRIGGER permiso_gestionar_comisionistas BEFORE INSERT OR UPDATE OR DELETE ON public.autorizaciones_comisionista
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('gestionar_comisionistas');
CREATE TRIGGER permiso_sala_negociacion BEFORE INSERT OR UPDATE OR DELETE ON public.negociaciones
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('sala_negociacion');
CREATE TRIGGER permiso_sala_mensaje BEFORE INSERT OR UPDATE OR DELETE ON public.mensajes
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('sala_negociacion');
CREATE TRIGGER permiso_subir_analisis_documentos BEFORE INSERT ON public.analisis_documentos
FOR EACH ROW EXECUTE FUNCTION public.validar_permiso_escritura_accion('subir_documentos');
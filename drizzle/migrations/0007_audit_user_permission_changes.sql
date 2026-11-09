CREATE TABLE public.audit_permisos_usuario (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 permiso text NOT NULL,
 habilitado_anterior boolean NOT NULL,
 habilitado_nuevo boolean NOT NULL,
 cambiado_por uuid,
 cambiado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_permisos_usuario TO authenticated;
GRANT ALL ON public.audit_permisos_usuario TO service_role;
ALTER TABLE public.audit_permisos_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administrators read permission history" ON public.audit_permisos_usuario FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE OR REPLACE FUNCTION public.auditar_permiso_usuario() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE anterior boolean; nuevo boolean;
BEGIN
 anterior := CASE WHEN TG_OP = 'INSERT' THEN true ELSE OLD.habilitado END;
 nuevo := CASE WHEN TG_OP = 'DELETE' THEN true ELSE NEW.habilitado END;
 IF anterior IS DISTINCT FROM nuevo THEN
  INSERT INTO public.audit_permisos_usuario(user_id,permiso,habilitado_anterior,habilitado_nuevo,cambiado_por)
  VALUES (CASE WHEN TG_OP='DELETE' THEN OLD.user_id ELSE NEW.user_id END, CASE WHEN TG_OP='DELETE' THEN OLD.permiso ELSE NEW.permiso END, anterior,nuevo,auth.uid());
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 NEW.actualizado_por := auth.uid(); NEW.actualizado_en := now();
 RETURN NEW;
END $$;
CREATE TRIGGER auditar_permiso_usuario BEFORE INSERT OR UPDATE OR DELETE ON public.permisos_usuario FOR EACH ROW EXECUTE FUNCTION public.auditar_permiso_usuario();
CREATE OR REPLACE FUNCTION public.guardar_permisos_usuario(p_user_id uuid, p_permisos jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item record;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'Solo administradores pueden gestionar permisos' USING ERRCODE='42501'; END IF;
 IF p_user_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.perfiles WHERE id=p_user_id) THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
 IF jsonb_typeof(p_permisos) IS DISTINCT FROM 'object' OR p_permisos='{}'::jsonb THEN RAISE EXCEPTION 'Permisos inválidos'; END IF;
 FOR item IN SELECT key,value FROM jsonb_each(p_permisos) LOOP
  IF jsonb_typeof(item.value) <> 'boolean' OR NOT (item.key = ANY(ARRAY['ver_portafolio','ver_diagnosticos','publicar_activo','contratar_diagnostico','subir_documentos','escribir_asesor','gestionar_comisionistas','sala_negociacion'])) THEN RAISE EXCEPTION 'Permiso inválido'; END IF;
 END LOOP;
 FOR item IN SELECT key,value FROM jsonb_each(p_permisos) LOOP
  INSERT INTO public.permisos_usuario(user_id,permiso,habilitado) VALUES(p_user_id,item.key,(item.value::text)::boolean)
  ON CONFLICT(user_id,permiso) DO UPDATE SET habilitado=EXCLUDED.habilitado;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.guardar_permisos_usuario(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_permisos_usuario(uuid,jsonb) TO authenticated,service_role;
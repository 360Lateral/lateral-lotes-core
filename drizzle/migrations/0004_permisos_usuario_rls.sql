GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.permisos_usuario TO authenticated;
GRANT ALL ON TABLE public.permisos_usuario TO service_role;
REVOKE ALL ON TABLE public.permisos_usuario FROM anon;

ALTER TABLE public.permisos_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY permisos_usuario_admin_all
ON public.permisos_usuario
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY permisos_usuario_select_own
ON public.permisos_usuario
FOR SELECT TO authenticated
USING (user_id = auth.uid());
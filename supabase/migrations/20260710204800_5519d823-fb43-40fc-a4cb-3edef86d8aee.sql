
DROP POLICY IF EXISTS "Sistema borra" ON public.notificaciones_sla;
DROP POLICY IF EXISTS "Usuario marca leidas las suyas" ON public.notificaciones_sla;
DROP POLICY IF EXISTS "Usuario ve sus notificaciones" ON public.notificaciones_sla;

CREATE POLICY "Sistema borra" ON public.notificaciones_sla FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Usuario marca leidas las suyas" ON public.notificaciones_sla FOR UPDATE TO authenticated USING (destinatario_id = auth.uid());
CREATE POLICY "Usuario ve sus notificaciones" ON public.notificaciones_sla FOR SELECT TO authenticated USING (destinatario_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

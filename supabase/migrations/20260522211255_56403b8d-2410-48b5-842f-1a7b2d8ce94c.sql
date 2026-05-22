
-- 1. Remove public INSERT policies on notifications (triggers are SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS "Sistema inserta notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Sistema inserta" ON public.notificaciones_sla;

-- Authenticated users may insert notifications targeted at themselves (rare, but safe)
CREATE POLICY "Auth insert own notificaciones"
  ON public.notificaciones FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth insert own notificaciones_sla"
  ON public.notificaciones_sla FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = destinatario_id);

-- 2. Allow authenticated users to read their own diagnostics
CREATE POLICY "Users view own diagnosticos"
  ON public.diagnosticos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Allow client (cliente_id) to read their own engagement
CREATE POLICY "Cliente ve su engagement"
  ON public.engagements_lote FOR SELECT TO authenticated
  USING (cliente_id = auth.uid());

-- 4. Restrict mapgis_cache SELECT to owner (or admin/asesor)
DROP POLICY IF EXISTS "Usuarios ven cache mapgis" ON public.mapgis_cache;
CREATE POLICY "Usuarios ven su cache mapgis"
  ON public.mapgis_cache FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_asesor(auth.uid()));

-- 5. Tighten user_roles policy: scope to authenticated and add explicit WITH CHECK
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 6. Restrict fotos-lotes storage writes to admin/asesor or lot owner
DROP POLICY IF EXISTS "Auth users upload fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete fotos" ON storage.objects;

CREATE POLICY "Admin asesor upload fotos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos-lotes' AND public.is_admin_or_asesor(auth.uid()));

CREATE POLICY "Admin asesor update fotos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fotos-lotes' AND public.is_admin_or_asesor(auth.uid()));

CREATE POLICY "Admin asesor delete fotos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fotos-lotes' AND public.is_admin_or_asesor(auth.uid()));

-- 7. Convert views to SECURITY INVOKER to satisfy linter
ALTER VIEW public.lotes_publicos SET (security_invoker = true);
ALTER VIEW public.vw_portafolio_resumen SET (security_invoker = true);

-- 8. Set search_path on remaining functions
ALTER FUNCTION public.sync_plan_to_perfil() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

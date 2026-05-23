
-- 1) normativa_urbana: restrict SELECT
DROP POLICY IF EXISTS "Normativa visible para todos" ON public.normativa_urbana;

CREATE POLICY "Normativa visible con acceso al lote"
ON public.normativa_urbana
FOR SELECT
TO authenticated
USING (public.has_lot_access(auth.uid(), lote_id));

CREATE POLICY "Normativa de lotes publicos visible anon"
ON public.normativa_urbana
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM public.lotes l
  WHERE l.id = normativa_urbana.lote_id AND l.es_publico = true
));

-- 2) notificaciones_sla: remove user-facing INSERT policy
DROP POLICY IF EXISTS "Auth insert own notificaciones_sla" ON public.notificaciones_sla;

-- 3) perfiles: tighten counterpart visibility to require contacto_visible
DROP POLICY IF EXISTS "Negotiation participants view counterpart profiles" ON public.perfiles;

CREATE POLICY "Negotiation counterpart profile only when contact visible"
ON public.perfiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.negociaciones n
    WHERE n.contacto_visible = true
      AND (
        (n.developer_id = auth.uid() AND n.owner_id = perfiles.id)
        OR (n.owner_id = auth.uid() AND n.developer_id = perfiles.id)
      )
  )
);

-- 4) suscripciones: scope to authenticated only
DROP POLICY IF EXISTS "usuario_ve_su_suscripcion" ON public.suscripciones;
DROP POLICY IF EXISTS "admin_ve_todas" ON public.suscripciones;

CREATE POLICY "Usuario ve su suscripcion"
ON public.suscripciones
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin gestiona suscripciones"
ON public.suscripciones
FOR ALL
TO authenticated
USING (public.is_super_admin_or_admin(auth.uid()))
WITH CHECK (public.is_super_admin_or_admin(auth.uid()));

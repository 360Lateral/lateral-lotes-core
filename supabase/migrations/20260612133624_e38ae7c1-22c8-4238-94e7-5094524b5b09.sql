-- Tighten usuario_owner mutations to admin-only (exclude experto)
DROP POLICY IF EXISTS "Admins manage usuario_owner" ON public.usuario_owner;

CREATE POLICY "Admins manage usuario_owner"
ON public.usuario_owner
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
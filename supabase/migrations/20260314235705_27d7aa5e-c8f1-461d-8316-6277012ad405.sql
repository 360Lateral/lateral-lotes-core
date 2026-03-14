
-- Replace the permissive notificaciones insert policy with one restricted to service role (trigger uses SECURITY DEFINER)
DROP POLICY "System insert notificaciones" ON public.notificaciones;

-- Only the trigger function (SECURITY DEFINER) inserts, so no user-facing INSERT policy needed.
-- The trigger runs as the function owner, bypassing RLS.

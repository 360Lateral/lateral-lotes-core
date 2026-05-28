
-- 1) Restrict perfiles "view all" to super_admin/admin only (remove experto blanket access).
DROP POLICY IF EXISTS "Admins view all profiles" ON public.perfiles;

CREATE POLICY "Super admin/admin view all profiles"
ON public.perfiles
FOR SELECT
TO authenticated
USING (public.is_super_admin_or_admin(auth.uid()));

-- Expertos can only see profiles of users tied to engagements they're assigned to
CREATE POLICY "Experto views profiles in their engagements"
ON public.perfiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'experto'
  )
  AND EXISTS (
    SELECT 1
    FROM public.engagements_lote e
    LEFT JOIN public.lotes l ON l.id = e.lote_id
    WHERE (e.asesor_asignado_id = auth.uid() OR e.gerente_id = auth.uid())
      AND (
        e.cliente_id = perfiles.id
        OR e.lead_id = perfiles.id
        OR l.owner_id = perfiles.id
        OR l.propietario_id = perfiles.id
      )
  )
);

-- 2) Tighten has_lot_access: engagement-based access only when the engagement is active
CREATE OR REPLACE FUNCTION public.has_lot_access(_user_id uuid, _lote_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.lotes l
    WHERE l.id = _lote_id
      AND (
        l.owner_id = _user_id
        OR public.is_admin_or_experto(_user_id)
        OR EXISTS (
          SELECT 1 FROM public.usuario_owner uo
          WHERE uo.user_id = _user_id AND uo.owner_id = l.owner_id
        )
        OR EXISTS (
          SELECT 1 FROM public.engagements_lote e
          WHERE e.lote_id = _lote_id
            AND (e.cliente_id = _user_id
                 OR e.asesor_asignado_id = _user_id
                 OR e.gerente_id = _user_id)
            AND e.estado_activacion NOT IN ('borrador', 'pendiente_pago')
        )
        OR EXISTS (
          SELECT 1 FROM public.ndas_firmados n
          WHERE n.lote_id = _lote_id AND n.desarrollador_id = _user_id
        )
      )
  )
$function$;

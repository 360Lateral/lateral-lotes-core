
-- 1) Engagement client visibility: hide borrador/pendiente_pago
DROP POLICY IF EXISTS "Cliente ve su engagement" ON public.engagements_lote;
CREATE POLICY "Cliente ve su engagement"
ON public.engagements_lote
FOR SELECT
TO authenticated
USING (
  cliente_id = auth.uid()
  AND estado_activacion NOT IN ('borrador','pendiente_pago')
);

-- 2) Remove public-lot bypass from has_lot_access so sensitive analysis data
-- is no longer readable by any authenticated user for public lots.
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
        )
        OR EXISTS (
          SELECT 1 FROM public.ndas_firmados n
          WHERE n.lote_id = _lote_id AND n.desarrollador_id = _user_id
        )
      )
  )
$function$;

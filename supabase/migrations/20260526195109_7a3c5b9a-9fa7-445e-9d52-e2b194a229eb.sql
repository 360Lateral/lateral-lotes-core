CREATE OR REPLACE FUNCTION public.user_has_engagement_on_lote(_user_id uuid, _lote_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.engagements_lote e
    WHERE e.lote_id = _lote_id
      AND (e.cliente_id = _user_id OR e.asesor_asignado_id = _user_id OR e.gerente_id = _user_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_nda_on_lote(_user_id uuid, _lote_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ndas_firmados n
    WHERE n.lote_id = _lote_id AND n.desarrollador_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_shares_owner_org(_user_id uuid, _owner_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_owner uo
    WHERE uo.user_id = _user_id AND uo.owner_id = _owner_id
  )
$$;

DROP POLICY IF EXISTS "Auth ven lotes propios y autorizados" ON public.lotes;

CREATE POLICY "Auth ven lotes propios y autorizados"
ON public.lotes FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR propietario_id = auth.uid()
  OR public.is_admin_or_experto(auth.uid())
  OR public.user_shares_owner_org(auth.uid(), owner_id)
  OR public.user_has_engagement_on_lote(auth.uid(), id)
  OR public.user_has_nda_on_lote(auth.uid(), id)
);
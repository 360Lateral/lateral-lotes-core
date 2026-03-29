
-- Create a SECURITY DEFINER helper to check lot access without recursion
CREATE OR REPLACE FUNCTION public.has_lot_access(_user_id uuid, _lote_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lotes l
    WHERE l.id = _lote_id
      AND (
        l.es_publico = true
        OR l.owner_id = _user_id
        OR public.is_admin_or_asesor(_user_id)
        OR EXISTS (
          SELECT 1 FROM public.usuario_owner uo
          WHERE uo.user_id = _user_id AND uo.owner_id = l.owner_id
        )
      )
  )
$$;

-- analisis_juridico
DROP POLICY IF EXISTS "Authenticated select analisis_juridico" ON public.analisis_juridico;
CREATE POLICY "Lot-scoped select analisis_juridico"
  ON public.analisis_juridico FOR SELECT TO authenticated
  USING (public.has_lot_access(auth.uid(), lote_id));

-- analisis_ambiental
DROP POLICY IF EXISTS "Authenticated select analisis_ambiental" ON public.analisis_ambiental;
CREATE POLICY "Lot-scoped select analisis_ambiental"
  ON public.analisis_ambiental FOR SELECT TO authenticated
  USING (public.has_lot_access(auth.uid(), lote_id));

-- analisis_sspp
DROP POLICY IF EXISTS "Authenticated select analisis_sspp" ON public.analisis_sspp;
CREATE POLICY "Lot-scoped select analisis_sspp"
  ON public.analisis_sspp FOR SELECT TO authenticated
  USING (public.has_lot_access(auth.uid(), lote_id));

-- analisis_geotecnico
DROP POLICY IF EXISTS "Authenticated select analisis_geotecnico" ON public.analisis_geotecnico;
CREATE POLICY "Lot-scoped select analisis_geotecnico"
  ON public.analisis_geotecnico FOR SELECT TO authenticated
  USING (public.has_lot_access(auth.uid(), lote_id));

-- analisis_mercado
DROP POLICY IF EXISTS "Authenticated select analisis_mercado" ON public.analisis_mercado;
CREATE POLICY "Lot-scoped select analisis_mercado"
  ON public.analisis_mercado FOR SELECT TO authenticated
  USING (public.has_lot_access(auth.uid(), lote_id));

-- analisis_arquitectonico
DROP POLICY IF EXISTS "Authenticated select analisis_arquitectonico" ON public.analisis_arquitectonico;
CREATE POLICY "Lot-scoped select analisis_arquitectonico"
  ON public.analisis_arquitectonico FOR SELECT TO authenticated
  USING (public.has_lot_access(auth.uid(), lote_id));

-- analisis_financiero
DROP POLICY IF EXISTS "Authenticated select analisis_financiero" ON public.analisis_financiero;
CREATE POLICY "Lot-scoped select analisis_financiero"
  ON public.analisis_financiero FOR SELECT TO authenticated
  USING (public.has_lot_access(auth.uid(), lote_id));

-- 1) Fix fotos_lotes: only public lots' photos visible to anon; authenticated users see based on lot access
DROP POLICY IF EXISTS "Fotos visibles para todos" ON public.fotos_lotes;

CREATE POLICY "Fotos de lotes publicos visibles a todos"
ON public.fotos_lotes
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lotes l
    WHERE l.id = fotos_lotes.lote_id
      AND l.es_publico = true
  )
);

CREATE POLICY "Fotos visibles a usuarios con acceso al lote"
ON public.fotos_lotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lotes l
    WHERE l.id = fotos_lotes.lote_id
      AND (
        l.owner_id = auth.uid()
        OR l.propietario_id = auth.uid()
        OR is_admin_or_experto(auth.uid())
        OR user_shares_owner_org(auth.uid(), l.owner_id)
        OR user_has_active_engagement_on_lote(auth.uid(), l.id)
        OR user_has_nda_on_lote(auth.uid(), l.id)
      )
  )
);

-- 2) Storage: enforce ownership on uploads to documentos-comisionistas
DROP POLICY IF EXISTS "auth upload doc comisionista" ON storage.objects;

CREATE POLICY "auth upload doc comisionista"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-comisionistas'
  AND owner = auth.uid()
);

-- 3) Transacciones: allow creator to view their own transactions
CREATE POLICY "Creador ve sus transacciones"
ON public.transacciones
FOR SELECT
TO authenticated
USING (creada_por = auth.uid());

-- 4) Fix SECURITY DEFINER views by setting security_invoker=true
ALTER VIEW public.lotes_publicos SET (security_invoker = true);
ALTER VIEW public.vw_portafolio_resumen SET (security_invoker = true);
ALTER VIEW public.vw_metricas_experto SET (security_invoker = true);
ALTER VIEW public.vw_planes_con_precio SET (security_invoker = true);
ALTER VIEW public.vw_mercado_publico SET (security_invoker = true);
ALTER VIEW public.vw_lotes_publicos SET (security_invoker = true);
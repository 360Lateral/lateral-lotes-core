
-- 1) Restringir lectura del bucket privado documentos-comisionistas
DROP POLICY IF EXISTS "auth read doc comisionista" ON storage.objects;
CREATE POLICY "auth read doc comisionista"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-comisionistas'
  AND (owner = auth.uid() OR public.is_admin_or_experto(auth.uid()))
);

-- 2) Endurecer el SELECT de lotes: los usuarios de engagement solo ven el lote
--    cuando el engagement NO está en borrador / pendiente_pago.
DROP POLICY IF EXISTS "Auth ven lotes propios y autorizados" ON public.lotes;
CREATE POLICY "Auth ven lotes propios y autorizados"
ON public.lotes
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR propietario_id = auth.uid()
  OR public.is_admin_or_experto(auth.uid())
  OR public.user_shares_owner_org(auth.uid(), owner_id)
  OR EXISTS (
    SELECT 1 FROM public.engagements_lote e
    WHERE e.lote_id = lotes.id
      AND (e.cliente_id = auth.uid()
           OR e.asesor_asignado_id = auth.uid()
           OR e.gerente_id = auth.uid())
      AND e.estado_activacion NOT IN ('borrador', 'pendiente_pago')
  )
  OR public.user_has_nda_on_lote(auth.uid(), id)
);

-- 3) Restringir tareas_analisis al equipo interno (admin / experto / asesor del engagement).
--    Los dueños del lote ya no ven datos internos de tareas; si necesitan progreso,
--    se les debe exponer vía un RPC curado.
DROP POLICY IF EXISTS "Visibles si puede ver engagement" ON public.tareas_analisis;
CREATE POLICY "Solo equipo interno ve tareas"
ON public.tareas_analisis
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_experto(auth.uid())
  OR public.es_experto_de_engagement(auth.uid(), engagement_id)
);

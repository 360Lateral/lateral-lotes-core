
-- Restore authenticated access to public lots (needed for catalog and detail pages)
DROP POLICY IF EXISTS "Auth ven lotes propios o admin" ON public.lotes;

CREATE POLICY "Auth ven lotes publicos y propios"
  ON public.lotes FOR SELECT TO authenticated
  USING (
    es_publico = true
    OR owner_id = auth.uid()
    OR is_admin_or_asesor(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.usuario_owner uo
      WHERE uo.user_id = auth.uid() AND uo.owner_id = lotes.owner_id
    )
  );

-- Recreate view as SECURITY INVOKER to fix linter warning
DROP VIEW IF EXISTS public.lotes_publicos;

CREATE VIEW public.lotes_publicos
WITH (security_invoker = on) AS
SELECT
  id, nombre_lote, ciudad, barrio, departamento, direccion,
  area_total_m2, lat, lng, estado_disponibilidad, tipo_lote,
  estrato, frente_ml, fondo_ml, destacado, foto_url, video_url,
  score_juridico, score_normativo, score_servicios,
  has_resolutoria, es_publico, owner_id, created_at, updated_at
FROM public.lotes
WHERE es_publico = true;

GRANT SELECT ON public.lotes_publicos TO anon, authenticated;

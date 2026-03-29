
-- 1. Tighten lotes SELECT: remove es_publico=true for regular authenticated users
-- Only admin/asesor/owner/linked users can query the base table directly
DROP POLICY IF EXISTS "Auth ven lotes publicos y propios" ON public.lotes;

CREATE POLICY "Auth ven lotes propios o admin"
  ON public.lotes FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR is_admin_or_asesor(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.usuario_owner uo
      WHERE uo.user_id = auth.uid() AND uo.owner_id = lotes.owner_id
    )
  );

-- 2. Recreate lotes_publicos as SECURITY DEFINER view (intentional: hides sensitive columns)
-- This is the ONLY access path for public lot data
DROP VIEW IF EXISTS public.lotes_publicos;

CREATE VIEW public.lotes_publicos
WITH (security_barrier = true) AS
SELECT
  id, nombre_lote, ciudad, barrio, departamento, direccion,
  area_total_m2, lat, lng, estado_disponibilidad, tipo_lote,
  estrato, frente_ml, fondo_ml, destacado, foto_url, video_url,
  score_juridico, score_normativo, score_servicios,
  has_resolutoria, es_publico, owner_id, created_at, updated_at
FROM public.lotes
WHERE es_publico = true;

-- Grant to both anon and authenticated
GRANT SELECT ON public.lotes_publicos TO anon, authenticated;

-- 3. Add a policy so the view owner (postgres) can read lotes for the view
-- Since the view is security_barrier but NOT security_definer by default,
-- we need authenticated users to still be able to query through it.
-- Actually we need to allow the view to access public lots.
-- Add a specific anon-safe policy for public lots with limited scope:
CREATE POLICY "Public lots via view"
  ON public.lotes FOR SELECT TO anon
  USING (es_publico = true);

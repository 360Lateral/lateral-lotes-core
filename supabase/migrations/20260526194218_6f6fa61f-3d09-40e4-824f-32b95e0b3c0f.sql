
-- Drop the policies that exposed full row of public lots
DROP POLICY IF EXISTS "Public lots via view" ON public.lotes;
DROP POLICY IF EXISTS "Auth ven lotes publicos y propios" ON public.lotes;

-- Recreate authenticated SELECT policy WITHOUT the broad es_publico branch.
-- Authenticated users only see their own lots, lots they manage (usuario_owner),
-- or admin/experto access. Public browsing must go through vw_lotes_publicos.
CREATE POLICY "Auth ven lotes propios y autorizados"
ON public.lotes
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR propietario_id = auth.uid()
  OR public.is_admin_or_experto(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.usuario_owner uo
    WHERE uo.user_id = auth.uid() AND uo.owner_id = lotes.owner_id
  )
  OR EXISTS (
    SELECT 1 FROM public.engagements_lote e
    WHERE e.lote_id = lotes.id
      AND (e.cliente_id = auth.uid() OR e.asesor_asignado_id = auth.uid() OR e.gerente_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.ndas_firmados n
    WHERE n.lote_id = lotes.id AND n.desarrollador_id = auth.uid()
  )
);

-- Safe public catalog view: only marketing-safe columns.
-- Excludes: matricula_inmobiliaria, nombre_propietario, propietario_id, owner_id,
-- tiene_deudas, problema_juridico, tiene_escritura, notas, notas_publicacion,
-- direccion, cbml.
CREATE OR REPLACE VIEW public.vw_lotes_publicos AS
SELECT
  id,
  nombre_lote,
  ciudad,
  barrio,
  departamento,
  estrato,
  lat,
  lng,
  area_total_m2,
  frente_ml,
  fondo_ml,
  estado_disponibilidad,
  destacado,
  score_juridico,
  score_normativo,
  score_servicios,
  score_ambiental,
  score_geotecnico,
  score_mercado,
  score_arquitectonico,
  score_financiero,
  has_resolutoria,
  foto_url,
  video_url,
  tipo_lote,
  es_publico,
  publicado_venta,
  estado_publicacion,
  precio_venta_estimado,
  created_at,
  updated_at
FROM public.lotes
WHERE es_publico = true;

-- View runs with definer privileges (default) to bypass base table RLS for safe columns only.
GRANT SELECT ON public.vw_lotes_publicos TO anon, authenticated;

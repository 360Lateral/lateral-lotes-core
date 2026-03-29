
-- Create a public-safe view that excludes sensitive owner/legal data
CREATE VIEW public.lotes_publicos AS
SELECT
  id, nombre_lote, ciudad, barrio, departamento, direccion,
  area_total_m2, lat, lng, estado_disponibilidad, tipo_lote,
  estrato, frente_ml, fondo_ml, destacado, foto_url, video_url,
  score_juridico, score_normativo, score_servicios, has_resolutoria,
  es_publico, owner_id, created_at, updated_at
FROM public.lotes
WHERE es_publico = true;

-- Grant anon access to the view
GRANT SELECT ON public.lotes_publicos TO anon;
GRANT SELECT ON public.lotes_publicos TO authenticated;

-- Remove anon direct access to lotes table
DROP POLICY "Anon ven lotes publicos" ON public.lotes;

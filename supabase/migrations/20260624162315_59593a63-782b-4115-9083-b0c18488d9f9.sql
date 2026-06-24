ALTER TABLE public.planes_diagnostico
  ADD COLUMN IF NOT EXISTS descripcion_corta text,
  ADD COLUMN IF NOT EXISTS para_quien text,
  ADD COLUMN IF NOT EXISTS recomendado boolean NOT NULL DEFAULT false;

DROP VIEW IF EXISTS public.vw_planes_con_precio;

CREATE VIEW public.vw_planes_con_precio AS
SELECT
  p.id,
  p.codigo,
  p.nombre,
  p.precio_smlmv,
  p.precio_cop AS precio_cop_legacy,
  COALESCE(
    (p.precio_smlmv * sm.valor_cop)::numeric,
    p.precio_cop,
    0
  )::numeric AS precio_cop_actual,
  p.moneda,
  p.dias_sla,
  p.orden,
  p.activo,
  p.descripcion_corta,
  p.para_quien,
  p.recomendado,
  COALESCE(sm.valor_cop, 0)::numeric AS smlmv_referencia,
  COALESCE(sm.anio, EXTRACT(YEAR FROM now())::int) AS smlmv_anio
FROM public.planes_diagnostico p
LEFT JOIN LATERAL (
  SELECT s.valor_cop, s.anio
  FROM public.salarios_minimos s
  WHERE s.vigente_hasta IS NULL
  ORDER BY s.vigente_desde DESC
  LIMIT 1
) sm ON true;

GRANT SELECT ON public.vw_planes_con_precio TO anon, authenticated;
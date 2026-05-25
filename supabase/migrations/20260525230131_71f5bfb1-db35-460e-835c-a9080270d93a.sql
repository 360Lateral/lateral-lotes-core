DROP VIEW IF EXISTS public.vw_portafolio_resumen;

CREATE VIEW public.vw_portafolio_resumen
WITH (security_invoker = true)
AS
SELECT
  e.id                                AS engagement_id,
  e.lote_id,
  l.nombre_lote                       AS lote_nombre,
  l.ciudad                            AS lote_ciudad,
  l.barrio                            AS lote_barrio,
  p.codigo                            AS plan_codigo,
  p.nombre                            AS plan_nombre,
  e.estado,
  e.estado_activacion,
  e.avance_pct,
  e.asesor_asignado_id                AS asesor_id,
  pa.nombre                           AS asesor_nombre,
  COALESCE(pc.nombre, lc.nombre)      AS cliente_nombre,
  GREATEST(0, (CURRENT_DATE - e.fecha_solicitud::date))::int AS dias_en_gestion,
  CASE
    WHEN e.fecha_sla_objetivo IS NULL THEN NULL
    ELSE (e.fecha_sla_objetivo::date - CURRENT_DATE)::int
  END                                 AS dias_para_sla,
  CASE
    WHEN e.fecha_sla_objetivo IS NULL THEN NULL
    WHEN (e.fecha_sla_objetivo::date - CURRENT_DATE) > 5 THEN 'verde'
    WHEN (e.fecha_sla_objetivo::date - CURRENT_DATE) >= 0 THEN 'ambar'
    ELSE 'rojo'
  END                                 AS semaforo_sla,
  e.estado_pago,
  e.precio_cobrado,
  e.moneda,
  COALESCE((
    SELECT COUNT(*)::int
      FROM public.tareas_analisis t
     WHERE t.engagement_id = e.id
       AND t.estado <> 'no_aplica'
  ), 0)                               AS n_analisis_total,
  COALESCE((
    SELECT COUNT(*)::int
      FROM public.tareas_analisis t
     WHERE t.engagement_id = e.id
       AND t.estado IN ('entregado','aprobado')
  ), 0)                               AS n_analisis_completados,
  EXISTS(
    SELECT 1
      FROM public.entregables_engagement ee
     WHERE ee.engagement_id = e.id
       AND ee.tipo = 'diagnostico_inmobiliario'
       AND ee.estado = 'publicado'
  )                                   AS tiene_diagnostico,
  EXISTS(
    SELECT 1
      FROM public.entregables_engagement ee
     WHERE ee.engagement_id = e.id
       AND ee.tipo = 'presentacion_diagnostico'
       AND ee.estado = 'publicado'
  )                                   AS tiene_presentacion,
  GREATEST(e.updated_at, COALESCE((
    SELECT MAX(t.updated_at)
      FROM public.tareas_analisis t
     WHERE t.engagement_id = e.id
  ), e.updated_at))                   AS ultima_actualizacion
FROM public.engagements_lote e
LEFT JOIN public.lotes l               ON l.id = e.lote_id
LEFT JOIN public.planes_diagnostico p  ON p.id = e.plan_id
LEFT JOIN public.perfiles pa           ON pa.id = e.asesor_asignado_id
LEFT JOIN public.perfiles pc           ON pc.id = e.cliente_id
LEFT JOIN public.leads lc              ON lc.id = e.lead_id
WHERE e.estado NOT IN ('cerrado','cancelado');

GRANT SELECT ON public.vw_portafolio_resumen TO authenticated;
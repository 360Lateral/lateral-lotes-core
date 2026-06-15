DROP VIEW IF EXISTS public.vw_portafolio_resumen;

CREATE VIEW public.vw_portafolio_resumen
WITH (security_invoker = true)
AS
WITH base AS (
  SELECT
    e.*,
    EXISTS(
      SELECT 1 FROM public.entregables_engagement ee
      WHERE ee.engagement_id = e.id
        AND ee.tipo = 'diagnostico_inmobiliario'
        AND ee.estado = 'publicado'
    ) AS _tiene_diagnostico,
    EXISTS(
      SELECT 1 FROM public.entregables_engagement ee
      WHERE ee.engagement_id = e.id
        AND ee.tipo = 'presentacion_diagnostico'
        AND ee.estado = 'publicado'
    ) AS _tiene_presentacion,
    COALESCE(
      e.fecha_entrega,
      (
        SELECT MAX(ee.updated_at)
        FROM public.entregables_engagement ee
        WHERE ee.engagement_id = e.id
          AND ee.tipo IN ('diagnostico_inmobiliario','presentacion_diagnostico')
          AND ee.estado = 'publicado'
      )
    ) AS _fecha_entrega_real
  FROM public.engagements_lote e
  WHERE e.estado NOT IN ('cerrado','cancelado')
)
SELECT
  b.id                                AS engagement_id,
  b.lote_id,
  l.nombre_lote                       AS lote_nombre,
  l.ciudad                            AS lote_ciudad,
  l.barrio                            AS lote_barrio,
  p.codigo                            AS plan_codigo,
  p.nombre                            AS plan_nombre,
  b.estado,
  b.estado_activacion,
  b.avance_pct,
  b.asesor_asignado_id                AS asesor_id,
  pa.nombre                           AS asesor_nombre,
  COALESCE(pc.nombre, lc.nombre)      AS cliente_nombre,

  GREATEST(0, (CURRENT_DATE - b.fecha_solicitud::date))::int AS dias_en_gestion,
  CASE
    WHEN b.fecha_sla_objetivo IS NULL THEN NULL
    ELSE (b.fecha_sla_objetivo::date - CURRENT_DATE)::int
  END                                 AS dias_para_sla,

  GREATEST(0, (CURRENT_DATE - b.fecha_solicitud::date))::int AS dias_transcurridos,
  CASE
    WHEN b.fecha_sla_objetivo IS NULL THEN NULL
    ELSE GREATEST(1, (b.fecha_sla_objetivo::date - b.fecha_solicitud::date))::int
  END                                 AS dias_totales_sla,

  CASE
    WHEN b.fecha_sla_objetivo IS NULL THEN NULL
    WHEN (b.fecha_sla_objetivo::date - CURRENT_DATE) > 5 THEN 'verde'
    WHEN (b.fecha_sla_objetivo::date - CURRENT_DATE) >= 0 THEN 'ambar'
    ELSE 'rojo'
  END                                 AS semaforo_sla,

  CASE
    WHEN (b._tiene_diagnostico AND b._tiene_presentacion) OR COALESCE(b.avance_pct,0) >= 100 THEN
      CASE
        WHEN b.fecha_sla_objetivo IS NULL THEN 'cumplido_a_tiempo'
        WHEN b._fecha_entrega_real IS NULL THEN 'cumplido_a_tiempo'
        WHEN b._fecha_entrega_real::date <= b.fecha_sla_objetivo::date THEN 'cumplido_a_tiempo'
        ELSE 'cumplido_con_retraso'
      END
    WHEN b.fecha_sla_objetivo IS NULL THEN NULL
    WHEN (b.fecha_sla_objetivo::date - CURRENT_DATE) < 0 THEN 'atrasado'
    WHEN (b.fecha_sla_objetivo::date - CURRENT_DATE) <= 5 THEN 'riesgo_fecha'
    WHEN (b.fecha_sla_objetivo::date - b.fecha_solicitud::date) > 0
      AND ((CURRENT_DATE - b.fecha_solicitud::date)::numeric / (b.fecha_sla_objetivo::date - b.fecha_solicitud::date)::numeric)
          > ((COALESCE(b.avance_pct, 0))::numeric / 100.0 + 0.2)
    THEN 'riesgo_ritmo'
    ELSE 'verde'
  END                                 AS sla_estado,

  ((b._tiene_diagnostico AND b._tiene_presentacion) OR COALESCE(b.avance_pct,0) >= 100)
                                       AS sla_cumplido,

  b._fecha_entrega_real                AS fecha_entrega_real,

  b.estado_pago,
  b.precio_cobrado,
  b.moneda,
  COALESCE((
    SELECT COUNT(*)::int
      FROM public.tareas_analisis t
     WHERE t.engagement_id = b.id
       AND t.estado <> 'no_aplica'
  ), 0)                               AS n_analisis_total,
  COALESCE((
    SELECT COUNT(*)::int
      FROM public.tareas_analisis t
     WHERE t.engagement_id = b.id
       AND t.estado IN ('entregado','aprobado')
  ), 0)                               AS n_analisis_completados,
  b._tiene_diagnostico                AS tiene_diagnostico,
  b._tiene_presentacion               AS tiene_presentacion,
  GREATEST(b.updated_at, COALESCE((
    SELECT MAX(t.updated_at)
      FROM public.tareas_analisis t
     WHERE t.engagement_id = b.id
  ), b.updated_at))                   AS ultima_actualizacion
FROM base b
LEFT JOIN public.lotes l               ON l.id = b.lote_id
LEFT JOIN public.planes_diagnostico p  ON p.id = b.plan_id
LEFT JOIN public.perfiles pa           ON pa.id = b.asesor_asignado_id
LEFT JOIN public.perfiles pc           ON pc.id = b.cliente_id
LEFT JOIN public.leads lc              ON lc.id = b.lead_id;

GRANT SELECT ON public.vw_portafolio_resumen TO authenticated;
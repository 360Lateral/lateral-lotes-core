CREATE OR REPLACE VIEW public.vw_metricas_experto
WITH (security_invoker = true)
AS
WITH base_experto AS (
  SELECT p.id, p.nombre, p.email
    FROM public.perfiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'experto'
),
m_propuestas AS (
  SELECT
    pe.experto_id,
    COUNT(*) FILTER (WHERE pe.estado IN ('enviada','ganadora','rechazada')) AS total_propuestas,
    COUNT(*) FILTER (WHERE pe.estado = 'ganadora')  AS propuestas_ganadas,
    COUNT(*) FILTER (WHERE pe.estado = 'rechazada') AS propuestas_rechazadas,
    COUNT(*) FILTER (WHERE pe.estado = 'retirada')  AS propuestas_retiradas,
    AVG(EXTRACT(EPOCH FROM (pe.fecha_propuesta - os.created_at))/3600)
      FILTER (WHERE pe.estado IN ('enviada','ganadora','rechazada')) AS tiempo_respuesta_horas_avg
  FROM public.propuestas_experto pe
  JOIN public.ordenes_servicio os ON os.id = pe.orden_id
  GROUP BY pe.experto_id
),
m_invitaciones AS (
  SELECT
    io.experto_id,
    COUNT(*) AS total_invitaciones,
    COUNT(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM public.propuestas_experto pe2
       WHERE pe2.orden_id = io.orden_id
         AND pe2.experto_id = io.experto_id
    )) AS invitaciones_respondidas
  FROM public.invitaciones_orden io
  GROUP BY io.experto_id
),
m_completados AS (
  SELECT
    pe.experto_id,
    COUNT(*) AS servicios_completados,
    AVG(EXTRACT(EPOCH FROM (ta.fecha_completado - ta.fecha_inicio))/86400)
      AS tiempo_entrega_dias_avg,
    SUM(
      CASE WHEN ta.fecha_completado IS NOT NULL AND ta.fecha_inicio IS NOT NULL
           AND EXTRACT(EPOCH FROM (ta.fecha_completado - ta.fecha_inicio))/86400 <= pe.plazo_propuesto_dias
           THEN 1 ELSE 0 END
    )::numeric / NULLIF(COUNT(*), 0) * 100 AS sla_cumplido_pct
  FROM public.propuestas_experto pe
  JOIN public.ordenes_servicio os
    ON os.id = pe.orden_id
   AND os.estado = 'completada'
   AND os.ganador_propuesta_id = pe.id
  JOIN public.tareas_analisis ta
    ON ta.engagement_id = os.engagement_id
   AND ta.tipo_analisis_id = os.tipo_analisis_id
   AND ta.estado IN ('entregado','aprobado')
  GROUP BY pe.experto_id
)
SELECT
  be.id AS experto_id,
  be.nombre,
  be.email,
  COALESCE(mp.total_propuestas, 0)        AS total_propuestas,
  COALESCE(mp.propuestas_ganadas, 0)       AS propuestas_ganadas,
  COALESCE(mp.propuestas_rechazadas, 0)    AS propuestas_rechazadas,
  COALESCE(mp.propuestas_retiradas, 0)     AS propuestas_retiradas,
  CASE WHEN COALESCE(mp.total_propuestas, 0) > 0
       THEN ROUND((mp.propuestas_ganadas::numeric / mp.total_propuestas::numeric) * 100, 1)
       ELSE NULL END                       AS tasa_adjudicacion_pct,
  ROUND(mp.tiempo_respuesta_horas_avg::numeric, 1) AS tiempo_respuesta_horas_avg,
  COALESCE(mi.total_invitaciones, 0)       AS total_invitaciones,
  COALESCE(mi.invitaciones_respondidas, 0) AS invitaciones_respondidas,
  CASE WHEN COALESCE(mi.total_invitaciones, 0) > 0
       THEN ROUND((mi.invitaciones_respondidas::numeric / mi.total_invitaciones::numeric) * 100, 1)
       ELSE NULL END                       AS tasa_respuesta_invitacion_pct,
  COALESCE(mc.servicios_completados, 0)    AS servicios_completados,
  ROUND(mc.tiempo_entrega_dias_avg::numeric, 1) AS tiempo_entrega_dias_avg,
  ROUND(mc.sla_cumplido_pct::numeric, 1)   AS sla_cumplido_pct
FROM base_experto be
LEFT JOIN m_propuestas   mp ON mp.experto_id = be.id
LEFT JOIN m_invitaciones mi ON mi.experto_id = be.id
LEFT JOIN m_completados  mc ON mc.experto_id = be.id;

GRANT SELECT ON public.vw_metricas_experto TO authenticated;
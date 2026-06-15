DROP VIEW IF EXISTS public.vw_portafolio_resumen;

CREATE VIEW public.vw_portafolio_resumen AS
WITH base AS (
  SELECT e.id, e.lote_id, e.plan_id, e.cliente_id, e.lead_id,
         e.asesor_asignado_id, e.gerente_id, e.estado,
         e.fecha_solicitud, e.fecha_inicio, e.fecha_sla_objetivo, e.fecha_entrega,
         e.precio_cobrado, e.moneda, e.estado_pago, e.avance_pct, e.notas,
         e.created_at, e.updated_at, e.mostrar_avance_al_cliente, e.estado_activacion,
         (EXISTS (SELECT 1 FROM entregables_engagement ee
                  WHERE ee.engagement_id = e.id
                    AND ee.tipo = 'diagnostico_inmobiliario'::tipo_entregable
                    AND ee.estado = 'publicado'::estado_entregable)) AS _tiene_diagnostico,
         (EXISTS (SELECT 1 FROM entregables_engagement ee
                  WHERE ee.engagement_id = e.id
                    AND ee.tipo = 'presentacion_diagnostico'::tipo_entregable
                    AND ee.estado = 'publicado'::estado_entregable)) AS _tiene_presentacion,
         (EXISTS (SELECT 1 FROM entregables_engagement ee
                  WHERE ee.engagement_id = e.id
                    AND ee.tipo IN ('diagnostico_inmobiliario'::tipo_entregable, 'presentacion_diagnostico'::tipo_entregable)
                    AND ee.estado = 'borrador'::estado_entregable)) AS _tiene_entregables_borrador,
         COALESCE(e.fecha_entrega,
                  (SELECT max(ee.updated_at) FROM entregables_engagement ee
                   WHERE ee.engagement_id = e.id
                     AND ee.tipo IN ('diagnostico_inmobiliario'::tipo_entregable, 'presentacion_diagnostico'::tipo_entregable)
                     AND ee.estado = 'publicado'::estado_entregable)) AS _fecha_entrega_real
  FROM engagements_lote e
  WHERE e.estado <> ALL (ARRAY['cerrado'::estado_engagement, 'cancelado'::estado_engagement])
)
SELECT b.id AS engagement_id,
       b.lote_id,
       l.nombre_lote AS lote_nombre,
       l.ciudad AS lote_ciudad,
       l.barrio AS lote_barrio,
       p.codigo AS plan_codigo,
       p.nombre AS plan_nombre,
       b.estado,
       b.estado_activacion,
       b.avance_pct,
       b.asesor_asignado_id AS asesor_id,
       pa.nombre AS asesor_nombre,
       COALESCE(pc.nombre, lc.nombre) AS cliente_nombre,
       GREATEST(0, CURRENT_DATE - b.fecha_solicitud::date) AS dias_en_gestion,
       CASE WHEN b.fecha_sla_objetivo IS NULL THEN NULL::integer
            ELSE b.fecha_sla_objetivo::date - CURRENT_DATE END AS dias_para_sla,
       GREATEST(0, CURRENT_DATE - b.fecha_solicitud::date) AS dias_transcurridos,
       CASE WHEN b.fecha_sla_objetivo IS NULL THEN NULL::integer
            ELSE GREATEST(1, b.fecha_sla_objetivo::date - b.fecha_solicitud::date) END AS dias_totales_sla,
       CASE WHEN b.fecha_sla_objetivo IS NULL THEN NULL::text
            WHEN (b.fecha_sla_objetivo::date - CURRENT_DATE) > 5 THEN 'verde'::text
            WHEN (b.fecha_sla_objetivo::date - CURRENT_DATE) >= 0 THEN 'ambar'::text
            ELSE 'rojo'::text END AS semaforo_sla,
       CASE
         WHEN (b._tiene_diagnostico AND b._tiene_presentacion) OR COALESCE(b.avance_pct, 0) >= 100 THEN
           CASE WHEN b.fecha_sla_objetivo IS NULL THEN 'cumplido_a_tiempo'::text
                WHEN b._fecha_entrega_real IS NULL THEN 'cumplido_a_tiempo'::text
                WHEN b._fecha_entrega_real::date <= b.fecha_sla_objetivo::date THEN 'cumplido_a_tiempo'::text
                ELSE 'cumplido_con_retraso'::text END
         WHEN b.fecha_sla_objetivo IS NULL THEN NULL::text
         WHEN (b.fecha_sla_objetivo::date - CURRENT_DATE) < 0 THEN 'atrasado'::text
         WHEN (b.fecha_sla_objetivo::date - CURRENT_DATE) <= 5 THEN 'riesgo_fecha'::text
         WHEN (b.fecha_sla_objetivo::date - b.fecha_solicitud::date) > 0
              AND ((CURRENT_DATE - b.fecha_solicitud::date)::numeric / (b.fecha_sla_objetivo::date - b.fecha_solicitud::date)::numeric)
                  > (COALESCE(b.avance_pct, 0) / 100.0 + 0.2)
           THEN 'riesgo_ritmo'::text
         ELSE 'verde'::text
       END AS sla_estado,
       ((b._tiene_diagnostico AND b._tiene_presentacion) OR COALESCE(b.avance_pct, 0) >= 100) AS sla_cumplido,
       b._fecha_entrega_real AS fecha_entrega_real,
       b.estado_pago,
       b.precio_cobrado,
       b.moneda,
       COALESCE((SELECT count(*)::integer FROM tareas_analisis t
                 WHERE t.engagement_id = b.id AND t.estado <> 'no_aplica'::estado_analisis), 0) AS n_analisis_total,
       COALESCE((SELECT count(*)::integer FROM tareas_analisis t
                 WHERE t.engagement_id = b.id
                   AND t.estado IN ('entregado'::estado_analisis, 'aprobado'::estado_analisis)), 0) AS n_analisis_completados,
       b._tiene_diagnostico AS tiene_diagnostico,
       b._tiene_presentacion AS tiene_presentacion,
       b._tiene_entregables_borrador AS tiene_entregables_borrador,
       GREATEST(b.updated_at,
                COALESCE((SELECT max(t.updated_at) FROM tareas_analisis t
                          WHERE t.engagement_id = b.id), b.updated_at)) AS ultima_actualizacion
FROM base b
LEFT JOIN lotes l ON l.id = b.lote_id
LEFT JOIN planes_diagnostico p ON p.id = b.plan_id
LEFT JOIN perfiles pa ON pa.id = b.asesor_asignado_id
LEFT JOIN perfiles pc ON pc.id = b.cliente_id
LEFT JOIN leads lc ON lc.id = b.lead_id;

GRANT SELECT ON public.vw_portafolio_resumen TO authenticated;
GRANT ALL ON public.vw_portafolio_resumen TO service_role;
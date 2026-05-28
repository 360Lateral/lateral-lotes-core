
DROP FUNCTION IF EXISTS public.listar_mis_engagements_cliente();

CREATE FUNCTION public.listar_mis_engagements_cliente()
 RETURNS TABLE(
   engagement_id uuid,
   lote_nombre text,
   lote_direccion text,
   lote_ciudad text,
   plan_nombre text,
   plan_codigo text,
   asesor_nombre text,
   estado estado_engagement,
   estado_activacion estado_activacion,
   avance_pct numeric,
   fecha_inicio timestamp with time zone,
   fecha_sla timestamp with time zone,
   dias_para_sla integer,
   mostrar_avance_al_cliente boolean,
   total_entregables_publicados integer,
   tiene_diagnostico boolean,
   tiene_presentacion boolean
 )
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    e.id,
    l.nombre_lote,
    l.direccion,
    l.ciudad,
    pd.nombre,
    pd.codigo,
    pf.nombre,
    e.estado,
    e.estado_activacion,
    e.avance_pct,
    e.fecha_inicio,
    e.fecha_sla_objetivo,
    CASE WHEN e.fecha_sla_objetivo IS NULL THEN NULL
         ELSE EXTRACT(DAY FROM (e.fecha_sla_objetivo - now()))::int END,
    e.mostrar_avance_al_cliente,
    COALESCE((
      SELECT COUNT(*)::int FROM public.entregables_engagement en
      WHERE en.engagement_id = e.id AND en.estado = 'publicado'
    ), 0),
    EXISTS (
      SELECT 1 FROM public.entregables_engagement en
      WHERE en.engagement_id = e.id
        AND en.estado = 'publicado'
        AND en.tipo = 'diagnostico_inmobiliario'
    ),
    EXISTS (
      SELECT 1 FROM public.entregables_engagement en
      WHERE en.engagement_id = e.id
        AND en.estado = 'publicado'
        AND en.tipo = 'presentacion_diagnostico'
    )
  FROM public.engagements_lote e
  LEFT JOIN public.lotes l ON l.id = e.lote_id
  LEFT JOIN public.planes_diagnostico pd ON pd.id = e.plan_id
  LEFT JOIN public.perfiles pf ON pf.id = e.asesor_asignado_id
  WHERE e.cliente_id = auth.uid()
    AND e.estado_activacion IN ('activo','borrador','pendiente_pago')
  ORDER BY e.created_at DESC;
$function$;

GRANT EXECUTE ON FUNCTION public.listar_mis_engagements_cliente() TO authenticated;

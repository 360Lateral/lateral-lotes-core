-- Parte A: Renombrar valores del enum app_role (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
             WHERE t.typname='app_role' AND e.enumlabel='inversor') THEN
    ALTER TYPE public.app_role RENAME VALUE 'inversor' TO 'propietario';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
             WHERE t.typname='app_role' AND e.enumlabel='asesor') THEN
    ALTER TYPE public.app_role RENAME VALUE 'asesor' TO 'experto';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
             WHERE t.typname='app_role' AND e.enumlabel='developer') THEN
    ALTER TYPE public.app_role RENAME VALUE 'developer' TO 'desarrollador';
  END IF;
END$$;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comisionista';

-- Parte B: Migrar datos existentes
UPDATE public.user_roles SET role = 'propietario' WHERE role = 'dueno';

UPDATE public.perfiles SET user_type = 'propietario' WHERE user_type IN ('inversor','dueno','owner');
UPDATE public.perfiles SET user_type = 'experto' WHERE user_type = 'asesor';
UPDATE public.perfiles SET user_type = 'desarrollador' WHERE user_type = 'developer';

-- Parte C: Helpers SQL renombrados (mantenemos los viejos como alias para no romper ~30 policies)
CREATE OR REPLACE FUNCTION public.is_admin_or_experto(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','experto')
  )
$$;

-- Alias de compatibilidad para policies existentes
CREATE OR REPLACE FUNCTION public.is_admin_or_asesor(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin_or_experto(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.es_experto_de_engagement(_user_id uuid, _engagement_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.engagements_lote e
    WHERE e.id = _engagement_id
      AND (e.asesor_asignado_id = _user_id OR e.gerente_id = _user_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.es_asesor_de_engagement(_user_id uuid, _engagement_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.es_experto_de_engagement(_user_id, _engagement_id)
$$;

-- obtener_ranking_asesores: actualizar para usar la nueva función canónica
CREATE OR REPLACE FUNCTION public.obtener_ranking_asesores(
  p_desde timestamp with time zone DEFAULT NULL,
  p_hasta timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  asesor_id uuid, asesor_nombre text, engagements_totales integer,
  engagements_activos integer, engagements_entregados integer,
  avance_promedio numeric, tiempo_medio_cierre_dias numeric,
  sla_cumplidos_pct numeric, ingresos_generados_cop bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_experto(auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    e.asesor_asignado_id,
    COALESCE(pf.nombre, 'Sin nombre')::text,
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE e.estado NOT IN ('entregado','cancelado','cerrado'))::int,
    COUNT(*) FILTER (WHERE e.estado = 'entregado')::int,
    ROUND(COALESCE(AVG(e.avance_pct), 0), 2)::numeric(5,2),
    ROUND(
      COALESCE(
        AVG(EXTRACT(EPOCH FROM (e.updated_at - e.fecha_inicio)) / 86400.0)
          FILTER (WHERE e.estado = 'entregado' AND e.fecha_inicio IS NOT NULL),
        0
      ), 1
    )::numeric(6,1),
    ROUND(
      CASE
        WHEN COUNT(*) FILTER (WHERE e.estado = 'entregado') > 0 THEN
          (COUNT(*) FILTER (
             WHERE e.estado = 'entregado'
               AND e.fecha_sla_objetivo IS NOT NULL
               AND e.updated_at <= e.fecha_sla_objetivo
           )::numeric
           / COUNT(*) FILTER (WHERE e.estado = 'entregado')::numeric) * 100
        ELSE 0
      END, 2
    )::numeric(5,2),
    COALESCE(SUM(p.precio_cop), 0)::bigint
  FROM public.engagements_lote e
  LEFT JOIN public.perfiles pf ON pf.id = e.asesor_asignado_id
  LEFT JOIN public.planes_diagnostico p ON p.id = e.plan_id
  WHERE e.asesor_asignado_id IS NOT NULL
    AND (p_desde IS NULL OR e.created_at >= p_desde)
    AND (p_hasta IS NULL OR e.created_at <= p_hasta)
  GROUP BY e.asesor_asignado_id, pf.nombre
  HAVING COUNT(*) > 0
  ORDER BY ingresos_generados_cop DESC;
END;
$$;
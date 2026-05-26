
-- Step 1: Recreate the 5 functions that reference is_admin_or_asesor to use is_admin_or_experto directly

CREATE OR REPLACE FUNCTION public.check_ai_quota(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_limit int;
  v_used  int;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_admin_or_experto(_user_id) THEN
    RETURN true;
  END IF;

  SELECT max_consultas_ia_mes INTO v_limit
    FROM public.get_plan_limits(_user_id);

  IF v_limit IS NULL OR v_limit <= 0 THEN
    RETURN true;
  END IF;

  SELECT COUNT(*)::int INTO v_used
    FROM public.consultas_ia
   WHERE user_id = _user_id
     AND created_at >= date_trunc('month', now());

  RETURN v_used < v_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.obtener_embudo_conversion(p_desde timestamp with time zone DEFAULT NULL::timestamp with time zone, p_hasta timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(etapa text, cantidad integer, conversion_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_leads_nuevos    INT;
  v_contactados     INT;
  v_negociacion     INT;
  v_eng_creados     INT;
  v_eng_entregados  INT;
BEGIN
  IF NOT public.is_admin_or_experto(auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT COUNT(*)::int INTO v_leads_nuevos FROM public.leads l
   WHERE (p_desde IS NULL OR l.created_at >= p_desde) AND (p_hasta IS NULL OR l.created_at <= p_hasta);

  SELECT COUNT(*)::int INTO v_contactados FROM public.leads l
   WHERE l.estado IN ('contactado','negociacion','cerrado')
     AND (p_desde IS NULL OR l.created_at >= p_desde) AND (p_hasta IS NULL OR l.created_at <= p_hasta);

  SELECT COUNT(*)::int INTO v_negociacion FROM public.leads l
   WHERE l.estado IN ('negociacion','cerrado')
     AND (p_desde IS NULL OR l.created_at >= p_desde) AND (p_hasta IS NULL OR l.created_at <= p_hasta);

  SELECT COUNT(*)::int INTO v_eng_creados FROM public.engagements_lote e
   WHERE (p_desde IS NULL OR e.created_at >= p_desde) AND (p_hasta IS NULL OR e.created_at <= p_hasta);

  SELECT COUNT(*)::int INTO v_eng_entregados FROM public.engagements_lote e
   WHERE e.estado = 'entregado'
     AND (p_desde IS NULL OR e.created_at >= p_desde) AND (p_hasta IS NULL OR e.created_at <= p_hasta);

  RETURN QUERY
  SELECT 'Leads nuevos'::text, v_leads_nuevos, 100.00::numeric(5,2)
  UNION ALL
  SELECT 'Contactados'::text, v_contactados,
         CASE WHEN v_leads_nuevos > 0 THEN ROUND((v_contactados::numeric / v_leads_nuevos) * 100, 2) ELSE 0 END::numeric(5,2)
  UNION ALL
  SELECT 'En negociación'::text, v_negociacion,
         CASE WHEN v_contactados > 0 THEN ROUND((v_negociacion::numeric / v_contactados) * 100, 2) ELSE 0 END::numeric(5,2)
  UNION ALL
  SELECT 'Engagement creado'::text, v_eng_creados,
         CASE WHEN v_negociacion > 0 THEN ROUND((v_eng_creados::numeric / v_negociacion) * 100, 2) ELSE 0 END::numeric(5,2)
  UNION ALL
  SELECT 'Engagement entregado'::text, v_eng_entregados,
         CASE WHEN v_eng_creados > 0 THEN ROUND((v_eng_entregados::numeric / v_eng_creados) * 100, 2) ELSE 0 END::numeric(5,2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.obtener_tendencia_mensual(p_meses_atras integer DEFAULT 12)
 RETURNS TABLE(mes date, mes_label text, engagements_creados integer, engagements_completados integer, ingresos_cop bigint, leads_nuevos integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin_or_experto(auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  WITH meses AS (
    SELECT generate_series(
      date_trunc('month', now() - ((p_meses_atras) || ' months')::interval),
      date_trunc('month', now()),
      '1 month'::interval
    )::date AS mes
  ),
  eng_creados AS (
    SELECT date_trunc('month', e.created_at)::date AS mes,
           COUNT(*)::int AS cant,
           COALESCE(SUM(p.precio_cop), 0)::bigint AS ingresos
      FROM public.engagements_lote e
      LEFT JOIN public.planes_diagnostico p ON p.id = e.plan_id
     GROUP BY 1
  ),
  eng_entregados AS (
    SELECT date_trunc('month', e.updated_at)::date AS mes, COUNT(*)::int AS cant
      FROM public.engagements_lote e WHERE e.estado = 'entregado' GROUP BY 1
  ),
  ld AS (
    SELECT date_trunc('month', l.created_at)::date AS mes, COUNT(*)::int AS cant
      FROM public.leads l GROUP BY 1
  )
  SELECT m.mes,
    (CASE EXTRACT(MONTH FROM m.mes)::int
       WHEN 1 THEN 'ene' WHEN 2 THEN 'feb' WHEN 3 THEN 'mar'
       WHEN 4 THEN 'abr' WHEN 5 THEN 'may' WHEN 6 THEN 'jun'
       WHEN 7 THEN 'jul' WHEN 8 THEN 'ago' WHEN 9 THEN 'sep'
       WHEN 10 THEN 'oct' WHEN 11 THEN 'nov' WHEN 12 THEN 'dic'
     END || ' ' || EXTRACT(YEAR FROM m.mes)::int)::text AS mes_label,
    COALESCE(ec.cant, 0), COALESCE(ee.cant, 0),
    COALESCE(ec.ingresos, 0), COALESCE(ld.cant, 0)
  FROM meses m
  LEFT JOIN eng_creados ec ON ec.mes = m.mes
  LEFT JOIN eng_entregados ee ON ee.mes = m.mes
  LEFT JOIN ld ON ld.mes = m.mes
  ORDER BY m.mes ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.firmar_url_entregable(p_entregable_id uuid, p_expira_segundos integer DEFAULT 3600)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage', 'extensions'
AS $function$
DECLARE
  v_ent RECORD;
  v_eng RECORD;
  v_puede BOOLEAN := false;
  v_signed TEXT;
  v_expira INT;
BEGIN
  v_expira := LEAST(GREATEST(COALESCE(p_expira_segundos, 3600), 60), 3600);

  SELECT * INTO v_ent FROM public.entregables_engagement WHERE id = p_entregable_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Entregable no encontrado'; END IF;

  SELECT * INTO v_eng FROM public.engagements_lote WHERE id = v_ent.engagement_id;

  IF public.is_admin_or_experto(auth.uid()) THEN
    v_puede := true;
  ELSIF v_ent.estado = 'publicado' AND v_eng.cliente_id = auth.uid() THEN
    v_puede := true;
  END IF;

  IF NOT v_puede THEN RAISE EXCEPTION 'No autorizado para ver este entregable'; END IF;

  IF v_ent.url_externa IS NOT NULL THEN RETURN v_ent.url_externa; END IF;

  SELECT storage_url INTO v_signed
  FROM storage.create_signed_url('entregables-clientes', v_ent.storage_path, v_expira) AS storage_url;

  RETURN v_signed;
EXCEPTION WHEN undefined_function THEN
  RETURN 'storage://entregables-clientes/' || v_ent.storage_path;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_lot_access(_user_id uuid, _lote_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.lotes l
    WHERE l.id = _lote_id
      AND (
        l.es_publico = true
        OR l.owner_id = _user_id
        OR public.is_admin_or_experto(_user_id)
        OR EXISTS (
          SELECT 1 FROM public.usuario_owner uo
          WHERE uo.user_id = _user_id AND uo.owner_id = l.owner_id
        )
      )
  )
$function$;

-- Step 2: Rebuild all policies that reference is_admin_or_asesor or es_asesor_de_engagement
DO $migrate$
DECLARE
  r record;
  q text;
  wc text;
  roles_str text;
  permissive_str text;
  cmd_str text;
  using_clause text;
  check_clause text;
  sql text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd, permissive, roles,
           qual::text AS q, with_check::text AS wc
      FROM pg_policies
     WHERE qual::text LIKE '%is_admin_or_asesor%'
        OR with_check::text LIKE '%is_admin_or_asesor%'
        OR qual::text LIKE '%es_asesor_de_engagement%'
        OR with_check::text LIKE '%es_asesor_de_engagement%'
  LOOP
    q  := replace(replace(COALESCE(r.q,  ''), 'is_admin_or_asesor', 'is_admin_or_experto'),
                  'es_asesor_de_engagement', 'es_experto_de_engagement');
    wc := replace(replace(COALESCE(r.wc, ''), 'is_admin_or_asesor', 'is_admin_or_experto'),
                  'es_asesor_de_engagement', 'es_experto_de_engagement');

    roles_str := array_to_string(ARRAY(SELECT quote_ident(unnest(r.roles))), ', ');
    permissive_str := r.permissive; -- 'PERMISSIVE' or 'RESTRICTIVE'
    cmd_str := r.cmd; -- 'SELECT','INSERT','UPDATE','DELETE','ALL'

    using_clause := CASE WHEN q  <> '' THEN ' USING (' || q  || ')' ELSE '' END;
    check_clause := CASE WHEN wc <> '' THEN ' WITH CHECK (' || wc || ')' ELSE '' END;

    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);

    sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s',
      r.policyname, r.schemaname, r.tablename,
      permissive_str, cmd_str, roles_str, using_clause, check_clause
    );
    EXECUTE sql;
  END LOOP;
END
$migrate$;

-- Step 3: Drop the alias functions
DROP FUNCTION IF EXISTS public.is_admin_or_asesor(uuid);
DROP FUNCTION IF EXISTS public.es_asesor_de_engagement(uuid, uuid);

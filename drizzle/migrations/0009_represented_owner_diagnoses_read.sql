CREATE OR REPLACE FUNCTION public.representa_cliente(_user_id uuid, _cliente_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND _cliente_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.usuario_owner uo WHERE uo.user_id = _user_id AND uo.owner_id = _cliente_id)
$$;
REVOKE ALL ON FUNCTION public.representa_cliente(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.representa_cliente(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Representantes leen diagnosticos de dueños" ON public.engagements_lote;
CREATE POLICY "Representantes leen diagnosticos de dueños" ON public.engagements_lote
  FOR SELECT TO authenticated
  USING (estado_activacion = 'activo' AND public.representa_cliente(auth.uid(), cliente_id));

DROP POLICY IF EXISTS "Representantes leen entregables publicados" ON public.entregables_engagement;
CREATE POLICY "Representantes leen entregables publicados" ON public.entregables_engagement
  FOR SELECT TO authenticated
  USING (estado = 'publicado' AND EXISTS (
    SELECT 1 FROM public.engagements_lote e
    WHERE e.id = entregables_engagement.engagement_id
      AND e.estado_activacion = 'activo'
      AND public.representa_cliente(auth.uid(), e.cliente_id)));

DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.listar_mis_engagements_cliente()'::regprocedure);
  d := replace(d, 'WHERE e.cliente_id = auth.uid()
    AND e.estado_activacion IN (''activo'',''borrador'',''pendiente_pago'')',
    'WHERE (
      (e.cliente_id = auth.uid() AND e.estado_activacion IN (''activo'',''borrador'',''pendiente_pago''))
      OR (e.estado_activacion = ''activo'' AND public.representa_cliente(auth.uid(), e.cliente_id))
    )');
  IF d NOT LIKE '%representa_cliente%' THEN RAISE EXCEPTION 'listar no actualizado'; END IF;
  EXECUTE d;

  d := pg_get_functiondef('public.obtener_resumen_engagements_cliente()'::regprocedure);
  d := replace(d, 'WHERE e.cliente_id = auth.uid()',
    'WHERE (e.cliente_id = auth.uid() OR (e.estado_activacion = ''activo'' AND public.representa_cliente(auth.uid(), e.cliente_id)))');
  IF d NOT LIKE '%representa_cliente%' THEN RAISE EXCEPTION 'resumen no actualizado'; END IF;
  EXECUTE d;

  d := pg_get_functiondef('public.obtener_engagement_para_cliente(uuid)'::regprocedure);
  d := replace(d, 'IF v_eng.cliente_id IS DISTINCT FROM auth.uid() AND NOT v_es_equipo THEN',
    'IF v_eng.cliente_id IS DISTINCT FROM auth.uid() AND NOT v_es_equipo
     AND NOT public.representa_cliente(auth.uid(), v_eng.cliente_id) THEN');
  IF d NOT LIKE '%representa_cliente%' THEN RAISE EXCEPTION 'obtener no actualizado'; END IF;
  EXECUTE d;

  d := pg_get_functiondef('public.firmar_url_entregable(uuid,integer)'::regprocedure);
  d := replace(d, 'ELSIF v_ent.estado = ''publicado'' AND v_eng.cliente_id = auth.uid() THEN',
    'ELSIF v_ent.estado = ''publicado'' AND (v_eng.cliente_id = auth.uid()
       OR (v_eng.estado_activacion = ''activo'' AND public.representa_cliente(auth.uid(), v_eng.cliente_id))) THEN');
  IF d NOT LIKE '%representa_cliente%' THEN RAISE EXCEPTION 'firmar no actualizado'; END IF;
  EXECUTE d;
END $$;
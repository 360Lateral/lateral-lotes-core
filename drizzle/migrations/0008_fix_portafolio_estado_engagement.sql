DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.obtener_portafolio_propietario(uuid)'::regprocedure);
  d := replace(d, 'el.estado_activacion AS engagement_estado', 'el.estado::text AS engagement_estado');
  d := replace(d, 'el.estado_activacion::text AS estado,', 'el.estado::text AS estado,');
  d := replace(d, 'AND el.estado_activacion::text <> ''entregado''', 'AND el.estado::text NOT IN (''entregado'', ''cerrado'', ''cancelado'')');
  IF d LIKE '%estado_activacion%' THEN RAISE EXCEPTION 'reemplazo incompleto'; END IF;
  EXECUTE d;
END $$;
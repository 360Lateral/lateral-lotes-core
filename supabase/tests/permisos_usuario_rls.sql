-- Run with psql against the database. All test fixtures are rolled back.
BEGIN;

DO $$
DECLARE
  normal_id uuid;
  admin_id uuid;
  super_id uuid;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  SELECT user_id INTO super_id FROM public.user_roles WHERE role = 'super_admin' LIMIT 1;
  SELECT p.id INTO normal_id FROM public.perfiles p
  WHERE NOT public.has_role(p.id, 'admin') AND NOT public.has_role(p.id, 'super_admin')
  LIMIT 1;
  IF normal_id IS NULL OR admin_id IS NULL OR super_id IS NULL THEN
    RAISE EXCEPTION 'Test requires a normal user, an admin and a super_admin';
  END IF;
  PERFORM set_config('test.normal_id', normal_id::text, true);
  PERFORM set_config('test.admin_id', admin_id::text, true);
  PERFORM set_config('test.super_id', super_id::text, true);
END $$;

INSERT INTO public.permisos_usuario (user_id, permiso, habilitado)
VALUES
  (current_setting('test.normal_id')::uuid, '__rls_test_own', true),
  (current_setting('test.admin_id')::uuid, '__rls_test_other', true);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.normal_id'), true);

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.permisos_usuario WHERE permiso = '__rls_test_own';
  IF n <> 1 THEN RAISE EXCEPTION 'Normal user must read own row'; END IF;
  SELECT count(*) INTO n FROM public.permisos_usuario WHERE permiso = '__rls_test_other';
  IF n <> 0 THEN RAISE EXCEPTION 'Normal user must not read other rows'; END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO public.permisos_usuario (user_id, permiso, habilitado)
    VALUES (current_setting('test.normal_id')::uuid, '__rls_test_insert', true);
    RAISE EXCEPTION 'Normal user unexpectedly inserted a row';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE public.permisos_usuario SET habilitado = false WHERE permiso = '__rls_test_own';
  IF FOUND THEN RAISE EXCEPTION 'Normal user unexpectedly updated a row'; END IF;
  DELETE FROM public.permisos_usuario WHERE permiso = '__rls_test_own';
  IF FOUND THEN RAISE EXCEPTION 'Normal user unexpectedly deleted a row'; END IF;
END $$;

DO $$
DECLARE actor text; n integer;
BEGIN
  FOREACH actor IN ARRAY ARRAY['test.admin_id', 'test.super_id'] LOOP
    PERFORM set_config('request.jwt.claim.sub', current_setting(actor), true);
    SELECT count(*) INTO n FROM public.permisos_usuario
    WHERE permiso IN ('__rls_test_own', '__rls_test_other');
    IF n <> 2 THEN RAISE EXCEPTION '% must read all rows', actor; END IF;
    INSERT INTO public.permisos_usuario (user_id, permiso, habilitado)
    VALUES (current_setting('test.normal_id')::uuid, '__rls_test_insert', true);
    UPDATE public.permisos_usuario SET habilitado = false WHERE permiso = '__rls_test_insert';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION '% must update other users rows', actor; END IF;
    DELETE FROM public.permisos_usuario WHERE permiso = '__rls_test_insert';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION '% must delete other users rows', actor; END IF;
  END LOOP;
END $$;

ROLLBACK;
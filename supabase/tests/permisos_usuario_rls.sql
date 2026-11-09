-- Evaluate the installed RLS predicates with real users; no application data is changed.
BEGIN;
DO $$
DECLARE
  normal_id uuid;
  admin_id uuid;
  super_id uuid;
  actor uuid;
  row_owner uuid;
  policy record;
  allowed boolean;
  can_read boolean;
  can_write boolean;
  command text;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  SELECT user_id INTO super_id FROM public.user_roles WHERE role = 'super_admin' LIMIT 1;
  SELECT p.id INTO normal_id FROM public.perfiles p
  WHERE NOT public.has_role(p.id, 'admin') AND NOT public.has_role(p.id, 'super_admin') LIMIT 1;
  IF normal_id IS NULL OR admin_id IS NULL OR super_id IS NULL THEN
    RAISE EXCEPTION 'Test requires a normal user, an admin and a super_admin';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.permisos_usuario'::regclass) THEN
    RAISE EXCEPTION 'RLS must be enabled';
  END IF;
  FOREACH command IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
    IF NOT has_table_privilege('authenticated', 'public.permisos_usuario', command) THEN
      RAISE EXCEPTION 'Missing authenticated grant: %', command;
    END IF;
    IF has_table_privilege('anon', 'public.permisos_usuario', command) THEN
      RAISE EXCEPTION 'Anonymous access must not be granted';
    END IF;
  END LOOP;
  FOREACH actor IN ARRAY ARRAY[normal_id, admin_id, super_id] LOOP
    PERFORM set_config('request.jwt.claim.sub', actor::text, true);
    FOREACH row_owner IN ARRAY ARRAY[normal_id, admin_id] LOOP
      can_read := false;
      FOR policy IN SELECT * FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'permisos_usuario'
        AND roles && ARRAY['authenticated', 'public']::name[] AND cmd IN ('ALL', 'SELECT')
      LOOP
        EXECUTE format('SELECT (%s) FROM (SELECT $1::uuid AS user_id) r', COALESCE(policy.qual, 'true'))
          INTO allowed USING row_owner;
        can_read := can_read OR COALESCE(allowed, false);
      END LOOP;
      IF can_read IS DISTINCT FROM (actor <> normal_id OR row_owner = normal_id) THEN
        RAISE EXCEPTION 'Read rule failed: normal users read only own rows; admins read all';
      END IF;
      FOREACH command IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE'] LOOP
        can_write := false;
        FOR policy IN SELECT * FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'permisos_usuario'
          AND roles && ARRAY['authenticated', 'public']::name[] AND cmd IN ('ALL', command)
        LOOP
          EXECUTE format('SELECT (%s) FROM (SELECT $1::uuid AS user_id) r',
            CASE WHEN command = 'INSERT' THEN COALESCE(policy.with_check, policy.qual, 'true')
              ELSE COALESCE(policy.qual, 'true') END)
            INTO allowed USING row_owner;
          can_write := can_write OR COALESCE(allowed, false);
          IF command = 'UPDATE' AND allowed THEN
            EXECUTE format('SELECT (%s) FROM (SELECT $1::uuid AS user_id) r',
              COALESCE(policy.with_check, policy.qual, 'true')) INTO allowed USING row_owner;
            IF NOT COALESCE(allowed, false) THEN
              RAISE EXCEPTION 'Administrator update check must allow all rows';
            END IF;
          END IF;
        END LOOP;
        IF can_write IS DISTINCT FROM (actor <> normal_id) THEN
          RAISE EXCEPTION 'Write rule failed for %: only admin/super_admin may write', command;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'PASS: RLS enabled; grants correct; own-only reads; admin/super_admin full access; normal writes denied';
END $$;
ROLLBACK;
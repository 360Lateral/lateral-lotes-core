
-- 1. Migrar datos
UPDATE public.perfiles SET user_type = 'propietario' WHERE user_type = 'dueno';

-- Para user_roles evitamos violar unique(user_id,role): insertamos propietario si falta, luego borramos dueno
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'propietario'::public.app_role
FROM public.user_roles
WHERE role = 'dueno'::public.app_role
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles WHERE role = 'dueno'::public.app_role;

-- 2. Actualizar trigger handle_new_user para mapear dueno -> propietario
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_type text := NEW.raw_user_meta_data->>'user_type';
  v_role public.app_role;
BEGIN
  -- Normalizar: dueno (deprecado) se convierte en propietario
  IF v_user_type = 'dueno' THEN
    v_user_type := 'propietario';
  END IF;

  INSERT INTO public.perfiles (id, nombre, activo, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    true,
    v_user_type
  )
  ON CONFLICT (id) DO NOTHING;

  v_role := CASE v_user_type
    WHEN 'super_admin'   THEN 'super_admin'::public.app_role
    WHEN 'admin'         THEN 'admin'::public.app_role
    WHEN 'experto'       THEN 'experto'::public.app_role
    WHEN 'propietario'   THEN 'propietario'::public.app_role
    WHEN 'desarrollador' THEN 'desarrollador'::public.app_role
    WHEN 'developer'     THEN 'desarrollador'::public.app_role
    WHEN 'comisionista'  THEN 'comisionista'::public.app_role
    ELSE 'propietario'::public.app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

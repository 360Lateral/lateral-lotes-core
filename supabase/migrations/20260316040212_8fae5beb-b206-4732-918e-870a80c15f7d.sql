CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, activo, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    true,
    NEW.raw_user_meta_data->>'user_type'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'inversor');

  RETURN NEW;
END;
$$;
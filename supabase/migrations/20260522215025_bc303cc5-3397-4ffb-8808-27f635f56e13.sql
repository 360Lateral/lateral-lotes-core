CREATE OR REPLACE FUNCTION public.check_ai_quota(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limit int;
  v_used  int;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admin/asesor sin límite
  IF public.is_admin_or_asesor(_user_id) THEN
    RETURN true;
  END IF;

  SELECT max_consultas_ia_mes INTO v_limit
    FROM public.get_plan_limits(_user_id);

  -- Sin límite definido = permitido
  IF v_limit IS NULL OR v_limit <= 0 THEN
    RETURN true;
  END IF;

  SELECT COUNT(*)::int INTO v_used
    FROM public.consultas_ia
   WHERE user_id = _user_id
     AND created_at >= date_trunc('month', now());

  RETURN v_used < v_limit;
END;
$$;
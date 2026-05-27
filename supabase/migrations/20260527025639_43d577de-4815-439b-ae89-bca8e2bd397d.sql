
CREATE OR REPLACE FUNCTION public.crear_nueva_version_contrato(
  p_contrato_id_actual uuid,
  p_contenido_legal text,
  p_precio_min numeric,
  p_precio_max numeric,
  p_plazo_min_dias int,
  p_plazo_max_dias int,
  p_moneda text DEFAULT 'COP',
  p_version_explicita text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid              uuid;
  v_es_super         boolean;
  v_actual           record;
  v_nueva_version    text;
  v_partes           text[];
  v_major            int;
  v_minor            int;
  v_nueva_id         uuid;
BEGIN
  v_uid := auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = v_uid AND role = 'super_admin'
  ) INTO v_es_super;

  IF NOT v_es_super THEN
    RAISE EXCEPTION 'Solo super_admin puede crear nuevas versiones de contratos marco';
  END IF;

  IF p_precio_max < p_precio_min THEN
    RAISE EXCEPTION 'precio_max debe ser >= precio_min';
  END IF;
  IF p_plazo_max_dias < p_plazo_min_dias THEN
    RAISE EXCEPTION 'plazo_max_dias debe ser >= plazo_min_dias';
  END IF;
  IF p_plazo_min_dias < 1 THEN
    RAISE EXCEPTION 'plazo_min_dias debe ser >= 1';
  END IF;

  SELECT * INTO v_actual
    FROM public.contratos_marco
   WHERE id = p_contrato_id_actual;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato base no encontrado';
  END IF;

  IF p_version_explicita IS NOT NULL AND length(trim(p_version_explicita)) > 0 THEN
    v_nueva_version := p_version_explicita;
    IF EXISTS (
      SELECT 1 FROM public.contratos_marco
       WHERE tipo_analisis_id = v_actual.tipo_analisis_id
         AND version = v_nueva_version
    ) THEN
      RAISE EXCEPTION 'Ya existe la versión % para este tipo de análisis', v_nueva_version;
    END IF;
  ELSE
    IF v_actual.version ~ '^v[0-9]+\.[0-9]+$' THEN
      v_partes := regexp_split_to_array(substring(v_actual.version from 2), '\.');
      v_major := v_partes[1]::int;
      v_minor := v_partes[2]::int + 1;
      v_nueva_version := 'v' || v_major || '.' || v_minor;
    ELSE
      v_nueva_version := 'v1.' || (
        SELECT count(*) FROM public.contratos_marco
         WHERE tipo_analisis_id = v_actual.tipo_analisis_id
      );
    END IF;
  END IF;

  INSERT INTO public.contratos_marco (
    tipo_analisis_id, version, contenido_legal,
    precio_min, precio_max, plazo_min_dias, plazo_max_dias,
    moneda, activo, creado_por
  ) VALUES (
    v_actual.tipo_analisis_id, v_nueva_version, p_contenido_legal,
    p_precio_min, p_precio_max, p_plazo_min_dias, p_plazo_max_dias,
    p_moneda, true, v_uid
  )
  RETURNING id INTO v_nueva_id;

  UPDATE public.contratos_marco
     SET activo = false,
         updated_at = now()
   WHERE id = p_contrato_id_actual;

  RETURN v_nueva_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_nueva_version_contrato(uuid, text, numeric, numeric, int, int, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_contrato_activo(
  p_contrato_id uuid,
  p_activo boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_super boolean;
  v_tipo uuid;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role = 'super_admin'
  ) INTO v_es_super;

  IF NOT v_es_super THEN
    RAISE EXCEPTION 'Solo super_admin puede activar/desactivar contratos';
  END IF;

  IF p_activo = true THEN
    SELECT tipo_analisis_id INTO v_tipo FROM public.contratos_marco WHERE id = p_contrato_id;
    UPDATE public.contratos_marco
       SET activo = false, updated_at = now()
     WHERE tipo_analisis_id = v_tipo
       AND activo = true
       AND id <> p_contrato_id;
  END IF;

  UPDATE public.contratos_marco
     SET activo = p_activo, updated_at = now()
   WHERE id = p_contrato_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_contrato_activo(uuid, boolean) TO authenticated;

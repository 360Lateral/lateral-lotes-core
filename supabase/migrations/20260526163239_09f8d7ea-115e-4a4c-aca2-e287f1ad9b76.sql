
-- Parte A: trigger sincronizador
CREATE OR REPLACE FUNCTION public.sincronizar_nombre_propietario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nombre text;
BEGIN
  IF NEW.propietario_id IS NULL THEN
    NEW.nombre_propietario := NULL;
  ELSE
    SELECT COALESCE(nombre, email, 'Sin nombre')
      INTO v_nombre
      FROM public.perfiles
     WHERE id = NEW.propietario_id;
    NEW.nombre_propietario := v_nombre;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sincronizar_nombre_propietario ON public.lotes;
CREATE TRIGGER trg_sincronizar_nombre_propietario
  BEFORE INSERT OR UPDATE OF propietario_id ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.sincronizar_nombre_propietario();

-- Parte B: backfill
UPDATE public.lotes l
   SET nombre_propietario = p.nombre
  FROM public.perfiles p
 WHERE l.propietario_id = p.id
   AND (l.nombre_propietario IS DISTINCT FROM p.nombre OR l.nombre_propietario IS NULL);

UPDATE public.lotes
   SET nombre_propietario = NULL
 WHERE propietario_id IS NULL
   AND nombre_propietario IS NOT NULL;

-- Parte C: extender validador
CREATE OR REPLACE FUNCTION public.validar_update_lote_propietario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_super_admin boolean;
BEGIN
  IF NOT public.is_admin_or_experto(auth.uid()) THEN
    IF NEW.estado_publicacion IS DISTINCT FROM OLD.estado_publicacion THEN
      RAISE EXCEPTION 'Solo admin/super_admin pueden cambiar estado_publicacion';
    END IF;
    IF NEW.notas_publicacion IS DISTINCT FROM OLD.notas_publicacion THEN
      RAISE EXCEPTION 'Solo admin/super_admin pueden cambiar notas_publicacion';
    END IF;
  END IF;

  IF NEW.propietario_id IS DISTINCT FROM OLD.propietario_id THEN
    IF OLD.propietario_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.user_roles
         WHERE user_id = auth.uid()
           AND role = 'super_admin'
      ) INTO v_es_super_admin;
      IF NOT v_es_super_admin THEN
        RAISE EXCEPTION 'Solo super_admin puede cambiar el propietario de un lote ya asignado. Asignación inicial sí permitida.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- Tabla de preferencias
CREATE TABLE IF NOT EXISTS public.preferencias_usuario (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_sla_digest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.preferencias_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver mis preferencias"
  ON public.preferencias_usuario FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Insertar mis preferencias"
  ON public.preferencias_usuario FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Actualizar mis preferencias"
  ON public.preferencias_usuario FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_preferencias_updated_at
  BEFORE UPDATE ON public.preferencias_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear preferencias al crear perfil
CREATE OR REPLACE FUNCTION public.crear_preferencias_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.preferencias_usuario(user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crear_preferencias ON public.perfiles;
CREATE TRIGGER trg_crear_preferencias
  AFTER INSERT ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.crear_preferencias_perfil();

-- Backfill para usuarios existentes
INSERT INTO public.preferencias_usuario(user_id)
SELECT id FROM public.perfiles
ON CONFLICT (user_id) DO NOTHING;

-- Función digest SLA
CREATE OR REPLACE FUNCTION public.obtener_digest_sla(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nombre TEXT;
  v_email TEXT;
  v_rojos JSONB;
  v_amarillos JSONB;
  v_total_rojos INT;
  v_total_amarillos INT;
BEGIN
  SELECT COALESCE(nombre, email), email
    INTO v_nombre, v_email
    FROM public.perfiles
   WHERE id = p_user_id;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  WITH base AS (
    SELECT n.nivel,
           n.data,
           (n.data->>'engagement_id')::uuid AS engagement_id,
           COALESCE(l.nombre_lote, n.data->>'lote_nombre', 'Lote sin nombre') AS lote_nombre,
           COALESCE(pd.nombre, n.data->>'plan_codigo', '—') AS plan_nombre,
           (n.data->>'dias_restantes')::int AS dias_restantes,
           n.data->>'fecha_sla' AS fecha_sla
      FROM public.notificaciones_sla n
      LEFT JOIN public.engagements_lote e ON e.id = (n.data->>'engagement_id')::uuid
      LEFT JOIN public.lotes l ON l.id = e.lote_id
      LEFT JOIN public.planes_diagnostico pd ON pd.id = e.plan_id
     WHERE n.destinatario_id = p_user_id
       AND n.estado = 'pendiente'
       AND n.tipo IN ('sla_rojo','sla_amarillo')
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'engagement_id', engagement_id,
      'lote_nombre', lote_nombre,
      'plan_nombre', plan_nombre,
      'dias_vencido', ABS(dias_restantes),
      'fecha_sla', fecha_sla
    )) FILTER (WHERE nivel = 'rojo'), '[]'::jsonb),
    COALESCE(jsonb_agg(jsonb_build_object(
      'engagement_id', engagement_id,
      'lote_nombre', lote_nombre,
      'plan_nombre', plan_nombre,
      'dias_restantes', dias_restantes,
      'fecha_sla', fecha_sla
    )) FILTER (WHERE nivel = 'amarillo'), '[]'::jsonb),
    COUNT(*) FILTER (WHERE nivel = 'rojo')::int,
    COUNT(*) FILTER (WHERE nivel = 'amarillo')::int
  INTO v_rojos, v_amarillos, v_total_rojos, v_total_amarillos
  FROM base;

  IF (v_total_rojos + v_total_amarillos) = 0 THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'usuario_nombre', v_nombre,
    'usuario_email', v_email,
    'fecha', to_char(now() AT TIME ZONE 'America/Bogota','YYYY-MM-DD'),
    'rojos', v_rojos,
    'amarillos', v_amarillos,
    'total_rojos', v_total_rojos,
    'total_amarillos', v_total_amarillos
  );
END;
$$;

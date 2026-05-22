-- ============================================================
-- Sistema de Notificaciones SLA
-- Nota: se usa el nombre `notificaciones_sla` porque ya existe
-- una tabla `notificaciones` con propósito distinto (alertas de matches).
-- ============================================================

-- 1) ENUMs
DO $$ BEGIN
  CREATE TYPE public.nivel_notificacion AS ENUM ('amarillo','rojo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_notificacion AS ENUM ('pendiente','leida','resuelta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Tabla
CREATE TABLE IF NOT EXISTS public.notificaciones_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  nivel public.nivel_notificacion NOT NULL,
  estado public.estado_notificacion NOT NULL DEFAULT 'pendiente',
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  entidad_tipo TEXT NOT NULL,
  entidad_id UUID NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  leida_at TIMESTAMPTZ,
  resuelta_at TIMESTAMPTZ,
  CONSTRAINT uq_notif_sla_dest_tipo_entidad UNIQUE (destinatario_id, tipo, entidad_id)
);

-- 3) Índices
CREATE INDEX IF NOT EXISTS idx_notif_sla_destinatario_estado
  ON public.notificaciones_sla (destinatario_id, estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_sla_entidad
  ON public.notificaciones_sla (entidad_tipo, entidad_id);

-- 4) RLS
ALTER TABLE public.notificaciones_sla ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve sus notificaciones" ON public.notificaciones_sla;
CREATE POLICY "Usuario ve sus notificaciones"
  ON public.notificaciones_sla FOR SELECT
  USING (destinatario_id = auth.uid());

DROP POLICY IF EXISTS "Usuario marca leidas las suyas" ON public.notificaciones_sla;
CREATE POLICY "Usuario marca leidas las suyas"
  ON public.notificaciones_sla FOR UPDATE
  USING (destinatario_id = auth.uid())
  WITH CHECK (destinatario_id = auth.uid());

DROP POLICY IF EXISTS "Sistema inserta" ON public.notificaciones_sla;
CREATE POLICY "Sistema inserta"
  ON public.notificaciones_sla FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Sistema borra" ON public.notificaciones_sla;
CREATE POLICY "Sistema borra"
  ON public.notificaciones_sla FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- 5) Función: detectar_sla_en_riesgo
CREATE OR REPLACE FUNCTION public.detectar_sla_en_riesgo()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_dias INT;
  v_nivel public.nivel_notificacion;
  v_tipo TEXT;
  v_titulo TEXT;
  v_mensaje TEXT;
  v_data JSONB;
  v_destinatario UUID;
  v_count INT := 0;
  v_inserted INT;
BEGIN
  FOR r IN
    SELECT e.id           AS engagement_id,
           e.lote_id,
           e.asesor_asignado_id,
           e.fecha_sla_objetivo,
           l.nombre_lote,
           p.codigo        AS plan_codigo
      FROM public.engagements_lote e
      LEFT JOIN public.lotes l ON l.id = e.lote_id
      LEFT JOIN public.planes_diagnostico p ON p.id = e.plan_id
     WHERE e.estado NOT IN ('entregado','cancelado','cerrado')
       AND e.fecha_sla_objetivo IS NOT NULL
  LOOP
    v_dias := EXTRACT(DAY FROM (r.fecha_sla_objetivo - now()))::int;

    IF v_dias < 0 THEN
      v_nivel := 'rojo';
      v_tipo  := 'sla_rojo';
      v_titulo := 'SLA vencido';
      v_mensaje := 'El engagement del lote ' || COALESCE(r.nombre_lote,'sin nombre') ||
                   ' venció hace ' || ABS(v_dias) || ' días.';
    ELSIF v_dias <= 7 THEN
      v_nivel := 'amarillo';
      v_tipo  := 'sla_amarillo';
      v_titulo := 'SLA próximo a vencer';
      v_mensaje := 'Quedan ' || v_dias || ' días para entregar el engagement del lote ' ||
                   COALESCE(r.nombre_lote,'sin nombre') || '.';
    ELSE
      CONTINUE;
    END IF;

    v_data := jsonb_build_object(
      'engagement_id', r.engagement_id,
      'lote_id', r.lote_id,
      'lote_nombre', r.nombre_lote,
      'plan_codigo', r.plan_codigo,
      'dias_restantes', v_dias,
      'fecha_sla', r.fecha_sla_objetivo
    );

    -- Destinatarios
    IF r.asesor_asignado_id IS NOT NULL THEN
      INSERT INTO public.notificaciones_sla(
        destinatario_id, tipo, nivel, titulo, mensaje, entidad_tipo, entidad_id, data
      ) VALUES (
        r.asesor_asignado_id, v_tipo, v_nivel, v_titulo, v_mensaje, 'engagement', r.engagement_id, v_data
      )
      ON CONFLICT (destinatario_id, tipo, entidad_id) DO NOTHING;
      GET DIAGNOSTICS v_inserted = ROW_COUNT;
      v_count := v_count + v_inserted;
    ELSE
      FOR v_destinatario IN
        SELECT DISTINCT ur.user_id
          FROM public.user_roles ur
          JOIN public.perfiles pf ON pf.id = ur.user_id
         WHERE ur.role IN ('admin','super_admin')
      LOOP
        INSERT INTO public.notificaciones_sla(
          destinatario_id, tipo, nivel, titulo, mensaje, entidad_tipo, entidad_id, data
        ) VALUES (
          v_destinatario, v_tipo, v_nivel, v_titulo, v_mensaje, 'engagement', r.engagement_id, v_data
        )
        ON CONFLICT (destinatario_id, tipo, entidad_id) DO NOTHING;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        v_count := v_count + v_inserted;
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.detectar_sla_en_riesgo() TO authenticated;

-- 6) Trigger: resolver / reasignar
CREATE OR REPLACE FUNCTION public.resolver_notificaciones_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado
     AND NEW.estado IN ('entregado','cancelado') THEN
    UPDATE public.notificaciones_sla
       SET estado = 'resuelta', resuelta_at = now()
     WHERE entidad_tipo = 'engagement'
       AND entidad_id = NEW.id
       AND estado <> 'resuelta';
  END IF;

  IF OLD.asesor_asignado_id IS DISTINCT FROM NEW.asesor_asignado_id
     AND OLD.asesor_asignado_id IS NOT NULL THEN
    DELETE FROM public.notificaciones_sla
     WHERE entidad_tipo = 'engagement'
       AND entidad_id = NEW.id
       AND destinatario_id = OLD.asesor_asignado_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resolver_notificaciones_engagement ON public.engagements_lote;
CREATE TRIGGER trg_resolver_notificaciones_engagement
  AFTER UPDATE ON public.engagements_lote
  FOR EACH ROW
  EXECUTE FUNCTION public.resolver_notificaciones_engagement();

-- 7) marcar_notificacion_leida
CREATE OR REPLACE FUNCTION public.marcar_notificacion_leida(p_notif_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notificaciones_sla
     SET estado = 'leida', leida_at = now()
   WHERE id = p_notif_id
     AND destinatario_id = auth.uid()
     AND estado = 'pendiente';
END;
$$;
GRANT EXECUTE ON FUNCTION public.marcar_notificacion_leida(UUID) TO authenticated;

-- 8) marcar_todas_leidas
CREATE OR REPLACE FUNCTION public.marcar_todas_leidas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INT;
BEGIN
  UPDATE public.notificaciones_sla
     SET estado = 'leida', leida_at = now()
   WHERE destinatario_id = auth.uid()
     AND estado = 'pendiente';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.marcar_todas_leidas() TO authenticated;

-- 9) contar_notificaciones_pendientes
CREATE OR REPLACE FUNCTION public.contar_notificaciones_pendientes()
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::int
    FROM public.notificaciones_sla
   WHERE destinatario_id = auth.uid()
     AND estado = 'pendiente';
$$;
GRANT EXECUTE ON FUNCTION public.contar_notificaciones_pendientes() TO authenticated;

-- 10) listar_notificaciones
CREATE OR REPLACE FUNCTION public.listar_notificaciones(
  p_solo_pendientes BOOLEAN DEFAULT false,
  p_limit INT DEFAULT 50
)
RETURNS SETOF public.notificaciones_sla
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT *
    FROM public.notificaciones_sla
   WHERE destinatario_id = auth.uid()
     AND (NOT p_solo_pendientes OR estado = 'pendiente')
   ORDER BY created_at DESC
   LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.listar_notificaciones(BOOLEAN, INT) TO authenticated;

-- TEST:
-- SELECT public.detectar_sla_en_riesgo();
-- SELECT * FROM public.notificaciones_sla ORDER BY created_at DESC LIMIT 20;
-- SELECT public.contar_notificaciones_pendientes();

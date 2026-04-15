-- =============================================
-- Sistema de Notificaciones Automáticas
-- Cuando un lote nuevo coincide con criterios
-- de un developer → se genera notificación
-- =============================================

-- 1. Ampliar tabla notificaciones
ALTER TABLE public.notificaciones
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'match_lote'
    CHECK (tipo IN ('match_lote', 'lote_destacado', 'cambio_estado', 'negociacion', 'sistema')),
  ADD COLUMN IF NOT EXISTS score INTEGER,
  ADD COLUMN IF NOT EXISTS alerta_id UUID REFERENCES public.alertas(id) ON DELETE SET NULL;

-- Índice para evitar duplicados eficientemente
CREATE INDEX IF NOT EXISTS idx_notif_user_lote_alerta
  ON public.notificaciones(user_id, lote_id, alerta_id)
  WHERE alerta_id IS NOT NULL;

-- 2. Función principal: genera notificaciones para un lote dado
CREATE OR REPLACE FUNCTION public.notificar_matches_lote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alerta    RECORD;
  v_resultado RECORD;
  v_nombre    TEXT;
BEGIN
  -- Solo procesar lotes disponibles
  IF NEW.estado_disponibilidad != 'Disponible' THEN
    RETURN NEW;
  END IF;

  -- En UPDATE: solo actuar si el estado CAMBIÓ a Disponible
  IF TG_OP = 'UPDATE' AND OLD.estado_disponibilidad = 'Disponible' THEN
    RETURN NEW;
  END IF;

  v_nombre := COALESCE(NEW.nombre_lote, 'Lote sin nombre');

  -- Recorrer todas las alertas activas
  FOR v_alerta IN
    SELECT id, user_id
      FROM public.alertas
     WHERE activa = true
       AND (status IS NULL OR status = 'active')
  LOOP
    -- Calcular score
    SELECT s.score, s.detalles
      INTO v_resultado
      FROM public.calcular_match_score(v_alerta.id, NEW.id) AS s(score, detalles);

    CONTINUE WHEN v_resultado.score < 50;

    -- Persistir en criteria_matches
    INSERT INTO public.criteria_matches(alerta_id, lote_id, score, detalles, calculated_at)
    VALUES (v_alerta.id, NEW.id, v_resultado.score, v_resultado.detalles, now())
    ON CONFLICT (alerta_id, lote_id)
    DO UPDATE SET
      score        = EXCLUDED.score,
      detalles     = EXCLUDED.detalles,
      calculated_at = now();

    -- Insertar notificación solo si no existe una en los últimos 30 días
    IF NOT EXISTS (
      SELECT 1 FROM public.notificaciones
       WHERE user_id  = v_alerta.user_id
         AND lote_id  = NEW.id
         AND alerta_id = v_alerta.id
         AND created_at > now() - INTERVAL '30 days'
    ) THEN
      INSERT INTO public.notificaciones(
        user_id, lote_id, mensaje, leida, tipo, score, alerta_id
      ) VALUES (
        v_alerta.user_id,
        NEW.id,
        CASE
          WHEN TG_OP = 'INSERT' THEN
            'Nuevo lote disponible: ' || v_nombre ||
            ' · ' || v_resultado.score || '% de coincidencia con tus criterios'
          ELSE
            'Lote ahora disponible: ' || v_nombre ||
            ' · ' || v_resultado.score || '% de coincidencia con tus criterios'
        END,
        false,
        'match_lote',
        v_resultado.score,
        v_alerta.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 3. Trigger en lotes: INSERT y UPDATE de disponibilidad
DROP TRIGGER IF EXISTS trg_notificar_matches_lote ON public.lotes;

CREATE TRIGGER trg_notificar_matches_lote
  AFTER INSERT OR UPDATE OF estado_disponibilidad
  ON public.lotes
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_matches_lote();

-- 4. Función manual: recalcular y notificar para todos los lotes disponibles
--    Útil para ejecutar la primera vez o tras crear alertas nuevas
CREATE OR REPLACE FUNCTION public.recalcular_todas_notificaciones()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote   RECORD;
  v_alerta RECORD;
  v_res    RECORD;
  v_count  INTEGER := 0;
BEGIN
  FOR v_lote IN
    SELECT * FROM public.lotes WHERE estado_disponibilidad = 'Disponible'
  LOOP
    FOR v_alerta IN
      SELECT id, user_id
        FROM public.alertas
       WHERE activa = true
         AND (status IS NULL OR status = 'active')
    LOOP
      SELECT s.score, s.detalles
        INTO v_res
        FROM public.calcular_match_score(v_alerta.id, v_lote.id) AS s(score, detalles);

      CONTINUE WHEN v_res.score < 50;

      INSERT INTO public.criteria_matches(alerta_id, lote_id, score, detalles, calculated_at)
      VALUES (v_alerta.id, v_lote.id, v_res.score, v_res.detalles, now())
      ON CONFLICT (alerta_id, lote_id)
      DO UPDATE SET score = EXCLUDED.score, detalles = EXCLUDED.detalles, calculated_at = now();

      IF NOT EXISTS (
        SELECT 1 FROM public.notificaciones
         WHERE user_id  = v_alerta.user_id
           AND lote_id  = v_lote.id
           AND alerta_id = v_alerta.id
           AND created_at > now() - INTERVAL '30 days'
      ) THEN
        INSERT INTO public.notificaciones(
          user_id, lote_id, mensaje, leida, tipo, score, alerta_id
        ) VALUES (
          v_alerta.user_id,
          v_lote.id,
          'Lote disponible: ' || COALESCE(v_lote.nombre_lote, 'Sin nombre') ||
          ' · ' || v_res.score || '% de coincidencia',
          false,
          'match_lote',
          v_res.score,
          v_alerta.id
        );
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 5. Policy: el sistema (service role) puede insertar notificaciones
CREATE POLICY "Sistema inserta notificaciones" ON public.notificaciones
  FOR INSERT WITH CHECK (true);


-- Add 'developer' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- Create alertas table
CREATE TABLE public.alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ciudad text,
  uso_suelo text,
  area_min numeric,
  area_max numeric,
  precio_max_m2 numeric,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users view own alerts" ON public.alertas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own alerts
CREATE POLICY "Users insert own alerts" ON public.alertas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users delete own alerts" ON public.alertas
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users update own alerts" ON public.alertas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Create notificaciones table
CREATE TABLE public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lote_id uuid REFERENCES public.lotes(id) ON DELETE CASCADE NOT NULL,
  mensaje text NOT NULL,
  leida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users view own notificaciones" ON public.notificaciones
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notificaciones" ON public.notificaciones
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- System can insert notifications (use security definer function)
CREATE POLICY "System insert notificaciones" ON public.notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Function to match alerts when a lote becomes Disponible
CREATE OR REPLACE FUNCTION public.notify_matching_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alerta RECORD;
  v_uso text;
  v_precio numeric;
BEGIN
  -- Only fire when estado changes to 'Disponible'
  IF NEW.estado_disponibilidad = 'Disponible' AND
     (OLD.estado_disponibilidad IS DISTINCT FROM 'Disponible') THEN

    -- Get uso_principal
    SELECT uso_principal INTO v_uso
    FROM public.normativa_urbana
    WHERE lote_id = NEW.id
    LIMIT 1;

    -- Get precio_m2
    SELECT precio_m2_cop INTO v_precio
    FROM public.precios
    WHERE lote_id = NEW.id
    LIMIT 1;

    FOR alerta IN
      SELECT * FROM public.alertas WHERE activa = true
    LOOP
      -- Check ciudad
      IF alerta.ciudad IS NOT NULL AND alerta.ciudad != '' AND
         LOWER(alerta.ciudad) != LOWER(COALESCE(NEW.ciudad, '')) THEN
        CONTINUE;
      END IF;

      -- Check uso_suelo
      IF alerta.uso_suelo IS NOT NULL AND alerta.uso_suelo != '' AND alerta.uso_suelo != 'Cualquiera' AND
         LOWER(alerta.uso_suelo) != LOWER(COALESCE(v_uso, '')) THEN
        CONTINUE;
      END IF;

      -- Check area_min
      IF alerta.area_min IS NOT NULL AND
         COALESCE(NEW.area_total_m2, 0) < alerta.area_min THEN
        CONTINUE;
      END IF;

      -- Check area_max
      IF alerta.area_max IS NOT NULL AND
         COALESCE(NEW.area_total_m2, 0) > alerta.area_max THEN
        CONTINUE;
      END IF;

      -- Check precio_max_m2
      IF alerta.precio_max_m2 IS NOT NULL AND v_precio IS NOT NULL AND
         v_precio > alerta.precio_max_m2 THEN
        CONTINUE;
      END IF;

      -- All conditions met, create notification
      INSERT INTO public.notificaciones (user_id, lote_id, mensaje)
      VALUES (
        alerta.user_id,
        NEW.id,
        'Nuevo lote disponible: ' || NEW.nombre_lote || ' en ' || COALESCE(NEW.ciudad, 'ubicación no especificada')
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on lotes table
CREATE TRIGGER trg_notify_matching_alerts
AFTER UPDATE ON public.lotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_matching_alerts();

-- Also trigger on INSERT (new lote created as Disponible)
CREATE TRIGGER trg_notify_matching_alerts_insert
AFTER INSERT ON public.lotes
FOR EACH ROW
WHEN (NEW.estado_disponibilidad = 'Disponible')
EXECUTE FUNCTION public.notify_matching_alerts();

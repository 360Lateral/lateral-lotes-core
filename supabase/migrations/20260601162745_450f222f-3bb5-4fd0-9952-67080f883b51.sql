-- Función de expiración
CREATE OR REPLACE FUNCTION public.expirar_suscripciones_y_accesos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_susc record;
BEGIN
  -- 1. Vencer suscripciones expiradas y bajar nivel a gratuito
  FOR v_susc IN
    SELECT * FROM public.suscripciones_desarrollador
     WHERE estado = 'activa' AND fecha_fin < now()
  LOOP
    UPDATE public.suscripciones_desarrollador
       SET estado = 'vencida', updated_at = now()
     WHERE id = v_susc.id;

    IF NOT EXISTS (
      SELECT 1 FROM public.suscripciones_desarrollador
       WHERE desarrollador_id = v_susc.desarrollador_id
         AND estado = 'activa'
         AND fecha_fin > now()
    ) THEN
      UPDATE public.perfiles
         SET nivel_suscripcion = 'gratuito',
             updated_at = now()
       WHERE id = v_susc.desarrollador_id
         AND COALESCE(nivel_suscripcion, 'gratuito') <> 'gratuito';

      INSERT INTO public.audit_nivel_suscripcion (
        desarrollador_id, nivel_anterior, nivel_nuevo, cambiado_por, motivo, origen
      ) VALUES (
        v_susc.desarrollador_id, v_susc.nivel, 'gratuito', NULL,
        'Suscripción vencida', 'sistema'
      );

      INSERT INTO public.notificaciones (user_id, tipo, mensaje, leida)
      VALUES (
        v_susc.desarrollador_id,
        'suscripcion_vencida',
        'Tu suscripción nivel ' || v_susc.nivel || ' venció. Renueva para seguir viendo información detallada.',
        false
      );
    END IF;
  END LOOP;

  -- 2. Vencer accesos pay-per-view expirados
  UPDATE public.accesos_lote
     SET estado = 'vencida', updated_at = now()
   WHERE estado = 'activa' AND fecha_expiracion < now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.expirar_suscripciones_y_accesos() TO service_role;

-- Programar cron diario (reemplaza si existe)
DO $$
BEGIN
  PERFORM cron.unschedule('expirar-suscripciones-accesos-diario');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'expirar-suscripciones-accesos-diario',
  '0 3 * * *',
  $cron$ SELECT public.expirar_suscripciones_y_accesos(); $cron$
);
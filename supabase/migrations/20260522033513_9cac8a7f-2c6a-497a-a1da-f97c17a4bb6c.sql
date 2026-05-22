
-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Eliminar job anterior si existía (idempotente)
DO $$
BEGIN
  PERFORM cron.unschedule('sla-digest-diario');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- IMPORTANTE: Antes de habilitar este job:
--   1) Configura el secret CRON_SECRET en la Edge Function.
--   2) Reemplaza __CRON_SECRET__ por el mismo valor (string aleatorio).
--   3) Vuelve a correr SOLO este bloque cron.schedule.
-- URL del proyecto: https://xtcicjrpznawnwvjdqhe.supabase.co
-- ============================================================
SELECT cron.schedule(
  'sla-digest-diario',
  '0 13 * * *',
  $$
    SELECT net.http_post(
      url := 'https://xtcicjrpznawnwvjdqhe.supabase.co/functions/v1/sla-digest-diario',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer __CRON_SECRET__'
      ),
      body := '{}'::jsonb
    );
  $$
);

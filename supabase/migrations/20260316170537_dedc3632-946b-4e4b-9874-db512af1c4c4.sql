
-- Add dueno and comisionista to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dueno';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comisionista';

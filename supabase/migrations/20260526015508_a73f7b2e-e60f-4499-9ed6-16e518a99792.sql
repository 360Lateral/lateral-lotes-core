-- Parte A: enum
CREATE TYPE public.estado_publicacion_lote AS ENUM (
  'pendiente_validacion',
  'aprobado',
  'rechazado',
  'retirado'
);

-- Parte B: columnas
ALTER TABLE public.lotes
  ADD COLUMN IF NOT EXISTS propietario_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS publicado_venta boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS estado_publicacion public.estado_publicacion_lote NOT NULL DEFAULT 'aprobado',
  ADD COLUMN IF NOT EXISTS precio_venta_estimado numeric,
  ADD COLUMN IF NOT EXISTS notas_publicacion text;

CREATE INDEX IF NOT EXISTS idx_lotes_propietario ON public.lotes(propietario_id);
CREATE INDEX IF NOT EXISTS idx_lotes_publicado ON public.lotes(publicado_venta, estado_publicacion)
  WHERE publicado_venta = true AND estado_publicacion = 'aprobado';

-- Parte C: backfill
WITH ultimo_engagement AS (
  SELECT DISTINCT ON (e.lote_id)
         e.lote_id,
         e.cliente_id
    FROM public.engagements_lote e
   WHERE e.cliente_id IS NOT NULL
     AND e.estado NOT IN ('cancelado')
   ORDER BY e.lote_id, e.created_at DESC
)
UPDATE public.lotes l
   SET propietario_id = ue.cliente_id
  FROM ultimo_engagement ue
 WHERE l.id = ue.lote_id
   AND l.propietario_id IS NULL;

-- Parte D: trigger + policies
CREATE OR REPLACE FUNCTION public.validar_update_lote_propietario()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_experto(auth.uid()) THEN
    IF NEW.estado_publicacion IS DISTINCT FROM OLD.estado_publicacion THEN
      RAISE EXCEPTION 'Solo admin/super_admin pueden cambiar estado_publicacion';
    END IF;
    IF NEW.notas_publicacion IS DISTINCT FROM OLD.notas_publicacion THEN
      RAISE EXCEPTION 'Solo admin/super_admin pueden cambiar notas_publicacion';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_update_lote_propietario ON public.lotes;
CREATE TRIGGER trg_validar_update_lote_propietario
  BEFORE UPDATE ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.validar_update_lote_propietario();

CREATE POLICY "Propietario ve sus lotes" ON public.lotes
  FOR SELECT TO authenticated
  USING (propietario_id = auth.uid());

CREATE POLICY "Propietario actualiza sus lotes" ON public.lotes
  FOR UPDATE TO authenticated
  USING (propietario_id = auth.uid())
  WITH CHECK (propietario_id = auth.uid());

CREATE POLICY "Propietario crea sus lotes" ON public.lotes
  FOR INSERT TO authenticated
  WITH CHECK (
    propietario_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'propietario')
  );
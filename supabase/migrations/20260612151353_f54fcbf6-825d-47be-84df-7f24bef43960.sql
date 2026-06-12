CREATE TABLE IF NOT EXISTS public.lote_vistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  visitor_session text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  source text
);

CREATE INDEX IF NOT EXISTS idx_lote_vistas_lote_fecha ON public.lote_vistas (lote_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_lote_vistas_fecha ON public.lote_vistas (fecha DESC);

GRANT SELECT, INSERT ON public.lote_vistas TO authenticated;
GRANT INSERT ON public.lote_vistas TO anon;
GRANT ALL ON public.lote_vistas TO service_role;

ALTER TABLE public.lote_vistas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lote_vistas insert publico" ON public.lote_vistas;
CREATE POLICY "lote_vistas insert publico"
  ON public.lote_vistas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "lote_vistas select propietario o admin" ON public.lote_vistas;
CREATE POLICY "lote_vistas select propietario o admin"
  ON public.lote_vistas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lotes l
      WHERE l.id = lote_vistas.lote_id
        AND (l.propietario_id = auth.uid() OR l.owner_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE OR REPLACE FUNCTION public.resumen_vistas_portafolio(p_propietario uuid)
RETURNS TABLE (
  total_vistas bigint,
  vistas_ultima_semana bigint,
  vistas_semana_anterior bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COUNT(*) AS total_vistas,
    COUNT(*) FILTER (WHERE v.fecha >= now() - interval '7 days') AS vistas_ultima_semana,
    COUNT(*) FILTER (WHERE v.fecha >= now() - interval '14 days' AND v.fecha < now() - interval '7 days') AS vistas_semana_anterior
  FROM public.lote_vistas v
  JOIN public.lotes l ON l.id = v.lote_id
  WHERE l.propietario_id = p_propietario OR l.owner_id = p_propietario;
$$;

GRANT EXECUTE ON FUNCTION public.resumen_vistas_portafolio(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.vistas_recientes_propietario(p_propietario uuid, p_limit int DEFAULT 5)
RETURNS TABLE (
  id uuid,
  lote_id uuid,
  lote_nombre text,
  fecha timestamptz,
  source text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.lote_id, l.nombre_lote, v.fecha, v.source
  FROM public.lote_vistas v
  JOIN public.lotes l ON l.id = v.lote_id
  WHERE l.propietario_id = p_propietario OR l.owner_id = p_propietario
  ORDER BY v.fecha DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.vistas_recientes_propietario(uuid, int) TO authenticated;
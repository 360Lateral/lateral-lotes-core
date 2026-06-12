
CREATE TABLE IF NOT EXISTS public.mensajes_asesor_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.engagements_lote(id) ON DELETE CASCADE,
  remitente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinatario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tema text,
  mensaje text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  leido_en timestamptz
);

CREATE INDEX IF NOT EXISTS idx_mensajes_asesor_engagement
  ON public.mensajes_asesor_engagement (engagement_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_asesor_remitente
  ON public.mensajes_asesor_engagement (remitente_id);

GRANT SELECT, INSERT ON public.mensajes_asesor_engagement TO authenticated;
GRANT ALL ON public.mensajes_asesor_engagement TO service_role;

ALTER TABLE public.mensajes_asesor_engagement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensajes_asesor_insert_participantes" ON public.mensajes_asesor_engagement;
CREATE POLICY "mensajes_asesor_insert_participantes"
  ON public.mensajes_asesor_engagement FOR INSERT TO authenticated
  WITH CHECK (
    remitente_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.engagements_lote e
      WHERE e.id = engagement_id
        AND (e.cliente_id = auth.uid() OR e.asesor_asignado_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "mensajes_asesor_select_participantes_o_admin" ON public.mensajes_asesor_engagement;
CREATE POLICY "mensajes_asesor_select_participantes_o_admin"
  ON public.mensajes_asesor_engagement FOR SELECT TO authenticated
  USING (
    public.is_super_admin_or_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.engagements_lote e
      WHERE e.id = engagement_id
        AND (e.cliente_id = auth.uid() OR e.asesor_asignado_id = auth.uid())
    )
  );

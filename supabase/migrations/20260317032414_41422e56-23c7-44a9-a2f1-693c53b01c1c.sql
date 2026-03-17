CREATE TABLE public.consultas_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pregunta text NOT NULL,
  respuesta text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.consultas_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own consultas_ia"
  ON public.consultas_ia FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own consultas_ia"
  ON public.consultas_ia FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin view all consultas_ia"
  ON public.consultas_ia FOR SELECT
  TO authenticated
  USING (is_admin_or_asesor(auth.uid()));
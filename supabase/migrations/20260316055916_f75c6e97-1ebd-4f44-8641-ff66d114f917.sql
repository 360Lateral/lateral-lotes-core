CREATE TABLE public.favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lote_id)
);

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favoritos" ON public.favoritos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own favoritos" ON public.favoritos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own favoritos" ON public.favoritos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
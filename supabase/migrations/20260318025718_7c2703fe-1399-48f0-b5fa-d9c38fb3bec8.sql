
-- 1. Create usuario_owner table
CREATE TABLE public.usuario_owner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, owner_id)
);

ALTER TABLE public.usuario_owner ENABLE ROW LEVEL SECURITY;

-- RLS: admins full CRUD
CREATE POLICY "Admins manage usuario_owner"
  ON public.usuario_owner FOR ALL
  TO authenticated
  USING (is_admin_or_asesor(auth.uid()));

-- RLS: users can see their own associations
CREATE POLICY "Users view own associations"
  ON public.usuario_owner FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Update lotes SELECT policy for authenticated to include associated users
DROP POLICY "Auth ven lotes publicos y propios" ON public.lotes;

CREATE POLICY "Auth ven lotes publicos y propios"
  ON public.lotes FOR SELECT
  TO authenticated
  USING (
    es_publico = true
    OR owner_id = auth.uid()
    OR is_admin_or_asesor(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.usuario_owner
      WHERE usuario_owner.user_id = auth.uid()
        AND usuario_owner.owner_id = lotes.owner_id
    )
  );

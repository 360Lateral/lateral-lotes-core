
-- Enum for negotiation status
CREATE TYPE public.estado_negociacion AS ENUM ('activa', 'en_revision', 'cerrada', 'concretada');

-- Negociaciones table
CREATE TABLE public.negociaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  developer_id uuid NOT NULL,
  owner_id uuid DEFAULT NULL,
  estado estado_negociacion NOT NULL DEFAULT 'activa',
  contacto_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.negociaciones ENABLE ROW LEVEL SECURITY;

-- Participants can view their own negociaciones
CREATE POLICY "Participants view own negociaciones" ON public.negociaciones
  FOR SELECT TO authenticated
  USING (developer_id = auth.uid() OR owner_id = auth.uid() OR public.is_admin_or_asesor(auth.uid()));

-- Developers can insert negociaciones (as themselves)
CREATE POLICY "Developers insert negociaciones" ON public.negociaciones
  FOR INSERT TO authenticated
  WITH CHECK (developer_id = auth.uid() AND public.has_role(auth.uid(), 'developer'));

-- Admin can update negociaciones
CREATE POLICY "Admin update negociaciones" ON public.negociaciones
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_asesor(auth.uid()));

-- Mensajes table
CREATE TABLE public.mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacion_id uuid NOT NULL REFERENCES public.negociaciones(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  contenido text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- Function to check if user is participant of a negociacion
CREATE OR REPLACE FUNCTION public.is_negociacion_participant(_user_id uuid, _negociacion_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.negociaciones
    WHERE id = _negociacion_id
      AND (developer_id = _user_id OR owner_id = _user_id)
  )
$$;

-- Participants and admin can view mensajes
CREATE POLICY "Participants view mensajes" ON public.mensajes
  FOR SELECT TO authenticated
  USING (public.is_negociacion_participant(auth.uid(), negociacion_id) OR public.is_admin_or_asesor(auth.uid()));

-- Participants can insert mensajes
CREATE POLICY "Participants insert mensajes" ON public.mensajes
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND (public.is_negociacion_participant(auth.uid(), negociacion_id) OR public.is_admin_or_asesor(auth.uid())));

-- Enable realtime for mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;

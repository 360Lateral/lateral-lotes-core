
-- Table for comisionista authorization documents
CREATE TABLE public.documentos_comisionista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lote_id uuid REFERENCES public.lotes(id) ON DELETE CASCADE,
  nombre_documento text NOT NULL,
  url_storage text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente',
  notas_admin text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_comisionista ENABLE ROW LEVEL SECURITY;

-- Comisionista can view and insert own docs
CREATE POLICY "Users view own comisionista docs" ON public.documentos_comisionista
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin_or_asesor(auth.uid()));

CREATE POLICY "Users insert own comisionista docs" ON public.documentos_comisionista
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin update comisionista docs" ON public.documentos_comisionista
  FOR UPDATE TO authenticated USING (is_admin_or_asesor(auth.uid()));

CREATE POLICY "Admin delete comisionista docs" ON public.documentos_comisionista
  FOR DELETE TO authenticated USING (is_admin_or_asesor(auth.uid()));

-- Update handle_new_user to assign 'dueno' role when user_type is 'dueno'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, activo, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    true,
    NEW.raw_user_meta_data->>'user_type'
  );

  -- Assign role based on user_type
  IF NEW.raw_user_meta_data->>'user_type' = 'dueno' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dueno');
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'developer' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'developer');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'inversor');
  END IF;

  RETURN NEW;
END;
$$;

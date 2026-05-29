
CREATE POLICY "Comisionista crea lote autorizado"
  ON public.lotes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'comisionista')
  );

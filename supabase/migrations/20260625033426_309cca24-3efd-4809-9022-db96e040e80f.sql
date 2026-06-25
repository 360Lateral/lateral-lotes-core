
CREATE POLICY "Cliente sube en carpeta propia (docs-cliente)"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'docs-cliente'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Cliente y equipo leen docs-cliente"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'docs-cliente'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'experto')
    )
  );

CREATE POLICY "Cliente borra sus docs-cliente"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'docs-cliente'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

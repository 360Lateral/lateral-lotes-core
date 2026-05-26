
CREATE POLICY "Lot authorized users read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.has_lot_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

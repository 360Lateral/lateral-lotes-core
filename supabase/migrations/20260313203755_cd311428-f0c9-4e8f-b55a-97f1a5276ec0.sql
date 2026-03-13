
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage: authenticated users can read
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos');

-- Admin/asesor can upload documents
CREATE POLICY "Admin/asesor can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  AND public.is_admin_or_asesor(auth.uid())
);

-- Admin/asesor can delete documents
CREATE POLICY "Admin/asesor can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND public.is_admin_or_asesor(auth.uid())
);

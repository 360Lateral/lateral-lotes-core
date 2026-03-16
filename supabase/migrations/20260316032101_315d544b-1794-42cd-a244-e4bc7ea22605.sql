
-- Add foto_url column to lotes
ALTER TABLE public.lotes ADD COLUMN foto_url text;

-- Create storage bucket for lot photos (public so images can be displayed)
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-lotes', 'fotos-lotes', true);

-- Allow authenticated users to upload to fotos-lotes
CREATE POLICY "Auth users upload fotos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos-lotes');

-- Allow public read access
CREATE POLICY "Public read fotos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'fotos-lotes');

-- Allow authenticated users to update their uploads
CREATE POLICY "Auth users update fotos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'fotos-lotes');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Auth users delete fotos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'fotos-lotes');

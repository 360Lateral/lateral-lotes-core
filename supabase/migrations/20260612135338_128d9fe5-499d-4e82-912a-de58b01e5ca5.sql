-- fotos-lotes: restrict storage policies after flipping bucket to private.

DROP POLICY IF EXISTS "Public read fotos" ON storage.objects;
DROP POLICY IF EXISTS "Admin asesor upload fotos" ON storage.objects;
DROP POLICY IF EXISTS "fotos-lotes: lectura controlada por acceso al lote" ON storage.objects;
DROP POLICY IF EXISTS "fotos-lotes: escritura por dueño del lote o admin" ON storage.objects;

-- SELECT: admin/experto, public lots, owner, or users with explicit access.
CREATE POLICY "fotos-lotes: lectura controlada por acceso al lote"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'fotos-lotes'
    AND (
      public.is_admin_or_experto(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.lotes l
        WHERE l.id::text = (storage.foldername(name))[1]
          AND l.es_publico = true
      )
      OR (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.lotes l
          WHERE l.id::text = (storage.foldername(name))[1]
            AND (
              l.propietario_id = auth.uid()
              OR public.has_lot_access(auth.uid(), l.id)
            )
        )
      )
    )
  );

-- INSERT: admin/experto or the lot owner can upload photos for their lot.
CREATE POLICY "fotos-lotes: escritura por dueño del lote o admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos-lotes'
    AND (
      public.is_admin_or_experto(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.lotes l
        WHERE l.id::text = (storage.foldername(name))[1]
          AND l.propietario_id = auth.uid()
      )
    )
  );

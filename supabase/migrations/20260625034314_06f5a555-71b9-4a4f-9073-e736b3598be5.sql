
-- Índice único para soportar ON CONFLICT en re-seeds
CREATE UNIQUE INDEX IF NOT EXISTS uq_docs_req_plan_tipo_nombre
  ON public.documentos_requeridos_plan (plan_id, tipo_analisis_id, nombre);

DO $$
DECLARE
  v_basico UUID;
  v_pro UUID;
  v_premium UUID;
  v_juridico UUID;
  v_normativo UUID;
  v_ambiental UUID;
  v_sspp UUID;
  v_geotecnico UUID;
  v_arquitectonico UUID;
BEGIN
  SELECT id INTO v_basico  FROM public.planes_diagnostico WHERE codigo = 'basico';
  SELECT id INTO v_pro     FROM public.planes_diagnostico WHERE codigo = 'pro';
  SELECT id INTO v_premium FROM public.planes_diagnostico WHERE codigo = 'premium';

  SELECT id INTO v_juridico       FROM public.tipos_analisis WHERE codigo = 'juridico';
  SELECT id INTO v_normativo      FROM public.tipos_analisis WHERE codigo = 'normativo';
  SELECT id INTO v_ambiental      FROM public.tipos_analisis WHERE codigo = 'ambiental';
  SELECT id INTO v_sspp           FROM public.tipos_analisis WHERE codigo = 'sspp';
  SELECT id INTO v_geotecnico     FROM public.tipos_analisis WHERE codigo = 'geotecnico';
  SELECT id INTO v_arquitectonico FROM public.tipos_analisis WHERE codigo = 'arquitectonico';

  IF v_basico IS NULL OR v_juridico IS NULL THEN
    RAISE NOTICE 'Planes o tipos no encontrados, skip seed';
    RETURN;
  END IF;

  -- ============ JURÍDICO (Básico, Pro, Premium) ============
  INSERT INTO public.documentos_requeridos_plan (plan_id, tipo_analisis_id, nombre, descripcion, opcional, orden)
  SELECT p.plan_id, v_juridico, d.nombre, d.descripcion, d.opcional, d.orden
  FROM (VALUES
    ('Escritura del lote', 'Documento legal de propiedad del lote (escritura pública)', false, 1),
    ('Certificado de Tradición y Libertad', 'Vigencia máxima 30 días. Descargable en VUR (https://www.vur.gov.co/)', false, 2),
    ('Paz y Salvo Predial', 'Certificado al día con el impuesto predial municipal', false, 3),
    ('Cédula del propietario', 'Cédula de ciudadanía del titular registrado en la escritura', false, 4),
    ('Promesa de compraventa', 'Si el lote está en proceso de venta o tiene compromiso firmado', true, 5)
  ) AS d(nombre, descripcion, opcional, orden)
  CROSS JOIN (VALUES (v_basico), (v_pro), (v_premium)) AS p(plan_id)
  ON CONFLICT (plan_id, tipo_analisis_id, nombre) DO NOTHING;

  -- ============ NORMATIVO (Básico, Pro, Premium) ============
  INSERT INTO public.documentos_requeridos_plan (plan_id, tipo_analisis_id, nombre, descripcion, opcional, orden)
  SELECT p.plan_id, v_normativo, d.nombre, d.descripcion, d.opcional, d.orden
  FROM (VALUES
    ('Plano del lote', 'Plano topográfico o de localización si lo tienes disponible', true, 1),
    ('Licencia de construcción previa', 'Si el lote tiene proyecto aprobado anteriormente', true, 2)
  ) AS d(nombre, descripcion, opcional, orden)
  CROSS JOIN (VALUES (v_basico), (v_pro), (v_premium)) AS p(plan_id)
  ON CONFLICT (plan_id, tipo_analisis_id, nombre) DO NOTHING;

  -- ============ AMBIENTAL (Pro, Premium) ============
  INSERT INTO public.documentos_requeridos_plan (plan_id, tipo_analisis_id, nombre, descripcion, opcional, orden)
  SELECT p.plan_id, v_ambiental, d.nombre, d.descripcion, d.opcional, d.orden
  FROM (VALUES
    ('Certificado de Uso del Suelo', 'Expedido por Curaduría Urbana o Secretaría de Planeación', true, 1),
    ('Estudios ambientales previos', 'Si el lote ha sido evaluado por restricciones ambientales', true, 2)
  ) AS d(nombre, descripcion, opcional, orden)
  CROSS JOIN (VALUES (v_pro), (v_premium)) AS p(plan_id)
  ON CONFLICT (plan_id, tipo_analisis_id, nombre) DO NOTHING;

  -- ============ SSPP (Pro, Premium) ============
  INSERT INTO public.documentos_requeridos_plan (plan_id, tipo_analisis_id, nombre, descripcion, opcional, orden)
  SELECT p.plan_id, v_sspp, d.nombre, d.descripcion, d.opcional, d.orden
  FROM (VALUES
    ('Factura de servicios públicos', 'Última factura del lote (agua, energía, gas) — útil si ya tiene conexión', true, 1)
  ) AS d(nombre, descripcion, opcional, orden)
  CROSS JOIN (VALUES (v_pro), (v_premium)) AS p(plan_id)
  ON CONFLICT (plan_id, tipo_analisis_id, nombre) DO NOTHING;

  -- ============ GEOTÉCNICO (Pro, Premium) ============
  INSERT INTO public.documentos_requeridos_plan (plan_id, tipo_analisis_id, nombre, descripcion, opcional, orden)
  SELECT p.plan_id, v_geotecnico, d.nombre, d.descripcion, d.opcional, d.orden
  FROM (VALUES
    ('Estudio de suelos previo', 'Si el lote ya tiene estudio geotécnico realizado', true, 1)
  ) AS d(nombre, descripcion, opcional, orden)
  CROSS JOIN (VALUES (v_pro), (v_premium)) AS p(plan_id)
  ON CONFLICT (plan_id, tipo_analisis_id, nombre) DO NOTHING;

  -- ============ ARQUITECTÓNICO (solo Premium) ============
  IF v_arquitectonico IS NOT NULL THEN
    INSERT INTO public.documentos_requeridos_plan (plan_id, tipo_analisis_id, nombre, descripcion, opcional, orden) VALUES
      (v_premium, v_arquitectonico, 'Plano de levantamiento', 'Plano arquitectónico del lote si lo tienes', true, 1),
      (v_premium, v_arquitectonico, 'Anteproyecto arquitectónico', 'Si ya existe propuesta de diseño preliminar', true, 2)
    ON CONFLICT (plan_id, tipo_analisis_id, nombre) DO NOTHING;
  END IF;

  RAISE NOTICE 'Seed completado';
END $$;

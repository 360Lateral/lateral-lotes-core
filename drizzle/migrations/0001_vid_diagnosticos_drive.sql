CREATE TABLE public.vid_drive_archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_file_id text NOT NULL UNIQUE,
  codigo_activo text NOT NULL,
  nombre text NOT NULL,
  ruta text,
  mime_type text,
  tamano bigint,
  modified_time timestamptz,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | procesado | requiere_revision | no_aplica | error
  motivo text,
  extracto jsonb,
  procesado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.vid_drive_archivos TO authenticated;
GRANT ALL ON public.vid_drive_archivos TO service_role;
ALTER TABLE public.vid_drive_archivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipo ve archivos VID" ON public.vid_drive_archivos FOR SELECT TO authenticated USING (public.is_admin_or_experto(auth.uid()));
CREATE POLICY "Equipo edita archivos VID" ON public.vid_drive_archivos FOR UPDATE TO authenticated USING (public.is_admin_or_experto(auth.uid())) WITH CHECK (public.is_admin_or_experto(auth.uid()));
CREATE INDEX ON public.vid_drive_archivos (codigo_activo, estado);

CREATE TABLE public.vid_diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_activo text NOT NULL UNIQUE,
  nombre_activo text NOT NULL,
  lote_id uuid,
  cliente_id uuid,
  drive_folder_id text NOT NULL,
  ciudad text,
  tipo_inmueble text,
  fecha_diagnostico date,
  criticidad text, -- alto | medio | bajo
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  resumen text,
  hallazgos jsonb NOT NULL DEFAULT '[]'::jsonb,
  plan_accion jsonb NOT NULL DEFAULT '[]'::jsonb,
  requiere_revision boolean NOT NULL DEFAULT false,
  motivo_revision text,
  documentos_procesados int NOT NULL DEFAULT 0,
  generado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.vid_diagnosticos TO authenticated;
GRANT ALL ON public.vid_diagnosticos TO service_role;
ALTER TABLE public.vid_diagnosticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipo ve diagnosticos VID" ON public.vid_diagnosticos FOR SELECT TO authenticated USING (public.is_admin_or_experto(auth.uid()));
CREATE POLICY "Cliente ve sus diagnosticos VID" ON public.vid_diagnosticos FOR SELECT TO authenticated USING (cliente_id = auth.uid() AND requiere_revision = false AND generado_at IS NOT NULL);
CREATE POLICY "Equipo edita diagnosticos VID" ON public.vid_diagnosticos FOR UPDATE TO authenticated USING (public.is_admin_or_experto(auth.uid())) WITH CHECK (public.is_admin_or_experto(auth.uid()));

CREATE TABLE public.vid_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accion text NOT NULL,
  usuario_id uuid,
  nuevos int DEFAULT 0,
  actualizados int DEFAULT 0,
  total int DEFAULT 0,
  detalle text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vid_sync_log TO authenticated;
GRANT ALL ON public.vid_sync_log TO service_role;
ALTER TABLE public.vid_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipo ve log VID" ON public.vid_sync_log FOR SELECT TO authenticated USING (public.is_admin_or_experto(auth.uid()));

CREATE TRIGGER trg_vid_arch_upd BEFORE UPDATE ON public.vid_drive_archivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_vid_diag_upd BEFORE UPDATE ON public.vid_diagnosticos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
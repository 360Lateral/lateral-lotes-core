
-- =============================================
-- 360Lateral Lotes — Schema completo
-- =============================================

-- Enums
CREATE TYPE public.estado_disponibilidad AS ENUM ('Disponible', 'Reservado', 'Vendido');
CREATE TYPE public.estado_servicio AS ENUM ('Disponible', 'En trámite', 'No disponible');
CREATE TYPE public.categoria_documento AS ENUM ('financiero', 'tecnico', 'predial', 'normativo', 'juridico', 'otro');
CREATE TYPE public.estado_lead AS ENUM ('nuevo', 'contactado', 'negociacion', 'cerrado', 'descartado');
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'asesor', 'inversor');

-- =============================================
-- Tabla: user_roles (roles separados por seguridad)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'inversor',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function para chequear roles sin recursión
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: chequea si el usuario es admin o asesor
CREATE OR REPLACE FUNCTION public.is_admin_or_asesor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin', 'asesor')
  )
$$;

-- RLS para user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- =============================================
-- Tabla: perfiles
-- =============================================
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  telefono TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles visibles para autenticados" ON public.perfiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios editan su perfil" ON public.perfiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.perfiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =============================================
-- Tabla: lotes
-- =============================================
CREATE TABLE public.lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_lote TEXT NOT NULL,
  ciudad TEXT,
  barrio TEXT,
  direccion TEXT,
  estrato INTEGER,
  lat DECIMAL,
  lng DECIMAL,
  area_total_m2 DECIMAL,
  frente_ml DECIMAL,
  fondo_ml DECIMAL,
  matricula_inmobiliaria TEXT,
  estado_disponibilidad estado_disponibilidad NOT NULL DEFAULT 'Disponible',
  destacado BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lotes visibles para todos" ON public.lotes
  FOR SELECT USING (true);
CREATE POLICY "Admin/asesor insertan lotes" ON public.lotes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor actualizan lotes" ON public.lotes
  FOR UPDATE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor eliminan lotes" ON public.lotes
  FOR DELETE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));

-- =============================================
-- Tabla: normativa_urbana
-- =============================================
CREATE TABLE public.normativa_urbana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE NOT NULL,
  uso_principal TEXT,
  usos_compatibles TEXT[],
  indice_construccion DECIMAL,
  indice_ocupacion DECIMAL,
  altura_max_pisos INTEGER,
  altura_max_metros DECIMAL,
  aislamiento_frontal_m DECIMAL,
  aislamiento_posterior_m DECIMAL,
  aislamiento_lateral_m DECIMAL,
  cesion_tipo_a_pct DECIMAL,
  tratamiento TEXT,
  zona_pot TEXT,
  norma_vigente TEXT
);
ALTER TABLE public.normativa_urbana ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Normativa visible para todos" ON public.normativa_urbana
  FOR SELECT USING (true);
CREATE POLICY "Admin/asesor insertan normativa" ON public.normativa_urbana
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor actualizan normativa" ON public.normativa_urbana
  FOR UPDATE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor eliminan normativa" ON public.normativa_urbana
  FOR DELETE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));

-- =============================================
-- Tabla: servicios_publicos
-- =============================================
CREATE TABLE public.servicios_publicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  estado estado_servicio NOT NULL DEFAULT 'Disponible',
  operador TEXT
);
ALTER TABLE public.servicios_publicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Servicios visibles para todos" ON public.servicios_publicos
  FOR SELECT USING (true);
CREATE POLICY "Admin/asesor insertan servicios" ON public.servicios_publicos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor actualizan servicios" ON public.servicios_publicos
  FOR UPDATE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor eliminan servicios" ON public.servicios_publicos
  FOR DELETE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));

-- =============================================
-- Tabla: precios
-- =============================================
CREATE TABLE public.precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE NOT NULL,
  precio_cop BIGINT,
  precio_m2_cop BIGINT,
  vigencia DATE,
  notas TEXT
);
ALTER TABLE public.precios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Precios visibles para todos" ON public.precios
  FOR SELECT USING (true);
CREATE POLICY "Admin/asesor insertan precios" ON public.precios
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor actualizan precios" ON public.precios
  FOR UPDATE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor eliminan precios" ON public.precios
  FOR DELETE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));

-- =============================================
-- Tabla: analisis_documentos
-- =============================================
CREATE TABLE public.analisis_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE NOT NULL,
  categoria categoria_documento NOT NULL DEFAULT 'otro',
  nombre TEXT NOT NULL,
  descripcion TEXT,
  url_storage TEXT,
  tipo_archivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.analisis_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documentos visibles para autenticados" ON public.analisis_documentos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/asesor insertan documentos" ON public.analisis_documentos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor actualizan documentos" ON public.analisis_documentos
  FOR UPDATE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor eliminan documentos" ON public.analisis_documentos
  FOR DELETE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));

-- =============================================
-- Tabla: leads
-- =============================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  mensaje TEXT,
  estado estado_lead NOT NULL DEFAULT 'nuevo',
  asignado_a UUID REFERENCES public.perfiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar un lead (formulario público)
CREATE POLICY "Cualquiera puede crear lead" ON public.leads
  FOR INSERT WITH CHECK (true);
-- Solo admin/asesor pueden ver leads
CREATE POLICY "Admin/asesor ven leads" ON public.leads
  FOR SELECT TO authenticated USING (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor actualizan leads" ON public.leads
  FOR UPDATE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));
CREATE POLICY "Admin/asesor eliminan leads" ON public.leads
  FOR DELETE TO authenticated USING (public.is_admin_or_asesor(auth.uid()));

-- =============================================
-- Trigger: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lotes_updated_at
  BEFORE UPDATE ON public.lotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Trigger: crear perfil + rol al registrarse
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, activo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), true);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'inversor');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

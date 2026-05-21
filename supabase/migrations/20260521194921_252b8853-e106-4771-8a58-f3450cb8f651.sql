
-- 1) Funciones auxiliares
CREATE OR REPLACE FUNCTION public.is_super_admin_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.es_asesor_de_engagement(_user_id uuid, _engagement_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.engagements_lote e
    WHERE e.id = _engagement_id
      AND (e.asesor_asignado_id = _user_id OR e.gerente_id = _user_id)
  )
$$;

-- Helper para reutilizar en tareas_analisis: ¿puede el usuario ver el engagement?
-- Patrón de "owner": lotes.owner_id = auth.uid() (mismo que usa ProtectedRoute/allowOwner).
CREATE OR REPLACE FUNCTION public.puede_ver_engagement(_user_id uuid, _engagement_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.engagements_lote e
    LEFT JOIN public.lotes l ON l.id = e.lote_id
    WHERE e.id = _engagement_id
      AND (
        public.is_super_admin_or_admin(_user_id)
        OR e.asesor_asignado_id = _user_id
        OR e.gerente_id = _user_id
        OR l.owner_id = _user_id
      )
  )
$$;

-- 2) Habilitar RLS
ALTER TABLE public.planes_diagnostico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_analisis     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_analisis    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements_lote   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_analisis    ENABLE ROW LEVEL SECURITY;

-- 3) planes_diagnostico
CREATE POLICY "Planes diagnostico visibles para todos"
  ON public.planes_diagnostico FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Super admin inserta planes diagnostico"
  ON public.planes_diagnostico FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin actualiza planes diagnostico"
  ON public.planes_diagnostico FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin elimina planes diagnostico"
  ON public.planes_diagnostico FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 4) tipos_analisis
CREATE POLICY "Authenticated ven tipos analisis"
  ON public.tipos_analisis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin inserta tipos analisis"
  ON public.tipos_analisis FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin actualiza tipos analisis"
  ON public.tipos_analisis FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin elimina tipos analisis"
  ON public.tipos_analisis FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- planes_analisis
CREATE POLICY "Authenticated ven planes analisis"
  ON public.planes_analisis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin inserta planes analisis"
  ON public.planes_analisis FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin actualiza planes analisis"
  ON public.planes_analisis FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin elimina planes analisis"
  ON public.planes_analisis FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 5) engagements_lote
CREATE POLICY "Admin ven todos los engagements"
  ON public.engagements_lote FOR SELECT TO authenticated
  USING (public.is_super_admin_or_admin(auth.uid()));

CREATE POLICY "Asesor ve sus engagements"
  ON public.engagements_lote FOR SELECT TO authenticated
  USING (asesor_asignado_id = auth.uid() OR gerente_id = auth.uid());

-- Dueño del lote: usamos el mismo patrón que ProtectedRoute/allowOwner
-- (lotes.owner_id = auth.uid()). TODO: si más adelante el "dueño" se identifica
-- por otro mecanismo (ej. usuario_owner), ampliar esta política.
CREATE POLICY "Dueño del lote ve sus engagements"
  ON public.engagements_lote FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lotes l
      WHERE l.id = engagements_lote.lote_id
        AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admin inserta engagements"
  ON public.engagements_lote FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin_or_admin(auth.uid()));

CREATE POLICY "Admin actualiza engagements"
  ON public.engagements_lote FOR UPDATE TO authenticated
  USING (public.is_super_admin_or_admin(auth.uid()));

CREATE POLICY "Asesor actualiza sus engagements"
  ON public.engagements_lote FOR UPDATE TO authenticated
  USING (asesor_asignado_id = auth.uid() OR gerente_id = auth.uid());

CREATE POLICY "Super admin elimina engagements"
  ON public.engagements_lote FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 6) tareas_analisis
CREATE POLICY "Visibles si puede ver engagement"
  ON public.tareas_analisis FOR SELECT TO authenticated
  USING (public.puede_ver_engagement(auth.uid(), engagement_id));

CREATE POLICY "Admin inserta tareas"
  ON public.tareas_analisis FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin_or_admin(auth.uid()));

CREATE POLICY "Admin actualiza tareas"
  ON public.tareas_analisis FOR UPDATE TO authenticated
  USING (public.is_super_admin_or_admin(auth.uid()));

CREATE POLICY "Asesor actualiza tareas de sus engagements"
  ON public.tareas_analisis FOR UPDATE TO authenticated
  USING (public.es_asesor_de_engagement(auth.uid(), engagement_id));

CREATE POLICY "Admin elimina tareas"
  ON public.tareas_analisis FOR DELETE TO authenticated
  USING (public.is_super_admin_or_admin(auth.uid()));

-- Permisos EXECUTE en helpers
GRANT EXECUTE ON FUNCTION public.is_super_admin_or_admin(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_asesor_de_engagement(uuid, uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.puede_ver_engagement(uuid, uuid)         TO authenticated;

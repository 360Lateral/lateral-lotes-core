-- Enums
CREATE TYPE public.feedback_tipo AS ENUM ('bug', 'mejora', 'pregunta', 'ux', 'otro');
CREATE TYPE public.feedback_severidad AS ENUM ('baja', 'media', 'alta', 'critica');
CREATE TYPE public.feedback_estado AS ENUM ('nuevo', 'en_revision', 'planificado', 'en_progreso', 'resuelto', 'descartado', 'duplicado');

-- Tabla principal
CREATE TABLE public.feedback_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  tipo public.feedback_tipo NOT NULL DEFAULT 'mejora',
  severidad public.feedback_severidad NOT NULL DEFAULT 'media',
  titulo text NOT NULL CHECK (length(titulo) BETWEEN 3 AND 200),
  descripcion text NOT NULL CHECK (length(descripcion) >= 10),
  url_origen text,
  info_tecnica jsonb,
  estado public.feedback_estado NOT NULL DEFAULT 'nuevo',
  asignado_a uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  duplicado_de uuid REFERENCES public.feedback_tickets(id) ON DELETE SET NULL,
  razon_descarte text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resuelto_en timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_tickets TO authenticated;
GRANT ALL ON public.feedback_tickets TO service_role;

ALTER TABLE public.feedback_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_tickets_insert_propio"
  ON public.feedback_tickets FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "feedback_tickets_select_propio_o_admin"
  ON public.feedback_tickets FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "feedback_tickets_update_admin"
  ON public.feedback_tickets FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE INDEX idx_feedback_usuario ON public.feedback_tickets(usuario_id);
CREATE INDEX idx_feedback_estado ON public.feedback_tickets(estado);
CREATE INDEX idx_feedback_asignado ON public.feedback_tickets(asignado_a);
CREATE INDEX idx_feedback_created ON public.feedback_tickets(created_at DESC);

CREATE TRIGGER trg_feedback_tickets_updated_at
  BEFORE UPDATE ON public.feedback_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Comentarios
CREATE TABLE public.feedback_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.feedback_tickets(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  mensaje text NOT NULL CHECK (length(mensaje) >= 1),
  visible_para_usuario boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.feedback_comentarios TO authenticated;
GRANT ALL ON public.feedback_comentarios TO service_role;

ALTER TABLE public.feedback_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_comentarios_insert_dueno_o_admin"
  ON public.feedback_comentarios FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.feedback_tickets t
        WHERE t.id = ticket_id AND t.usuario_id = auth.uid()
      )
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );

CREATE POLICY "feedback_comentarios_select_selectivo"
  ON public.feedback_comentarios FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.feedback_tickets t
      WHERE t.id = ticket_id
        AND t.usuario_id = auth.uid()
        AND visible_para_usuario = true
    )
  );

CREATE INDEX idx_feedback_comentarios_ticket ON public.feedback_comentarios(ticket_id, created_at);

-- Notificación: nuevo ticket → todos los admins
CREATE OR REPLACE FUNCTION public.notificar_nuevo_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_autor text;
  v_admin uuid;
BEGIN
  SELECT COALESCE(nombre, 'Usuario') INTO v_autor
  FROM public.perfiles WHERE id = NEW.usuario_id;

  FOR v_admin IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'super_admin')
  LOOP
    INSERT INTO public.notificaciones_sla (
      destinatario_id, tipo, nivel, estado, titulo, mensaje,
      entidad_tipo, entidad_id, data
    ) VALUES (
      v_admin,
      'feedback_nuevo',
      CASE NEW.severidad
        WHEN 'critica' THEN 'rojo'::semaforo_estado
        WHEN 'alta' THEN 'rojo'::semaforo_estado
        ELSE 'amarillo'::semaforo_estado
      END,
      'pendiente'::estado_notificacion,
      'Nuevo feedback: ' || NEW.tipo::text,
      v_autor || ': ' || NEW.titulo,
      'feedback_ticket',
      NEW.id,
      jsonb_build_object('tipo', NEW.tipo, 'severidad', NEW.severidad)
    );
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notificar_nuevo_feedback
  AFTER INSERT ON public.feedback_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notificar_nuevo_feedback();

-- Notificación: respuesta visible → dueño del ticket
CREATE OR REPLACE FUNCTION public.notificar_respuesta_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
  v_titulo text;
  v_autor text;
BEGIN
  IF NOT NEW.visible_para_usuario THEN RETURN NEW; END IF;

  SELECT t.usuario_id, t.titulo INTO v_usuario_id, v_titulo
  FROM public.feedback_tickets t WHERE t.id = NEW.ticket_id;

  IF NEW.autor_id = v_usuario_id THEN RETURN NEW; END IF;

  SELECT COALESCE(nombre, '360Lateral') INTO v_autor
  FROM public.perfiles WHERE id = NEW.autor_id;

  INSERT INTO public.notificaciones_sla (
    destinatario_id, tipo, nivel, estado, titulo, mensaje,
    entidad_tipo, entidad_id, data
  ) VALUES (
    v_usuario_id,
    'feedback_respuesta',
    'amarillo'::semaforo_estado,
    'pendiente'::estado_notificacion,
    v_autor || ' respondió a tu feedback',
    v_titulo,
    'feedback_ticket',
    NEW.ticket_id,
    jsonb_build_object('comentario_id', NEW.id)
  );
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notificar_respuesta_feedback
  AFTER INSERT ON public.feedback_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.notificar_respuesta_feedback();
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          activa: boolean
          area_max: number | null
          area_min: number | null
          ciudad: string | null
          created_at: string
          id: string
          precio_max_m2: number | null
          user_id: string
          uso_suelo: string | null
        }
        Insert: {
          activa?: boolean
          area_max?: number | null
          area_min?: number | null
          ciudad?: string | null
          created_at?: string
          id?: string
          precio_max_m2?: number | null
          user_id: string
          uso_suelo?: string | null
        }
        Update: {
          activa?: boolean
          area_max?: number | null
          area_min?: number | null
          ciudad?: string | null
          created_at?: string
          id?: string
          precio_max_m2?: number | null
          user_id?: string
          uso_suelo?: string | null
        }
        Relationships: []
      }
      analisis_documentos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_documento"]
          created_at: string
          created_by: string | null
          descripcion: string | null
          id: string
          lote_id: string
          nombre: string
          tipo_archivo: string | null
          url_storage: string | null
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_documento"]
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          lote_id: string
          nombre: string
          tipo_archivo?: string | null
          url_storage?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_documento"]
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          lote_id?: string
          nombre?: string
          tipo_archivo?: string | null
          url_storage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_documentos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          area_m2: number | null
          ciudad: string | null
          created_at: string
          departamento: string | null
          email: string | null
          estado: string | null
          id: string
          nombre: string | null
          notas: string | null
          objetivo: string | null
          problema_juridico: string | null
          servicios: string[] | null
          telefono: string | null
          tiene_escritura: boolean | null
          tipo_lote: string | null
        }
        Insert: {
          area_m2?: number | null
          ciudad?: string | null
          created_at?: string
          departamento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nombre?: string | null
          notas?: string | null
          objetivo?: string | null
          problema_juridico?: string | null
          servicios?: string[] | null
          telefono?: string | null
          tiene_escritura?: boolean | null
          tipo_lote?: string | null
        }
        Update: {
          area_m2?: number | null
          ciudad?: string | null
          created_at?: string
          departamento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nombre?: string | null
          notas?: string | null
          objetivo?: string | null
          problema_juridico?: string | null
          servicios?: string[] | null
          telefono?: string | null
          tiene_escritura?: boolean | null
          tipo_lote?: string | null
        }
        Relationships: []
      }
      documentos_comisionista: {
        Row: {
          created_at: string
          estado: string
          id: string
          lote_id: string | null
          nombre_documento: string
          notas_admin: string | null
          url_storage: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          lote_id?: string | null
          nombre_documento: string
          notas_admin?: string | null
          url_storage: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          lote_id?: string | null
          nombre_documento?: string
          notas_admin?: string | null
          url_storage?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_comisionista_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          created_at: string
          id: string
          lote_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lote_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lote_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_lotes: {
        Row: {
          created_at: string
          id: string
          lote_id: string
          orden: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          lote_id: string
          orden?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          lote_id?: string
          orden?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_lotes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          asignado_a: string | null
          created_at: string
          email: string | null
          estado: Database["public"]["Enums"]["estado_lead"]
          id: string
          lote_id: string | null
          mensaje: string | null
          nombre: string
          telefono: string | null
        }
        Insert: {
          asignado_a?: string | null
          created_at?: string
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_lead"]
          id?: string
          lote_id?: string | null
          mensaje?: string | null
          nombre: string
          telefono?: string | null
        }
        Update: {
          asignado_a?: string | null
          created_at?: string
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_lead"]
          id?: string
          lote_id?: string | null
          mensaje?: string | null
          nombre?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes: {
        Row: {
          area_total_m2: number | null
          barrio: string | null
          ciudad: string | null
          created_at: string
          departamento: string | null
          destacado: boolean | null
          direccion: string | null
          es_publico: boolean
          estado_disponibilidad: Database["public"]["Enums"]["estado_disponibilidad"]
          estrato: number | null
          fondo_ml: number | null
          foto_url: string | null
          frente_ml: number | null
          has_resolutoria: boolean | null
          id: string
          lat: number | null
          lng: number | null
          matricula_inmobiliaria: string | null
          nombre_lote: string
          notas: string | null
          owner_id: string | null
          problema_juridico: string | null
          score_juridico: number | null
          score_normativo: number | null
          score_servicios: number | null
          tiene_deudas: string | null
          tiene_escritura: boolean | null
          tipo_lote: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          area_total_m2?: number | null
          barrio?: string | null
          ciudad?: string | null
          created_at?: string
          departamento?: string | null
          destacado?: boolean | null
          direccion?: string | null
          es_publico?: boolean
          estado_disponibilidad?: Database["public"]["Enums"]["estado_disponibilidad"]
          estrato?: number | null
          fondo_ml?: number | null
          foto_url?: string | null
          frente_ml?: number | null
          has_resolutoria?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          matricula_inmobiliaria?: string | null
          nombre_lote: string
          notas?: string | null
          owner_id?: string | null
          problema_juridico?: string | null
          score_juridico?: number | null
          score_normativo?: number | null
          score_servicios?: number | null
          tiene_deudas?: string | null
          tiene_escritura?: boolean | null
          tipo_lote?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          area_total_m2?: number | null
          barrio?: string | null
          ciudad?: string | null
          created_at?: string
          departamento?: string | null
          destacado?: boolean | null
          direccion?: string | null
          es_publico?: boolean
          estado_disponibilidad?: Database["public"]["Enums"]["estado_disponibilidad"]
          estrato?: number | null
          fondo_ml?: number | null
          foto_url?: string | null
          frente_ml?: number | null
          has_resolutoria?: boolean | null
          id?: string
          lat?: number | null
          lng?: number | null
          matricula_inmobiliaria?: string | null
          nombre_lote?: string
          notas?: string | null
          owner_id?: string | null
          problema_juridico?: string | null
          score_juridico?: number | null
          score_normativo?: number | null
          score_servicios?: number | null
          tiene_deudas?: string | null
          tiene_escritura?: boolean | null
          tipo_lote?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          contenido: string
          created_at: string
          id: string
          negociacion_id: string
          sender_id: string
        }
        Insert: {
          contenido: string
          created_at?: string
          id?: string
          negociacion_id: string
          sender_id: string
        }
        Update: {
          contenido?: string
          created_at?: string
          id?: string
          negociacion_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_negociacion_id_fkey"
            columns: ["negociacion_id"]
            isOneToOne: false
            referencedRelation: "negociaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      negociaciones: {
        Row: {
          contacto_visible: boolean
          created_at: string
          developer_id: string
          estado: Database["public"]["Enums"]["estado_negociacion"]
          id: string
          lote_id: string
          owner_id: string | null
        }
        Insert: {
          contacto_visible?: boolean
          created_at?: string
          developer_id: string
          estado?: Database["public"]["Enums"]["estado_negociacion"]
          id?: string
          lote_id: string
          owner_id?: string | null
        }
        Update: {
          contacto_visible?: boolean
          created_at?: string
          developer_id?: string
          estado?: Database["public"]["Enums"]["estado_negociacion"]
          id?: string
          lote_id?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negociaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      normativa_urbana: {
        Row: {
          aislamiento_frontal_m: number | null
          aislamiento_lateral_m: number | null
          aislamiento_posterior_m: number | null
          altura_max_metros: number | null
          altura_max_pisos: number | null
          cesion_tipo_a_pct: number | null
          id: string
          indice_construccion: number | null
          indice_ocupacion: number | null
          lote_id: string
          norma_vigente: string | null
          tratamiento: string | null
          uso_principal: string | null
          usos_compatibles: string[] | null
          zona_pot: string | null
        }
        Insert: {
          aislamiento_frontal_m?: number | null
          aislamiento_lateral_m?: number | null
          aislamiento_posterior_m?: number | null
          altura_max_metros?: number | null
          altura_max_pisos?: number | null
          cesion_tipo_a_pct?: number | null
          id?: string
          indice_construccion?: number | null
          indice_ocupacion?: number | null
          lote_id: string
          norma_vigente?: string | null
          tratamiento?: string | null
          uso_principal?: string | null
          usos_compatibles?: string[] | null
          zona_pot?: string | null
        }
        Update: {
          aislamiento_frontal_m?: number | null
          aislamiento_lateral_m?: number | null
          aislamiento_posterior_m?: number | null
          altura_max_metros?: number | null
          altura_max_pisos?: number | null
          cesion_tipo_a_pct?: number | null
          id?: string
          indice_construccion?: number | null
          indice_ocupacion?: number | null
          lote_id?: string
          norma_vigente?: string | null
          tratamiento?: string | null
          uso_principal?: string | null
          usos_compatibles?: string[] | null
          zona_pot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "normativa_urbana_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          id: string
          leida: boolean
          lote_id: string
          mensaje: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leida?: boolean
          lote_id: string
          mensaje: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leida?: boolean
          lote_id?: string
          mensaje?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean | null
          created_at: string
          id: string
          nombre: string | null
          telefono: string | null
          user_type: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          id: string
          nombre?: string | null
          telefono?: string | null
          user_type?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          id?: string
          nombre?: string | null
          telefono?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      precios: {
        Row: {
          id: string
          lote_id: string
          notas: string | null
          precio_cop: number | null
          precio_m2_cop: number | null
          vigencia: string | null
        }
        Insert: {
          id?: string
          lote_id: string
          notas?: string | null
          precio_cop?: number | null
          precio_m2_cop?: number | null
          vigencia?: string | null
        }
        Update: {
          id?: string
          lote_id?: string
          notas?: string | null
          precio_cop?: number | null
          precio_m2_cop?: number | null
          vigencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precios_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_publicos: {
        Row: {
          estado: Database["public"]["Enums"]["estado_servicio"]
          id: string
          lote_id: string
          operador: string | null
          tipo: string
        }
        Insert: {
          estado?: Database["public"]["Enums"]["estado_servicio"]
          id?: string
          lote_id: string
          operador?: string | null
          tipo: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["estado_servicio"]
          id?: string
          lote_id?: string
          operador?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_publicos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_asesor: { Args: { _user_id: string }; Returns: boolean }
      is_negociacion_participant: {
        Args: { _negociacion_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "asesor"
        | "inversor"
        | "developer"
        | "dueno"
        | "comisionista"
      categoria_documento:
        | "financiero"
        | "tecnico"
        | "predial"
        | "normativo"
        | "juridico"
        | "otro"
      estado_disponibilidad:
        | "Disponible"
        | "Reservado"
        | "Vendido"
        | "En revisión"
      estado_lead:
        | "nuevo"
        | "contactado"
        | "negociacion"
        | "cerrado"
        | "descartado"
      estado_negociacion: "activa" | "en_revision" | "cerrada" | "concretada"
      estado_servicio: "Disponible" | "En trámite" | "No disponible"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "asesor",
        "inversor",
        "developer",
        "dueno",
        "comisionista",
      ],
      categoria_documento: [
        "financiero",
        "tecnico",
        "predial",
        "normativo",
        "juridico",
        "otro",
      ],
      estado_disponibilidad: [
        "Disponible",
        "Reservado",
        "Vendido",
        "En revisión",
      ],
      estado_lead: [
        "nuevo",
        "contactado",
        "negociacion",
        "cerrado",
        "descartado",
      ],
      estado_negociacion: ["activa", "en_revision", "cerrada", "concretada"],
      estado_servicio: ["Disponible", "En trámite", "No disponible"],
    },
  },
} as const

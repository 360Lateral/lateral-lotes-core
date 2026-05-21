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
          altura_min_pisos: number | null
          area_max: number | null
          area_min: number | null
          barrio: string | null
          ciudad: string | null
          created_at: string
          descripcion: string | null
          estratos: number[] | null
          id: string
          io_minimo: number | null
          nombre: string | null
          precio_max_m2: number | null
          presupuesto_max: number | null
          presupuesto_min: number | null
          status: string | null
          tratamiento: string | null
          tratamientos: string[] | null
          updated_at: string | null
          user_id: string
          uso_suelo: string | null
        }
        Insert: {
          activa?: boolean
          altura_min_pisos?: number | null
          area_max?: number | null
          area_min?: number | null
          barrio?: string | null
          ciudad?: string | null
          created_at?: string
          descripcion?: string | null
          estratos?: number[] | null
          id?: string
          io_minimo?: number | null
          nombre?: string | null
          precio_max_m2?: number | null
          presupuesto_max?: number | null
          presupuesto_min?: number | null
          status?: string | null
          tratamiento?: string | null
          tratamientos?: string[] | null
          updated_at?: string | null
          user_id: string
          uso_suelo?: string | null
        }
        Update: {
          activa?: boolean
          altura_min_pisos?: number | null
          area_max?: number | null
          area_min?: number | null
          barrio?: string | null
          ciudad?: string | null
          created_at?: string
          descripcion?: string | null
          estratos?: number[] | null
          id?: string
          io_minimo?: number | null
          nombre?: string | null
          precio_max_m2?: number | null
          presupuesto_max?: number | null
          presupuesto_min?: number | null
          status?: string | null
          tratamiento?: string | null
          tratamientos?: string[] | null
          updated_at?: string | null
          user_id?: string
          uso_suelo?: string | null
        }
        Relationships: []
      }
      analisis_ambiental: {
        Row: {
          amenaza_inundacion: string | null
          amenaza_remocion: string | null
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          distancia_ronda_m: number | null
          id: string
          lote_id: string
          observaciones: string | null
          pasivo_ambiental: boolean | null
          requiere_licencia_ambiental: boolean | null
          reserva_forestal: boolean | null
          ronda_hidrica: boolean | null
          updated_at: string | null
        }
        Insert: {
          amenaza_inundacion?: string | null
          amenaza_remocion?: string | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          distancia_ronda_m?: number | null
          id?: string
          lote_id: string
          observaciones?: string | null
          pasivo_ambiental?: boolean | null
          requiere_licencia_ambiental?: boolean | null
          reserva_forestal?: boolean | null
          ronda_hidrica?: boolean | null
          updated_at?: string | null
        }
        Update: {
          amenaza_inundacion?: string | null
          amenaza_remocion?: string | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          distancia_ronda_m?: number | null
          id?: string
          lote_id?: string
          observaciones?: string | null
          pasivo_ambiental?: boolean | null
          requiere_licencia_ambiental?: boolean | null
          reserva_forestal?: boolean | null
          ronda_hidrica?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_ambiental_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_ambiental_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_arquitectonico: {
        Row: {
          area_vendible_pct: number | null
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          eficiencia_lote_pct: number | null
          forma_lote: string | null
          id: string
          lote_id: string
          m2_construibles_total: number | null
          observaciones: string | null
          permite_sotano: boolean | null
          tipologias: string | null
          unidades_estimadas: number | null
          updated_at: string | null
        }
        Insert: {
          area_vendible_pct?: number | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          eficiencia_lote_pct?: number | null
          forma_lote?: string | null
          id?: string
          lote_id: string
          m2_construibles_total?: number | null
          observaciones?: string | null
          permite_sotano?: boolean | null
          tipologias?: string | null
          unidades_estimadas?: number | null
          updated_at?: string | null
        }
        Update: {
          area_vendible_pct?: number | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          eficiencia_lote_pct?: number | null
          forma_lote?: string | null
          id?: string
          lote_id?: string
          m2_construibles_total?: number | null
          observaciones?: string | null
          permite_sotano?: boolean | null
          tipologias?: string | null
          unidades_estimadas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_arquitectonico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_arquitectonico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "analisis_documentos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_financiero: {
        Row: {
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          costo_construccion_m2: number | null
          id: string
          ingresos_proyectados: number | null
          lote_id: string
          margen_bruto_pct: number | null
          observaciones: string | null
          precio_estimado_max: number | null
          precio_estimado_min: number | null
          precio_estimado_promedio: number | null
          punto_equilibrio_pct: number | null
          tir_pct: number | null
          updated_at: string | null
          valor_compra_lote: number | null
          vpn: number | null
        }
        Insert: {
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          costo_construccion_m2?: number | null
          id?: string
          ingresos_proyectados?: number | null
          lote_id: string
          margen_bruto_pct?: number | null
          observaciones?: string | null
          precio_estimado_max?: number | null
          precio_estimado_min?: number | null
          precio_estimado_promedio?: number | null
          punto_equilibrio_pct?: number | null
          tir_pct?: number | null
          updated_at?: string | null
          valor_compra_lote?: number | null
          vpn?: number | null
        }
        Update: {
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          costo_construccion_m2?: number | null
          id?: string
          ingresos_proyectados?: number | null
          lote_id?: string
          margen_bruto_pct?: number | null
          observaciones?: string | null
          precio_estimado_max?: number | null
          precio_estimado_min?: number | null
          precio_estimado_promedio?: number | null
          punto_equilibrio_pct?: number | null
          tir_pct?: number | null
          updated_at?: string | null
          valor_compra_lote?: number | null
          vpn?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_financiero_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_financiero_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_geotecnico: {
        Row: {
          capacidad_portante_ton_m2: number | null
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          id: string
          lote_id: string
          nivel_freatico_m: number | null
          observaciones: string | null
          pendiente_pct: number | null
          sistema_cimentacion: string | null
          sobrecosto_cimentacion_estimado: number | null
          tipo_suelo: string | null
          updated_at: string | null
        }
        Insert: {
          capacidad_portante_ton_m2?: number | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          id?: string
          lote_id: string
          nivel_freatico_m?: number | null
          observaciones?: string | null
          pendiente_pct?: number | null
          sistema_cimentacion?: string | null
          sobrecosto_cimentacion_estimado?: number | null
          tipo_suelo?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidad_portante_ton_m2?: number | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          id?: string
          lote_id?: string
          nivel_freatico_m?: number | null
          observaciones?: string | null
          pendiente_pct?: number | null
          sistema_cimentacion?: string | null
          sobrecosto_cimentacion_estimado?: number | null
          tipo_suelo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_geotecnico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_geotecnico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_juridico: {
        Row: {
          cadena_tradicion: string | null
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          deuda_predial: boolean | null
          discrepancia_areas: boolean | null
          gravamenes: boolean | null
          hipoteca_activa: boolean | null
          id: string
          litigio_activo: boolean | null
          lote_id: string
          observaciones: string | null
          proceso_sucesion: boolean | null
          servidumbres: boolean | null
          updated_at: string | null
        }
        Insert: {
          cadena_tradicion?: string | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          deuda_predial?: boolean | null
          discrepancia_areas?: boolean | null
          gravamenes?: boolean | null
          hipoteca_activa?: boolean | null
          id?: string
          litigio_activo?: boolean | null
          lote_id: string
          observaciones?: string | null
          proceso_sucesion?: boolean | null
          servidumbres?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cadena_tradicion?: string | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          deuda_predial?: boolean | null
          discrepancia_areas?: boolean | null
          gravamenes?: boolean | null
          hipoteca_activa?: boolean | null
          id?: string
          litigio_activo?: boolean | null
          lote_id?: string
          observaciones?: string | null
          proceso_sucesion?: boolean | null
          servidumbres?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_juridico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_juridico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_mercado: {
        Row: {
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          id: string
          lote_id: string
          observaciones: string | null
          perfil_comprador: string | null
          precio_unidad_promedio: number | null
          precio_venta_m2_zona: number | null
          proyectos_competidores: number | null
          updated_at: string | null
          valorizacion_anual_pct: number | null
          velocidad_absorcion_unidades_mes: number | null
        }
        Insert: {
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          id?: string
          lote_id: string
          observaciones?: string | null
          perfil_comprador?: string | null
          precio_unidad_promedio?: number | null
          precio_venta_m2_zona?: number | null
          proyectos_competidores?: number | null
          updated_at?: string | null
          valorizacion_anual_pct?: number | null
          velocidad_absorcion_unidades_mes?: number | null
        }
        Update: {
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          id?: string
          lote_id?: string
          observaciones?: string | null
          perfil_comprador?: string | null
          precio_unidad_promedio?: number | null
          precio_venta_m2_zona?: number | null
          proyectos_competidores?: number | null
          updated_at?: string | null
          valorizacion_anual_pct?: number | null
          velocidad_absorcion_unidades_mes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_mercado_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_mercado_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_sspp: {
        Row: {
          acueducto_disponible: boolean | null
          alcantarillado_disponible: boolean | null
          capacidad_red_kva: number | null
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          costo_extension_estimado: number | null
          distancia_red_matriz_m: number | null
          energia_disponible: boolean | null
          gas_disponible: boolean | null
          id: string
          lote_id: string
          observaciones: string | null
          updated_at: string | null
          via_pavimentada: boolean | null
        }
        Insert: {
          acueducto_disponible?: boolean | null
          alcantarillado_disponible?: boolean | null
          capacidad_red_kva?: number | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          costo_extension_estimado?: number | null
          distancia_red_matriz_m?: number | null
          energia_disponible?: boolean | null
          gas_disponible?: boolean | null
          id?: string
          lote_id: string
          observaciones?: string | null
          updated_at?: string | null
          via_pavimentada?: boolean | null
        }
        Update: {
          acueducto_disponible?: boolean | null
          alcantarillado_disponible?: boolean | null
          capacidad_red_kva?: number | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          costo_extension_estimado?: number | null
          distancia_red_matriz_m?: number | null
          energia_disponible?: boolean | null
          gas_disponible?: boolean | null
          id?: string
          lote_id?: string
          observaciones?: string | null
          updated_at?: string | null
          via_pavimentada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_sspp_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_sspp_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas_ia: {
        Row: {
          created_at: string
          id: string
          lote_id: string
          pregunta: string
          respuesta: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lote_id: string
          pregunta: string
          respuesta: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lote_id?: string
          pregunta?: string
          respuesta?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_ia_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_ia_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      criteria_matches: {
        Row: {
          alerta_id: string
          calculated_at: string
          detalles: Json | null
          id: string
          lote_id: string
          score: number
        }
        Insert: {
          alerta_id: string
          calculated_at?: string
          detalles?: Json | null
          id?: string
          lote_id: string
          score?: number
        }
        Update: {
          alerta_id?: string
          calculated_at?: string
          detalles?: Json | null
          id?: string
          lote_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "criteria_matches_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criteria_matches_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criteria_matches_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          area_m2: number | null
          ciudad: string | null
          convertido_a_lote: boolean | null
          created_at: string
          departamento: string | null
          email: string | null
          estado: string | null
          id: string
          lote_id: string | null
          nombre: string | null
          notas: string | null
          objetivo: string | null
          problema_juridico: string | null
          servicios: string[] | null
          telefono: string | null
          tiene_escritura: boolean | null
          tipo_lote: string | null
          user_id: string | null
        }
        Insert: {
          area_m2?: number | null
          ciudad?: string | null
          convertido_a_lote?: boolean | null
          created_at?: string
          departamento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          lote_id?: string | null
          nombre?: string | null
          notas?: string | null
          objetivo?: string | null
          problema_juridico?: string | null
          servicios?: string[] | null
          telefono?: string | null
          tiene_escritura?: boolean | null
          tipo_lote?: string | null
          user_id?: string | null
        }
        Update: {
          area_m2?: number | null
          ciudad?: string | null
          convertido_a_lote?: boolean | null
          created_at?: string
          departamento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          lote_id?: string | null
          nombre?: string | null
          notas?: string | null
          objetivo?: string | null
          problema_juridico?: string | null
          servicios?: string[] | null
          telefono?: string | null
          tiene_escritura?: boolean | null
          tipo_lote?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "documentos_comisionista_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      engagements_lote: {
        Row: {
          asesor_asignado_id: string | null
          avance_pct: number
          cliente_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_engagement"]
          estado_pago: string
          fecha_entrega: string | null
          fecha_inicio: string | null
          fecha_sla_objetivo: string | null
          fecha_solicitud: string
          gerente_id: string | null
          id: string
          lead_id: string | null
          lote_id: string
          moneda: string
          notas: string | null
          plan_id: string | null
          precio_cobrado: number | null
          updated_at: string
        }
        Insert: {
          asesor_asignado_id?: string | null
          avance_pct?: number
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_engagement"]
          estado_pago?: string
          fecha_entrega?: string | null
          fecha_inicio?: string | null
          fecha_sla_objetivo?: string | null
          fecha_solicitud?: string
          gerente_id?: string | null
          id?: string
          lead_id?: string | null
          lote_id: string
          moneda?: string
          notas?: string | null
          plan_id?: string | null
          precio_cobrado?: number | null
          updated_at?: string
        }
        Update: {
          asesor_asignado_id?: string | null
          avance_pct?: number
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_engagement"]
          estado_pago?: string
          fecha_entrega?: string | null
          fecha_inicio?: string | null
          fecha_sla_objetivo?: string | null
          fecha_solicitud?: string
          gerente_id?: string | null
          id?: string
          lead_id?: string | null
          lote_id?: string
          moneda?: string
          notas?: string | null
          plan_id?: string | null
          precio_cobrado?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagements_lote_asesor_asignado_id_fkey"
            columns: ["asesor_asignado_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_gerente_id_fkey"
            columns: ["gerente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_diagnostico"
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
          {
            foreignKeyName: "favoritos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
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
          {
            foreignKeyName: "fotos_lotes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
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
          {
            foreignKeyName: "leads_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes: {
        Row: {
          area_total_m2: number | null
          barrio: string | null
          cbml: string | null
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
          nombre_propietario: string | null
          notas: string | null
          owner_id: string | null
          problema_juridico: string | null
          score_ambiental: number | null
          score_arquitectonico: number | null
          score_financiero: number | null
          score_geotecnico: number | null
          score_juridico: number | null
          score_mercado: number | null
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
          cbml?: string | null
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
          nombre_propietario?: string | null
          notas?: string | null
          owner_id?: string | null
          problema_juridico?: string | null
          score_ambiental?: number | null
          score_arquitectonico?: number | null
          score_financiero?: number | null
          score_geotecnico?: number | null
          score_juridico?: number | null
          score_mercado?: number | null
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
          cbml?: string | null
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
          nombre_propietario?: string | null
          notas?: string | null
          owner_id?: string | null
          problema_juridico?: string | null
          score_ambiental?: number | null
          score_arquitectonico?: number | null
          score_financiero?: number | null
          score_geotecnico?: number | null
          score_juridico?: number | null
          score_mercado?: number | null
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
      mapgis_cache: {
        Row: {
          cbml: string
          consultado_at: string
          datos: Json
          es_valido: boolean
          expira_at: string
          id: string
          tipo_entrada: string
          user_id: string | null
          valor_entrada: string
        }
        Insert: {
          cbml: string
          consultado_at?: string
          datos?: Json
          es_valido?: boolean
          expira_at?: string
          id?: string
          tipo_entrada?: string
          user_id?: string | null
          valor_entrada: string
        }
        Update: {
          cbml?: string
          consultado_at?: string
          datos?: Json
          es_valido?: boolean
          expira_at?: string
          id?: string
          tipo_entrada?: string
          user_id?: string | null
          valor_entrada?: string
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          contenido: string
          created_at: string
          id: string
          leido: boolean
          metadata: Json | null
          negociacion_id: string
          sender_id: string
          tipo: string | null
        }
        Insert: {
          contenido: string
          created_at?: string
          id?: string
          leido?: boolean
          metadata?: Json | null
          negociacion_id: string
          sender_id: string
          tipo?: string | null
        }
        Update: {
          contenido?: string
          created_at?: string
          id?: string
          leido?: boolean
          metadata?: Json | null
          negociacion_id?: string
          sender_id?: string
          tipo?: string | null
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
          updated_at: string | null
        }
        Insert: {
          contacto_visible?: boolean
          created_at?: string
          developer_id: string
          estado?: Database["public"]["Enums"]["estado_negociacion"]
          id?: string
          lote_id: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          contacto_visible?: boolean
          created_at?: string
          developer_id?: string
          estado?: Database["public"]["Enums"]["estado_negociacion"]
          id?: string
          lote_id?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negociaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
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
          altura_texto: string | null
          cesion_tipo_a_pct: number | null
          cesion_tipo_b: number | null
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          densidad_max: number | null
          id: string
          indice_construccion: number | null
          indice_ocupacion: number | null
          io_plataforma: number | null
          io_torre: number | null
          lote_id: string
          norma_vigente: string | null
          tratamiento: string | null
          uso_principal: string | null
          usos_compatibles: string[] | null
          zona_homogenea: string | null
          zona_pot: string | null
        }
        Insert: {
          aislamiento_frontal_m?: number | null
          aislamiento_lateral_m?: number | null
          aislamiento_posterior_m?: number | null
          altura_max_metros?: number | null
          altura_max_pisos?: number | null
          altura_texto?: string | null
          cesion_tipo_a_pct?: number | null
          cesion_tipo_b?: number | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          densidad_max?: number | null
          id?: string
          indice_construccion?: number | null
          indice_ocupacion?: number | null
          io_plataforma?: number | null
          io_torre?: number | null
          lote_id: string
          norma_vigente?: string | null
          tratamiento?: string | null
          uso_principal?: string | null
          usos_compatibles?: string[] | null
          zona_homogenea?: string | null
          zona_pot?: string | null
        }
        Update: {
          aislamiento_frontal_m?: number | null
          aislamiento_lateral_m?: number | null
          aislamiento_posterior_m?: number | null
          altura_max_metros?: number | null
          altura_max_pisos?: number | null
          altura_texto?: string | null
          cesion_tipo_a_pct?: number | null
          cesion_tipo_b?: number | null
          completado?: boolean | null
          completado_at?: string | null
          completado_por?: string | null
          densidad_max?: number | null
          id?: string
          indice_construccion?: number | null
          indice_ocupacion?: number | null
          io_plataforma?: number | null
          io_torre?: number | null
          lote_id?: string
          norma_vigente?: string | null
          tratamiento?: string | null
          uso_principal?: string | null
          usos_compatibles?: string[] | null
          zona_homogenea?: string | null
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
          {
            foreignKeyName: "normativa_urbana_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          alerta_id: string | null
          created_at: string
          id: string
          leida: boolean
          lote_id: string
          mensaje: string
          negociacion_id: string | null
          score: number | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          alerta_id?: string | null
          created_at?: string
          id?: string
          leida?: boolean
          lote_id: string
          mensaje: string
          negociacion_id?: string | null
          score?: number | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          alerta_id?: string | null
          created_at?: string
          id?: string
          leida?: boolean
          lote_id?: string
          mensaje?: string
          negociacion_id?: string | null
          score?: number | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_negociacion_id_fkey"
            columns: ["negociacion_id"]
            isOneToOne: false
            referencedRelation: "negociaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean | null
          created_at: string
          email: string | null
          id: string
          nombre: string | null
          onboarding_completado: boolean | null
          onboarding_paso: number | null
          plan: string | null
          telefono: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          email?: string | null
          id: string
          nombre?: string | null
          onboarding_completado?: boolean | null
          onboarding_paso?: number | null
          plan?: string | null
          telefono?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string | null
          onboarding_completado?: boolean | null
          onboarding_paso?: number | null
          plan?: string | null
          telefono?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      planes: {
        Row: {
          acceso_analisis_completo: boolean
          acceso_documentos: boolean
          acceso_negociaciones: boolean
          activo: boolean
          created_at: string
          descripcion: string | null
          destacar_lotes: boolean
          id: string
          max_alertas: number | null
          max_consultas_ia_mes: number | null
          max_documentos: number | null
          max_lotes: number | null
          nombre: string
          precio_anual_cop: number | null
          precio_cop: number
          slug: string
        }
        Insert: {
          acceso_analisis_completo?: boolean
          acceso_documentos?: boolean
          acceso_negociaciones?: boolean
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          destacar_lotes?: boolean
          id?: string
          max_alertas?: number | null
          max_consultas_ia_mes?: number | null
          max_documentos?: number | null
          max_lotes?: number | null
          nombre: string
          precio_anual_cop?: number | null
          precio_cop?: number
          slug: string
        }
        Update: {
          acceso_analisis_completo?: boolean
          acceso_documentos?: boolean
          acceso_negociaciones?: boolean
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          destacar_lotes?: boolean
          id?: string
          max_alertas?: number | null
          max_consultas_ia_mes?: number | null
          max_documentos?: number | null
          max_lotes?: number | null
          nombre?: string
          precio_anual_cop?: number | null
          precio_cop?: number
          slug?: string
        }
        Relationships: []
      }
      planes_analisis: {
        Row: {
          id: string
          incluido: boolean
          peso_avance: number
          plan_id: string
          tipo_analisis_id: string
        }
        Insert: {
          id?: string
          incluido?: boolean
          peso_avance?: number
          plan_id: string
          tipo_analisis_id: string
        }
        Update: {
          id?: string
          incluido?: boolean
          peso_avance?: number
          plan_id?: string
          tipo_analisis_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_analisis_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_diagnostico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_analisis_tipo_analisis_id_fkey"
            columns: ["tipo_analisis_id"]
            isOneToOne: false
            referencedRelation: "tipos_analisis"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_diagnostico: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          dias_sla: number | null
          id: string
          moneda: string
          nombre: string
          orden: number | null
          precio_cop: number | null
          precio_smlmv: number | null
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          dias_sla?: number | null
          id?: string
          moneda?: string
          nombre: string
          orden?: number | null
          precio_cop?: number | null
          precio_smlmv?: number | null
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          dias_sla?: number | null
          id?: string
          moneda?: string
          nombre?: string
          orden?: number | null
          precio_cop?: number | null
          precio_smlmv?: number | null
        }
        Relationships: []
      }
      pot_norma_referencia: {
        Row: {
          aislamiento_frontal_m: number | null
          aislamiento_lateral_m: number | null
          aislamiento_posterior_m: number | null
          franja: string | null
          id: string
          io_plataforma: number | null
          io_torre: number | null
          observaciones: string | null
          tipo: string
          tratamiento: string | null
        }
        Insert: {
          aislamiento_frontal_m?: number | null
          aislamiento_lateral_m?: number | null
          aislamiento_posterior_m?: number | null
          franja?: string | null
          id?: string
          io_plataforma?: number | null
          io_torre?: number | null
          observaciones?: string | null
          tipo: string
          tratamiento?: string | null
        }
        Update: {
          aislamiento_frontal_m?: number | null
          aislamiento_lateral_m?: number | null
          aislamiento_posterior_m?: number | null
          franja?: string | null
          id?: string
          io_plataforma?: number | null
          io_torre?: number | null
          observaciones?: string | null
          tipo?: string
          tratamiento?: string | null
        }
        Relationships: []
      }
      pot_poligonos: {
        Row: {
          altura_max_m: number | null
          altura_max_pisos: number | null
          altura_texto: string | null
          cesion_tipo_a: number | null
          cesion_tipo_b: number | null
          densidad_max: number | null
          densidad_texto: string | null
          departamento: string
          fecha_carga: string | null
          fuente: string | null
          geom: unknown
          ic_base: number | null
          ic_maximo: number | null
          ic_texto: string | null
          id: string
          io: number | null
          municipio: string
          norma_vigente: string | null
          poligono_norma: string | null
          tratamiento: string | null
          uso_principal: string | null
          usos_compatibles: string[] | null
          zona_homogenea: string | null
        }
        Insert: {
          altura_max_m?: number | null
          altura_max_pisos?: number | null
          altura_texto?: string | null
          cesion_tipo_a?: number | null
          cesion_tipo_b?: number | null
          densidad_max?: number | null
          densidad_texto?: string | null
          departamento: string
          fecha_carga?: string | null
          fuente?: string | null
          geom?: unknown
          ic_base?: number | null
          ic_maximo?: number | null
          ic_texto?: string | null
          id?: string
          io?: number | null
          municipio: string
          norma_vigente?: string | null
          poligono_norma?: string | null
          tratamiento?: string | null
          uso_principal?: string | null
          usos_compatibles?: string[] | null
          zona_homogenea?: string | null
        }
        Update: {
          altura_max_m?: number | null
          altura_max_pisos?: number | null
          altura_texto?: string | null
          cesion_tipo_a?: number | null
          cesion_tipo_b?: number | null
          densidad_max?: number | null
          densidad_texto?: string | null
          departamento?: string
          fecha_carga?: string | null
          fuente?: string | null
          geom?: unknown
          ic_base?: number | null
          ic_maximo?: number | null
          ic_texto?: string | null
          id?: string
          io?: number | null
          municipio?: string
          norma_vigente?: string | null
          poligono_norma?: string | null
          tratamiento?: string | null
          uso_principal?: string | null
          usos_compatibles?: string[] | null
          zona_homogenea?: string | null
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
          {
            foreignKeyName: "precios_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
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
          {
            foreignKeyName: "servicios_publicos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          ciclo: string | null
          created_at: string | null
          estado: string
          external_customer_id: string | null
          external_subscription_id: string | null
          fecha_fin: string | null
          fecha_inicio: string
          fecha_vencimiento: string | null
          id: string
          monto_cop: number | null
          plan: string
          plan_id: string | null
          proveedor_pago: string | null
          prueba_hasta: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
          wompi_subscription_id: string | null
        }
        Insert: {
          ciclo?: string | null
          created_at?: string | null
          estado?: string
          external_customer_id?: string | null
          external_subscription_id?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          fecha_vencimiento?: string | null
          id?: string
          monto_cop?: number | null
          plan?: string
          plan_id?: string | null
          proveedor_pago?: string | null
          prueba_hasta?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
          wompi_subscription_id?: string | null
        }
        Update: {
          ciclo?: string | null
          created_at?: string | null
          estado?: string
          external_customer_id?: string | null
          external_subscription_id?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          fecha_vencimiento?: string | null
          id?: string
          monto_cop?: number | null
          plan?: string
          plan_id?: string | null
          proveedor_pago?: string | null
          prueba_hasta?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
          wompi_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_analisis: {
        Row: {
          avance_pct: number
          bloqueado: boolean
          created_at: string
          engagement_id: string
          estado: Database["public"]["Enums"]["estado_analisis"]
          fecha_completado: string | null
          fecha_inicio: string | null
          fecha_objetivo: string | null
          id: string
          link_detalle_id: string | null
          motivo_bloqueo: string | null
          responsable_id: string | null
          tipo_analisis_id: string
          updated_at: string
        }
        Insert: {
          avance_pct?: number
          bloqueado?: boolean
          created_at?: string
          engagement_id: string
          estado?: Database["public"]["Enums"]["estado_analisis"]
          fecha_completado?: string | null
          fecha_inicio?: string | null
          fecha_objetivo?: string | null
          id?: string
          link_detalle_id?: string | null
          motivo_bloqueo?: string | null
          responsable_id?: string | null
          tipo_analisis_id: string
          updated_at?: string
        }
        Update: {
          avance_pct?: number
          bloqueado?: boolean
          created_at?: string
          engagement_id?: string
          estado?: Database["public"]["Enums"]["estado_analisis"]
          fecha_completado?: string | null
          fecha_inicio?: string | null
          fecha_objetivo?: string | null
          id?: string
          link_detalle_id?: string | null
          motivo_bloqueo?: string | null
          responsable_id?: string | null
          tipo_analisis_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_analisis_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_analisis_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_analisis_tipo_analisis_id_fkey"
            columns: ["tipo_analisis_id"]
            isOneToOne: false
            referencedRelation: "tipos_analisis"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_analisis: {
        Row: {
          activo: boolean
          codigo: string
          id: string
          nombre: string
          orden: number | null
          tabla_destino: string | null
        }
        Insert: {
          activo?: boolean
          codigo: string
          id?: string
          nombre: string
          orden?: number | null
          tabla_destino?: string | null
        }
        Update: {
          activo?: boolean
          codigo?: string
          id?: string
          nombre?: string
          orden?: number | null
          tabla_destino?: string | null
        }
        Relationships: []
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
      usuario_owner: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      lotes_publicos: {
        Row: {
          area_total_m2: number | null
          barrio: string | null
          ciudad: string | null
          created_at: string | null
          departamento: string | null
          destacado: boolean | null
          direccion: string | null
          es_publico: boolean | null
          estado_disponibilidad:
            | Database["public"]["Enums"]["estado_disponibilidad"]
            | null
          estrato: number | null
          fondo_ml: number | null
          foto_url: string | null
          frente_ml: number | null
          has_resolutoria: boolean | null
          id: string | null
          lat: number | null
          lng: number | null
          nombre_lote: string | null
          owner_id: string | null
          precio_cop: number | null
          precio_m2_cop: number | null
          score_ambiental: number | null
          score_arquitectonico: number | null
          score_financiero: number | null
          score_geotecnico: number | null
          score_juridico: number | null
          score_mercado: number | null
          score_normativo: number | null
          score_servicios: number | null
          tipo_lote: string | null
          updated_at: string | null
          video_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_match_score: {
        Args: { p_alerta_id: string; p_lote_id: string }
        Returns: {
          detalles: Json
          score: number
        }[]
      }
      consultar_norma_por_punto: {
        Args: { p_lat: number; p_lng: number }
        Returns: {
          aislamiento_frontal_m: number
          aislamiento_lateral_m: number
          aislamiento_posterior_m: number
          altura_max_m: number
          altura_max_pisos: number
          altura_texto: string
          cesion_tipo_a: number
          cesion_tipo_b: number
          densidad_max: number
          densidad_texto: string
          franja: string
          fuente: string
          ic_base: number
          ic_maximo: number
          ic_texto: string
          io: number
          io_torre: number
          municipio: string
          norma_vigente: string
          observaciones_norma: string
          poligono_norma: string
          tratamiento: string
          uso_principal: string
          usos_compatibles: string[]
          zona_homogenea: string
        }[]
      }
      count_diagnosticos: { Args: never; Returns: number }
      crear_engagement: {
        Args: { p_cliente_id?: string; p_lote_id: string; p_plan_id: string }
        Returns: string
      }
      es_asesor_de_engagement: {
        Args: { _engagement_id: string; _user_id: string }
        Returns: boolean
      }
      factor_avance_por_estado: {
        Args: { p_estado: Database["public"]["Enums"]["estado_analisis"] }
        Returns: number
      }
      get_plan_limits: {
        Args: { _user_id: string }
        Returns: {
          acceso_analisis_completo: boolean
          acceso_documentos: boolean
          acceso_negociaciones: boolean
          destacar_lotes: boolean
          max_alertas: number
          max_consultas_ia_mes: number
          max_documentos: number
          max_lotes: number
          plan_slug: string
        }[]
      }
      get_user_plan: { Args: { _user_id: string }; Returns: string }
      has_lot_access: {
        Args: { _lote_id: string; _user_id: string }
        Returns: boolean
      }
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin_or_admin: { Args: { _user_id: string }; Returns: boolean }
      puede_ver_engagement: {
        Args: { _engagement_id: string; _user_id: string }
        Returns: boolean
      }
      recalcular_todas_notificaciones: { Args: never; Returns: number }
      refresh_matches_alerta: {
        Args: { p_alerta_id: string }
        Returns: undefined
      }
      shares_negociacion: {
        Args: { _user_a: string; _user_b: string }
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
      estado_analisis:
        | "no_aplica"
        | "pendiente"
        | "en_progreso"
        | "en_revision"
        | "aprobado"
        | "rechazado"
        | "entregado"
      estado_disponibilidad:
        | "Disponible"
        | "Reservado"
        | "Vendido"
        | "En revisión"
      estado_engagement:
        | "prospecto"
        | "activo"
        | "en_revision"
        | "entregado"
        | "cerrado"
        | "cancelado"
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
      estado_analisis: [
        "no_aplica",
        "pendiente",
        "en_progreso",
        "en_revision",
        "aprobado",
        "rechazado",
        "entregado",
      ],
      estado_disponibilidad: [
        "Disponible",
        "Reservado",
        "Vendido",
        "En revisión",
      ],
      estado_engagement: [
        "prospecto",
        "activo",
        "en_revision",
        "entregado",
        "cerrado",
        "cancelado",
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

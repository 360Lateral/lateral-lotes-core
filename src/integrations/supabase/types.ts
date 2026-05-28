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
          engagement_id: string | null
          experto_id: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
            foreignKeyName: "analisis_ambiental_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_ambiental_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "analisis_ambiental_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_ambiental_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
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
          {
            foreignKeyName: "analisis_ambiental_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_ambiental_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          engagement_id: string | null
          experto_id: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
            foreignKeyName: "analisis_arquitectonico_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_arquitectonico_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "analisis_arquitectonico_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_arquitectonico_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
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
          {
            foreignKeyName: "analisis_arquitectonico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_arquitectonico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          {
            foreignKeyName: "analisis_documentos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_documentos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      analisis_financiero: {
        Row: {
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          costo_construccion_m2: number | null
          engagement_id: string | null
          experto_id: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
            foreignKeyName: "analisis_financiero_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_financiero_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "analisis_financiero_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_financiero_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
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
          {
            foreignKeyName: "analisis_financiero_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_financiero_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      analisis_geotecnico: {
        Row: {
          capacidad_portante_ton_m2: number | null
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          engagement_id: string | null
          experto_id: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
            foreignKeyName: "analisis_geotecnico_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_geotecnico_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "analisis_geotecnico_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_geotecnico_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
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
          {
            foreignKeyName: "analisis_geotecnico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_geotecnico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          engagement_id: string | null
          experto_id: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
            foreignKeyName: "analisis_juridico_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_juridico_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "analisis_juridico_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_juridico_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
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
          {
            foreignKeyName: "analisis_juridico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_juridico_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      analisis_mercado: {
        Row: {
          completado: boolean | null
          completado_at: string | null
          completado_por: string | null
          engagement_id: string | null
          experto_id: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
            foreignKeyName: "analisis_mercado_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_mercado_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "analisis_mercado_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_mercado_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
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
          {
            foreignKeyName: "analisis_mercado_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_mercado_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          engagement_id: string | null
          experto_id: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
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
          engagement_id?: string | null
          experto_id?: string | null
          gas_disponible?: boolean | null
          id?: string
          lote_id?: string
          observaciones?: string | null
          updated_at?: string | null
          via_pavimentada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_sspp_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_sspp_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "analisis_sspp_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_sspp_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
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
          {
            foreignKeyName: "analisis_sspp_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_sspp_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      audit_nivel_suscripcion: {
        Row: {
          cambiado_por: string | null
          created_at: string
          desarrollador_id: string
          id: string
          motivo: string | null
          nivel_anterior:
            | Database["public"]["Enums"]["nivel_suscripcion"]
            | null
          nivel_nuevo: Database["public"]["Enums"]["nivel_suscripcion"]
          origen: string
        }
        Insert: {
          cambiado_por?: string | null
          created_at?: string
          desarrollador_id: string
          id?: string
          motivo?: string | null
          nivel_anterior?:
            | Database["public"]["Enums"]["nivel_suscripcion"]
            | null
          nivel_nuevo: Database["public"]["Enums"]["nivel_suscripcion"]
          origen?: string
        }
        Update: {
          cambiado_por?: string | null
          created_at?: string
          desarrollador_id?: string
          id?: string
          motivo?: string | null
          nivel_anterior?:
            | Database["public"]["Enums"]["nivel_suscripcion"]
            | null
          nivel_nuevo?: Database["public"]["Enums"]["nivel_suscripcion"]
          origen?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_nivel_suscripcion_cambiado_por_fkey"
            columns: ["cambiado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_nivel_suscripcion_cambiado_por_fkey"
            columns: ["cambiado_por"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "audit_nivel_suscripcion_desarrollador_id_fkey"
            columns: ["desarrollador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_nivel_suscripcion_desarrollador_id_fkey"
            columns: ["desarrollador_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
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
          {
            foreignKeyName: "consultas_ia_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_ia_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      contratos_marco: {
        Row: {
          activo: boolean
          contenido_legal: string
          creado_por: string | null
          created_at: string
          id: string
          moneda: string
          plazo_max_dias: number
          plazo_min_dias: number
          precio_max: number
          precio_min: number
          tipo_analisis_id: string
          updated_at: string
          version: string
        }
        Insert: {
          activo?: boolean
          contenido_legal: string
          creado_por?: string | null
          created_at?: string
          id?: string
          moneda?: string
          plazo_max_dias: number
          plazo_min_dias: number
          precio_max: number
          precio_min: number
          tipo_analisis_id: string
          updated_at?: string
          version: string
        }
        Update: {
          activo?: boolean
          contenido_legal?: string
          creado_por?: string | null
          created_at?: string
          id?: string
          moneda?: string
          plazo_max_dias?: number
          plazo_min_dias?: number
          precio_max?: number
          precio_min?: number
          tipo_analisis_id?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_marco_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_marco_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "contratos_marco_tipo_analisis_id_fkey"
            columns: ["tipo_analisis_id"]
            isOneToOne: false
            referencedRelation: "tipos_analisis"
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
          {
            foreignKeyName: "criteria_matches_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criteria_matches_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          {
            foreignKeyName: "diagnosticos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          {
            foreignKeyName: "documentos_comisionista_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_comisionista_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      engagements_lote: {
        Row: {
          asesor_asignado_id: string | null
          avance_pct: number
          cliente_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_engagement"]
          estado_activacion: Database["public"]["Enums"]["estado_activacion"]
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
          mostrar_avance_al_cliente: boolean
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
          estado_activacion?: Database["public"]["Enums"]["estado_activacion"]
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
          mostrar_avance_al_cliente?: boolean
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
          estado_activacion?: Database["public"]["Enums"]["estado_activacion"]
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
          mostrar_avance_al_cliente?: boolean
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
            foreignKeyName: "engagements_lote_asesor_asignado_id_fkey"
            columns: ["asesor_asignado_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "engagements_lote_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "engagements_lote_gerente_id_fkey"
            columns: ["gerente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_gerente_id_fkey"
            columns: ["gerente_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
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
            foreignKeyName: "engagements_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "engagements_lote_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_diagnostico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "vw_planes_con_precio"
            referencedColumns: ["id"]
          },
        ]
      }
      entregables_engagement: {
        Row: {
          created_at: string
          engagement_id: string
          estado: Database["public"]["Enums"]["estado_entregable"]
          id: string
          mime_type: string | null
          nombre: string
          notas: string | null
          storage_path: string | null
          subido_por: string | null
          tamano_bytes: number | null
          tipo: Database["public"]["Enums"]["tipo_entregable"]
          tipo_analisis_id: string | null
          updated_at: string
          url_externa: string | null
          version: number
        }
        Insert: {
          created_at?: string
          engagement_id: string
          estado?: Database["public"]["Enums"]["estado_entregable"]
          id?: string
          mime_type?: string | null
          nombre: string
          notas?: string | null
          storage_path?: string | null
          subido_por?: string | null
          tamano_bytes?: number | null
          tipo: Database["public"]["Enums"]["tipo_entregable"]
          tipo_analisis_id?: string | null
          updated_at?: string
          url_externa?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          engagement_id?: string
          estado?: Database["public"]["Enums"]["estado_entregable"]
          id?: string
          mime_type?: string | null
          nombre?: string
          notas?: string | null
          storage_path?: string | null
          subido_por?: string | null
          tamano_bytes?: number | null
          tipo?: Database["public"]["Enums"]["tipo_entregable"]
          tipo_analisis_id?: string | null
          updated_at?: string
          url_externa?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "entregables_engagement_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregables_engagement_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "entregables_engagement_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregables_engagement_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "entregables_engagement_tipo_analisis_id_fkey"
            columns: ["tipo_analisis_id"]
            isOneToOne: false
            referencedRelation: "tipos_analisis"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_wompi: {
        Row: {
          error_procesamiento: string | null
          evento_id_externo: string
          id: string
          payload: Json
          procesado: boolean
          procesado_en: string | null
          recibido_en: string
          tipo_evento: string
          transaccion_id: string | null
        }
        Insert: {
          error_procesamiento?: string | null
          evento_id_externo: string
          id?: string
          payload: Json
          procesado?: boolean
          procesado_en?: string | null
          recibido_en?: string
          tipo_evento: string
          transaccion_id?: string | null
        }
        Update: {
          error_procesamiento?: string | null
          evento_id_externo?: string
          id?: string
          payload?: Json
          procesado?: boolean
          procesado_en?: string | null
          recibido_en?: string
          tipo_evento?: string
          transaccion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_wompi_transaccion_id_fkey"
            columns: ["transaccion_id"]
            isOneToOne: false
            referencedRelation: "transacciones"
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
          {
            foreignKeyName: "favoritos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          {
            foreignKeyName: "fotos_lotes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_lotes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      invitaciones_orden: {
        Row: {
          experto_id: string
          fecha_invitacion: string
          orden_id: string
        }
        Insert: {
          experto_id: string
          fecha_invitacion?: string
          orden_id: string
        }
        Update: {
          experto_id?: string
          fecha_invitacion?: string
          orden_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_orden_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_orden_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "invitaciones_orden_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
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
            foreignKeyName: "leads_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
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
          {
            foreignKeyName: "leads_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          estado_publicacion: Database["public"]["Enums"]["estado_publicacion_lote"]
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
          notas_publicacion: string | null
          owner_id: string | null
          precio_venta_estimado: number | null
          problema_juridico: string | null
          propietario_id: string | null
          publicado_venta: boolean
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
          estado_publicacion?: Database["public"]["Enums"]["estado_publicacion_lote"]
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
          notas_publicacion?: string | null
          owner_id?: string | null
          precio_venta_estimado?: number | null
          problema_juridico?: string | null
          propietario_id?: string | null
          publicado_venta?: boolean
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
          estado_publicacion?: Database["public"]["Enums"]["estado_publicacion_lote"]
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
          notas_publicacion?: string | null
          owner_id?: string | null
          precio_venta_estimado?: number | null
          problema_juridico?: string | null
          propietario_id?: string | null
          publicado_venta?: boolean
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
        Relationships: [
          {
            foreignKeyName: "lotes_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
        ]
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
      ndas_firmados: {
        Row: {
          contenido_aceptado: string
          created_at: string
          desarrollador_id: string
          fecha_firma: string
          id: string
          ip: string | null
          lote_id: string
          user_agent: string | null
          version_nda: string
        }
        Insert: {
          contenido_aceptado: string
          created_at?: string
          desarrollador_id: string
          fecha_firma?: string
          id?: string
          ip?: string | null
          lote_id: string
          user_agent?: string | null
          version_nda: string
        }
        Update: {
          contenido_aceptado?: string
          created_at?: string
          desarrollador_id?: string
          fecha_firma?: string
          id?: string
          ip?: string | null
          lote_id?: string
          user_agent?: string | null
          version_nda?: string
        }
        Relationships: [
          {
            foreignKeyName: "ndas_firmados_desarrollador_id_fkey"
            columns: ["desarrollador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ndas_firmados_desarrollador_id_fkey"
            columns: ["desarrollador_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "ndas_firmados_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ndas_firmados_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ndas_firmados_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ndas_firmados_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          {
            foreignKeyName: "negociaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
          {
            foreignKeyName: "normativa_urbana_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normativa_urbana_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          alerta_id: string | null
          created_at: string
          id: string
          leida: boolean
          lote_id: string | null
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
          lote_id?: string | null
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
          lote_id?: string | null
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
            foreignKeyName: "notificaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
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
      notificaciones_sla: {
        Row: {
          created_at: string
          data: Json
          destinatario_id: string
          entidad_id: string
          entidad_tipo: string
          estado: Database["public"]["Enums"]["estado_notificacion"]
          id: string
          leida_at: string | null
          mensaje: string
          nivel: Database["public"]["Enums"]["nivel_notificacion"]
          resuelta_at: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          data?: Json
          destinatario_id: string
          entidad_id: string
          entidad_tipo: string
          estado?: Database["public"]["Enums"]["estado_notificacion"]
          id?: string
          leida_at?: string | null
          mensaje: string
          nivel: Database["public"]["Enums"]["nivel_notificacion"]
          resuelta_at?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          data?: Json
          destinatario_id?: string
          entidad_id?: string
          entidad_tipo?: string
          estado?: Database["public"]["Enums"]["estado_notificacion"]
          id?: string
          leida_at?: string | null
          mensaje?: string
          nivel?: Database["public"]["Enums"]["nivel_notificacion"]
          resuelta_at?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_sla_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_sla_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
        ]
      }
      ordenes_servicio: {
        Row: {
          contrato_marco_id: string
          creado_por: string | null
          created_at: string
          engagement_id: string | null
          estado: Database["public"]["Enums"]["estado_orden_servicio"]
          fecha_limite_propuestas: string
          ganador_propuesta_id: string | null
          id: string
          lote_id: string
          notas_admin: string | null
          tipo_analisis_id: string
          updated_at: string
          visibilidad: Database["public"]["Enums"]["visibilidad_orden"]
        }
        Insert: {
          contrato_marco_id: string
          creado_por?: string | null
          created_at?: string
          engagement_id?: string | null
          estado?: Database["public"]["Enums"]["estado_orden_servicio"]
          fecha_limite_propuestas: string
          ganador_propuesta_id?: string | null
          id?: string
          lote_id: string
          notas_admin?: string | null
          tipo_analisis_id: string
          updated_at?: string
          visibilidad?: Database["public"]["Enums"]["visibilidad_orden"]
        }
        Update: {
          contrato_marco_id?: string
          creado_por?: string | null
          created_at?: string
          engagement_id?: string | null
          estado?: Database["public"]["Enums"]["estado_orden_servicio"]
          fecha_limite_propuestas?: string
          ganador_propuesta_id?: string | null
          id?: string
          lote_id?: string
          notas_admin?: string | null
          tipo_analisis_id?: string
          updated_at?: string
          visibilidad?: Database["public"]["Enums"]["visibilidad_orden"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_ordenes_ganador"
            columns: ["ganador_propuesta_id"]
            isOneToOne: false
            referencedRelation: "propuestas_experto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_contrato_marco_id_fkey"
            columns: ["contrato_marco_id"]
            isOneToOne: false
            referencedRelation: "contratos_marco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "ordenes_servicio_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "ordenes_servicio_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "ordenes_servicio_tipo_analisis_id_fkey"
            columns: ["tipo_analisis_id"]
            isOneToOne: false
            referencedRelation: "tipos_analisis"
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
          nivel_suscripcion: Database["public"]["Enums"]["nivel_suscripcion"]
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
          nivel_suscripcion?: Database["public"]["Enums"]["nivel_suscripcion"]
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
          nivel_suscripcion?: Database["public"]["Enums"]["nivel_suscripcion"]
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
            foreignKeyName: "planes_analisis_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "vw_planes_con_precio"
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
          {
            foreignKeyName: "precios_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      preferencias_usuario: {
        Row: {
          created_at: string
          email_sla_digest: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sla_digest?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sla_digest?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      propuestas_experto: {
        Row: {
          estado: Database["public"]["Enums"]["estado_propuesta"]
          experto_id: string
          fecha_propuesta: string
          id: string
          mensaje_experto: string | null
          orden_id: string
          plazo_propuesto_dias: number
          precio_propuesto: number
          updated_at: string
        }
        Insert: {
          estado?: Database["public"]["Enums"]["estado_propuesta"]
          experto_id: string
          fecha_propuesta?: string
          id?: string
          mensaje_experto?: string | null
          orden_id: string
          plazo_propuesto_dias: number
          precio_propuesto: number
          updated_at?: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["estado_propuesta"]
          experto_id?: string
          fecha_propuesta?: string
          id?: string
          mensaje_experto?: string | null
          orden_id?: string
          plazo_propuesto_dias?: number
          precio_propuesto?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_experto_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_experto_experto_id_fkey"
            columns: ["experto_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "propuestas_experto_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      salarios_minimos: {
        Row: {
          anio: number
          created_at: string
          decreto: string | null
          id: string
          notas: string | null
          valor_cop: number
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          anio: number
          created_at?: string
          decreto?: string | null
          id?: string
          notas?: string | null
          valor_cop: number
          vigente_desde: string
          vigente_hasta?: string | null
        }
        Update: {
          anio?: number
          created_at?: string
          decreto?: string | null
          id?: string
          notas?: string | null
          valor_cop?: number
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "servicios_publicos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_publicos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
      solicitudes_contacto: {
        Row: {
          created_at: string
          desarrollador_id: string
          estado: Database["public"]["Enums"]["estado_solicitud_contacto"]
          fecha_procesado: string | null
          id: string
          lote_id: string
          mensaje: string
          notas_admin: string | null
          procesado_por: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          desarrollador_id: string
          estado?: Database["public"]["Enums"]["estado_solicitud_contacto"]
          fecha_procesado?: string | null
          id?: string
          lote_id: string
          mensaje: string
          notas_admin?: string | null
          procesado_por?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          desarrollador_id?: string
          estado?: Database["public"]["Enums"]["estado_solicitud_contacto"]
          fecha_procesado?: string | null
          id?: string
          lote_id?: string
          mensaje?: string
          notas_admin?: string | null
          procesado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_contacto_desarrollador_id_fkey"
            columns: ["desarrollador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_contacto_desarrollador_id_fkey"
            columns: ["desarrollador_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "solicitudes_contacto_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_contacto_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_contacto_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_contacto_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
          {
            foreignKeyName: "solicitudes_contacto_procesado_por_fkey"
            columns: ["procesado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_contacto_procesado_por_fkey"
            columns: ["procesado_por"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
            foreignKeyName: "tareas_analisis_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "tareas_analisis_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_analisis_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
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
      transacciones: {
        Row: {
          creada_por: string | null
          engagement_id: string
          error_msg: string | null
          estado: Database["public"]["Enums"]["estado_transaccion"]
          fecha_aprobacion: string | null
          fecha_creacion: string
          fecha_expiracion: string | null
          id: string
          metadata: Json | null
          moneda: string
          monto_cop: number
          monto_smlmv: number
          plan_id: string
          propietario_id: string | null
          smlmv_referencia: number
          updated_at: string
          wompi_payment_link_url: string | null
          wompi_reference: string | null
          wompi_status: string | null
          wompi_transaction_id: string | null
        }
        Insert: {
          creada_por?: string | null
          engagement_id: string
          error_msg?: string | null
          estado?: Database["public"]["Enums"]["estado_transaccion"]
          fecha_aprobacion?: string | null
          fecha_creacion?: string
          fecha_expiracion?: string | null
          id?: string
          metadata?: Json | null
          moneda?: string
          monto_cop: number
          monto_smlmv: number
          plan_id: string
          propietario_id?: string | null
          smlmv_referencia: number
          updated_at?: string
          wompi_payment_link_url?: string | null
          wompi_reference?: string | null
          wompi_status?: string | null
          wompi_transaction_id?: string | null
        }
        Update: {
          creada_por?: string | null
          engagement_id?: string
          error_msg?: string | null
          estado?: Database["public"]["Enums"]["estado_transaccion"]
          fecha_aprobacion?: string | null
          fecha_creacion?: string
          fecha_expiracion?: string | null
          id?: string
          metadata?: Json | null
          moneda?: string
          monto_cop?: number
          monto_smlmv?: number
          plan_id?: string
          propietario_id?: string | null
          smlmv_referencia?: number
          updated_at?: string
          wompi_payment_link_url?: string | null
          wompi_reference?: string | null
          wompi_status?: string | null
          wompi_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_creada_por_fkey"
            columns: ["creada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_creada_por_fkey"
            columns: ["creada_por"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
          },
          {
            foreignKeyName: "transacciones_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements_lote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "vw_portafolio_resumen"
            referencedColumns: ["engagement_id"]
          },
          {
            foreignKeyName: "transacciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_diagnostico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "vw_planes_con_precio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
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
      vw_lotes_publicos: {
        Row: {
          area_total_m2: number | null
          barrio: string | null
          ciudad: string | null
          created_at: string | null
          departamento: string | null
          destacado: boolean | null
          es_publico: boolean | null
          estado_disponibilidad:
            | Database["public"]["Enums"]["estado_disponibilidad"]
            | null
          estado_publicacion:
            | Database["public"]["Enums"]["estado_publicacion_lote"]
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
          precio_venta_estimado: number | null
          publicado_venta: boolean | null
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
        Insert: {
          area_total_m2?: number | null
          barrio?: string | null
          ciudad?: string | null
          created_at?: string | null
          departamento?: string | null
          destacado?: boolean | null
          es_publico?: boolean | null
          estado_disponibilidad?:
            | Database["public"]["Enums"]["estado_disponibilidad"]
            | null
          estado_publicacion?:
            | Database["public"]["Enums"]["estado_publicacion_lote"]
            | null
          estrato?: number | null
          fondo_ml?: number | null
          foto_url?: string | null
          frente_ml?: number | null
          has_resolutoria?: boolean | null
          id?: string | null
          lat?: number | null
          lng?: number | null
          nombre_lote?: string | null
          precio_venta_estimado?: number | null
          publicado_venta?: boolean | null
          score_ambiental?: number | null
          score_arquitectonico?: number | null
          score_financiero?: number | null
          score_geotecnico?: number | null
          score_juridico?: number | null
          score_mercado?: number | null
          score_normativo?: number | null
          score_servicios?: number | null
          tipo_lote?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          area_total_m2?: number | null
          barrio?: string | null
          ciudad?: string | null
          created_at?: string | null
          departamento?: string | null
          destacado?: boolean | null
          es_publico?: boolean | null
          estado_disponibilidad?:
            | Database["public"]["Enums"]["estado_disponibilidad"]
            | null
          estado_publicacion?:
            | Database["public"]["Enums"]["estado_publicacion_lote"]
            | null
          estrato?: number | null
          fondo_ml?: number | null
          foto_url?: string | null
          frente_ml?: number | null
          has_resolutoria?: boolean | null
          id?: string | null
          lat?: number | null
          lng?: number | null
          nombre_lote?: string | null
          precio_venta_estimado?: number | null
          publicado_venta?: boolean | null
          score_ambiental?: number | null
          score_arquitectonico?: number | null
          score_financiero?: number | null
          score_geotecnico?: number | null
          score_juridico?: number | null
          score_mercado?: number | null
          score_normativo?: number | null
          score_servicios?: number | null
          tipo_lote?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      vw_mercado_publico: {
        Row: {
          area_m2_redondeada: number | null
          barrio: string | null
          categoria_area: string | null
          ciudad: string | null
          codigo_anonimo: string | null
          latitud_zona: number | null
          longitud_zona: number | null
          lote_id: string | null
          publicado_en: string | null
          rango_precio: string | null
          uso_actual: string | null
        }
        Insert: {
          area_m2_redondeada?: never
          barrio?: string | null
          categoria_area?: never
          ciudad?: string | null
          codigo_anonimo?: never
          latitud_zona?: never
          longitud_zona?: never
          lote_id?: string | null
          publicado_en?: string | null
          rango_precio?: never
          uso_actual?: string | null
        }
        Update: {
          area_m2_redondeada?: never
          barrio?: string | null
          categoria_area?: never
          ciudad?: string | null
          codigo_anonimo?: never
          latitud_zona?: never
          longitud_zona?: never
          lote_id?: string | null
          publicado_en?: string | null
          rango_precio?: never
          uso_actual?: string | null
        }
        Relationships: []
      }
      vw_metricas_experto: {
        Row: {
          email: string | null
          experto_id: string | null
          invitaciones_respondidas: number | null
          nombre: string | null
          propuestas_ganadas: number | null
          propuestas_rechazadas: number | null
          propuestas_retiradas: number | null
          servicios_completados: number | null
          sla_cumplido_pct: number | null
          tasa_adjudicacion_pct: number | null
          tasa_respuesta_invitacion_pct: number | null
          tiempo_entrega_dias_avg: number | null
          tiempo_respuesta_horas_avg: number | null
          total_invitaciones: number | null
          total_propuestas: number | null
        }
        Relationships: []
      }
      vw_planes_con_precio: {
        Row: {
          activo: boolean | null
          codigo: string | null
          dias_sla: number | null
          id: string | null
          moneda: string | null
          nombre: string | null
          orden: number | null
          precio_cop_actual: number | null
          precio_cop_legacy: number | null
          precio_smlmv: number | null
          smlmv_anio: number | null
          smlmv_referencia: number | null
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          dias_sla?: number | null
          id?: string | null
          moneda?: string | null
          nombre?: string | null
          orden?: number | null
          precio_cop_actual?: never
          precio_cop_legacy?: number | null
          precio_smlmv?: number | null
          smlmv_anio?: never
          smlmv_referencia?: never
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          dias_sla?: number | null
          id?: string | null
          moneda?: string | null
          nombre?: string | null
          orden?: number | null
          precio_cop_actual?: never
          precio_cop_legacy?: number | null
          precio_smlmv?: number | null
          smlmv_anio?: never
          smlmv_referencia?: never
        }
        Relationships: []
      }
      vw_portafolio_resumen: {
        Row: {
          asesor_id: string | null
          asesor_nombre: string | null
          avance_pct: number | null
          cliente_nombre: string | null
          dias_en_gestion: number | null
          dias_para_sla: number | null
          engagement_id: string | null
          estado: Database["public"]["Enums"]["estado_engagement"] | null
          estado_activacion:
            | Database["public"]["Enums"]["estado_activacion"]
            | null
          estado_pago: string | null
          lote_barrio: string | null
          lote_ciudad: string | null
          lote_id: string | null
          lote_nombre: string | null
          moneda: string | null
          n_analisis_completados: number | null
          n_analisis_total: number | null
          plan_codigo: string | null
          plan_nombre: string | null
          precio_cobrado: number | null
          semaforo_sla: string | null
          tiene_diagnostico: boolean | null
          tiene_presentacion: boolean | null
          ultima_actualizacion: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagements_lote_asesor_asignado_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_asesor_asignado_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_experto"
            referencedColumns: ["experto_id"]
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
            foreignKeyName: "engagements_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_lotes_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "vw_mercado_publico"
            referencedColumns: ["lote_id"]
          },
        ]
      }
    }
    Functions: {
      activar_engagement: {
        Args: { p_engagement_id: string }
        Returns: undefined
      }
      activar_engagement_gratuito: {
        Args: { p_engagement_id: string }
        Returns: undefined
      }
      activar_engagement_post_pago: {
        Args: { p_transaccion_id: string }
        Returns: undefined
      }
      adjudicar_propuesta: {
        Args: { p_orden_id: string; p_propuesta_id: string }
        Returns: undefined
      }
      calcular_match_score: {
        Args: { p_alerta_id: string; p_lote_id: string }
        Returns: {
          detalles: Json
          score: number
        }[]
      }
      cambiar_nivel_suscripcion: {
        Args: {
          p_desarrollador_id: string
          p_motivo?: string
          p_nivel_nuevo: Database["public"]["Enums"]["nivel_suscripcion"]
          p_origen?: string
        }
        Returns: string
      }
      cancelar_orden_servicio: {
        Args: { p_motivo?: string; p_orden_id: string }
        Returns: undefined
      }
      check_ai_quota: { Args: { _user_id: string }; Returns: boolean }
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
      contar_notificaciones_pendientes: { Args: never; Returns: number }
      count_diagnosticos: { Args: never; Returns: number }
      crear_engagement: {
        Args: { p_cliente_id?: string; p_lote_id: string; p_plan_id: string }
        Returns: string
      }
      crear_nueva_version_contrato: {
        Args: {
          p_contenido_legal: string
          p_contrato_id_actual: string
          p_moneda?: string
          p_plazo_max_dias: number
          p_plazo_min_dias: number
          p_precio_max: number
          p_precio_min: number
          p_version_explicita?: string
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      detectar_sla_en_riesgo: { Args: never; Returns: number }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      es_experto_de_engagement: {
        Args: { _engagement_id: string; _user_id: string }
        Returns: boolean
      }
      factor_avance_por_estado: {
        Args: { p_estado: Database["public"]["Enums"]["estado_analisis"] }
        Returns: number
      }
      firmar_nda: {
        Args: {
          p_contenido_aceptado: string
          p_lote_id: string
          p_user_agent: string
          p_version_nda: string
        }
        Returns: string
      }
      firmar_url_entregable: {
        Args: { p_entregable_id: string; p_expira_segundos?: number }
        Returns: string
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
      importar_engagement_historico: {
        Args: {
          p_asesor_id: string
          p_cliente_id: string
          p_fecha_entrega: string
          p_link_diagnostico: string
          p_link_presentacion: string
          p_lote_id: string
          p_notas?: string
          p_plan_id: string
          p_precio_cobrado?: number
          p_tareas_no_aplica?: string[]
        }
        Returns: string
      }
      is_admin_or_experto: { Args: { _user_id: string }; Returns: boolean }
      is_negociacion_participant: {
        Args: { _negociacion_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin_or_admin: { Args: { _user_id: string }; Returns: boolean }
      listar_mis_engagements_cliente: {
        Args: never
        Returns: {
          asesor_nombre: string
          avance_pct: number
          dias_para_sla: number
          engagement_id: string
          estado: Database["public"]["Enums"]["estado_engagement"]
          estado_activacion: Database["public"]["Enums"]["estado_activacion"]
          fecha_inicio: string
          fecha_sla: string
          lote_ciudad: string
          lote_direccion: string
          lote_nombre: string
          mostrar_avance_al_cliente: boolean
          plan_codigo: string
          plan_nombre: string
          tiene_diagnostico: boolean
          tiene_presentacion: boolean
          total_entregables_publicados: number
        }[]
      }
      listar_notificaciones: {
        Args: { p_limit?: number; p_solo_pendientes?: boolean }
        Returns: {
          created_at: string
          data: Json
          destinatario_id: string
          entidad_id: string
          entidad_tipo: string
          estado: Database["public"]["Enums"]["estado_notificacion"]
          id: string
          leida_at: string | null
          mensaje: string
          nivel: Database["public"]["Enums"]["nivel_notificacion"]
          resuelta_at: string | null
          tipo: string
          titulo: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notificaciones_sla"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      marcar_notificacion_leida: {
        Args: { p_notif_id: string }
        Returns: undefined
      }
      marcar_todas_leidas: { Args: never; Returns: number }
      marcar_transaccion_fallida: {
        Args: {
          p_error_msg?: string
          p_estado_nuevo: Database["public"]["Enums"]["estado_transaccion"]
          p_transaccion_id: string
          p_wompi_status?: string
        }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      obtener_digest_sla: { Args: { p_user_id: string }; Returns: Json }
      obtener_embudo_conversion: {
        Args: { p_desde?: string; p_hasta?: string }
        Returns: {
          cantidad: number
          conversion_pct: number
          etapa: string
        }[]
      }
      obtener_engagement_para_cliente: {
        Args: { p_engagement_id: string }
        Returns: Json
      }
      obtener_kpis_portafolio: { Args: never; Returns: Json }
      obtener_lote_para_usuario: { Args: { p_lote_id: string }; Returns: Json }
      obtener_ranking_asesores: {
        Args: { p_desde?: string; p_hasta?: string }
        Returns: {
          asesor_id: string
          asesor_nombre: string
          avance_promedio: number
          engagements_activos: number
          engagements_entregados: number
          engagements_totales: number
          ingresos_generados_cop: number
          sla_cumplidos_pct: number
          tiempo_medio_cierre_dias: number
        }[]
      }
      obtener_smlmv_vigente: { Args: { p_fecha?: string }; Returns: number }
      obtener_tendencia_mensual: {
        Args: { p_meses_atras?: number }
        Returns: {
          engagements_completados: number
          engagements_creados: number
          ingresos_cop: number
          leads_nuevos: number
          mes: string
          mes_label: string
        }[]
      }
      obtener_transaccion_publica: {
        Args: { p_reference: string }
        Returns: Json
      }
      puede_ver_engagement: {
        Args: { _engagement_id: string; _user_id: string }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
      solicitar_diagnostico: {
        Args: { p_lote_id: string; p_plan_id: string }
        Returns: string
      }
      toggle_contrato_activo: {
        Args: { p_activo: boolean; p_contrato_id: string }
        Returns: undefined
      }
      user_has_engagement_on_lote: {
        Args: { _lote_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_nda_on_lote: {
        Args: { _lote_id: string; _user_id: string }
        Returns: boolean
      }
      user_shares_owner_org: {
        Args: { _owner_id: string; _user_id: string }
        Returns: boolean
      }
      validar_lote: {
        Args: { p_decision: string; p_lote_id: string; p_notas?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "experto"
        | "propietario"
        | "desarrollador"
        | "dueno"
        | "comisionista"
      categoria_documento:
        | "financiero"
        | "tecnico"
        | "predial"
        | "normativo"
        | "juridico"
        | "otro"
      estado_activacion: "borrador" | "pendiente_pago" | "activo"
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
      estado_entregable: "borrador" | "publicado" | "archivado"
      estado_lead:
        | "nuevo"
        | "contactado"
        | "negociacion"
        | "cerrado"
        | "descartado"
      estado_negociacion: "activa" | "en_revision" | "cerrada" | "concretada"
      estado_notificacion: "pendiente" | "leida" | "resuelta"
      estado_orden_servicio:
        | "abierta"
        | "adjudicada"
        | "en_ejecucion"
        | "completada"
        | "cancelada"
      estado_propuesta: "enviada" | "ganadora" | "rechazada" | "retirada"
      estado_publicacion_lote:
        | "pendiente_validacion"
        | "aprobado"
        | "rechazado"
        | "retirado"
      estado_servicio: "Disponible" | "En trámite" | "No disponible"
      estado_solicitud_contacto: "pendiente" | "contactado" | "cerrado"
      estado_transaccion:
        | "pendiente"
        | "aprobada"
        | "declinada"
        | "expirada"
        | "reembolsada"
        | "error"
      nivel_notificacion: "amarillo" | "rojo"
      nivel_suscripcion: "gratuito" | "basico" | "profesional" | "premium"
      tipo_entregable:
        | "diagnostico_inmobiliario"
        | "presentacion_diagnostico"
        | "informe_area"
        | "documento_soporte"
        | "otro"
      visibilidad_orden: "publica" | "invitacion"
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
        "experto",
        "propietario",
        "desarrollador",
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
      estado_activacion: ["borrador", "pendiente_pago", "activo"],
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
      estado_entregable: ["borrador", "publicado", "archivado"],
      estado_lead: [
        "nuevo",
        "contactado",
        "negociacion",
        "cerrado",
        "descartado",
      ],
      estado_negociacion: ["activa", "en_revision", "cerrada", "concretada"],
      estado_notificacion: ["pendiente", "leida", "resuelta"],
      estado_orden_servicio: [
        "abierta",
        "adjudicada",
        "en_ejecucion",
        "completada",
        "cancelada",
      ],
      estado_propuesta: ["enviada", "ganadora", "rechazada", "retirada"],
      estado_publicacion_lote: [
        "pendiente_validacion",
        "aprobado",
        "rechazado",
        "retirado",
      ],
      estado_servicio: ["Disponible", "En trámite", "No disponible"],
      estado_solicitud_contacto: ["pendiente", "contactado", "cerrado"],
      estado_transaccion: [
        "pendiente",
        "aprobada",
        "declinada",
        "expirada",
        "reembolsada",
        "error",
      ],
      nivel_notificacion: ["amarillo", "rojo"],
      nivel_suscripcion: ["gratuito", "basico", "profesional", "premium"],
      tipo_entregable: [
        "diagnostico_inmobiliario",
        "presentacion_diagnostico",
        "informe_area",
        "documento_soporte",
        "otro",
      ],
      visibilidad_orden: ["publica", "invitacion"],
    },
  },
} as const

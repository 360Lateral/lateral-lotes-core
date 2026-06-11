/**
 * Tipos compartidos de los módulos financieros.
 * Reemplazan los `any` de las queries con joins de Supabase.
 */

export interface PerfilMini {
  id?: string;
  nombre: string | null;
  email: string | null;
  telefono?: string | null;
}

export interface LoteMini {
  id?: string;
  nombre_lote: string | null;
  ciudad: string | null;
  barrio?: string | null;
}

export interface TipoMini {
  nombre: string | null;
}

export interface PlanMini {
  nombre: string | null;
  codigo?: string | null;
  precio_smlmv?: number | null;
}

export interface OrdenMini {
  lote_id: string | null;
  lotes: LoteMini | null;
}

export interface EngagementMini {
  lote_id: string | null;
  estado_activacion?: string | null;
  lotes: LoteMini | null;
}

export type EstadoLiquidacion = "pendiente" | "pagada" | "cancelada" | string;
export type EstadoComision = "pendiente" | "pagada" | "cancelada" | string;
export type EstadoTransaccion =
  | "pendiente"
  | "aprobada"
  | "declinada"
  | "expirada"
  | "reembolsada"
  | "error"
  | string;

export interface LiquidacionRow {
  id: string;
  experto_id?: string;
  orden_id?: string | null;
  engagement_id?: string | null;
  monto_bruto: number | string;
  fee_pct: number | string;
  fee_monto: number | string;
  monto_neto: number | string;
  moneda?: string | null;
  estado: EstadoLiquidacion;
  metodo_pago: string | null;
  referencia_pago: string | null;
  fecha_generacion: string;
  fecha_pago: string | null;
  experto?: PerfilMini | null;
  tipo?: TipoMini | null;
  orden?: OrdenMini | null;
}

export interface ComisionRow {
  id: string;
  base_calculo: number | string;
  comision_pct: number | string;
  comision_monto: number | string;
  estado: EstadoComision;
  metodo_pago: string | null;
  referencia_pago?: string | null;
  fecha_generacion: string;
  fecha_pago: string | null;
  lote?: LoteMini | null;
  comisionista?: PerfilMini | null;
}

export interface TransaccionRow {
  id: string;
  engagement_id: string | null;
  monto_cop: number | string | null;
  estado: EstadoTransaccion;
  wompi_reference?: string | null;
  wompi_transaction_id?: string | null;
  wompi_payment_link_url?: string | null;
  fecha_creacion: string;
  fecha_aprobacion: string | null;
  fecha_expiracion?: string | null;
  plan?: PlanMini | null;
  propietario?: PerfilMini | null;
  engagement?: EngagementMini | null;
}

export interface TransaccionDetalle extends TransaccionRow {
  monto_smlmv?: number | string | null;
  smlmv_referencia?: number | string | null;
  moneda?: string | null;
  wompi_status?: string | null;
  error_msg?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface EventoWompiRow {
  id: string;
  evento_id_externo: string | null;
  tipo_evento: string | null;
  procesado: boolean | null;
  error_procesamiento: string | null;
  recibido_en: string;
  procesado_en: string | null;
}

/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

import { template as engagementActivado } from './engagement-activado.tsx'
import { template as suscripcionActivada } from './suscripcion-activada.tsx'
import { template as accesoLoteActivado } from './acceso-lote-activado.tsx'

// Entry shape required by send-transactional-email and preview-transactional-email.
export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'engagement-activado': engagementActivado,
  'suscripcion-activada': suscripcionActivada,
  'acceso-lote-activado': accesoLoteActivado,
}

# Fase 1.A — Claridad de pricing (sin tocar Wompi)

## Auditoría (Parte A · D.1 · E.1)

**Rutas confirmadas:**
- `/planes` → `src/pages/Planes.tsx` (público, propietario). Botón "Solicitar" → `Link to="/diagnostico"`. No invoca Wompi.
- `/suscripcion` → `src/pages/Suscripcion.tsx` (protegido, desarrollador). Botón "Suscribirme" → `useGenerarPagoWompi` (✓ no tocar).
- `/dashboard/config-suscripciones` → `src/pages/DashboardConfigSuscripciones.tsx` (super-admin). Hoy SOLO tiene precios desarrollador (3 niveles × 3 periodos) + Pay-per-view. **No existe pestaña Propietario** — la configuración de planes de propietario se hace vía `planes_diagnostico` + `planes_analisis` (hooks ya creados en `usePlanesConfig.ts`) pero **no hay UI admin** que los exponga. Hay que construirla.

**SMLMV:** ya existe tabla `salarios_minimos (anio, valor_cop, vigente_desde, vigente_hasta, decreto, notas)`. La vista `vw_planes_con_precio` ya devuelve `smlmv_referencia` y `smlmv_anio`. **No está hardcodeado**, ya es editable a nivel datos, pero **no hay UI admin** para mantenerla. Reutilizo esta tabla en vez de crear `configuracion_sistema`.

**Wompi (no tocar):** `useGenerarPagoWompi`, `Suscripcion.tsx` (handleSuscribirse), `PayPerViewCTA`, `GenerarLinkPagoDialog`, `SolicitarDiagnosticoDialog`.

## Trabajo

### 1. Hook `useSmlmvVigente`
Lee de `salarios_minimos` el registro con `vigente_hasta IS NULL` (o el de mayor `vigente_desde`). Devuelve `{ anio, monto, actualizado_en, decreto }`. Reutilizado en `/planes` y admin.

### 2. `/planes` (Parte B) — refactor completo
- Hero rediseñado: "¿Cuánto vale tu lote? ¿Qué puedes construir en él?" + bajada explicando pago por lote + SLA.
- Bloque "¿Para quién es cada plan?" (4 cards cortas) ANTES de la tabla.
- Tabla desktop: subtítulo por columna, badge "Más popular" con borde naranja prominente en Pro, features traducidas a lenguaje cliente, tooltip por feature mostrando el nombre técnico.
- Pricing dinámico: lee SMLMV vigente con `useSmlmvVigente` y calcula `factor × monto`. Fallback a hardcode si el hook falla.
- Mobile <768px: cards apiladas verticales + botón "Ver tabla comparativa" que abre Sheet/Dialog con la tabla scrollable horizontal.
- Botones: "Solicitar" → "Comprar plan" (mismo `Link to="/diagnostico"` por ahora).
- CTA secundaria: "Hablar con un asesor" (WhatsApp `https://wa.me/...` placeholder) + "Ver casos de éxito" (ancla a sección placeholder).
- Sección FAQ con `Accordion` shadcn, respuestas marcadas con "[Confirmar con admin]" donde corresponde.

### 3. `/suscripcion` (Parte C) — refactor completo
- Hero rediseñado.
- Toggle Mensual / Trimestral (-X%) / Anual (-Y%) — descuentos calculados de los precios reales (vs precio mensual × N meses). Badge "Mejor valor" en el de mayor descuento.
- Cards: subtítulo, features traducidas con tooltips técnicos, mini-disclaimer en Básico equilibrando altura ("Plan sin información identificable…").
- Sección Pay-per-view destacada debajo: lee precio real de `useConfigPayPerView`, CTA "Buscar lote y pagar" → `/lotes`.
- FAQ propio (cambio prorrateado, fin de suscripción, conteo de lotes placeholder, NDA).
- Flujo Wompi (`handleSuscribirse`) **intacto**.

### 4. Admin: pestaña Propietario (Parte D)
Convertir `DashboardConfigSuscripciones` a layout con `Tabs` shadcn (3 tabs: **Propietario**, **Desarrollador**, **General**). La pestaña Desarrollador conserva el contenido actual sin cambios.

**Tab Propietario (nuevo):** lista de planes desde `usePlanesDiagnostico` + matriz de análisis desde `usePlanesAnalisis` + `useTiposAnalisis`. Por plan editable:
- Nombre
- Factor SMLMV (numérico)
- Análisis incluidos (checkboxes contra `tipos_analisis`, persiste vía `usePlanesAnalisis.upsertMany`)
- Toggle "Recomendado" (único — al activar uno se desactiva el resto)
- Descripción corta (100 char) + "Para quién es" (80 char)
- Monto calculado: `factor × smlmv_vigente` (read-only)

Las dos descripciones requieren columnas nuevas. Migración:
```sql
ALTER TABLE public.planes_diagnostico
  ADD COLUMN IF NOT EXISTS descripcion_corta text,
  ADD COLUMN IF NOT EXISTS para_quien text,
  ADD COLUMN IF NOT EXISTS recomendado boolean NOT NULL DEFAULT false;
```
Sin cambios de RLS (la tabla ya las tiene). Actualizar `usePlanesConfig.ts` + `usePlanesConPrecio.ts` para incluir los nuevos campos y consumirlos en `/planes`.

**Tab General (nuevo):** editor de SMLMV vigente.
- Muestra el registro actual de `salarios_minimos` (año, monto, decreto, vigente desde).
- Botón "Registrar nuevo SMLMV" → form (año, monto, decreto, fecha vigente desde). Al guardar: cierra el registro previo (`vigente_hasta = nuevo.vigente_desde`) e inserta el nuevo. Hook `useActualizarSmlmv` con `useMutation`.
- Aviso visual: "Esto recalcula precios de planes de propietario automáticamente."

### 5. Validación
- `bunx tsgo --noEmit` debe pasar.
- Probar `/planes` (desktop + mobile), `/suscripcion`, admin tabs.
- No tocar `useGenerarPagoWompi`, `Suscripcion.handleSuscribirse`, `PayPerViewCTA`.

## Detalle técnico

**Archivos nuevos:**
- `src/hooks/useSmlmvVigente.ts`
- `src/hooks/useActualizarSmlmv.ts`
- `src/components/planes/ParaQuienGrid.tsx`
- `src/components/planes/PlanesFAQ.tsx`
- `src/components/planes/PlanesMobileCards.tsx`
- `src/components/suscripcion/SuscripcionFAQ.tsx`
- `src/components/suscripcion/PayPerViewBanner.tsx`
- `src/components/admin/precios/TabPropietario.tsx`
- `src/components/admin/precios/TabDesarrollador.tsx` (extracción del contenido actual)
- `src/components/admin/precios/TabGeneral.tsx`

**Archivos editados:**
- `src/pages/Planes.tsx` (rewrite estructural)
- `src/pages/Suscripcion.tsx` (header, toggle, cards, PPV, FAQ — handleSuscribirse intacto)
- `src/pages/DashboardConfigSuscripciones.tsx` (envuelve en Tabs)
- `src/hooks/usePlanesConfig.ts` (añade campos `descripcion_corta`, `para_quien`, `recomendado`)
- `src/hooks/usePlanesConPrecio.ts` (añade mismos campos si la vista los expone)

**Migración:** 1 migración con `ALTER TABLE planes_diagnostico` + posiblemente refrescar `vw_planes_con_precio` para incluir los nuevos campos.

## Fuera de alcance (Fase 1.B)
- Unificar checkout en `/planes` con Wompi.
- Activar PPV real si no existe end-to-end.
- Email/comms post-compra.

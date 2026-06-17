# Plan — Unificar reporting de Análisis 360° en el engagement

## Estado actual relevante (verificado)

- `useAnalisisUnificado(loteId, engagementId)` ya existe y combina las 7 tablas técnicas (`analisis_juridico`, `_ambiental`, `_arquitectonico`, `_financiero`, `_geotecnico`, `_mercado`, `_sspp`) + tareas + responsable. Devuelve `score`, `tarea_estado`, `responsable_nombre`, `fecha_objetivo`, `ultima_edicion`.
- `EngagementDetalle.tsx` YA renderiza `<AnalisisCard>` grid usando ese hook, PERO debajo conserva un `<details>` con `<TareasAnalisisList>` — **esa es la duplicación de reporting a eliminar**.
- `DashboardLoteAnalisis.tsx` (1486 líneas) es el editor estructurado real. Cada tabla técnica se lee/escribe ahí. Se preserva 100%.
- `TareasAnalisisList` solo se usa en `EngagementDetalle.tsx` → tras el refactor queda huérfano y se elimina.

## Decisión de diseño

En lugar de duplicar el agregador, **extender** `useAnalisisUnificado` para que también traiga: `entregables[]` por análisis, `incluido_en_plan`, `factor_avance` (mapeo FACTOR), `valoracionEstimada` y `scorePromedioPonderado`. La fuente única de verdad se mantiene.

Si extender resulta intrusivo (cambia el shape consumido por `AnalisisCard`), se crea un wrapper `useAnalisisUnificadoEngagement` que llama al hook base + entregables + plan y agrega los campos derivados sin tocar el shape original.

## Cambios

### 1. `src/hooks/useAnalisisUnificadoEngagement.ts` (nuevo)
Wrapper que compone:
- `useAnalisisUnificado(loteId, engagementId)` (ya tiene scores + tareas + responsables).
- `useEntregablesEngagement(engagementId)` → agrupa por `tipo_analisis_id`.
- `useAnalisisPorPlan(engagementId)` → marca `incluido_en_plan`.

Devuelve:
```ts
{ items: AnalisisItemUnificado[], valoracionEstimada, scorePromedioPonderado, totalAnalisis, completados }
```
La fórmula de valoración estimada y promedio ponderado se copia literal de `DashboardLoteAnalisis.tsx` (zona "Valoración estimada del lote (360°)").

### 2. `src/hooks/useEngagementActivoDelLote.ts` (nuevo)
Query simple sobre `engagements_lote` (nombre real de la tabla, no `engagements`) → devuelve `engagementId` del último engagement del lote.

### 3. `src/components/portafolio/AnalisisCardUnificada.tsx` (nuevo)
Una card por análisis:
- Header: icono (de `ICON_MAP` reutilizado), nombre, badge de estado con cromática verde/amarillo/naranja/rojo/gris.
- Score grande (`text-2xl font-display`) + `<Progress>` con `factor_avance`.
- Asesor + fecha límite.
- Chips de entregables (reusa `ChipEntregable` extraído de `TareasAnalisisList`).
- Acciones: Select de estado inline (lógica idéntica a la actual), botón `+ Entregable` (abre `SubirEntregableDialog` con `tipoAnalisisId`), botón **"Editar datos →"** que navega a `/dashboard/lotes/${loteId}/analisis#${codigo}`.
- Si `!incluido_en_plan` → card deshabilitada con texto "No incluido en este plan".
- Si `!puedeGestionar` → oculta Select de estado, botón "+ Entregable" y "Editar datos". Solo lectura + descarga.

### 4. `src/components/portafolio/Analisis360Grid.tsx` (nuevo)
- Llama `useAnalisisUnificadoEngagement`.
- Card resumen: valoración estimada, score promedio, X de N completados.
- Botones: **"Editor completo →"** (→ `/dashboard/lotes/:id/analisis`), `<ExcelAnalisisImporter loteId/>`, `<ExcelAnalisisExporter loteId/>`.
- `<Collapsible>` con `<MapGISConsulta>` (onApply muestra toast "Para aplicar, abre el editor completo").
- Grid responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` de `AnalisisCardUnificada`.
- Skeletons mientras carga.
- Si `!puedeGestionar` → oculta "Editor completo", Importar, MapGIS.

### 5. `src/pages/EngagementDetalle.tsx` (refactor mínimo)
- Eliminar import y uso de `TareasAnalisisList`.
- Eliminar el bloque `<details>` con "Ver tareas detalladas y entregables por análisis".
- Reemplazar la sección entera "Análisis 360°" (header + grid `AnalisisCard` + `<details>`) por:
  ```tsx
  <Analisis360Grid engagementId={engagement.id} loteId={engagement.lote_id} puedeGestionar={puedeSubir} />
  ```
- Mantener `EngagementHeader`, `TarjetasMaestros`, `ChecklistEntrega`, `SeccionEntregables`, alerts de activación/pago, acciones admin.

### 6. `src/pages/DashboardLoteAnalisis.tsx` (cambios cosméticos únicamente)
- **NO tocar lógica interna, hooks, formularios, PDF, POT, MapGIS, autosave.**
- Cambiar título a `Editor de Análisis 360° — {lote.nombre_lote}`.
- Agregar botón "← Volver al engagement" cerca del título, condicional al resultado de `useEngagementActivoDelLote(loteId)`.
- Agregar `id={`analisis-${codigo}`}` al contenedor de cada sección de análisis (7 secciones técnicas).
- `useEffect` al montar: si `window.location.hash`, hacer `scrollIntoView` con delay 300ms.

### 7. `src/components/portafolio/TareasAnalisisList.tsx`
- Tras refactor verificar `rg TareasAnalisisList src/`. Hoy solo se usa en `EngagementDetalle.tsx`. Se elimina el archivo.
- Antes de eliminar, extraer `ChipEntregable` a `src/components/entregables/ChipEntregable.tsx` para reutilizarlo en `AnalisisCardUnificada`.

### 8. Portal cliente — `src/pages/portal/EngagementClienteDetalle.tsx`
- Reusar `<Analisis360Grid puedeGestionar={false} />` si hoy renderiza algo equivalente. Si tiene su propia vista de análisis, se cambia a este componente. (Verificar primero en build mode antes de tocar.)

### 9. Rutas y links — sin cambios
- `/dashboard/lotes/:id/analisis` sigue apuntando a `DashboardLoteAnalisis`.
- Los 5 enlaces existentes se conservan.

## Notas técnicas

- React Query: el wrapper invalida `["analisis-unificado", loteId, engagementId]` cuando hay mutación de tarea/entregable, para que al volver del editor el reporting refresque.
- TypeScript estricto, cromática semántica del design system (sin colores hardcodeados).
- Tabla real de engagements en este proyecto es `engagements_lote` (verificado en `<supabase-tables>`).

## Validación post-implementación

1. `Analisis360Grid` renderiza 7 tarjetas técnicas con score + estado + asesor + entregables + resumen + botones Excel/MapGIS.
2. "Editor completo →" y "Editar datos →" (con anchor) navegan correctamente y el editor hace scroll a la sección.
3. `DashboardLoteAnalisis` conserva PDF extract, POT, MapGIS apply, autosave, Excel.
4. Botón "← Volver al engagement" aparece cuando el lote tiene engagement.
5. Cliente en portal ve modo solo lectura.
6. `TareasAnalisisList.tsx` eliminado; `ChipEntregable` reubicado.
7. Build pasa.

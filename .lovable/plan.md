
## Auditoría (Parte A) — Hallazgos

### 1. Estructura actual

- **`src/pages/portal/MisEngagements.tsx`** (714 líneas): vista lista con tabs Servicios/Activos, KPI cards, `EngagementCard`, `ProximoPasoCard`, `ActividadRecientePanel`. Botón actual: **"Solicitar diagnóstico"** → abre `SolicitarDiagnosticoDialog`.
- **`src/pages/portal/EngagementClienteDetalle.tsx`** (458 líneas): hero + timeline 4-pasos, tarjetas maestras (Diagnóstico/Presentación), `AnalisisPorAreaAcordeon`, sidebar sticky con asesor + actividad.

### 2. Módulo de upload de documentos del propietario

**No existe hoy un módulo de upload de documentos del propietario embebido en el portal.** Sólo existe `src/components/entregables/SubirEntregableDialog.tsx`, que es para que el **equipo interno (asesor/admin)** suba entregables al engagement. No hay tabla `documentos_propietario`, ni RPC, ni componente cliente-facing para que el propietario suba escrituras / planos / certificados.

**Decisión necesaria del usuario** (ver pregunta abajo): la Parte C.4 y B.7 sub-CTA "Subir documentos" asumen este módulo. O lo construimos en este sprint (es un mini-feature completo: tabla + RLS + bucket + UI), o se difiere a sprint 2.A.bis.

### 3. Análisis incluidos en un plan

`useAnalisisPorPlan()` ya existe y retorna `{ plan_id, tipo_analisis_id, codigo, nombre }[]` desde `planes_analisis` con `incluido=true`. Reusable para la sección C.3.

### 4. SLA

Campo `engagements_lote.fecha_sla_objetivo`. El hook `useMisEngagementsCliente` ya expone `dias_para_sla` precalculado por el RPC `listar_mis_engagements_cliente`. En el detalle (`useEngagementCliente`) se expone `engagement.fecha_sla`, pero **no** `dias_para_sla` — habría que calcular client-side con `differenceInDays`.

### 5. Resumen "X de Y análisis completados" a nivel engagement

`useAnalisisUnificado(loteId, engagementId)` retorna las dimensiones con `tarea_estado`. Permite contar `completados` y `totales`. Para la lista (`MisEngagements`), llamar este hook por cada engagement es costoso → mejor extender el RPC `listar_mis_engagements_cliente` para devolver `analisis_completados` + `analisis_totales`, o agregar columnas calculadas en una nueva RPC ligera.

### 6. Datos de "preview de ficha técnica" (Score 360°, Valoración, Viabilidad)

`useAnalisisUnificadoEngagement` ya computa `valoracionEstimada` y `scorePromedio`. Para la **lista** (B.6 mini-preview por card), de nuevo necesitamos un dato agregado del RPC para no hacer N llamadas por card.

---

## Decisiones que necesito antes de implementar

Esta fase tiene 14 sub-tareas + nuevo módulo de upload + RPC backend nuevo + responsive. Para mantener calidad y un PR revisable, propongo dividir en 3 entregas. **¿Cuál ejecuto ahora?**

### Opción 1 — Solo frontend, datos existentes (1 turno)
B.1 (fallback nombre lote), B.2 (renombrar botón a "Comprar diagnóstico" → `/planes`), B.4 (chip SLA universal en cards usando `dias_para_sla` ya existente), B.5 (CTA "Mejorar plan"), B.7 (sugerencias contextuales: borrador, atrasado, default), B.8 (actividad reciente vacía con contexto), C.1 (fallback nombre), C.2 (reconciliar stepper con avance_pct existente), C.3 (sección "Análisis incluidos en tu plan" usando `useAnalisisPorPlan` + `useAnalisisUnificado`), C.5 (SLA countdown sidebar), C.6 (CTA sidebar "Mejorar plan"), C.7 (banner entregado + KPIs resumen con `useAnalisisUnificadoEngagement`), C.8 (estados borrador/atrasado).

**Excluye:** B.3 y B.6 (requieren RPC backend nuevo para no romper performance), C.4 (requiere construir módulo upload completo).

### Opción 2 — Frontend + RPC backend para B.3/B.6
Opción 1 + migración SQL que extiende `listar_mis_engagements_cliente` para devolver `analisis_completados`, `analisis_totales`, `score_promedio`, `valoracion_estimada`, `score_viabilidad`.

### Opción 3 — Todo, incluido módulo de upload (2-3 turnos)
Opción 2 + nuevo módulo `documentos_propietario`: tabla + RLS + bucket + componente `SubirDocumentoPropietarioDialog` + integración en C.4.

### Pregunta complementaria
**C.7 "Resumen de resultados" referencia `/lotes/:id/ficha`** (Sprint 4). ¿Esa ruta ya existe y muestra ficha completa, o el CTA debe ir a `/portal/engagement/:id` por ahora? Reviso: existe `src/pages/LoteFicha.tsx` — asumo que sí existe la ruta, confirmar.

---

Confirma **Opción 1 / 2 / 3** y respondo sobre la ficha técnica, y arranco la implementación en el siguiente turno.

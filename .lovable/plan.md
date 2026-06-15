## Diagnóstico

El badge "Vencido · 155 días" lo pinta `EngagementHeader.tsx` (líneas 36-42), que calcula el semáforo SLA **localmente** comparando `fecha_sla_objetivo` contra `Date.now()` — sin considerar si el engagement ya está `entregado` o si tiene `fecha_entrega`.

Es el mismo bug operativo que ya se arregló en la tabla/kanban del portafolio (donde se usa `sla_estado` calculado en la vista de BD con estados `cumplido_a_tiempo` / `cumplido_con_retraso`), pero el header de detalle quedó con su lógica vieja "if dias < 0 → rojo".

Por eso el engagement aparece "Vencido" aunque ya se marcó como entregado.

## Fix

1. **`src/hooks/useEngagementDetalle.ts`**: agregar `fecha_entrega` al `SELECT` y al tipo `EngagementDetalle`.

2. **`src/components/portafolio/EngagementHeader.tsx`**: reemplazar el bloque local de cálculo de semáforo por la lógica unificada:
   - Si `engagement.estado === 'entregado'`: renderizar `<BadgeSla>` con `cumplido_a_tiempo` (si `fecha_entrega ≤ fecha_sla_objetivo`) o `cumplido_con_retraso` (si llegó tarde). Si no hay `fecha_entrega`, usar `cumplido_a_tiempo` por defecto.
   - Si no está entregado: mantener semáforo verde/amarillo/rojo actual, pero usar `BadgeSla` para que el lenguaje sea consistente con el resto del portafolio (Atrasado / Por vencer / En tiempo).
3. Eliminar `SemaforoSlaBadge` del header (queda obsoleto en este lugar; lo dejamos por si se usa en otro sitio — `rg` solo lo encontró aquí, así que también se puede borrar el archivo, pero lo dejo para no ampliar el scope).

## Resultado esperado

En `/dashboard/engagements/332c941e-...`, donde el ChecklistEntrega ya muestra "Entregado al cliente", el KPI "SLA" del header pasará de `Vencido · 155 días` (rojo) a `Cumplido` (verde) — o `Cumplido` con reloj ámbar si la entrega fue posterior a la fecha SLA objetivo.

Sin cambios de BD ni de otras vistas: el portafolio ya muestra correctamente "Cumplido" porque consume `sla_estado` de la vista; solo el header de detalle estaba desconectado.
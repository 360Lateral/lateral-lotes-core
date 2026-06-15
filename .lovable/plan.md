## Problema

En `/dashboard/engagements/:id` el bloque "Cliente" muestra `engagements_lote.cliente_id → perfiles.nombre`. En este engagement aparece "Jorge Raigosa", que no es el cliente que solicitó el diagnóstico sino otra persona — la fuente correcta para ese espacio debe ser **el propietario del lote** (`lotes.propietario_id → perfiles.nombre`), no `cliente_id`.

## Cambios (solo UI, sin tocar lógica de negocio ni DB)

### 1. `src/hooks/useEngagementDetalle.ts`
- Extender el JOIN de `lote` para traer también el propietario:
  ```
  lote:lotes!engagements_lote_lote_id_fkey (
    id, nombre_lote, direccion, ciudad, area_total_m2,
    propietario:perfiles!lotes_propietario_id_fkey ( id, nombre, email )
  )
  ```
- Añadir `propietario` (mismo shape que `cliente`) al tipo `EngagementDetalle.lote`.
- Mantener el JOIN actual de `cliente` intacto (se sigue usando en otras partes / lógica de permisos).

### 2. `src/components/portafolio/EngagementHeader.tsx`
- Renombrar la etiqueta `Cliente` → `Propietario del lote`.
- Cambiar la fuente del nombre/email:
  - de `engagement.cliente?.nombre / email`
  - a `engagement.lote?.propietario?.nombre / email`.
- Fallback: `"Sin propietario registrado"` cuando no haya.

### Fuera de alcance
- No se toca `cliente_id` en la base de datos, ni el JOIN de `cliente` en otros hooks/pantallas.
- No se modifica `EngagementDetalle.tsx` ni ningún otro consumidor del hook (el campo `cliente` sigue disponible).
- No se cambian permisos ni RLS — `lotes.propietario_id` ya es legible por quien puede ver el engagement.

## Resultado esperado

El header del engagement mostrará el propietario real del lote (coherente con `/dashboard/lotes/.../editar` y con "Solicitudes de contacto"), eliminando la incoherencia que viste con "Jorge Raigosa".

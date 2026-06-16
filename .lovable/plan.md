## Problema

En `/portal` el usuario `jorgeraigosaroldan@gmail.com` ve "Lote Dorado Plaza" (cuyo `propietario_id` es su propio user id, registrado como "Sura Investments") pero no ve los 16 activos de "Fundación Organización VID" a los que está asociado mediante `usuario_owner`.

Causa: el hook `useMisActivos` filtra solo por `propietario_id = user.id` e ignora la tabla `usuario_owner`.

## Cambio

Ampliar `useMisActivos` para que retorne la **unión** de:
1. Lotes cuyo `propietario_id` = `user.id` (su propio inventario, p. ej. Sura → Lote Dorado Plaza).
2. Lotes cuyo `propietario_id` esté en los `owner_id` asociados al usuario en `usuario_owner` (p. ej. los lotes de Fundación VID).

## Pasos

1. En `src/hooks/useMisActivos.ts`:
   - Consultar primero `usuario_owner` por `user_id = propietarioId` y obtener la lista de `owner_id`.
   - Construir un arreglo `ids = [propietarioId, ...ownerIds]` (sin duplicados).
   - Consultar `lotes` con `.in("propietario_id", ids)` en lugar de `.eq(...)`.
   - Mantener el mismo `select`, ordenamiento y tipo de retorno.

2. Verificar visualmente en `/portal` que aparezcan tanto el lote propio como los 16 de Fundación VID, ordenados por `created_at` descendente.

## Notas técnicas

- RLS de `lotes` ya permite a un propietario leer lotes asociados vía `usuario_owner` (memoria User-Owner RLS), por lo tanto no se requiere migración de base de datos.
- No se modifica el modelo de datos: el `propietario_id` del lote sigue apuntando a la entidad propietaria; el vínculo usuario↔organización vive en `usuario_owner`.
- No se altera el comportamiento de otras vistas; el cambio es local al hook `useMisActivos`, que ya es el único consumidor de "Mis Activos" en el portal.

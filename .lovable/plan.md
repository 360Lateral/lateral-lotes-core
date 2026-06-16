## Objetivo

Que los filtros aplicados en los listados se mantengan al recargar, minimizar, cerrar pestaña o navegar a otra página y volver — en lugar de reiniciarse cada vez.

## Estrategia

Persistir los filtros en `localStorage` por usuario + listado, con una clave única por vista. Al montar cada listado, se hidratan los filtros desde `localStorage`; cada cambio se guarda automáticamente. Se limpian solo con el botón "Limpiar filtros" o al cerrar sesión.

## Alcance (listados con filtros)

1. `/lotes` — Catálogo público (ciudad, uso, estado, área) → `LotesFilterPanel`
2. `/mercado` — Mercado público (ciudad, barrio, uso, tamaño, rango precio) → `FiltrosMercado`
3. `/dashboard/portafolio` — Portafolio admin (plan, estado, asesor, semáforo, búsqueda, activación) → `useVistaPortafolio`
4. `/dashboard/ordenes-servicio` (o equivalente) — Órdenes (tipos, visibilidad, días, precio mínimo) → `FiltrosOrdenesSticky`

## Implementación técnica

1. **Nuevo hook `usePersistedState<T>(key, defaultValue)`** en `src/hooks/usePersistedState.ts`:
   - Lee de `localStorage` al inicializar (con `JSON.parse` seguro y fallback al default si falla).
   - Escribe en `localStorage` en cada cambio (`useEffect`).
   - Namespace por usuario: `360l:filters:{userId|'anon'}:{key}` para que no se mezclen filtros entre cuentas.

2. **Aplicar el hook en cada página/listado**:
   - `src/pages/Lotes.tsx` → reemplazar `useState<Filters>` por `usePersistedState("lotes", defaultFilters)`.
   - `src/pages/Mercado.tsx` → persistir `FiltrosMercado` y `orden` con clave `"mercado"`.
   - `src/pages/PortafolioDashboard.tsx` → persistir `PortafolioFiltrosUI` con clave `"portafolio"`.
   - Página de órdenes de servicio → persistir `FiltrosOrdenes` con clave `"ordenes"`.

3. **Botón "Limpiar filtros"** ya existente en cada panel: además de resetear el estado, borra la clave correspondiente del `localStorage`.

4. **Logout**: en `AuthContext.signOut` agregar limpieza de claves `360l:filters:*` del usuario que cierra sesión, para no dejar residuos.

## Lo que NO cambia

- No se modifica RLS, esquemas, ni lógica de queries.
- Las URLs no llevan los filtros en query string (decisión: `localStorage` es suficiente para el caso "minimizar/volver"); si más adelante se quiere compartir filtros por link, se evalúa aparte.
- Los filtros se mantienen indefinidamente hasta que el usuario use "Limpiar" o cierre sesión.

## Verificación

- Aplicar filtros en `/lotes`, navegar a `/dashboard`, volver → filtros intactos.
- Recargar (`F5`) en `/mercado` con filtros → siguen aplicados.
- Cerrar sesión y entrar con otro usuario → no ve filtros del anterior.
- Botón "Limpiar" → resetea estado y `localStorage`.
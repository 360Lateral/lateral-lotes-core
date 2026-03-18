

## Plan: Optimizar rendimiento al escribir en formularios

### Problema identificado

Los componentes `LoteFormPage` (728 lineas) y `LoteWizard` (986 lineas) usan estado controlado (`setForm`) en cada keystroke, lo que re-renderiza todo el componente incluyendo el mapa de Google Maps. Esto causa lag perceptible al escribir.

El `DashboardLotes` tambien filtra la lista en cada keystroke, aunque con 16 lotes no deberia ser problema significativo.

### Solucion

**1. Extraer GoogleMap a componente memoizado**

Crear un componente `MemoizedLoteMap` con `React.memo` que reciba solo `lat`, `lng` y `onMapClick`. Esto evita que el mapa se re-renderice en cada keystroke.

| Archivo | Accion |
|---|---|
| `src/components/maps/MemoizedLoteMap.tsx` | Crear componente memoizado |
| `src/components/LoteFormPage.tsx` | Reemplazar GoogleMap inline por MemoizedLoteMap |
| `src/components/LoteWizard.tsx` | Reemplazar GoogleMap inline por MemoizedLoteMap |

**2. Debounce en busqueda de DashboardLotes**

Agregar debounce de 300ms al filtro de busqueda para evitar re-filtrar en cada keystroke.

| Archivo | Accion |
|---|---|
| `src/pages/DashboardLotes.tsx` | Agregar `useDeferredValue` o debounce al estado `search` |

**3. Memoizar secciones pesadas del formulario**

Envolver las secciones de servicios y normativa en `React.memo` o usar `useMemo` para evitar recalculos innecesarios.

### Detalles tecnicos

- `MemoizedLoteMap` usa `React.memo` con comparacion shallow de `lat`, `lng` para evitar re-render si las coordenadas no cambiaron
- Para el debounce, se usa `useDeferredValue` de React 18 (ya disponible) para el valor de busqueda
- El `handleMapClick` ya usa `useCallback` en LoteFormPage, lo cual es correcto para evitar invalidar el memo


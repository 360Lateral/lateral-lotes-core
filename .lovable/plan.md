

## Plan: Cambiar estilo de mapa a Satellite Streets

Cambiar el estilo de Mapbox de `light-v11` a `satellite-streets-v12` en todos los archivos que usan mapas, y ajustar la imagen estática de las cards para que también use satellite.

### Archivos a modificar (5 cambios de estilo)

1. **`src/pages/Lotes.tsx`** (línea 110): `light-v11` → `satellite-streets-v12`
2. **`src/pages/LoteDetalle.tsx`** (línea 262): `light-v11` → `satellite-streets-v12`
3. **`src/components/LoteWizard.tsx`** (línea 146): `streets-v12` → `satellite-streets-v12`
4. **`src/components/LoteFormPage.tsx`** (línea 262): `streets-v12` → `satellite-streets-v12`
5. **`src/components/LoteCard.tsx`** (línea 51): Cambiar la URL estática de `light-v11` a `satellite-streets-v12` para que las miniaturas de las cards también sean satelitales

### Ajuste visual en pines
- Cambiar el borde de los pines del mapa en `Lotes.tsx` de `white` a un borde más grueso para mejor contraste contra el fondo satelital oscuro
- Ajustar el color del texto en los popups para mantener legibilidad

Sin dependencias nuevas ni cambios de base de datos.


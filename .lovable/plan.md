

## Importación Masiva de Lotes desde Excel

### Implementación

**1. Instalar dependencia `xlsx`** para parsear archivos Excel en el frontend.

**2. Crear `src/pages/DashboardLotesImportar.tsx`** — página protegida con:

- Zona de carga de archivo (.xlsx, .xls, .csv) con drag & drop o botón
- Parseo del archivo con `xlsx` → extrae las filas como objetos
- Tabla de previsualización con las columnas mapeadas:
  - `nombre_lote` ← "Nombre" / "nombre_lote" / "Nombre del lote"
  - `direccion` ← "Dirección" / "direccion"
  - `ciudad` ← "Ciudad" / "ciudad" / "Municipio"
  - `matricula_inmobiliaria` ← "Matrícula" / "matricula_inmobiliaria"
  - `lat` ← "Latitud" / "lat" (extraída de link de Google Maps si es URL)
  - `lng` ← "Longitud" / "lng"
  - `area_total_m2` ← "Área" / "area_total_m2" / "Area m2"
- Detección inteligente de columnas: busca headers por nombre parcial (case-insensitive)
- Si se pega un link de Google Maps, extraer lat/lng con regex
- Indicador de filas válidas (tienen al menos nombre_lote) vs inválidas
- Botón "Importar X lotes" que hace bulk insert a `lotes` table
- Progress bar durante la importación
- Resultado: "X lotes importados correctamente, Y errores"

**3. Modificar `src/pages/DashboardLotes.tsx`** — agregar botón "Importar Excel" junto al botón "Nuevo lote".

**4. Registrar ruta en `src/App.tsx`** — `/dashboard/lotes/importar` protegida.

### Archivos

| Archivo | Acción |
|---|---|
| `package.json` | Agregar `xlsx` |
| `src/pages/DashboardLotesImportar.tsx` | Crear |
| `src/pages/DashboardLotes.tsx` | Agregar botón importar |
| `src/App.tsx` | Agregar ruta |

No se requieren cambios de base de datos. Se usa la tabla `lotes` existente con INSERT (RLS permite admin/asesor).


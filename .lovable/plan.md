

## Score Visual de Viabilidad — Plan de Implementación

### 1. Base de datos — Migration

Agregar 3 columnas a la tabla `lotes`:

```sql
ALTER TABLE public.lotes
  ADD COLUMN score_juridico integer,
  ADD COLUMN score_normativo integer,
  ADD COLUMN score_servicios integer;
```

Sin constraints adicionales. Valores válidos: 1, 2, 3 o null. No se requieren cambios de RLS (las políticas existentes de lotes cubren SELECT público y UPDATE para admin/asesor).

### 2. Componente reutilizable `ScoreIndicator`

Crear `src/components/ScoreIndicator.tsx` — un componente que recibe `score: number | null`, `label: string`, `emoji: string`, y un prop `size` ("sm" para tarjetas, "lg" para detalle).

- Score 1 → verde `#2ecc71` + "Favorable"
- Score 2 → amarillo `#f39c12` + "Requiere revisión"
- Score 3 → rojo `#e74c3c` + "Tiene observaciones"
- null → gris `#9ca3af` + tooltip "Sin información aún"

Versión `sm`: círculo de 10px + emoji + etiqueta en texto xs.
Versión `lg`: círculo de 16px + emoji + etiqueta + texto descriptivo.

### 3. Tarjetas del catálogo

**`LoteCard.tsx`**: Agregar props `score_juridico`, `score_normativo`, `score_servicios`. Debajo del bloque de precio/área, agregar fila con 3 `ScoreIndicator` size="sm".

**`LoteListCard.tsx`**: Agregar los mismos props y una fila de scores debajo del área/precio.

**`Index.tsx`**: Incluir los 3 campos de score en la query y pasarlos a `LoteCard`.

**`Lotes.tsx`**: Incluir los 3 campos en la query, actualizar la interfaz `LoteWithPrecio`, y pasarlos a `LoteListCard`.

### 4. Detalle del lote (`LoteDetalle.tsx`)

Arriba de los `<Tabs>` (línea ~462), insertar una barra con 3 `ScoreIndicator` size="lg". Los datos ya vienen del query existente que hace `select("*")`.

### 5. Panel admin — Formulario de edición (`LoteFormPage.tsx`)

Agregar 3 campos Select al formulario (en una sección "Score de viabilidad"):
- Score Jurídico: Sin asignar / Verde / Amarillo / Rojo
- Score Normativo: igual
- Score Servicios: igual

Guardar como integer (1/2/3) o null en la tabla lotes. Actualizar la interfaz `LoteForm` y la lógica de save/load.

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| Migration SQL | Agregar 3 columnas |
| `src/components/ScoreIndicator.tsx` | Crear |
| `src/components/LoteCard.tsx` | Agregar fila de scores |
| `src/components/LoteListCard.tsx` | Agregar fila de scores |
| `src/pages/Index.tsx` | Agregar campos score al query |
| `src/pages/Lotes.tsx` | Agregar campos score al query e interfaz |
| `src/pages/LoteDetalle.tsx` | Agregar barra de scores arriba de tabs |
| `src/components/LoteFormPage.tsx` | Agregar selectores de score |


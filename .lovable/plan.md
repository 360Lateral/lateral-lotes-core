## Objetivo
En `/dashboard/lotes`, separar el badge del plan (hoy va pegado al nombre del lote) en su propia columna **"Plan"**, y colorear el badge según la importancia del plan.

## Cambios

### 1. `src/pages/DashboardLotes.tsx`
- Agregar `<th>Plan</th>` en el `<thead>` entre **Propietario** y **Ciudad**.
- Quitar el `<Badge>` del plan que actualmente se renderiza al lado de `l.nombre_lote`.
- Agregar nueva `<td>` que muestre el badge del plan usando un helper `planBadgeClass(codigo)`; mostrar `—` si el lote no tiene engagement activo.
- Actualizar el `colSpan` del estado vacío de `8` a `9`.

### 2. Helper de color por importancia
Crear una pequeña función local (o en `src/lib/utils.ts` si prefieres centralizar) que mapee `planes_diagnostico.codigo` (o `nombre` como fallback) a clases Tailwind sobre tokens semánticos del design system. Propuesta de jerarquía (de menor a mayor importancia):

| Plan (codigo)                  | Color (token)                                      |
|--------------------------------|----------------------------------------------------|
| `express` / básico             | `bg-muted text-muted-foreground`                   |
| `estandar` / intermedio        | `bg-secondary text-secondary-foreground`           |
| `avanzado` / profesional       | `bg-warning text-primary-foreground` (naranja)     |
| `premium` / `360` / top tier   | `bg-success text-primary-foreground` (verde fuerte)|
| desconocido                    | `bg-muted text-muted-foreground`                   |

Usar `<Badge className={planBadgeClass(codigo)} variant="outline">{nombre}</Badge>` para respetar el design system (no se introducen colores hardcoded; todo vía tokens HSL ya definidos en `index.css`/`tailwind.config.ts`).

### Notas
- No se toca lógica de datos ni queries: ya viene `planes_diagnostico.codigo, nombre` desde `useEngagementsActivosPorLotes`.
- Cambio puramente de presentación, alineado con la regla "UI change → solo frontend".
- Antes de cerrar verifico los códigos reales de planes en `planes_diagnostico` para mapear correctamente; si los `codigo` no coinciden con el mapa propuesto, ajusto el helper para usar `orden` numérico como criterio de importancia.
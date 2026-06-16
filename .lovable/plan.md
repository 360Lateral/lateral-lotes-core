## Problema

En `/dashboard/usuarios`, al editar un usuario, la sección **"Dueños asociados"** muestra un Select vacío. Causa raíz: el listado se construye filtrando `users.filter(u => u.user_type === "dueno")` (línea 93 de `DashboardUsuarios.tsx`), pero en este proyecto los propietarios reales tienen `user_type = "propietario"` (verificado en BD: 5 usuarios `propietario`, 0 usuarios `dueno`). Por eso el desplegable no trae nada.

Además la etiqueta usa "Dueños", inconsistente con el resto del sistema que ya estandarizó "Propietario" (ver `AsignarPropietarioDialog`, `usePropietariosList`, header del engagement).

## Cambios (solo UI en `src/pages/DashboardUsuarios.tsx`)

1. **Línea 93** — Cambiar la fuente del Select para que considere a los propietarios reales:
   ```ts
   const owners = users.filter(
     (u) => u.user_type === "propietario" || u.user_type === "dueno"
   );
   ```
   (Se deja `"dueno"` como fallback por si quedaran registros legacy; los actuales son `"propietario"`.)

2. **Líneas 438–440** — Renombrar la etiqueta y el texto auxiliar:
   - `Label`: "Dueños asociados" → **"Propietarios asociados"**.
   - Descripción: "podrá ver los lotes privados de los dueños asociados" → "…de los propietarios asociados".

3. **Línea 459** — Placeholder del Select: "Seleccionar dueño" → **"Seleccionar propietario"**.

## Fuera de alcance

- No se tocan los nombres internos de la tabla `usuario_owner` ni el campo `owner_id` (es el nombre de la relación, no un label visible).
- No se modifica `list-users` ni `manage-user` (siguen recibiendo `owner_id` correctamente).
- No se cambia la consulta de "Lotes del propietario" (línea 148, `lotes.owner_id`) — esa columna sí existe en BD y aplica a usuarios tipo `dueno`/`comisionista`; está fuera del bug reportado.
- No se renombra el `user_type` "dueno" del filtro superior (línea 245) para no romper datos existentes.

## Resultado esperado

El Select de "Propietarios asociados" listará los 5 usuarios con `user_type = 'propietario'`, permitiendo asociarlos al usuario que se edita. La terminología queda alineada con el resto de la plataforma.

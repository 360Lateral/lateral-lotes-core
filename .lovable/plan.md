

## Plan: Gestión avanzada de usuarios y publicación de lotes

### Resumen

Se necesitan tres capacidades nuevas para el administrador:

1. **Cambiar tipo de usuario** (`user_type` en `perfiles`) desde el panel de usuarios
2. **Asociar usuarios a un dueño/organización** para controlar qué lotes pueden ver
3. **Publicar/despublicar lotes** (`es_publico`) desde el panel de lotes del dashboard

---

### Cambios en base de datos

**Nueva tabla `usuario_owner` (asociación usuario ↔ dueño/organización):**
- `id` uuid PK
- `user_id` uuid NOT NULL (el usuario asociado, ej. comisionista)
- `owner_id` uuid NOT NULL (el dueño cuyos lotes puede ver)
- `created_at` timestamptz default now()
- Unique constraint en `(user_id, owner_id)`
- RLS: admins pueden CRUD, usuarios autenticados pueden SELECT sus propios registros

Esto permite que un comisionista u otro usuario vea los lotes de los dueños a los que fue asociado.

**Actualizar RLS de `lotes`** para que usuarios asociados vía `usuario_owner` puedan ver lotes privados de sus dueños asignados.

---

### Edge Function: `manage-user` (nueva)

Endpoint unificado para que admins puedan:
- **Cambiar `user_type`**: actualiza `perfiles.user_type` con el service role key
- **Asociar/desasociar usuario ↔ dueño**: insert/delete en `usuario_owner`

Validaciones: solo `admin` o `super_admin` pueden invocar.

---

### Cambios en el frontend

#### 1. `DashboardUsuarios.tsx` - Columna "Tipo" editable + asociación a dueño

- Agregar botón de edición en la columna "Tipo" que abre un dialog con:
  - Select para cambiar `user_type` (dueno, comisionista, developer, inversor)
  - Multi-select o lista de dueños asociados (cargados de `perfiles` donde `user_type = 'dueno'`)
  - Botón para agregar/quitar asociaciones
- El `list-users` edge function se amplía para devolver también las asociaciones `usuario_owner` de cada usuario

#### 2. `DashboardLotes.tsx` - Toggle de publicación

- Agregar un botón/switch `es_publico` en cada fila de lote en el listado del dashboard admin
- Al hacer toggle, ejecutar `supabase.from("lotes").update({ es_publico: !current })` directamente (ya permitido por RLS para admins)

#### 3. `DashboardOwnerLotes.tsx` - Lotes de dueños asociados

- Si el usuario es comisionista, consultar también lotes de sus dueños asociados vía `usuario_owner`

---

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| Migration SQL | Crear tabla `usuario_owner` + RLS + actualizar política SELECT de `lotes` |
| `supabase/functions/manage-user/index.ts` | Nueva edge function |
| `supabase/functions/list-users/index.ts` | Agregar asociaciones al response |
| `src/pages/DashboardUsuarios.tsx` | Dialog editar tipo + gestionar asociaciones |
| `src/pages/DashboardLotes.tsx` | Toggle `es_publico` por lote |
| `src/pages/DashboardOwnerLotes.tsx` | Consultar lotes de dueños asociados |


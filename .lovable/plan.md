

## Sala de Negociación Privada — Plan de Implementación

### Resumen

Crear un sistema de negociación en tiempo real entre developers y dueños de lotes, con chat, gestión de estados y panel admin. Se crean 2 tablas nuevas, 1 página nueva, y se modifican 3 páginas existentes.

---

### 1. Base de datos — Nuevas tablas y políticas

**Tabla `negociaciones`:**
- `id` (uuid, PK), `lote_id` (uuid, FK → lotes), `developer_id` (uuid), `owner_id` (uuid, nullable — asignado por admin), `estado` (enum: `activa`, `en_revision`, `cerrada`, `concretada`), `contacto_visible` (boolean, default false), `created_at` (timestamptz)

**Nuevo enum** `estado_negociacion`: `activa | en_revision | cerrada | concretada`

**Tabla `mensajes`:**
- `id` (uuid, PK), `negociacion_id` (uuid, FK → negociaciones), `sender_id` (uuid), `contenido` (text), `created_at` (timestamptz)

**RLS:**
- `negociaciones`: SELECT/INSERT para participantes (`developer_id = auth.uid()` o `owner_id = auth.uid()`); admin/asesor puede SELECT/UPDATE all
- `mensajes`: SELECT/INSERT para participantes de la negociación; admin puede SELECT all

**Realtime:** Habilitar realtime en tabla `mensajes` para chat en vivo.

---

### 2. Flujo "Me interesa este lote" — Modificar `LoteDetalle.tsx`

Cuando el usuario logueado es developer y hace clic en "Me interesa este lote":
- Verificar si ya existe una negociación activa para ese lote + developer
- Si no existe, crear registro en `negociaciones` con `developer_id = user.id`, `owner_id = null` (admin lo asigna después), `estado = 'activa'`
- Redirigir a `/negociacion/[id]`
- Si ya existe, redirigir directamente a la sala existente
- Para usuarios no-developer, mantener el formulario de contacto actual sin cambios

---

### 3. Página `/negociacion/:id` — Nueva página `SalaNegociacion.tsx`

**Panel superior fijo (azul oscuro #1D3461):**
- Nombre del lote, área, precio, estado de la negociación como badge

**Panel de chat (centro):**
- Mensajes con burbujas: naranja (`#F49D15`) para el usuario actual, gris para el otro
- Scroll automático al último mensaje
- Suscripción realtime a nuevos mensajes via `supabase.channel()`
- Campo de texto + botón "Enviar" fijo al fondo

**Panel lateral (desktop) / Tab (mobile):**
- Estado de la negociación con badge de color
- Botón "Cambiar estado" solo visible para admin/asesor
- Datos de contacto del otro participante, solo visibles si `contacto_visible = true`

**Acceso:** Solo participantes de la negociación (developer_id o owner_id) y admin/asesor. Redirigir si no autorizado.

---

### 4. Dashboard Developer — Modificar `DashboardDeveloper.tsx`

Agregar sección "Mis Negociaciones" debajo de "Mis Alertas":
- Query a `negociaciones` donde `developer_id = user.id`, join con `lotes` para nombre
- Tarjetas con: nombre del lote, estado, fecha, botón "Ir a sala" que navega a `/negociacion/[id]`

---

### 5. Panel Admin — Modificar `Dashboard.tsx` o nueva sección

Agregar sección "Negociaciones" en el dashboard admin:
- Tabla con todas las negociaciones: lote, developer (nombre de perfil), owner (nombre de perfil), fecha, estado
- Botón para cambiar estado (dropdown)
- Toggle para habilitar `contacto_visible`
- Botón para asignar `owner_id` (selector de usuarios con rol admin/asesor o inversor)

---

### 6. Routing — Modificar `App.tsx`

- Nueva ruta `/negociacion/:id` protegida (requiere autenticación)
- Importar `SalaNegociacion`

---

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| Migration SQL | Crear enum, tablas, RLS, realtime |
| `src/pages/SalaNegociacion.tsx` | Crear — página completa de chat |
| `src/pages/LoteDetalle.tsx` | Modificar — lógica "Me interesa" para developers |
| `src/pages/DashboardDeveloper.tsx` | Modificar — agregar sección negociaciones |
| `src/pages/Dashboard.tsx` | Modificar — agregar tabla negociaciones para admin |
| `src/App.tsx` | Modificar — nueva ruta |
| `src/components/ProtectedRoute.tsx` | Sin cambios (ya maneja auth genérica) |


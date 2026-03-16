

## Plan: Personalizar la landing y controlar visibilidad de lotes

### Problema actual
1. La landing page (/) no diferencia la experiencia entre dueño de lote y developer logueado
2. Todos los lotes son visibles para todos — no hay concepto de lote público/privado ni de propiedad
3. La navbar no refleja el perfil del usuario logueado

### Cambios necesarios

#### 1. Base de datos — Migración
- Agregar columna `owner_id uuid` (nullable, referencia a `auth.users`) a la tabla `lotes`
- Agregar columna `es_publico boolean default true` a la tabla `lotes`
- Actualizar políticas RLS de SELECT en `lotes`:
  - Anónimos/públicos: solo ven lotes donde `es_publico = true`
  - Autenticados: ven lotes públicos + sus propios lotes (`owner_id = auth.uid()`) + admin/asesor ven todo
- Actualizar RLS de INSERT: permitir a usuarios autenticados insertar lotes con `owner_id = auth.uid()` (no solo admin/asesor)
- Actualizar RLS de UPDATE/DELETE: el owner puede modificar/eliminar sus propios lotes además de admin/asesor

#### 2. Landing page (`src/pages/Index.tsx`)
- **No logueado**: mantener como está (hero genérico, lotes públicos destacados)
- **Logueado como dueño**: cambiar hero a "Gestiona tus lotes" con botones "Publicar nuevo lote" y "Ver mis lotes"; la sección de lotes muestra solo los suyos con opción de ver el catálogo público
- **Logueado como developer**: cambiar hero a "Encuentra tu próximo terreno" con botón "Explorar catálogo"; muestra lotes públicos disponibles
- **Logueado como admin**: mantener vista actual con acceso al dashboard

#### 3. Navbar (`src/components/Navbar.tsx`)
- Mostrar badge o indicador del tipo de perfil junto al nombre del usuario (ej: "Juan · Dueño de lote")
- Ajustar links: dueños ven "Mis lotes" y "Diagnóstico"; developers ven "Catálogo" y "Alertas"

#### 4. Catálogo `/lotes` (`src/pages/Lotes.tsx`)
- Solo mostrar lotes donde `es_publico = true` (la RLS lo filtrará automáticamente para no-owners)
- Si el usuario es dueño, agregar un toggle/tab "Mis lotes" / "Catálogo público"

#### 5. Wizard de publicación (`src/components/LoteWizard.tsx`)
- Al publicar, setear `owner_id` al usuario actual
- Los lotes nuevos nacen con `es_publico = false` y `estado = 'En revisión'` — el admin los revisa y los marca públicos

#### 6. Ficha del lote (`src/pages/LoteDetalle.tsx`)
- Si el lote es privado (`es_publico = false`) y el usuario no es el dueño ni admin, mostrar un mensaje "Este lote no está disponible" en lugar de la ficha completa

### Orden de implementación
1. Migración de base de datos (owner_id, es_publico, RLS)
2. Actualizar LoteWizard para incluir owner_id
3. Modificar landing page con vistas personalizadas por perfil
4. Actualizar Navbar con indicador de perfil y links contextuales
5. Ajustar catálogo /lotes con filtro de visibilidad
6. Proteger ficha de detalle para lotes privados

### Nota técnica
Las queries existentes en Index.tsx y Lotes.tsx no necesitan filtro explícito por `es_publico` porque las nuevas políticas RLS filtrarán automáticamente. Solo se necesita agregar lógica de "mis lotes" para dueños.


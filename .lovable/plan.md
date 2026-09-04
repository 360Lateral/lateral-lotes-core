# Desactivar y eliminar usuarios (solo superadmin)

Hoy la pantalla de Usuarios solo permite cambiar rol, tipo de usuario y asociaciones con propietarios. No existe ninguna forma de desactivar ni de borrar una cuenta.

## Qué se agrega

En cada fila de la lista de usuarios, dentro del menú de acciones (visible solo para el superadmin):

1. **Desactivar / Reactivar cuenta**
   - Marca la cuenta como inactiva: la persona ya no puede iniciar sesión, pero se conservan sus lotes, engagements, pagos e historial.
   - Es reversible con un clic.
   - Badge "Inactivo" en la fila y filtro para ver activos/inactivos.

2. **Eliminar definitivamente**
   - Acción destacada en rojo, con diálogo de confirmación donde hay que escribir el correo exacto del usuario.
   - El diálogo muestra antes de borrar un resumen de lo que tiene asociado (lotes, engagements, transacciones) para evitar borrados accidentales.
   - Se bloquea el borrado del propio superadmin y de otros superadmins.

## Qué pasa con la información al eliminar

Al borrar una cuenta se elimina el usuario y su perfil. Los lotes, engagements y pagos quedan sin dueño asignado (no se borran), y aparecen en la pantalla "Lotes sin propietario" para reasignarlos. Los pagos y liquidaciones se conservan por trazabilidad contable.

## Detalles técnicos

- `supabase/functions/manage-user/index.ts`: nuevas acciones
  - `toggle_activo` → actualiza `perfiles.activo`; exige rol admin/super_admin.
  - `delete_user` → exige `super_admin`; valida que el objetivo no sea super_admin ni el propio llamante; hace un conteo previo de dependencias y luego `auth.admin.deleteUser`, con limpieza de `user_roles`, `usuario_owner`, `perfiles`.
  - `preview_delete` → devuelve conteos de `lotes`, `engagements_lote`, `transacciones`, `negociaciones` para el diálogo de confirmación.
- Al desactivar también se revoca la sesión activa (`auth.admin.signOut`) para que el bloqueo sea inmediato.
- `src/pages/DashboardUsuarios.tsx`: menú de acciones por fila, badge de estado, filtro activo/inactivo, y nuevo `EliminarUsuarioDialog` (confirmación por correo + resumen de dependencias). Las opciones destructivas se renderizan solo si `isSuperAdmin`.
- Bloqueo de acceso para cuentas desactivadas: comprobación de `perfiles.activo` en `AuthContext`; si está en `false`, se cierra sesión y se muestra un mensaje de cuenta desactivada.
- No se requiere cambio de esquema: `perfiles.activo` ya existe.

# Modo pruebas también para administradores

Hoy la barra de simulación de roles y la página de Pruebas solo aparecen para el super admin. Se habilitan también para el rol Administrador, con una sola limitación: un administrador no puede simular al Super Admin.

## Qué cambia

1. **Barra superior de simulación**: visible también para administradores. En su selector aparecen Visitante, Propietario, Comisionista, Desarrollador, Experto y Admin. La opción Super Admin solo la ve el super admin.
2. **Menú lateral**: la entrada "Pruebas" se muestra a los administradores.
3. **Página /dashboard/qa**: accesible para administradores; se conservan todos los recorridos, incluido el del Super Admin, pero marcado como "solo lectura / no simulable" para un admin (el enlace de ese recorrido no activa la simulación).
4. **Protección**: si un administrador intenta forzar la simulación de super admin (por ejemplo con un valor guardado antiguo), se ignora y vuelve a su rol real.

Sin cambios para el super admin: sigue viendo todo igual que hoy.

## Detalle técnico

- `AuthContext`: añadir `isRealAdmin` (rol real `admin`) y `canUseQaMode = isRealSuperAdmin || isRealAdmin`. La simulación pasa a permitirse cuando `canUseQaMode`, con guarda: si `!isRealSuperAdmin && devRole === "super_admin"` se trata como `none`.
- `DevRoleContext`: al leer el valor persistido no hay cambios; el filtrado del rol prohibido se hace en `AuthContext` para no depender del orden de providers.
- `DevRoleBanner`: condición `canUseQaMode` en vez de `isRealSuperAdmin`; ocultar la opción `super_admin` del `Select` cuando no es super admin real.
- `DashboardLayout` (línea ~271): mostrar "Pruebas" con `canUseQaMode`.
- `DashboardQA`: reemplazar el guard `isRealSuperAdmin` por `canUseQaMode`; en el recorrido de Super Admin, para admins, deshabilitar el botón que activa la simulación y mostrar una nota.

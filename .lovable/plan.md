
Objetivo: corregir el bloqueo de login (“Ingresando…”) y la pantalla “Cargando…” en rutas protegidas, manteniendo el flujo actual de redirecciones por rol/perfil.

Diagnóstico (causa raíz ya confirmada):
1) La autenticación sí responde bien (token 200), pero después no salen requests de perfil/roles.
2) El estado queda colgado en login y también en /dashboard con “Cargando…”.
3) En `src/contexts/AuthContext.tsx`, el listener `onAuthStateChange` está declarado `async` y hace `await` a consultas del backend dentro del callback.
4) Ese patrón puede bloquear el cliente de auth (deadlock), dejando promesas pendientes indefinidamente.

Plan de implementación (sin tocar lógica de negocio existente):
1) Refactor de `AuthContext` para eliminar el deadlock
   - Archivo: `src/contexts/AuthContext.tsx`
   - Cambios:
     - Hacer `onAuthStateChange` síncrono (sin `async/await` dentro).
     - Mover `loadUserData(...)` a ejecución diferida fuera del callback (microtask/timeout).
     - Centralizar manejo de sesión en una función interna (`applySession`) con `try/catch/finally`.
     - Garantizar que `setLoading(false)` siempre se ejecute (incluso ante error).
     - Mantener limpieza de estado al cerrar sesión (`roles`, `userType`) tal como está.

2) Blindaje de estado de carga en login
   - Archivo: `src/pages/Login.tsx` (ajuste pequeño, sin cambiar UX)
   - Cambios:
     - Envolver `handleLogin` en `try/catch/finally` para asegurar `setLoading(false)` en cualquier fallo inesperado.
     - Mantener exactamente la lógica actual de redirección por roles/perfil.

3) Verificación funcional (end-to-end)
   - Probar login con admin demo:
     - Debe salir de “Ingresando…” y navegar a `/dashboard`.
     - `/dashboard` ya no debe quedarse en “Cargando…”.
   - Recargar `/dashboard` con sesión activa: debe cargar normal.
   - Validar que usuarios no admin siguen redirigiéndose como antes.
   - Probar logout/login nuevamente para confirmar estabilidad.

Detalles técnicos (resumen):
- Problema principal: operaciones async del cliente dentro de `onAuthStateChange`.
- Solución técnica: listener sin awaits + carga de datos diferida + `finally` obligatorio para cerrar `loading`.
- Impacto esperado: elimina cuelgues intermitentes de autenticación sin modificar permisos, rutas ni métricas del dashboard.

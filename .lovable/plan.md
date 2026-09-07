# Modo pruebas: recorrido guiado por roles

Objetivo: poder pasearte por el portal como cualquier rol, seguir un paso a paso de cada proceso y dejar anotado lo que quieras mejorar, sin salir de la aplicación.

## 1. Selector de rol mejorado (barra superior)

Hoy la barra de simulación solo la ve el super admin y se pierde al recargar. Cambios:

- La selección se recuerda al recargar y al navegar entre páginas.
- La barra queda siempre visible mientras simulas, con el nombre del rol destacado y un botón claro para volver a tu rol real.
- Se agrega la opción "Visitante (sin sesión)" para revisar cómo se ve el portal sin haber iniciado sesión.
- Un atajo para saltar directo al inicio del rol elegido.

Sigue siendo exclusivo del super admin.

## 2. Nueva página "Pruebas" (/dashboard/qa)

Accesible desde el menú lateral, solo para super admin.

- Lista de recorridos agrupados por rol: Visitante, Propietario, Comisionista, Desarrollador, Experto, Admin, Super Admin.
- Cada recorrido es una secuencia de pasos con: qué hacer, qué deberías ver, y un enlace que te lleva a esa pantalla ya con el rol correcto activado.
- Casilla para marcar cada paso como Correcto / Con hallazgo / Pendiente, con barra de avance por rol.
- Al volver a la página, el avance sigue ahí.

Recorridos que se incluyen:

- Visitante: inicio, catálogo público, ficha de lote bloqueada, diagnóstico gratuito, planes, índice de mercado, registro.
- Propietario: registro y bienvenida, publicar lote (asistente de 4 pasos), diagnóstico, portafolio, engagements y documentos requeridos, negociaciones, pago de plan.
- Comisionista: autorización del propietario y documentos, cargar lote representado, seguimiento.
- Desarrollador: catálogo con filtros, ficha, suscripción y pago por vista, favoritos y alertas, solicitud de contacto, negociación, mi cuenta.
- Experto: órdenes de servicio, postulación, ejecución de análisis por áreas, entregables, liquidaciones.
- Admin: validación de lotes, lotes sin propietario, usuarios, engagements, solicitudes de contacto, pagos, feedback, métricas.
- Super Admin: configuración, contratos marco, precios y planes, activar/desactivar y eliminar usuarios.

## 3. Registro de hallazgos desde cada paso

- Botón "Reportar hallazgo" en cada paso, que abre el formulario de feedback ya existente con el rol, el paso y la pantalla precargados.
- El hallazgo queda guardado en el tablero de feedback actual (/dashboard/feedback), así que se gestiona con el mismo flujo de tipo, severidad y estado que ya usas.
- En la página de Pruebas se muestra cuántos hallazgos abiertos tiene cada recorrido.

## Detalle técnico

- `DevRoleContext`: persistir `devRole` en `localStorage` por usuario; añadir valor `visitante` que fuerza vista pública (sin sesión efectiva) en `AuthContext` sin cerrar la sesión real.
- `DevRoleBanner`: rediseño compacto, siempre visible al simular, con botón "Ir al inicio del rol" y salida.
- Nuevo `src/pages/DashboardQA.tsx` + `src/lib/qa-recorridos.ts` (definición declarativa de roles → pasos: id, título, expectativa, ruta, rol requerido).
- Progreso guardado en `localStorage` (clave por usuario). No requiere cambios de base de datos.
- Hallazgos: reutilizar `EnviarFeedbackDialog`, pasando contexto inicial (rol, paso, ruta) en la descripción; consulta de conteo sobre `feedback_tickets` filtrando por etiqueta del recorrido.
- Ruta protegida con `requireSuperAdmin` y entrada en el menú de `DashboardLayout`.

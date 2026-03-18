

## Plan: Rediseño minimalista y limpieza de botones en toda la app

### Problemas identificados

1. **Navbar**: 3 bloques condicionales duplicados para el botón "Dashboard" (admin, developer, dueno) tanto en desktop como en mobile (6 condicionales en total). El botón "Cerrar sesión" aparece como icono en desktop y como botón con texto en mobile -- inconsistente.

2. **Index.tsx (Hero)**: 5 variantes de hero con botones redundantes. El hero de "dueno" tiene 4 acciones (Ir a Mi Panel, Ver mis lotes, Publicar nuevo lote, Solicitar diagnóstico) -- demasiadas opciones. Los heros de otros roles también repiten CTAs que ya están en el Navbar.

3. **Dashboard.tsx (admin)**: La tabla de "Negociaciones activas" tiene una columna de estado que siempre dice "Activa" (Badge estático) -- superflua ya que el query filtra por `estado = 'activa'`. El botón "Ver sala" por cada fila ocupa espacio.

4. **DashboardLotes.tsx**: 5 iconos de acción por fila (Editar, Documentos, Análisis, Ver ficha, Eliminar) -- demasiados para una vista de tabla. El botón "Importar Excel" compite visualmente con "Nuevo lote".

5. **DashboardUsuarios.tsx**: Los badges de roles tienen icono ShieldMinus inline -- no es claro que sean clickeables. Hay botones de "Editar" y "Otorgar rol" separados que podrían unificarse.

6. **DashboardOwner.tsx**: Botones "Publicar lote" y "Solicitar diagnóstico" en el header + cards clickeables abajo que llevan a los mismos destinos = redundancia.

7. **DashboardNegociaciones.tsx**: Botón "Ver sala" por cada fila podría ser un click en la fila completa.

---

### Cambios propuestos

#### Navbar (desktop + mobile)
- Unificar los 3 condicionales de botón Dashboard en uno solo que determine la ruta según el rol
- Reducir a: nombre de usuario (sin badge de perfil en desktop) + link "Dashboard/Mi Panel" + icono logout

#### Index.tsx (Hero)
- Hero de dueno: reducir a 2 acciones: "Ir a Mi Panel" (primario) + "Publicar lote" (secundario). Eliminar "Ver mis lotes" y "Solicitar diagnóstico" (ya accesibles desde el panel)
- Hero de developer: mantener 2 acciones pero quitar icono redundante
- Hero de admin: mantener como está (ya tiene 1 solo botón)
- Hero genérico: reducir a 1 CTA + link de texto

#### Dashboard.tsx (admin)
- Negociaciones activas: eliminar columna "Estado" (siempre "Activa"), hacer la fila clickeable en lugar de botón "Ver sala"
- Diagnósticos: reducir columnas (quitar "Municipio" y "Área" de la tabla resumen, dejar solo Fecha, Nombre, Objetivo, Estado)
- Lotes pendientes: compactar botones Aprobar/Rechazar a iconos con tooltip

#### DashboardLotes.tsx
- Agrupar acciones en un dropdown menu (3 puntos) con: Editar, Documentos, Análisis 360°, Ver ficha, Eliminar
- Mover "Importar Excel" a un icono junto al buscador (menos prominente)

#### DashboardUsuarios.tsx
- Unificar botones "Editar" y "Otorgar rol" en el mismo dialog de edición
- Eliminar el icono ShieldMinus de los badges de roles (gestionar roles solo desde el dialog)
- Hacer la fila clickeable para abrir el dialog de edición

#### DashboardOwner.tsx
- Eliminar los botones del header ("Publicar lote", "Solicitar diagnóstico")
- Convertir las 4 cards de métricas en acciones directas (ya son clickeables) y agregar una card de "Publicar lote" como acción principal

#### DashboardNegociaciones.tsx
- Hacer la fila completa clickeable para ir a la sala, eliminar botón "Ver sala"

#### DashboardLeads.tsx
- Ya está bien (la fila es clickeable para abrir el sheet). Sin cambios.

---

### Archivos a modificar

| Archivo | Cambio principal |
|---|---|
| `src/components/Navbar.tsx` | Unificar condicionales de Dashboard, simplificar área de usuario |
| `src/pages/Index.tsx` | Reducir CTAs en heros, eliminar acciones redundantes |
| `src/pages/Dashboard.tsx` | Quitar columnas/botones superfluos, filas clickeables |
| `src/pages/DashboardLotes.tsx` | Acciones en dropdown, importar menos prominente |
| `src/pages/DashboardUsuarios.tsx` | Unificar edición + roles, quitar botón separado |
| `src/pages/DashboardOwner.tsx` | Eliminar botones duplicados del header |
| `src/pages/DashboardNegociaciones.tsx` | Filas clickeables, quitar botón "Ver sala" |


# Cambiar "engagement" por "Diagnóstico" en el portal del cliente

Solo cambian los textos que el cliente lee en el portal (`/portal/...`). El panel de administración, las direcciones de las páginas y la base de datos se quedan igual.

## Textos a cambiar
- Aviso de retraso en "Mis diagnósticos": "...desde el detalle del engagement." pasa a "...desde el detalle del diagnóstico."; el botón "Ver engagement" pasa a "Ver diagnóstico".
- Ventana para solicitar un diagnóstico: "Al confirmar, tu engagement se activará al instante." pasa a "Al confirmar, tu diagnóstico se activará al instante."
- Ventana "Contactar asesor": "Tu mensaje queda registrado en el engagement." pasa a "Tu mensaje queda registrado en el diagnóstico."
- Durante la construcción reviso otra vez todas las pantallas del portal (también títulos, pestañas, avisos vacíos y notificaciones que se ven en el portal) y cambio cualquier otro texto visible con la palabra. Uso "Diagnóstico" con mayúscula inicial en títulos y botones, y "diagnóstico" en minúscula dentro de las frases.

## Detalles técnicos
- Archivos: `src/pages/portal/MisEngagements.tsx`, `src/components/portal/SolicitarDiagnosticoDialog.tsx`, `src/components/portal/ContactarAsesorDialog.tsx`, más los textos de notificaciones del portal en `src/components/notificaciones/` si aparecen.
- No se tocan los nombres de variables, hooks, componentes, rutas, consultas, nombres de tablas ni nada de `/dashboard`.
- Verificación: buscar en el portal textos visibles que aún digan "engagement" y revisar a 390 px.

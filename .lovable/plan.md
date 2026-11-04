# Cambiar "engagement" por "diagnóstico" en los botones que faltan

La mayoría de los textos del panel ya dicen "diagnóstico". Faltan dos botones que se saltaron en la pasada anterior:

- Tarjeta de lote en el panel: "Abrir engagement" pasa a "Abrir diagnóstico" (y "Abrir diagnóstico (cerrado)" si ya terminó).
- Panel lateral del lote: el mismo botón, con el mismo cambio.

Después reviso en pantalla el inicio del panel, el portafolio y la página de un diagnóstico, en escritorio y celular (390 px), para confirmar que no queda ningún "engagement" visible. Si aparece otro, lo cambio también.

## Detalles técnicos
- `src/components/dashboard/LoteCardUnificada.tsx` línea 218 y `src/components/dashboard/LoteDetalleDrawer.tsx` línea 61.
- La búsqueda anterior no detectó la palabra cuando va pegada a `{...}`; la revisión final lee el texto visible de las páginas con Playwright.
- No se cambian rutas, nombres internos ni datos.

# Mostrar el avance de los diagnósticos finalizados en la tarjeta del lote

## Por qué pasa
En la tarjeta, la etiqueta de estado y el avance leen fuentes distintas:
- La etiqueta "Finalizado" toma el diagnóstico más reciente, aunque esté cerrado.
- El "Avance" sale del resumen del portafolio, que solo cuenta diagnósticos abiertos. Si el diagnóstico está cerrado, ese resumen no trae avance y la tarjeta muestra "—".

Por ejemplo, Casa Santa María del Encuentro tiene un diagnóstico cerrado al 100 %, pero la tarjeta muestra "Finalizado" y "—" en el avance.

## Cambio
- El avance de la tarjeta se toma del mismo diagnóstico que usa la etiqueta de estado. Así, un lote con diagnóstico cerrado muestra su cifra real (por ejemplo, 100 %).
- Si el lote no tiene ningún diagnóstico, sigue mostrando "—".
- No cambian el portafolio, las alertas de plazo, los datos ni el diseño de la tarjeta.

Después reviso las tarjetas en computador y en celular (390 px).

## Detalles técnicos
- `useEngagementDelLote`: agregar `avance_pct` al select y devolverlo en el resultado.
- `LoteCardUnificada.tsx`: `avance = engagementLote?.avance_pct ?? lote.engagement_avance_pct`.
- `vw_portafolio_resumen` no se toca: su filtro de diagnósticos abiertos alimenta el Kanban y los indicadores de plazo.

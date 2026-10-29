# Score 360° completo para visitantes

## Problema confirmado
Sin sesión, las tarjetas de /mercado y la ficha /lotes/:id solo pueden leer 3 de los 8 puntajes (jurídico, normativo, servicios). Por eso el Score 360° sale más bajo o incompleto, y lotes publicados pero no marcados como públicos salen "Sin score".

## Qué cambia
- Visitantes y usuarios con sesión ven el mismo puntaje y el mismo "X de 8 módulos".
- No se abren lotes nuevos a nadie: solo se agregan los 5 puntajes que faltan a los lotes que cada persona ya puede ver.

## Detalles técnicos
- Migración: ampliar `listar_mercado_publico` (ya autorizada, mismas filas) para que devuelva los 8 campos `score_*` además de `score_360`. Sin cambios de tablas, permisos ni filas visibles.
- `obtener-scores-360.ts`: usar esa RPC como respaldo en lugar de `listar_catalogo_lotes`, cubriendo también lotes publicados no `es_publico`.
- Requiere cambiar una función de la base de datos (antes se pidió no cambiar la base); por eso necesita tu aprobación.
- Actualizar la regla en AGENTS.md y verificar Escobero sin sesión: 4.0/10 en tarjeta y ficha, a 390 px.

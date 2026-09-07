# Cerrar las puertas que aún dejan ver lotes reales sin cuenta

El catálogo de /lotes ya quedó cerrado (sin cuenta solo se ven los 3 lotes de ejemplo). Pero al revisar el resto del sitio encontré tres puertas abiertas por donde un visitante sin cuenta todavía alcanza lotes reales.

## Qué está pasando hoy

| Pantalla | Estado hoy |
|---|---|
| /lotes (catálogo) | Ya cerrado: solo ejemplos sin cuenta |
| /mercado | Abierto: cualquiera ve todos los lotes reales (zona, área, rango de precio, score) |
| /lotes/:id (detalle) | Abierto: sin cuenta se abre cualquier lote aprobado con ciudad, barrio, área y rango de precio |
| /lotes/:id/ficha | Ya cerrado |
| Inicio (barra de cifras) | Consulta una tabla que ya no existe; las cifras fallan en silencio |

Además, el sitio publicado (urbanix360.com) todavía corre la versión anterior: aunque ya se cerró el catálogo, hasta que no se publique de nuevo se seguirán viendo lotes reales allí.

## Reglas que quedarán

- Sin cuenta: solo lotes de ejemplo, en /lotes y en /mercado. Abrir un lote real lleva a una pantalla de bloqueo con invitación a registrarse o ver planes.
- Con cuenta sin plan pago: sus propios lotes (más los ejemplos). Nada del inventario ajeno.
- Con plan pago, acceso de cortesía o pago por vista: el lote o el catálogo al que tenga derecho.
- Propietario, asesor y admin: como hoy.

## Qué se hará

1. **Cerrar /mercado.** El listado deja de leer la vista pública y pasa a una función en el servidor con las mismas reglas del catálogo. Sin cuenta o sin plan se muestran solo los ejemplos y un bloque de invitación en lugar del resto; se quita el acceso anónimo directo a la vista.
2. **Cerrar el detalle del lote.** Abrir un lote real sin acceso devuelve solo nombre y ciudad y muestra la pantalla de bloqueo, en vez de barrio, área y rango de precio.
3. **Cifras de la portada.** Las cifras de la página de inicio pasan a calcularse en el servidor (solo totales, ningún dato de lote), para que dejen de fallar y no expongan inventario.
4. **Verificación.** Se comprueba en el navegador, sin sesión, que /lotes y /mercado muestren solo ejemplos, y que un lote real quede bloqueado tanto en el detalle como en la ficha y su PDF.
5. **Publicar.** Al terminar hay que publicar para que el sitio en vivo tome los cambios.

## Detalle técnico

- Nueva RPC `listar_mercado_publico()` (security definer, `search_path=public`) que replica el filtro por niveles de `listar_catalogo_lotes()` sobre las filas de `vw_mercado_publico`; `REVOKE SELECT ON public.vw_mercado_publico FROM anon` y grant `EXECUTE` a `anon, authenticated`.
- `obtener_lote_para_usuario`: al inicio, si `NOT public.tiene_acceso_ficha(auth.uid(), p_lote_id)` devolver `{ bloqueado: true, lote_id, ciudad, nombre_lote }` y salir; el resto del cuerpo queda igual.
- `obtener_ficha_publica_enriquecida`: añadir la misma verificación de acceso antes de devolver el bloque arquitectónico.
- Nueva RPC `obtener_stats_publicas()` que devuelve conteos agregados (lotes disponibles, ciudades, diagnósticos, con resolutoría); `src/pages/Index.tsx` deja de consultar `lotes_publicos`.
- Frontend: `src/hooks/useMercadoPublico.ts` (consumo de la nueva RPC), `src/pages/Mercado.tsx` (badge "Ejemplo" y bloque de invitación), `src/hooks/useLoteDetalle.ts` y `src/pages/LoteDetalle.tsx` (estado bloqueado), `src/hooks/useFichaEnriquecida.ts` (dejar de leer `vw_lotes_publicos` directamente y tolerar el bloqueo), `src/pages/Index.tsx`.

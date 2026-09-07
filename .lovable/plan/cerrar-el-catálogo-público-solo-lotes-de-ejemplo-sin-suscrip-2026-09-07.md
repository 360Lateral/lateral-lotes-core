# Cerrar el catálogo público: solo lotes de ejemplo sin suscripción

Hoy cualquier persona sin cuenta ve el catálogo real completo en /lotes (fotos, ubicación aproximada, precio por m² y scores) y puede abrir la ficha técnica y descargarla en PDF. Esto se cierra.

## Reglas de acceso que quedarán

| Quién | Catálogo /lotes | Ficha y PDF de un lote |
|---|---|---|
| Visitante sin sesión | Solo lotes marcados como "Ejemplo" | Solo los de ejemplo |
| Registrado sin plan | Sus propios lotes + los de ejemplo | Sus lotes y los de ejemplo |
| Con plan activo, cortesía o pago por vista | Catálogo completo | Los lotes a los que tiene acceso |
| Propietario / asesor / admin | Lo suyo y lo que ya administran | Igual que hoy |

Los lotes de ejemplo se ven claramente rotulados como demostración, y donde antes iba el resto del inventario aparece una invitación a registrarse o elegir plan (sin decir cuántos lotes reales hay).

## Qué se hará

1. **Marcar lotes de ejemplo.** Nueva marca "es de ejemplo" en los lotes, con interruptor para el admin en la edición del lote. Se crean 3 lotes demo con datos ficticios (Medellín, Envigado, Sabaneta) para que el visitante siempre vea algo.
2. **Catálogo filtrado en el servidor.** El listado deja de leer directamente la vista pública y pasa a pedir los lotes por una función que aplica las reglas de la tabla anterior. Así el filtro no se puede saltar desde el navegador.
3. **Ficha y PDF protegidos.** La ficha del lote y la descarga en PDF solo se arman si la persona tiene acceso a ese lote; si no, se muestra una pantalla de bloqueo con botones a registro / planes / pago por vista. El botón de descarga desaparece cuando no hay acceso.
4. **Detalle del lote.** Abrir un lote real sin acceso lleva a la pantalla de bloqueo en vez de mostrar datos.
5. **Verificación.** Se comprueba en el navegador, sin sesión, que /lotes muestre únicamente los ejemplos y que la ficha y el PDF de un lote real queden bloqueados.

## Detalle técnico

- Migración: `lotes.es_ejemplo boolean not null default false` + índice parcial; seed de 3 lotes demo (`es_publico=true, es_ejemplo=true, propietario_id null`).
- Nueva función `listar_catalogo_lotes()` (security definer, `search_path=public`) que devuelve las columnas de `vw_lotes_publicos` + `precio_m2` aplicando: anon → `es_ejemplo`; autenticado sin plan → `es_ejemplo OR owner_id/propietario_id = auth.uid()`; con `nivel_suscripcion <> 'gratuito'` o `is_admin_or_experto` → todos los `es_publico`. Se revoca `SELECT` de `anon` sobre `vw_lotes_publicos`.
- Políticas de `precios` y `fotos_lotes` para `anon`: se acotan a lotes con `es_ejemplo = true` (hoy alcanzan todo `es_publico`).
- `obtener_ficha_lote`: añade verificación de acceso — `es_ejemplo`, `has_lot_access(auth.uid(), id)`, acceso vigente en `accesos_lote`, o `nivel_suscripcion <> 'gratuito'` — y devuelve `{encontrada:true, acceso:false}` con solo nombre y ciudad cuando no hay acceso.
- Frontend: `src/pages/Lotes.tsx` (consumo del nuevo RPC, badge "Ejemplo", bloque de invitación), `src/pages/LoteFicha.tsx` (estado bloqueado, ocultar imprimir/descargar), `src/pages/LoteDetalle.tsx` (redirección a bloqueo), y el formulario de lote para el interruptor de ejemplo.

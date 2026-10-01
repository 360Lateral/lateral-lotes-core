# Lotes de ejemplo con análisis 360 completos (demo para desarrolladores)

## Situación actual
Los 6 lotes de ejemplo existen, pero no tienen ningún análisis cargado (jurídico, ambiental, arquitectónico, financiero, geotécnico, mercado, servicios públicos), ni normativa urbana, ni fotos. Por eso la ficha se ve casi vacía.

## Qué haré
1. **Llenar los 8 análisis de cada lote de ejemplo** con datos inventados pero coherentes con su ciudad, área y precio:
   - Normativa urbana (tratamiento, índices, alturas, usos)
   - Jurídico, Ambiental, Geotécnico, Servicios públicos, Arquitectónico (potencial constructivo, unidades), Mercado (precios m² de la zona, absorción) y Financiero (ventas, costos, utilidad, TIR, valor estimado).
   - Perfiles variados: 2 lotes "excelentes", 3 "buenos con observaciones", 1 con alertas (para mostrar los semáforos y avisos).
2. **Fotos de ejemplo**: generar 2-3 imágenes por lote (terreno/vista aérea) y asociarlas, para que la ficha y las tarjetas se vean completas.
3. **Ficha completa visible**: confirmar que al abrir un lote de ejemplo se muestran todas las secciones (scores 360, normativa, análisis, valoración, mapa) sin bloqueos, para visitante y desarrollador.
4. **Marca visible "Datos de ejemplo"** en la ficha de estos lotes, para que nadie confunda cifras inventadas con reales.
5. Verificar en escritorio y en celular (390px).

## Importante
Todas las cifras serán inventadas. Úsalas solo para la presentación; si quieres que algún lote refleje un caso real, me pasas los datos.

## Detalles técnicos
- Inserción por SQL en las tablas analisis_* y normativa_urbana (sin `updated_at` en normativa), estado "entregado"/aprobado según el esquema de cada tabla.
- Revisar si las fichas de ejemplo leen análisis vía RLS para anon; si no, ajustar `obtener_lote_para_usuario`/políticas solo para `es_ejemplo = true`.
- Fotos subidas al bucket `fotos-lotes` y registradas en `fotos_lotes`.

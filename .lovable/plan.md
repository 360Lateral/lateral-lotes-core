# Respaldo de los datos del backend

Objetivo: tener una copia segura de la información del proyecto, sin cambiar de backend ni tocar la aplicación.

## Opción recomendada (sin código, la haces tú)

En el panel **Cloud → Advanced settings → Export data**. Genera el volcado completo de la base de datos y es la vía oficial de respaldo. No requiere cambios en el proyecto.

## Opción complementaria (la ejecuto yo)

Exportar en archivos CSV las tablas de negocio críticas, para que tengas copias legibles en Excel:

- `lotes`, `normativa_urbana`, `fotos_lotes`
- `perfiles`, `user_roles`, `usuario_owner`
- `engagements_lote`, `entregables_engagement`, `documentos_subidos_engagement`
- `transacciones`, `suscripciones`, `suscripciones_desarrollador`, `comisiones_venta`
- `negociaciones`, `mensajes`, `solicitudes_contacto`, `leads`, `diagnosticos`
- Tablas de análisis 360 (`analisis_*`)

Los archivos quedan disponibles para descarga desde la carpeta de documentos del proyecto.

## Notas

- No se crean ni modifican tablas: es solo lectura y exportación.
- El código de la aplicación no cambia.
- Las fotos y documentos guardados en almacenamiento (`fotos-lotes`, `docs-cliente`) no se incluyen en un CSV; si los quieres respaldar, se copian aparte archivo por archivo.
- Conviene repetir el respaldo periódicamente, ya que es una foto del momento.

## Detalle técnico

Consultas `COPY (SELECT ...) TO STDOUT WITH CSV HEADER` por tabla, escritas en `/mnt/documents/backup-<fecha>/`. Sin migraciones ni escrituras en la base de datos.

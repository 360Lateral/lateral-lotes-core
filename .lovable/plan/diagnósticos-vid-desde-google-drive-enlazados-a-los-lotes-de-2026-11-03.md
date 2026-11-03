# Diagnósticos VID desde Google Drive, enlazados a los lotes de la plataforma

Los 17 diagnósticos de la carpeta de Drive se importan como resultados de los lotes de la Fundación Organización VID ya existentes en 360Lateral. Si un diagnóstico no coincide con ningún lote, queda en una bandeja "Por asignar" para revisarlo juntos.

## Activos a cruzar (código y nombre)
E1 Centro de Eventos VID · E2 Centro Logístico Metropolitano · E3 Clínica Cardio VID · E4 Casa Santa María del Encuentro · E5 TeleVID · E6 Locales Alberto Álvarez – La 33 · E7 Locales Alberto Álvarez – La Candelaria · E8 Centro Logístico Entrada Norte (CLEN) · E9 Parqueadero La Playa · A1 Lote Municipio de Apartadó · A2 Segundo Lote Municipio de Apartadó · A3 Clínica Odontológica – Casa La Palma · A4 Casa Barrio Estadio – Sede Laboratorio Dental · A5 Casa en Barrio Calasanz · CB8 Propiedad Fundación Margarita Moreno · CB9 Atardeceres VID · CB10 Parqueadero Casa Sede

- Primer paso: revisar que estos 17 activos existan en la plataforma a nombre de VID y entregarte un reporte con los que coinciden, los que faltan y los nombres que difieren. No se crean lotes sin tu visto bueno.
- Cada diagnóstico se asigna a un activo por su código (E1…CB10) o su nombre. Si queda en duda, va a "Por asignar".

## Pantallas
1. **Importación** (admin y equipo): botón "Sincronizar con Drive", fecha de última sincronización, lista de archivos con su estado (importado, requiere revisión, por asignar, error) y selector para asignar a mano el lote correspondiente.
2. **Portafolio VID**: tarjetas en celular y tabla en escritorio, con búsqueda y filtros por ciudad, tipo de inmueble, nivel de criticidad y fecha del diagnóstico.
3. **Ficha del diagnóstico** (dentro del lote): datos clave, resumen ejecutivo, hallazgos con nivel alto/medio/bajo, plan de acción en pasos priorizados y enlace al documento original en Drive. Si falta un dato, se muestra "No disponible".

## Roles
- **Administrador**: todo.
- **Equipo** (expertos): ver, sincronizar, asignar lotes y corregir los datos extraídos.
- **Cliente VID**: solo lectura de los 17 diagnósticos de sus lotes, nunca de los de otros clientes.
- Todo requiere iniciar sesión.

## Etapas
1. Conexión de solo lectura a Drive y listado de la carpeta.
2. Lectura de PDF, Word, Excel y Google Docs, más extracción con IA, probada primero con 2–3 archivos.
3. Resumen, hallazgos y plan de acción.
4. Cruce con los lotes VID, bandeja "Por asignar", portafolio y ficha.
5. Permisos por rol, protección de datos de propietarios y lista de pruebas.

## Protección de datos
- Antes de guardar nada, la IA descarta nombres, cédulas, teléfonos, correos y direcciones personales de propietarios. Luego un filtro automático vuelve a revisar el resultado y, si detecta algo así, marca el diagnóstico "requiere revisión" y lo oculta.
- Nunca se borra, mueve ni modifica nada en Drive.

## Detalles técnicos
- Conector de Google Drive (cuenta del administrador) con lectura limitada al ID de carpeta `17G1Limc60i96VSyMvXerXbamsJQjOyuE`. Los Google Docs se exportan a texto y los PDF, Word y Excel se descargan y se convierten a texto en una función del servidor.
- Extracción con Lovable AI (`openai/gpt-6-astra`, salida JSON con esquema estricto).
- Nueva tabla `diagnosticos_drive`: `drive_file_id` único para evitar duplicados al reimportar, `modified_time`, `lote_id` (puede quedar vacío), `estado`, `datos` (jsonb), `resumen`, `hallazgos` (jsonb con criticidad), `plan_accion` (jsonb), `requiere_revision`, `motivo_revision`, `drive_url`. Tabla `sync_drive_log` para el historial de sincronizaciones.
- RLS: admin/super_admin todo; experto lectura y edición; cliente VID lectura vía `usuario_owner` / `has_lot_access` del lote asignado. Los diagnósticos sin lote solo los ven admin y equipo.
- El cruce con lotes se hace por dirección, matrícula, CBML o nombre, sugerido por la IA y confirmado en la bandeja.
- Se reutilizan el inicio de sesión, el diseño y los roles actuales. Todo se verifica a 390 px.

## Necesito de ti
- Conectar Google Drive cuando aparezca la tarjeta de conexión (cuenta con acceso a la carpeta).
- Confirmar qué usuario o cuenta corresponde al cliente VID en la plataforma.

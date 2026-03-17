

## Plan: Plantilla Excel para actualizar datos básicos de lotes

### Contexto
El importador actual (`DashboardLotesImportar.tsx`) solo **crea** lotes nuevos. El usuario necesita un flujo de ida y vuelta: descargar una plantilla con los lotes existentes, editar datos, y reimportarla para **actualizar** los lotes.

### Cambios

#### 1. Nuevo componente: `src/components/PlantillaLotesExporter.tsx`
- Botón "Descargar plantilla" que genera un Excel en memoria con SheetJS
- Consulta todos los lotes existentes desde Supabase
- Genera un archivo con dos hojas:
  - **"Instrucciones"**: Explica cómo llenar y reimportar
  - **"Lotes"**: Tabla con columnas: `Nombre del lote`, `Dirección`, `Ciudad / Municipio`, `Departamento`, `Matrícula`, `Área m²`, `Estrato`, `Tipo de lote`, `Barrio`, `Latitud`, `Longitud`, `Link Google Maps`, `Nombre propietario`, `Notas`
  - Pre-llena las filas con los datos actuales de cada lote para que el usuario edite lo que necesite
- Nombre del archivo: `Plantilla_Lotes_360_YYYY-MM-DD.xlsx`

#### 2. Modificar `src/pages/DashboardLotesImportar.tsx`
- Agregar el botón "Descargar plantilla" junto al área de carga (arriba de la zona de drag & drop)
- Modificar la lógica de importación para que detecte si un lote ya existe (por `nombre_lote` exacto) y haga `UPDATE` en lugar de `INSERT`
- Agregar las columnas faltantes al mapeo de headers: `Departamento`, `Estrato`, `Tipo de lote`, `Nombre propietario`, `Notas`
- Mostrar en la previsualización cuáles filas son nuevas y cuáles son actualizaciones (badge "Nuevo" vs "Actualizar")
- En el resumen final, indicar cuántos se crearon vs cuántos se actualizaron

### Flujo del usuario
1. Va a Dashboard → Lotes → Importar
2. Descarga la plantilla (ya viene con los lotes actuales)
3. Edita o agrega filas en Excel
4. Sube el archivo de vuelta
5. El sistema detecta lotes existentes (por nombre) y actualiza; los nuevos se crean

### Sin cambios en base de datos
No se necesitan migraciones. Se usa la tabla `lotes` existente.


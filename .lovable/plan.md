

## Plan: Eliminar secciones duplicadas del formulario de lotes

### Resumen
Eliminar las secciones **Normativa urbana**, **Servicios públicos** y **Score de viabilidad** del formulario `LoteFormPage.tsx`, ya que esta información se gestiona desde el Análisis 360°.

### Cambios en `src/components/LoteFormPage.tsx`

**1. Eliminar campos del interface `LoteForm` (lines 50-70)**
Remover los 16 campos de normativa, scores y sus referencias:
- `uso_principal`, `usos_compatibles`, `indice_construccion`, `indice_ocupacion`, `altura_max_pisos`, `altura_max_metros`, `aislamiento_frontal_m`, `aislamiento_posterior_m`, `aislamiento_lateral_m`, `zona_pot`, `tratamiento`, `norma_vigente`, `cesion_tipo_a_pct`
- `score_juridico`, `score_normativo`, `score_servicios`

**2. Eliminar campos del `emptyForm` (lines 88-106)**
Remover las mismas 16 propiedades de la inicialización.

**3. Eliminar el state de servicios y constantes**
- Remover `SERVICIOS_DEFAULT` (lines 28-34)
- Remover `ServicioRow` interface (lines 109-113)
- Remover `const [servicios, setServicios]` (line 123)
- Remover `updateServicio` helper (lines 307-308)

**4. Eliminar queries innecesarias**
- Remover query `existingNormativa` (lines 140-147) — **pero mantener la referencia en `estadoAnalisis`** cambiándola a query directa
- Remover query `existingServicios` (lines 149-156)

**5. Eliminar useEffects de carga**
- Remover useEffect de normativa (lines 234-252)
- Remover useEffect de servicios (lines 254-261)
- Remover campos de normativa y scores del useEffect de existingLote (lines 211-213)

**6. Eliminar del `saveMutation`**
- Remover bloque de normativa payload y upsert (lines 358-379)
- Remover bloque de servicios delete/insert (lines 381-391)
- Remover `score_juridico`, `score_normativo`, `score_servicios` del `lotePayload` (lines 327-329)

**7. Eliminar secciones de UI**
- Remover Card "Normativa urbana" (lines 562-619)
- Remover Card "Servicios públicos" (lines 621-660)
- Remover Card "Score de viabilidad" (lines 682-723)

**8. Limpiar imports no usados**
Remover iconos y componentes que ya no se usen tras la eliminación.

### Lo que NO se toca
- Card de "Información básica"
- Card de "Foto del lote"
- Card de "Ubicación"
- Card de "Dimensiones"
- Card de "Precio del propietario"
- Card de "Análisis 360° — Estado por área"
- Botones de acción
- Notas


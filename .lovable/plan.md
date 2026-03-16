

## Estimación Automática de Valor — Plan

### Contexto
No existe una página `/diagnostico`. Hay que crearla desde cero y registrar la ruta.

### Implementación

**1. Crear `src/pages/Diagnostico.tsx`**

Página pública con Navbar + Footer. Contiene un formulario con:
- Municipio (input texto)
- Área en m² (input numérico)
- Tipo de lote (Select: Urbano / Rural / Expansión urbana)
- Botón naranja "Ver estimación de valor"

Al hacer clic, consulta la base de datos:
- Query `lotes` filtrados por `ciudad` (case-insensitive match con el municipio ingresado)
- Join con `precios` para obtener `precio_m2_cop`
- Join con `normativa_urbana` para filtrar por `uso_principal` mapeado al tipo de lote seleccionado

Mapeo tipo → uso_principal:
- Urbano → Residencial, Comercial, Industrial (o cualquier uso urbano)
- Rural → Rural
- Expansión urbana → Expansión

Calcula min, promedio y max de `precio_m2_cop`. Muestra tarjeta de estimación con:
- Fondo `#1a2744`, texto blanco, valores en `#E8951A`
- Rango por m², estimación total (área × promedio, área × min, área × max)
- Precios en formato COP sin decimales
- Nota gris al pie
- Estado vacío si no hay referencias

**2. Modificar `src/App.tsx`**
- Agregar ruta pública `/diagnostico` → `<Diagnostico />`

**3. Agregar link en Navbar**
- Agregar "Diagnóstico" a `navLinks` array

### Archivos
| Archivo | Acción |
|---|---|
| `src/pages/Diagnostico.tsx` | Crear |
| `src/App.tsx` | Agregar ruta |
| `src/components/Navbar.tsx` | Agregar link |

No se requieren cambios de base de datos. Las tablas `lotes`, `precios` y `normativa_urbana` ya tienen SELECT público.


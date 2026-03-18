

## Plan: HeroImage con fotos reales de ciudades colombianas

### 1. Crear `src/components/ui/HeroImage.tsx`

Componente reutilizable con props: `imageUrl`, `height` (default "500px"), `overlay` ("dark" | "orange" | "split"), `children`.

- Contenedor `relative overflow-hidden` con la altura indicada (reducida al 65% en mobile via media query)
- `<img>` con `object-fit: cover`, animacion Ken Burns (scale 1→1.08, 15s, ease-in-out, infinite alternate)
- Capa overlay `absolute inset-0` con background segun tipo:
  - `dark`: `rgba(10,18,32,0.75)`
  - `orange`: gradiente lineal de `rgba(10,18,32,0.85)` a `rgba(232,149,26,0.15)`
  - `split`: gradiente lineal de `rgba(10,18,32,0.90)` 0-55% a `rgba(10,18,32,0.3)` 55-100%
- Children con `relative z-[2]`
- En mobile: overlay "split" se comporta como "dark"
- `prefers-reduced-motion`: desactiva Ken Burns

Ken Burns keyframes se definen inline o en tailwind.config.ts.

### 2. Integrar en paginas

| Pagina | Overlay | Height | Notas |
|---|---|---|---|
| `Index.tsx` (hero no-logueado) | split | 520px | Envolver seccion existente en HeroImage |
| `Bienvenida.tsx` | dark | 100vh | Reemplazar `style={{ backgroundColor }}` del contenedor raiz |
| `Resolutoria.tsx` | orange | 480px | Reemplazar `<section className="bg-secondary py-20">` |
| `Diagnostico.tsx` | dark | 220px | Agregar header con titulo/subtitulo antes del formulario |
| `Planes.tsx` | split | 200px | Agregar header antes de la tabla |

### 3. Imagenes Unsplash (URLs fijas)

Definidas como constantes en cada pagina o importadas desde un archivo de constantes.

### Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `src/components/ui/HeroImage.tsx` | Crear componente |
| `tailwind.config.ts` | Agregar keyframe `ken-burns` |
| `src/pages/Index.tsx` | Envolver hero no-logueado en HeroImage |
| `src/pages/Bienvenida.tsx` | Usar HeroImage como fondo fullscreen |
| `src/pages/Resolutoria.tsx` | Reemplazar hero section |
| `src/pages/Diagnostico.tsx` | Agregar hero header antes del form |
| `src/pages/Planes.tsx` | Agregar hero header |


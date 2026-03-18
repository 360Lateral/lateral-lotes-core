

## Plan: Corregir parpadeo y pérdida de foco en LoteWizard

### Problema raíz

En `LoteWizard.tsx`, los componentes `Step1`, `Step2`, `Step3`, `Step4` y `ProgressBar` están definidos como **funciones arrow dentro del cuerpo del componente** (lineas ~384, ~450, ~556, ~640+, ~800+). Cada vez que el usuario escribe una letra, `setForm` re-renderiza el componente padre, lo que **recrea estas funciones como nuevas referencias de componente**. React interpreta esto como un componente distinto y **desmonta y remonta todo el paso**, causando:

- Parpadeo visible (el DOM se destruye y reconstruye)
- Pérdida del foco del input (el input anterior desaparece)
- Imposibilidad de escribir fluidamente

### Solución

Convertir `Step1`–`Step4` y `ProgressBar` de funciones-componente inline a **JSX directo** dentro del return del componente. En lugar de:

```tsx
const Step1 = () => (<Card>...</Card>);
// ...
{step === 1 && <Step1 />}
```

Cambiar a:

```tsx
{step === 1 && (
  <Card>...</Card>
)}
```

Esto elimina la creación de nuevos componentes en cada render y permite que React preserve el DOM y el foco de los inputs entre re-renders.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/LoteWizard.tsx` | Reemplazar `Step1`–`Step4` y `ProgressBar` de funciones inline a JSX directo en el return |

### Impacto

- Elimina el parpadeo al escribir
- Preserva el foco del cursor en los inputs
- Sin cambios funcionales ni visuales


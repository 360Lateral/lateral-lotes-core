

## Fix: "Nombre propietario" overwrites "Nombre lote" during import

### Root Cause
In the `ALIASES` array (line 34), the regex for `nombre_lote` is:
```
/^nombre.*(lote)?|^lote$/i
```
The `(lote)?` makes "lote" optional, so it matches **any** header starting with "nombre" — including "Nombre propietario". Since it appears before the propietario regex (line 45), it wins, mapping the propietario column to `nombre_lote`.

### Fix
Change line 34 to require "lote" in the match and add a more specific propietario regex:

```typescript
[/^nombre.*lote|^lote$/i, "nombre_lote"],
```

Remove the `?` from `(lote)?` so "lote" is **required** when the header starts with "nombre". This way "Nombre del lote" matches `nombre_lote`, and "Nombre propietario" falls through to the propietario regex on line 45.

### Single line change
- File: `src/pages/DashboardLotesImportar.tsx`, line 34


## Problema

La migración de seguridad anterior reescribió la policy SELECT de `public.lotes` para inlinear un `EXISTS … FROM engagements_lote` (con el filtro de `estado_activacion`). Pero `engagements_lote` tiene la policy `Dueño del lote ve sus engagements` que evalúa `EXISTS … FROM lotes WHERE l.owner_id = auth.uid()`. 

Resultado: al consultar `lotes`, Postgres evalúa la policy de lotes → consulta engagements_lote → evalúa policy de engagements_lote → consulta lotes → bucle. Postgres aborta con:

```
42P17: infinite recursion detected in policy for relation "lotes"
```

Todas las queries a `/rest/v1/lotes` están devolviendo HTTP 500 (visto en la red del preview con el JWT de Jorge). Afecta a todos los usuarios autenticados, no solo super_admin — el síntoma de "no aparecen los lotes" es consecuencia directa.

## Fix (una sola migración SQL)

Romper el ciclo moviendo la verificación de engagement a una función `SECURITY DEFINER` que no dispara RLS al leer `engagements_lote`. La función mantiene la misma semántica del fix de seguridad (excluye `borrador` y `pendiente_pago`).

```sql
-- 1. Nueva función SECURITY DEFINER que evita la recursión
CREATE OR REPLACE FUNCTION public.user_has_active_engagement_on_lote(
  _user_id uuid,
  _lote_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.engagements_lote e
    WHERE e.lote_id = _lote_id
      AND (
        e.cliente_id = _user_id
        OR e.asesor_asignado_id = _user_id
        OR e.gerente_id = _user_id
      )
      AND e.estado_activacion NOT IN ('borrador', 'pendiente_pago')
  );
$$;

-- 2. Reemplazar la policy de lotes para usar la función (sin EXISTS recursivo)
DROP POLICY IF EXISTS "Auth ven lotes propios y autorizados" ON public.lotes;

CREATE POLICY "Auth ven lotes propios y autorizados"
ON public.lotes
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR propietario_id = auth.uid()
  OR is_admin_or_experto(auth.uid())
  OR user_shares_owner_org(auth.uid(), owner_id)
  OR user_has_active_engagement_on_lote(auth.uid(), id)
  OR user_has_nda_on_lote(auth.uid(), id)
);
```

## Verificación

- Tras la migración, recargar `/dashboard/lotes` con el usuario super_admin (Jorge) — debe listar los 27 lotes.
- Probar con un cliente que tenga engagement en estado `activo` → ve el lote.
- Probar con un engagement en estado `borrador` → NO ve el lote (mantenemos el endurecimiento de seguridad anterior).
- No se toca `engagements_lote`, ni `tareas_analisis`, ni el bucket `documentos-comisionistas` (los otros tres fixes del scan siguen válidos).

# UI rules
- Portal mobile navigation reuses the desktop link list and existing account actions within the shared layout Sheet; keep desktop markup styling and profile availability unchanged to avoid navigation drift.
- Market filters whitelist supported fields before persistence, query keys and filtering, so retired filters cannot affect restored searches; responsive panel styling stays local to the filter components.
- Landing trust-strip counts reuse `useStatsMercado` unchanged, with viewport and reduced-motion handling local to the strip, so market calculations stay identical without changing other animations.
- Market card photo enrichment keeps the catalog RPC as the authorization gate, reads `foto_url` from `vw_lotes_publicos` for only returned IDs, and falls back to the existing access-checked ficha RPC; use signed storage URLs without broadening permissions.
- Mobile plan summaries derive counts and new-feature highlights from the same inclusion arrays as the comparison table; keep desktop rendering unchanged so both views stay consistent.
- Market cards and lot detail use `calcularScore360` on the eight stored module scores and render `Score360Badge`; stored scores always win over derived estimates (the ficha may only fill gaps). Read `vw_lotes_publicos` first and fall back to `listar_mercado_publico`, which returns all eight scores for the rows the user is already authorized to see, so visitors and members get the same score.
- Reuse `FloatingActionStack` for compact mobile actions on `/mercado`, `/lotes/:id` (including `/ficha`), and public pages in `PUBLIC_MOBILE_ACTION_PATHS`, regardless of session; the shared Footer and public fallback use that same route list for bottom clearance, while footerless public pages reserve clearance in their wrapper. Preserve desktop, print output, dashboards, and private/account user screens to avoid unrelated UI changes.
- Keep mobile lot-detail zoom controls in `MapaHeroLote` and reuse the centralized map loader; this allows accessible touch targets without changing desktop map controls.
- Diagnosis status labels on lot cards (admin and portal) come from `estadoDiagnostico` in `src/lib/estado-diagnostico.ts`; the portal diagnosis view admits admin/experto read-only via `PortalProtectedRoute permitirEquipo` and the RPC staff check, so staff can open what the client sees.

# Database rules
- `permisos_usuario` uses `has_role` RLS for administrator writes and owner-only reads for other authenticated users; keep table grants aligned with these policies to prevent permission self-escalation.
- User action permissions use `tiene_permiso` through restrictive RLS and guarded RPCs/triggers, plus payment-function validation; UI gates use the same RPC and never replace server authorization.
- Admin permission edits use an atomic role-checked RPC; a database trigger stamps the authenticated actor and appends effective changes to an admin-readable audit history to prevent client-forged attribution.

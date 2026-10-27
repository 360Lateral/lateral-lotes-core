# UI rules
- Keep the compact mobile action menu scoped to `/mercado` and `/lotes/:id` in `FloatingActionStack`; preserve the existing actions on other routes and desktop to avoid unrelated UI changes.
- Keep mobile lot-detail zoom controls in `MapaHeroLote` and reuse the centralized map loader; this allows accessible touch targets without changing desktop map controls.
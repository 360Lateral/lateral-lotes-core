create or replace function public.es_lote_ejemplo(_lote_id uuid) returns boolean language sql stable security definer set search_path = public as $$ select coalesce((select es_ejemplo from public.lotes where id = _lote_id), false) $$;
grant execute on function public.es_lote_ejemplo(uuid) to anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['analisis_juridico','analisis_ambiental','analisis_arquitectonico','analisis_financiero','analisis_geotecnico','analisis_mercado','analisis_sspp','normativa_urbana'] loop
    execute format('drop policy if exists "Lotes de ejemplo visibles a todos" on public.%I', t);
    execute format('create policy "Lotes de ejemplo visibles a todos" on public.%I for select to anon, authenticated using (public.es_lote_ejemplo(lote_id))', t);
  end loop;
end $$;
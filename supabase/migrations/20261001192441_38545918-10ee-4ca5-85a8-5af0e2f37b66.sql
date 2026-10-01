do $$
declare t text;
begin
  foreach t in array array['analisis_juridico','analisis_ambiental','analisis_arquitectonico','analisis_financiero','analisis_geotecnico','analisis_mercado','analisis_sspp','normativa_urbana'] loop
    execute format('grant select on public.%I to anon', t);
    execute format('drop policy if exists "Lotes de ejemplo visibles a todos" on public.%I', t);
    execute format('create policy "Lotes de ejemplo visibles a todos" on public.%I for select to anon, authenticated using (exists (select 1 from public.lotes l where l.id = lote_id and l.es_ejemplo))', t);
  end loop;
end $$;
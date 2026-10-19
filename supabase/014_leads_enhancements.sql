-- BillTech — ajustes ao Pipeline: canais de origem revistos (sai LinkedIn, entram Telefone e
-- Instagram) e associação opcional de um lead a uma conta de cliente já existente no portal (a
-- mesma empresa pode ter chegado como lead e, à parte, criado conta — ou o inverso). Idempotente.

-- Remapeia leads antigos em 'linkedin' antes de apertar o constraint (sem linhas hoje, mas não custa).
update public.leads set channel = 'instagram' where channel = 'linkedin';

alter table public.leads drop constraint if exists leads_channel_check;
alter table public.leads add constraint leads_channel_check check (channel in ('organico', 'indicacao', 'whatsapp', 'telefone', 'instagram'));

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'client_id') then
    alter table public.leads add column client_id uuid references public.profiles (id) on delete set null;
  end if;
end $$;
create index if not exists leads_client_idx on public.leads (client_id);

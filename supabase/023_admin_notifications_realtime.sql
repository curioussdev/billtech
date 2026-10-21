-- BillTech — ativa o Realtime nas tabelas que alimentam o centro de notificações do admin
-- (pedidos de alteração de perfil, reuniões, leads/negócios), para o sino atualizar sozinho.
-- Mesmo padrão de 011_realtime.sql / 022_invoices_realtime.sql. Idempotente.

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profile_change_requests') then
    alter publication supabase_realtime add table public.profile_change_requests;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'meetings') then
    alter publication supabase_realtime add table public.meetings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leads') then
    alter publication supabase_realtime add table public.leads;
  end if;
end $$;

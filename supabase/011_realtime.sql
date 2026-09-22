-- BillTech — ativa o Realtime (Postgres Changes) nas tabelas que alimentam a conversa em direto do
-- portal e os contadores "por ler". A RLS de cada tabela decide o que cada subscritor recebe: o
-- cliente só vê as suas próprias linhas (e nunca notas internas), o admin vê tudo. Idempotente.

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'request_messages') then
    alter publication supabase_realtime add table public.request_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'request_attachments') then
    alter publication supabase_realtime add table public.request_attachments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'requests') then
    alter publication supabase_realtime add table public.requests;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'broadcast_recipients') then
    alter publication supabase_realtime add table public.broadcast_recipients;
  end if;
end $$;

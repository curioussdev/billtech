-- BillTech — ativa o Realtime (Postgres Changes) na tabela de faturas, para o estado de pagamento
-- (e o progresso de parcelas) atualizar sozinho do lado do cliente, sem recarregar a página — mesmo
-- padrão de 011_realtime.sql. Idempotente.

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'invoices') then
    alter publication supabase_realtime add table public.invoices;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'installments') then
    alter publication supabase_realtime add table public.installments;
  end if;
end $$;

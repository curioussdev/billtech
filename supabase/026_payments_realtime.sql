-- BillTech — ativa o Realtime na tabela `payments`: faltava desde 022_invoices_realtime.sql (que só
-- cobriu invoices/installments). Sem isto, registar um pagamento manual (externo, sem Stripe) não
-- atualiza ao vivo nem o painel do admin (noutra sessão) nem a página de pagamentos do cliente —
-- só após um refresh manual ou uma navegação que revalide a página. Idempotente.

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payments') then
    alter publication supabase_realtime add table public.payments;
  end if;
end $$;

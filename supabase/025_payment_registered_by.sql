-- BillTech — rastreabilidade de pagamentos registados manualmente (fora da plataforma, sem Stripe
-- ativo): qual admin registou cada pagamento. Nulo para pagamentos feitos pelo próprio cliente
-- (Stripe, quando ativo). Executar depois de 009_finance.sql. Idempotente.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'registered_by') then
    alter table public.payments add column registered_by uuid references public.profiles (id) on delete set null;
  end if;
end $$;

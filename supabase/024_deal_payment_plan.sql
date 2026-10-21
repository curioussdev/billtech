-- BillTech — forma de pagamento (opcional) ao fechar um negócio como Ganho: até quantas prestações
-- de quanto foi acordado, e a fatura que isso gera no módulo financeiro. Executar depois de
-- 014_leads_enhancements.sql e 009_finance.sql. Idempotente.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'payment_type') then
    alter table public.leads add column payment_type text check (payment_type is null or payment_type in ('unico', 'parcelado'));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'payment_installments') then
    alter table public.leads add column payment_installments int check (payment_installments is null or payment_installments between 2 and 12);
  end if;
  -- Preenchida quando a fatura já pôde ser criada (o negócio já tinha, ou passou a ter, uma conta de
  -- cliente associada) — nula enquanto o pagamento acordado ainda não gerou fatura nenhuma.
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'invoice_id') then
    alter table public.leads add column invoice_id uuid references public.invoices (id) on delete set null;
  end if;
end $$;

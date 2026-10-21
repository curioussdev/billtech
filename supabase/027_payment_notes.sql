-- BillTech — referência/nota opcional em cada pagamento registado manualmente (ex.: nº de
-- transferência, referência Multibanco). Executar depois de 009_finance.sql. Idempotente.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'notes') then
    alter table public.payments add column notes text not null default '';
  end if;
end $$;

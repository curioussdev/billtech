-- BillTech — débito automático recorrente (cartão guardado ou SEPA Direct Debit por IBAN), opcional,
-- em cima das faturas/parcelas já existentes. Reaproveita installments.due_date/status como único
-- calendário (nenhuma tabela de agenda paralela) e installments.stripe_payment_intent_id (já existia,
-- por preencher). Sem cobrança nenhuma incluída aqui — só o esquema. Idempotente.
-- Executar depois de 009_finance.sql.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'stripe_customer_id') then
    alter table public.profiles add column stripe_customer_id text;
  end if;
end $$;
create unique index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id) where stripe_customer_id is not null;

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoices' and column_name = 'autopay_enabled') then
    alter table public.invoices add column autopay_enabled boolean not null default false;
  end if;
end $$;

-- Mandato do cliente para a Stripe cobrar sem ele estar presente — cartão guardado ou débito direto
-- SEPA. A Stripe trata do texto/aceitação do mandato (mode:'setup' no Checkout); esta tabela só
-- guarda a referência para o cobrarmos depois e para o poder revogar a sério (paymentMethods.detach).
create table if not exists public.autopay_mandates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  stripe_payment_method_id text not null,
  payment_method_type text not null check (payment_method_type in ('card', 'sepa_debit')),
  stripe_setup_intent_id text,
  status text not null default 'ativo' check (status in ('ativo', 'revogado')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
-- Só um mandato ativo por cliente de cada vez: ativar um novo implica revogar o anterior primeiro.
create unique index if not exists autopay_mandates_one_active_per_client on public.autopay_mandates (client_id) where status = 'ativo';
create index if not exists autopay_mandates_client_idx on public.autopay_mandates (client_id, created_at desc);

alter table public.autopay_mandates enable row level security;
drop policy if exists "autopay_mandates_select" on public.autopay_mandates;
drop policy if exists "autopay_mandates_admin" on public.autopay_mandates;
create policy "autopay_mandates_select" on public.autopay_mandates for select using (client_id = auth.uid() or public.is_admin());
create policy "autopay_mandates_admin" on public.autopay_mandates for all using (public.is_admin()) with check (public.is_admin());

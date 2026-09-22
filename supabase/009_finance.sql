-- BillTech — módulo financeiro: faturas, parcelamentos, pagamentos, códigos de desconto e
-- fidelização de clientes. Preparado para Stripe (guarda os IDs de payment_intent/checkout session),
-- mas sem nenhuma chamada à Stripe ainda — só a estrutura. Executar depois de 008_portal_upgrades.sql.
-- Idempotente.
--
-- Nota de arquitetura: a 008 tinha acabado de acrescentar payment_status/invoice_value/invoice_url a
-- client_projects — superado por este módulo dedicado, porque uma fatura não é 1:1 com um projeto
-- (um projeto pode ter várias faturas, parceladas ou não). Remove-se aqui em vez de reescrever a 008,
-- para manter o histórico de migrações tal como foi corrido.
alter table public.client_projects
  drop column if exists payment_status,
  drop column if exists invoice_value,
  drop column if exists invoice_url;

-- Sem tabela `Client` própria: o pedido original tinha uma (userId, companyName…), mas isso já existe
-- em `profiles` (id, company). Uma segunda tabela de identidade só duplicava dados e criava dessincronia.
-- A fidelização fica isolada em `client_loyalty`, 1 linha por perfil — separa dados financeiros dos de
-- autenticação, mais fácil de auditar.
create table if not exists public.client_loyalty (
  client_id uuid primary key references public.profiles (id) on delete cascade,
  loyalty_points int not null default 0 check (loyalty_points >= 0),
  loyalty_tier text not null default 'bronze' check (loyalty_tier in ('bronze', 'silver', 'gold', 'platinum')),
  total_spent numeric not null default 0 check (total_spent >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  percentage numeric check (percentage is null or (percentage > 0 and percentage <= 100)),
  fixed_amount numeric check (fixed_amount is null or fixed_amount > 0),
  is_active boolean not null default true,
  usage_limit int check (usage_limit is null or usage_limit > 0),
  used_count int not null default 0,
  created_at timestamptz not null default now(),
  -- ou percentagem ou valor fixo — nunca os dois, nunca nenhum
  constraint discount_codes_one_kind check ((percentage is not null) <> (fixed_amount is not null))
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.client_projects (id) on delete set null,
  description text not null,
  total_amount numeric not null check (total_amount >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  discount_code_id uuid references public.discount_codes (id) on delete set null,
  -- Coluna gerada: nunca diverge do total menos o desconto, não há de "esquecer" de recalcular.
  final_amount numeric generated always as (greatest(total_amount - discount_amount, 0)) stored,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  due_date date not null,
  payment_type text not null default 'unico' check (payment_type in ('unico', 'parcelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_client_idx on public.invoices (client_id, due_date desc);
create index if not exists invoices_status_idx on public.invoices (status, due_date);

create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  installment_number int not null check (installment_number > 0),
  amount numeric not null check (amount >= 0),
  due_date date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado')),
  -- Preenchido quando ligarmos a Stripe a sério (um Payment Intent por parcela)
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  unique (invoice_id, installment_number)
);
create index if not exists installments_invoice_idx on public.installments (invoice_id, installment_number);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  -- Nulo quando o pagamento salda a fatura toda (não uma parcela específica)
  installment_id uuid references public.installments (id) on delete set null,
  amount numeric not null check (amount >= 0),
  status text not null default 'pendente' check (status in ('pendente', 'sucesso', 'falhou', 'reembolsado')),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  payment_method text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists payments_invoice_idx on public.payments (invoice_id, created_at desc);

alter table public.client_loyalty enable row level security;
alter table public.discount_codes enable row level security;
alter table public.invoices enable row level security;
alter table public.installments enable row level security;
alter table public.payments enable row level security;

-- Leitura protegida por RLS; escritas SEMPRE por Server Action com service role (o mesmo padrão já
-- usado em client_projects/requests) — mesmo os pagamentos "feitos pelo cliente" passam por uma
-- Server Action que verifica a sessão primeiro, nunca por um insert direto vindo do browser.
drop policy if exists "client_loyalty_select" on public.client_loyalty;
drop policy if exists "client_loyalty_admin" on public.client_loyalty;
create policy "client_loyalty_select" on public.client_loyalty for select using (client_id = auth.uid() or public.is_admin());
create policy "client_loyalty_admin" on public.client_loyalty for all using (public.is_admin()) with check (public.is_admin());

-- Códigos de desconto nunca são listáveis pelo cliente: aplicam-se por Server Action (que valida o
-- código escrito e grava com service role), nunca por leitura direta da tabela.
drop policy if exists "discount_codes_admin" on public.discount_codes;
create policy "discount_codes_admin" on public.discount_codes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "invoices_select" on public.invoices;
drop policy if exists "invoices_admin" on public.invoices;
create policy "invoices_select" on public.invoices for select using (client_id = auth.uid() or public.is_admin());
create policy "invoices_admin" on public.invoices for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "installments_select" on public.installments;
drop policy if exists "installments_admin" on public.installments;
create policy "installments_select" on public.installments for select using (
  public.is_admin() or exists (select 1 from public.invoices i where i.id = invoice_id and i.client_id = auth.uid())
);
create policy "installments_admin" on public.installments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payments_select" on public.payments;
drop policy if exists "payments_admin" on public.payments;
create policy "payments_select" on public.payments for select using (
  public.is_admin() or exists (select 1 from public.invoices i where i.id = invoice_id and i.client_id = auth.uid())
);
create policy "payments_admin" on public.payments for all using (public.is_admin()) with check (public.is_admin());

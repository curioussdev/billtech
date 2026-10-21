-- BillTech — contrato de prestação de serviços gerado pela plataforma e enviado ao cliente para
-- assinatura (externa, por agora). Um projeto tem no máximo um contrato "atual"; o PDF assinado
-- continua a viver à parte em project_documents (kind='contrato'), inalterado. Executar depois de
-- 002_portal.sql. Idempotente.

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.client_projects (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  project_name text not null,
  scope text not null,
  total_amount numeric not null check (total_amount >= 0),
  payment_type text not null check (payment_type in ('unico', 'parcelado')),
  installments int check (installments is null or installments between 2 and 12),
  start_date date not null,
  due_date date,
  status text not null default 'rascunho' check (status in ('rascunho', 'enviado')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists contracts_client_idx on public.contracts (client_id);

alter table public.contracts enable row level security;
drop policy if exists "contracts_select" on public.contracts;
drop policy if exists "contracts_admin" on public.contracts;
create policy "contracts_select" on public.contracts for select using (client_id = auth.uid() or public.is_admin());
create policy "contracts_admin" on public.contracts for all using (public.is_admin()) with check (public.is_admin());

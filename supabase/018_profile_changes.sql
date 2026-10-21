-- BillTech — NIF do cliente (preenchido uma vez, depois inalterável) e o fluxo de pedidos de
-- alteração para campos sensíveis (NIF, email): o cliente nunca os edita diretamente depois de
-- preenchidos — só pode pedir, e um admin aprova ou rejeita. Idempotente.

alter table public.profiles add column if not exists nif text;

create table if not exists public.profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  field text not null check (field in ('nif', 'email')),
  current_value text not null default '',
  requested_value text not null,
  reason text not null default '',
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolution_note text not null default ''
);
create index if not exists profile_change_requests_client_idx on public.profile_change_requests (client_id, created_at desc);
create index if not exists profile_change_requests_status_idx on public.profile_change_requests (status, created_at desc);

alter table public.profile_change_requests enable row level security;
drop policy if exists "profile_change_requests_select" on public.profile_change_requests;
drop policy if exists "profile_change_requests_insert" on public.profile_change_requests;
drop policy if exists "profile_change_requests_admin" on public.profile_change_requests;
-- O cliente vê e cria os seus próprios pedidos; só o admin pode aprovar/rejeitar (update/delete).
create policy "profile_change_requests_select" on public.profile_change_requests for select using (client_id = auth.uid() or public.is_admin());
create policy "profile_change_requests_insert" on public.profile_change_requests for insert with check (client_id = auth.uid() or public.is_admin());
create policy "profile_change_requests_admin" on public.profile_change_requests for update using (public.is_admin()) with check (public.is_admin());

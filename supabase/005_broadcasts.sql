-- BillTech — comunicados do admin para clientes (um, vários ou todos).
-- Executar depois de 004_super_admins_audit.sql. Idempotente.

create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  -- SET NULL: o comunicado sobrevive à eliminação do admin; o email fica registado
  admin_id uuid references public.profiles (id) on delete set null,
  admin_email text not null,
  subject text not null,
  body text not null,
  audience text not null check (audience in ('all', 'selected')),
  recipient_count int not null default 0,
  email_requested boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists broadcasts_created_idx on public.broadcasts (created_at desc);

create table if not exists public.broadcast_recipients (
  broadcast_id uuid not null references public.broadcasts (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz,
  email_status text not null default 'skipped' check (email_status in ('sent', 'failed', 'skipped')),
  primary key (broadcast_id, client_id)
);
create index if not exists broadcast_recipients_client_idx on public.broadcast_recipients (client_id, read_at);

alter table public.broadcasts enable row level security;
alter table public.broadcast_recipients enable row level security;

drop policy if exists "broadcasts_select" on public.broadcasts;
drop policy if exists "broadcasts_admin" on public.broadcasts;
-- O cliente só lê comunicados em que consta como destinatário
create policy "broadcasts_select" on public.broadcasts for select using (
  public.is_admin() or exists (select 1 from public.broadcast_recipients r where r.broadcast_id = id and r.client_id = auth.uid())
);
create policy "broadcasts_admin" on public.broadcasts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "broadcast_recipients_select" on public.broadcast_recipients;
drop policy if exists "broadcast_recipients_admin" on public.broadcast_recipients;
create policy "broadcast_recipients_select" on public.broadcast_recipients for select using (client_id = auth.uid() or public.is_admin());
create policy "broadcast_recipients_admin" on public.broadcast_recipients for all using (public.is_admin()) with check (public.is_admin());

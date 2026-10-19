-- BillTech — Centro de Comando (Fase 1): registo dos sites externos dos clientes e a tabela de
-- telemetria que vão alimentar. Não guardamos a chave de API em texto — só o hash SHA-256; a chave
-- em claro só existe no momento em que é gerada, mostrada uma única vez ao admin.
-- A Fase 2 traz o endpoint de ingestão (com validação HMAC) e o dashboard de telemetria.
-- Idempotente.

create table if not exists public.external_sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  domain text not null,
  api_key_hash text not null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  last_ping_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists external_sites_client_idx on public.external_sites (client_id);

create table if not exists public.telemetry_logs (
  id uuid primary key default gen_random_uuid(),
  external_site_id uuid not null references public.external_sites (id) on delete cascade,
  metric_type text not null check (metric_type in ('page_view', 'error', 'uptime')),
  value jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists telemetry_logs_site_idx on public.telemetry_logs (external_site_id, occurred_at desc);

alter table public.external_sites enable row level security;
alter table public.telemetry_logs enable row level security;
drop policy if exists "external_sites_admin" on public.external_sites;
drop policy if exists "telemetry_logs_admin" on public.telemetry_logs;
create policy "external_sites_admin" on public.external_sites for all using (public.is_admin()) with check (public.is_admin());
create policy "telemetry_logs_admin" on public.telemetry_logs for all using (public.is_admin()) with check (public.is_admin());

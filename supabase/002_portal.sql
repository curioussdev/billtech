-- BillTech — portal do cliente: projetos, pedidos e conversas.
-- Executar depois de schema.sql. Idempotente.

create table if not exists public.client_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'planeamento' check (status in ('planeamento', 'desenvolvimento', 'testes', 'entregue', 'manutencao')),
  progress int not null default 0 check (progress between 0 and 100),
  due_date date,
  url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_projects_client_idx on public.client_projects (client_id);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.client_projects (id) on delete set null,
  type text not null check (type in ('alteracao', 'implementacao', 'suporte', 'orcamento', 'duvida')),
  title text not null,
  description text not null,
  priority text not null default 'normal' check (priority in ('baixa', 'normal', 'alta', 'urgente')),
  status text not null default 'aberto' check (status in ('aberto', 'em_analise', 'em_curso', 'aguarda_cliente', 'concluido', 'cancelado')),
  -- "Por ler" de cada lado da conversa
  client_unread boolean not null default false,
  admin_unread boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index if not exists requests_client_idx on public.requests (client_id, last_message_at desc);
create index if not exists requests_admin_idx on public.requests (status, last_message_at desc);

create table if not exists public.request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_role text not null check (author_role in ('client', 'admin')),
  body text not null,
  -- Nota interna: visível só para administradores
  internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists request_messages_request_idx on public.request_messages (request_id, created_at);

-- Leitura protegida por RLS. Escritas dos clientes passam por Server Actions (service role),
-- que verificam a propriedade do pedido antes de gravar.
alter table public.client_projects enable row level security;
alter table public.requests enable row level security;
alter table public.request_messages enable row level security;

drop policy if exists "client_projects_select" on public.client_projects;
drop policy if exists "client_projects_admin" on public.client_projects;
create policy "client_projects_select" on public.client_projects for select using (client_id = auth.uid() or public.is_admin());
create policy "client_projects_admin" on public.client_projects for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "requests_select" on public.requests;
drop policy if exists "requests_admin" on public.requests;
create policy "requests_select" on public.requests for select using (client_id = auth.uid() or public.is_admin());
create policy "requests_admin" on public.requests for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "request_messages_select" on public.request_messages;
drop policy if exists "request_messages_admin" on public.request_messages;
create policy "request_messages_select" on public.request_messages for select using (
  public.is_admin()
  or (not internal and exists (select 1 from public.requests r where r.id = request_id and r.client_id = auth.uid()))
);
create policy "request_messages_admin" on public.request_messages for all using (public.is_admin()) with check (public.is_admin());

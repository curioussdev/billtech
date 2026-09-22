-- BillTech — melhorias à área de cliente: faturação visível, histórico de atividade do projeto, e
-- anexos nas conversas. Executar depois de 007_leads.sql. Idempotente.
--
-- Nota de arquitetura: `client_projects` é a tabela REAL e por-cliente do portal (área de cliente) —
-- diferente da `ClientProject` mock/admin usada em Receita & Projetos (que ainda não está ligada a
-- contas de cliente). Por isso a faturação fica aqui, na tabela que já pertence a um cliente
-- autenticado, em vez de tentar ligar os dois sistemas agora.

-- ─── Faturação visível ao cliente ──────────────────────────────────────────
alter table public.client_projects
  add column if not exists payment_status text not null default 'nao_faturado' check (payment_status in ('nao_faturado', 'faturado', 'pago')),
  add column if not exists invoice_value numeric check (invoice_value is null or invoice_value >= 0),
  add column if not exists invoice_url text not null default '';

-- ─── Histórico de atividade do projeto ─────────────────────────────────────
create table if not exists public.client_project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects (id) on delete cascade,
  kind text not null check (kind in ('status', 'progress', 'due_date', 'nota', 'faturacao')),
  -- Frase já composta em PT-PT no momento da escrita (evita lógica de "diff" na leitura)
  message text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);
create index if not exists client_project_events_project_idx on public.client_project_events (project_id, created_at desc);

alter table public.client_project_events enable row level security;
drop policy if exists "client_project_events_select" on public.client_project_events;
drop policy if exists "client_project_events_admin" on public.client_project_events;
create policy "client_project_events_select" on public.client_project_events for select using (
  public.is_admin() or exists (select 1 from public.client_projects cp where cp.id = project_id and cp.client_id = auth.uid())
);
create policy "client_project_events_admin" on public.client_project_events for all using (public.is_admin()) with check (public.is_admin());

-- ─── Anexos nas conversas ───────────────────────────────────────────────────
create table if not exists public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  -- Nulo quando o anexo acompanha a descrição inicial do pedido (que não é uma linha em request_messages)
  message_id uuid references public.request_messages (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  content_type text not null default '',
  size_bytes bigint not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploader_role text not null check (uploader_role in ('client', 'admin')),
  created_at timestamptz not null default now()
);
create index if not exists request_attachments_request_idx on public.request_attachments (request_id, created_at);

alter table public.request_attachments enable row level security;
drop policy if exists "request_attachments_select" on public.request_attachments;
drop policy if exists "request_attachments_admin" on public.request_attachments;
create policy "request_attachments_select" on public.request_attachments for select using (
  public.is_admin() or exists (select 1 from public.requests r where r.id = request_id and r.client_id = auth.uid())
);
create policy "request_attachments_admin" on public.request_attachments for all using (public.is_admin()) with check (public.is_admin());

-- Bucket privado (ao contrário do site-media, que é público): faturas, prints e documentos podem ser
-- sensíveis. Nunca se serve por URL pública — sempre por URL assinada, gerada por uma Server Action
-- que confirma primeiro que quem pede tem acesso ao pedido (ver `src/actions/attachments.ts`).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-attachments',
  'client-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do nothing;

-- Caminho de cada objeto: "<request_id>/<ficheiro>" — a política lê o request_id do próprio caminho
-- para confirmar que quem envia é o dono do pedido (ou admin), sem precisar de outra tabela.
drop policy if exists "client_attachments_insert" on storage.objects;
drop policy if exists "client_attachments_admin_delete" on storage.objects;
create policy "client_attachments_insert" on storage.objects for insert with check (
  bucket_id = 'client-attachments'
  and (
    public.is_admin()
    or exists (select 1 from public.requests r where r.client_id = auth.uid() and r.id::text = (storage.foldername(name))[1])
  )
);
create policy "client_attachments_admin_delete" on storage.objects for delete using (bucket_id = 'client-attachments' and public.is_admin());

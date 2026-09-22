-- BillTech — satisfação pós-pedido (CSAT) e documentos do projeto. Executar depois de 009_finance.sql.
-- Idempotente.

-- ─── Satisfação (1 avaliação por pedido, só depois de "concluído") ─────────
alter table public.requests
  add column if not exists satisfaction_rating int check (satisfaction_rating is null or (satisfaction_rating between 1 and 5)),
  add column if not exists satisfaction_comment text not null default '',
  add column if not exists satisfaction_at timestamptz;

-- ─── Documentos do projeto (contratos, acessos, entregáveis) ───────────────
-- Reutiliza o bucket `client-attachments` já criado em 008 (privado), com um prefixo diferente
-- ("projects/<id>/…", em vez de "<request_id>/…") — só o admin carrega, o cliente só descarrega.
create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  content_type text not null default '',
  size_bytes bigint not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists project_documents_project_idx on public.project_documents (project_id, created_at desc);

alter table public.project_documents enable row level security;
drop policy if exists "project_documents_select" on public.project_documents;
drop policy if exists "project_documents_admin" on public.project_documents;
create policy "project_documents_select" on public.project_documents for select using (
  public.is_admin() or exists (select 1 from public.client_projects cp where cp.id = project_id and cp.client_id = auth.uid())
);
create policy "project_documents_admin" on public.project_documents for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "client_attachments_project_insert" on storage.objects;
create policy "client_attachments_project_insert" on storage.objects for insert with check (
  bucket_id = 'client-attachments' and (storage.foldername(name))[1] = 'projects' and public.is_admin()
);

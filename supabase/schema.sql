-- BillTech — esquema Supabase.
-- Executar UMA vez em: Supabase Dashboard → SQL Editor → New query → Run.
-- É idempotente: pode voltar a correr sem apagar dados.

-- ───────────────────────────── Perfis ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  company text not null default '',
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

-- Funções security definer evitam recursão de RLS ao consultar a própria tabela
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.my_role() returns text
language sql security definer set search_path = public stable as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, company)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'company', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_select" on public.profiles for select using (id = auth.uid() or public.is_admin());
-- O utilizador edita o próprio perfil mas nunca o seu papel (role)
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = public.my_role());
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────── Conteúdo da landing page ─────────────────────
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
drop policy if exists "site_content_read" on public.site_content;
drop policy if exists "site_content_admin_write" on public.site_content;
create policy "site_content_read" on public.site_content for select using (true);
create policy "site_content_admin_write" on public.site_content for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  position int not null default 0,
  published boolean not null default true,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
drop policy if exists "projects_read" on public.projects;
drop policy if exists "projects_admin_write" on public.projects;
create policy "projects_read" on public.projects for select using (published or public.is_admin());
create policy "projects_admin_write" on public.projects for all using (public.is_admin()) with check (public.is_admin());

-- Definições privadas (ex.: email que recebe o formulário). Nunca públicas.
create table if not exists public.private_settings (
  key text primary key,
  value jsonb not null
);
alter table public.private_settings enable row level security;
drop policy if exists "private_settings_admin" on public.private_settings;
create policy "private_settings_admin" on public.private_settings for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── Área de cliente ─────────────────────────
-- O catálogo de soluções vive em site_content (key = 'solutions'); aqui só as atribuições.
create table if not exists public.client_solutions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  solution_id text not null,
  primary key (user_id, solution_id)
);
alter table public.client_solutions enable row level security;
drop policy if exists "client_solutions_select" on public.client_solutions;
drop policy if exists "client_solutions_admin_write" on public.client_solutions;
create policy "client_solutions_select" on public.client_solutions for select using (user_id = auth.uid() or public.is_admin());
create policy "client_solutions_admin_write" on public.client_solutions for all using (public.is_admin()) with check (public.is_admin());

-- Mensagens (formulário público e área de cliente). Escritas apenas pelo servidor (service role).
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  whatsapp text not null default '',
  challenge text not null,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "contact_messages_admin_read" on public.contact_messages;
create policy "contact_messages_admin_read" on public.contact_messages for select using (public.is_admin());

-- ─────────────────────────── Imagens (Storage) ───────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists "site_media_admin_insert" on storage.objects;
drop policy if exists "site_media_admin_update" on storage.objects;
drop policy if exists "site_media_admin_delete" on storage.objects;
create policy "site_media_admin_insert" on storage.objects for insert with check (bucket_id = 'site-media' and public.is_admin());
create policy "site_media_admin_update" on storage.objects for update using (bucket_id = 'site-media' and public.is_admin());
create policy "site_media_admin_delete" on storage.objects for delete using (bucket_id = 'site-media' and public.is_admin());

-- ───────────────────── Tornar-te administrador ─────────────────────
-- 1) Regista-te em /entrar e confirma o email.
-- 2) Corre este comando (uma vez):
--
--   update public.profiles set role = 'admin' where email = '946393361bill@gmail.com';

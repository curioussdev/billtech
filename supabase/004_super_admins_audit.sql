-- BillTech — duplo Super Admin restrito + trilha de auditoria (audit_logs).
-- Executar depois de 003_analytics.sql. Idempotente.

-- ───────────────────────── 1. Whitelist de Super Admins ─────────────────────────
-- Única fonte de verdade no banco. O código tem a mesma lista em src/lib/super-admins.ts.
create table if not exists public.super_admins (
  email text primary key check (email = lower(email))
);
insert into public.super_admins (email) values ('946393361bill@gmail.com'), ('geral.billtech@gmail.com')
on conflict (email) do nothing;
alter table public.super_admins enable row level security;
-- Sem políticas: ninguém (exceto service role) lê ou altera a whitelist pela API.

create or replace function public.is_super_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and lower(p.email) in (select email from public.super_admins)
  )
$$;

-- ───────────── 2. Só a whitelist pode ter o papel 'admin' (defesa no banco) ─────────────
create or replace function public.enforce_admin_whitelist() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'admin' and lower(new.email) not in (select email from public.super_admins) then
    raise exception 'Papel admin reservado aos Super Admins autorizados (%).', new.email using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists profiles_enforce_admin_whitelist on public.profiles;
create trigger profiles_enforce_admin_whitelist before insert or update of role, email on public.profiles
  for each row execute function public.enforce_admin_whitelist();

-- ─────────── 3. Promoção automática, apenas com email CONFIRMADO ───────────
-- Confirmar o email prova a posse do endereço; registar-se sozinho não chega.
create or replace function public.promote_confirmed_super_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and lower(new.email) in (select email from public.super_admins) then
    update public.profiles set role = 'admin' where id = new.id and role <> 'admin';
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_confirmed_promote on auth.users;
create trigger on_auth_user_confirmed_promote after insert or update of email_confirmed_at on auth.users
  for each row execute function public.promote_confirmed_super_admin();

-- Promove já quem existe e tem o email confirmado (no-op para contas ainda não criadas)
update public.profiles p set role = 'admin'
from auth.users u
where u.id = p.id and u.email_confirmed_at is not null and lower(p.email) in (select email from public.super_admins) and p.role <> 'admin';

-- ───────────────────────────── 4. audit_logs ─────────────────────────────
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  -- SET NULL: o registo sobrevive à eliminação do utilizador; o email fica em admin_email
  admin_id uuid references public.profiles (id) on delete set null,
  admin_email text not null,
  action text not null,
  target_resource text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_admin_email_idx on public.audit_logs (admin_email, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action, created_at desc);
create index if not exists audit_logs_resource_idx on public.audit_logs (target_resource, created_at desc);

alter table public.audit_logs enable row level security;
drop policy if exists "audit_logs_super_admin_read" on public.audit_logs;
-- Só Super Admins leem. Não há políticas de escrita: apenas o servidor (service role) insere.
create policy "audit_logs_super_admin_read" on public.audit_logs for select using (public.is_super_admin());

-- Append-only: nem a service role consegue alterar ou apagar registos (só um superuser do Postgres, deliberadamente)
create or replace function public.audit_logs_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_logs é append-only: % não permitido.', tg_op using errcode = '42501';
end $$;

drop trigger if exists audit_logs_no_update_delete on public.audit_logs;
create trigger audit_logs_no_update_delete before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

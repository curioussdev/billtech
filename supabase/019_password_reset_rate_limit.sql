-- BillTech — regista cada pedido de "esqueci a password" para aplicar um limite de frequência por
-- email (evita que o endpoint público sirva para inundar a caixa de correio de outra pessoa). Sem
-- RLS pública: só é escrito/lido pelo servidor com a service role key. Idempotente.

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  requested_at timestamptz not null default now()
);
create index if not exists password_reset_requests_email_idx on public.password_reset_requests (email, requested_at desc);

alter table public.password_reset_requests enable row level security;
drop policy if exists "password_reset_requests_admin" on public.password_reset_requests;
create policy "password_reset_requests_admin" on public.password_reset_requests for all using (public.is_admin()) with check (public.is_admin());

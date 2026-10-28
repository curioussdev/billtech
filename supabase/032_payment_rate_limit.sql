-- BillTech — regista cada tentativa de ação de pagamento (checkout, configurar/revogar débito
-- automático) para aplicar um limite de frequência por cliente+ação, generalizando o limitador já
-- existente para "esqueci a password" (019_password_reset_rate_limit.sql). Evita que uma conta
-- comprometida, um frontend com bug a repetir pedidos, ou um ataque automatizado consigam martelar a
-- API da Stripe através das nossas Server Actions. Sem RLS pública: só o servidor (service role) lê
-- e escreve. Idempotente.

create table if not exists public.payment_action_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  requested_at timestamptz not null default now()
);
create index if not exists payment_action_requests_lookup_idx on public.payment_action_requests (client_id, action, requested_at desc);

alter table public.payment_action_requests enable row level security;
drop policy if exists "payment_action_requests_admin" on public.payment_action_requests;
create policy "payment_action_requests_admin" on public.payment_action_requests for all using (public.is_admin()) with check (public.is_admin());

-- BillTech — despesas do negócio, para o ledger unificado (faturas + pagamentos + despesas) do
-- módulo financeiro. Ferramenta de uso interno, sem RLS pública — só is_admin(), como `leads`/`goals`.
-- Idempotente.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null check (amount >= 0),
  category text not null default 'geral' check (category in ('geral', 'ferramentas', 'marketing', 'subcontratacao', 'infraestrutura', 'impostos')),
  incurred_at date not null default current_date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists expenses_incurred_idx on public.expenses (incurred_at desc);

alter table public.expenses enable row level security;
drop policy if exists "expenses_admin" on public.expenses;
create policy "expenses_admin" on public.expenses for all using (public.is_admin()) with check (public.is_admin());

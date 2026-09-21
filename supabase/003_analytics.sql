-- BillTech — analytics próprio da landing page (sem cookies, sem IP, sem dados pessoais).
-- Executar depois de 002_portal.sql. Idempotente.
-- Toda a escrita/leitura passa por Server Routes com a service role; nada é acessível a anon/authenticated.

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  session_id text not null,
  path text not null,
  referrer_host text not null default 'direto',
  device text not null default 'desktop' check (device in ('desktop', 'mobile', 'tablet')),
  created_at timestamptz not null default now()
);
create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_session_idx on public.page_views (session_id, created_at);

-- Quem está no site agora: uma linha por sessão, atualizada pelos "batimentos"
create table if not exists public.presence (
  session_id text primary key,
  path text not null,
  last_seen timestamptz not null default now()
);
create index if not exists presence_last_seen_idx on public.presence (last_seen desc);

create table if not exists public.daily_peak (
  day date primary key,
  peak int not null default 0,
  peak_at timestamptz not null default now()
);

alter table public.page_views enable row level security;
alter table public.presence enable row level security;
alter table public.daily_peak enable row level security;
-- Sem políticas: só a service role (que ignora a RLS) lê e escreve.

-- Regista uma visita ('view') ou um batimento ('beat') e mantém o pico diário.
create or replace function public.analytics_track(p_kind text, p_sid text, p_path text, p_ref text, p_device text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_online int;
  v_day date := (now() at time zone 'Europe/Lisbon')::date;
begin
  if p_kind = 'view' then
    insert into page_views (session_id, path, referrer_host, device) values (p_sid, p_path, coalesce(nullif(p_ref, ''), 'direto'), p_device);
    -- Limpeza barata de presenças antigas
    delete from presence where last_seen < now() - interval '1 day';
  end if;

  insert into presence (session_id, path, last_seen) values (p_sid, p_path, now())
  on conflict (session_id) do update set path = excluded.path, last_seen = now();

  select count(*) into v_online from presence where last_seen > now() - interval '60 seconds';
  insert into daily_peak (day, peak, peak_at) values (v_day, v_online, now())
  on conflict (day) do update
    set peak = greatest(daily_peak.peak, excluded.peak),
        peak_at = case when excluded.peak > daily_peak.peak then now() else daily_peak.peak_at end;
end $$;

create or replace function public.analytics_realtime()
returns table (online int, peak int, peak_at timestamptz) language sql security definer set search_path = public stable as $$
  select
    (select count(*)::int from presence where last_seen > now() - interval '60 seconds'),
    coalesce((select p.peak from daily_peak p where p.day = (now() at time zone 'Europe/Lisbon')::date), 0),
    (select p.peak_at from daily_peak p where p.day = (now() at time zone 'Europe/Lisbon')::date)
$$;

create or replace function public.analytics_online_pages()
returns table (path text, online int) language sql security definer set search_path = public stable as $$
  select path, count(*)::int from presence where last_seen > now() - interval '60 seconds' group by path order by 2 desc, 1 limit 8
$$;

-- Visitantes únicos (sessões) e visualizações por dia, incluindo dias sem tráfego
create or replace function public.analytics_daily(p_days int)
returns table (day date, visitors int, pageviews int) language sql security definer set search_path = public stable as $$
  select d::date,
         coalesce(count(distinct v.session_id), 0)::int,
         coalesce(count(v.id), 0)::int
  from generate_series(((now() at time zone 'Europe/Lisbon')::date - (p_days - 1)), (now() at time zone 'Europe/Lisbon')::date, interval '1 day') d
  left join page_views v on (v.created_at at time zone 'Europe/Lisbon')::date = d::date
  group by d order by d
$$;

create or replace function public.analytics_top_pages(p_days int, p_limit int)
returns table (path text, views int, visitors int) language sql security definer set search_path = public stable as $$
  select path, count(*)::int, count(distinct session_id)::int from page_views
  where created_at > now() - make_interval(days => p_days)
  group by path order by 2 desc limit p_limit
$$;

create or replace function public.analytics_sources(p_days int, p_limit int)
returns table (source text, visitors int) language sql security definer set search_path = public stable as $$
  select referrer_host, count(distinct session_id)::int from page_views
  where created_at > now() - make_interval(days => p_days)
  group by referrer_host order by 2 desc limit p_limit
$$;

-- PostgREST expõe funções a anon/authenticated por omissão: fechar
revoke execute on function public.analytics_track(text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.analytics_realtime() from public, anon, authenticated;
revoke execute on function public.analytics_online_pages() from public, anon, authenticated;
revoke execute on function public.analytics_daily(int) from public, anon, authenticated;
revoke execute on function public.analytics_top_pages(int, int) from public, anon, authenticated;
revoke execute on function public.analytics_sources(int, int) from public, anon, authenticated;
grant execute on function public.analytics_track(text, text, text, text, text) to service_role;
grant execute on function public.analytics_realtime() to service_role;
grant execute on function public.analytics_online_pages() to service_role;
grant execute on function public.analytics_daily(int) to service_role;
grant execute on function public.analytics_top_pages(int, int) to service_role;
grant execute on function public.analytics_sources(int, int) to service_role;

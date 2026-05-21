create table if not exists public.daily_briefings (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  title text not null,
  script text not null,
  audio_url text,
  duration_seconds integer,
  status text not null default 'draft' check (status in ('draft', 'generating', 'published', 'failed')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.briefing_segments (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  order_index integer not null,
  text text not null,
  start_time numeric not null,
  end_time numeric not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.briefing_issues (
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  issue_id uuid not null references public.issues(id) on delete cascade,
  order_index integer not null,
  primary key (briefing_id, issue_id)
);

create index if not exists briefing_segments_briefing_id_idx on public.briefing_segments(briefing_id);
create index if not exists briefing_segments_briefing_id_order_index_idx on public.briefing_segments(briefing_id, order_index);
create index if not exists briefing_issues_briefing_id_idx on public.briefing_issues(briefing_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_briefings_set_updated_at on public.daily_briefings;
create trigger daily_briefings_set_updated_at
before update on public.daily_briefings
for each row
execute function public.set_updated_at();

alter table public.daily_briefings enable row level security;
alter table public.briefing_segments enable row level security;
alter table public.briefing_issues enable row level security;

drop policy if exists "Published briefings are readable" on public.daily_briefings;
create policy "Published briefings are readable"
on public.daily_briefings
for select
to authenticated
using (status = 'published');

drop policy if exists "Published briefing segments are readable" on public.briefing_segments;
create policy "Published briefing segments are readable"
on public.briefing_segments
for select
to authenticated
using (
  exists (
    select 1
    from public.daily_briefings
    where daily_briefings.id = briefing_segments.briefing_id
      and daily_briefings.status = 'published'
  )
);

drop policy if exists "Published briefing issues are readable" on public.briefing_issues;
create policy "Published briefing issues are readable"
on public.briefing_issues
for select
to authenticated
using (
  exists (
    select 1
    from public.daily_briefings
    where daily_briefings.id = briefing_issues.briefing_id
      and daily_briefings.status = 'published'
  )
);

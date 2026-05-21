create table if not exists public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('misleading', 'inappropriate', 'duplicate', 'broken', 'other')),
  note text,
  created_at timestamp with time zone not null default now()
);

create index if not exists issue_reports_issue_id_idx on public.issue_reports(issue_id);
create index if not exists issue_reports_user_id_idx on public.issue_reports(user_id);

alter table public.issue_reports enable row level security;

drop policy if exists "Users can create issue reports" on public.issue_reports;
create policy "Users can create issue reports"
on public.issue_reports
for insert
to authenticated
with check (auth.uid() = user_id);

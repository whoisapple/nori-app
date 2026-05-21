create table if not exists public.issue_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_id uuid not null references public.issues(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (user_id, issue_id)
);

create index if not exists issue_bookmarks_user_id_created_at_idx
on public.issue_bookmarks(user_id, created_at desc);

create index if not exists issue_bookmarks_issue_id_idx
on public.issue_bookmarks(issue_id);

alter table public.issue_bookmarks enable row level security;

drop policy if exists "Users can read their issue bookmarks" on public.issue_bookmarks;
create policy "Users can read their issue bookmarks"
on public.issue_bookmarks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their issue bookmarks" on public.issue_bookmarks;
create policy "Users can create their issue bookmarks"
on public.issue_bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their issue bookmarks" on public.issue_bookmarks;
create policy "Users can delete their issue bookmarks"
on public.issue_bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

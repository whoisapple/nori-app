create table if not exists public.briefing_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  briefing_id uuid not null references public.daily_briefings(id) on delete cascade,
  source text not null default 'rewarded_ad' check (source in ('rewarded_ad', 'pro')),
  unlocked_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone,
  primary key (user_id, briefing_id)
);

create index if not exists briefing_unlocks_user_id_unlocked_at_idx
on public.briefing_unlocks(user_id, unlocked_at desc);

alter table public.briefing_unlocks enable row level security;

drop policy if exists "Users can read their briefing unlocks" on public.briefing_unlocks;
create policy "Users can read their briefing unlocks"
on public.briefing_unlocks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their briefing unlocks" on public.briefing_unlocks;
create policy "Users can create their briefing unlocks"
on public.briefing_unlocks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their briefing unlocks" on public.briefing_unlocks;
create policy "Users can update their briefing unlocks"
on public.briefing_unlocks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.user_subscription_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entitlement_id text not null default 'pro',
  is_pro boolean not null default false,
  revenuecat_app_user_id text,
  active_entitlements text[] not null default '{}'::text[],
  latest_customer_info jsonb,
  updated_at timestamp with time zone not null default now()
);

alter table public.user_subscription_status enable row level security;

drop policy if exists "Users can read their subscription status" on public.user_subscription_status;
create policy "Users can read their subscription status"
on public.user_subscription_status
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can upsert their subscription status" on public.user_subscription_status;
create policy "Users can upsert their subscription status"
on public.user_subscription_status
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their subscription status" on public.user_subscription_status;
create policy "Users can update their subscription status"
on public.user_subscription_status
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

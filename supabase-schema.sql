create extension if not exists pgcrypto;

create table if not exists public.game_attempts (
  id uuid primary key default gen_random_uuid(),
  player_device_id text not null,
  player_name text,
  floor integer not null check (floor >= 0 and floor <= 999),
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint game_attempts_player_name_length check (player_name is null or char_length(player_name) <= 6)
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  player_device_id text not null,
  player_name text not null,
  floor integer not null check (floor >= 0 and floor <= 999),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint leaderboard_player_name_length check (char_length(player_name) between 1 and 6)
);

create or replace view public.leaderboard_public
with (security_invoker = true)
as
select
  id,
  player_name,
  floor,
  submitted_at
from public.leaderboard_entries
order by floor desc, submitted_at asc;

create or replace view public.player_best_scores
with (security_invoker = true)
as
select
  player_device_id,
  max(floor) as best_floor,
  max(played_at) as last_played_at,
  count(*)::integer as play_count
from public.game_attempts
group by player_device_id;

create or replace view public.admin_player_summary
as
select
  a.player_device_id,
  max(a.floor) as best_floor,
  max(a.played_at) as last_played_at,
  count(*)::integer as play_count,
  (
    select le.player_name
    from public.leaderboard_entries le
    where le.player_device_id = a.player_device_id
    order by le.floor desc, le.submitted_at desc
    limit 1
  ) as latest_player_name
from public.game_attempts a
group by a.player_device_id;

alter table public.game_attempts enable row level security;
alter table public.leaderboard_entries enable row level security;

drop policy if exists "Public can insert game attempts" on public.game_attempts;
create policy "Public can insert game attempts"
on public.game_attempts
for insert
to anon
with check (true);

drop policy if exists "Public can read game attempts" on public.game_attempts;
create policy "Public can read game attempts"
on public.game_attempts
for select
to anon
using (true);

drop policy if exists "Public can insert leaderboard entries" on public.leaderboard_entries;
create policy "Public can insert leaderboard entries"
on public.leaderboard_entries
for insert
to anon
with check (char_length(player_name) between 1 and 6);

drop policy if exists "Public can read leaderboard entries" on public.leaderboard_entries;
create policy "Public can read leaderboard entries"
on public.leaderboard_entries
for select
to anon
using (true);

grant usage on schema public to anon;
grant select, insert on public.game_attempts to anon;
grant select, insert on public.leaderboard_entries to anon;
grant select on public.leaderboard_public to anon;
grant select on public.player_best_scores to anon;

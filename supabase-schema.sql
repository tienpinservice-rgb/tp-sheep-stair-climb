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

create table if not exists public.players (
  player_device_id text primary key,
  player_name text,
  best_floor integer not null default 0 check (best_floor >= 0 and best_floor <= 999),
  best_played_at timestamptz,
  play_count integer not null default 0 check (play_count >= 0),
  first_played_at timestamptz not null default now(),
  last_played_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_player_name_length check (player_name is null or char_length(player_name) <= 6)
);

with attempt_summary as (
  select
    player_device_id,
    max(floor) as best_floor,
    count(*)::integer as play_count,
    min(played_at) as first_played_at,
    max(played_at) as last_played_at
  from public.game_attempts
  group by player_device_id
),
best_attempt as (
  select distinct on (player_device_id)
    player_device_id,
    played_at as best_played_at
  from public.game_attempts
  order by player_device_id, floor desc, played_at desc
),
latest_name as (
  select distinct on (player_device_id)
    player_device_id,
    player_name
  from (
    select player_device_id, player_name, submitted_at as named_at
    from public.leaderboard_entries
    where player_name is not null and char_length(player_name) > 0
    union all
    select player_device_id, player_name, played_at as named_at
    from public.game_attempts
    where player_name is not null and char_length(player_name) > 0
  ) names
  order by player_device_id, named_at desc
)
insert into public.players (
  player_device_id,
  player_name,
  best_floor,
  best_played_at,
  play_count,
  first_played_at,
  last_played_at,
  updated_at
)
select
  attempt_summary.player_device_id,
  latest_name.player_name,
  attempt_summary.best_floor,
  best_attempt.best_played_at,
  attempt_summary.play_count,
  attempt_summary.first_played_at,
  attempt_summary.last_played_at,
  now()
from attempt_summary
left join best_attempt using (player_device_id)
left join latest_name using (player_device_id)
on conflict (player_device_id) do update set
  player_name = coalesce(excluded.player_name, public.players.player_name),
  best_floor = greatest(public.players.best_floor, excluded.best_floor),
  best_played_at = case
    when excluded.best_floor >= public.players.best_floor then excluded.best_played_at
    else public.players.best_played_at
  end,
  play_count = greatest(public.players.play_count, excluded.play_count),
  first_played_at = least(public.players.first_played_at, excluded.first_played_at),
  last_played_at = greatest(public.players.last_played_at, excluded.last_played_at),
  updated_at = now();

drop view if exists public.leaderboard_public;
drop view if exists public.player_best_scores;
drop view if exists public.admin_player_summary;

create or replace view public.leaderboard_public
with (security_invoker = true)
as
select
  player_device_id as id,
  player_name,
  best_floor as floor,
  best_played_at as submitted_at
from public.players
where player_name is not null and char_length(player_name) > 0
order by best_floor desc, best_played_at asc;

create or replace view public.player_best_scores
with (security_invoker = true)
as
select
  player_device_id,
  player_name,
  best_floor,
  coalesce(best_played_at, last_played_at) as last_played_at,
  play_count
from public.players;

create or replace view public.admin_player_summary
as
select
  player_device_id,
  player_name as latest_player_name,
  best_floor,
  coalesce(best_played_at, last_played_at) as last_played_at,
  play_count,
  first_played_at,
  updated_at
from public.players;

alter table public.game_attempts enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.players enable row level security;

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

drop policy if exists "Public can insert players" on public.players;
create policy "Public can insert players"
on public.players
for insert
to anon
with check (player_name is null or char_length(player_name) <= 6);

drop policy if exists "Public can update players" on public.players;
create policy "Public can update players"
on public.players
for update
to anon
using (true)
with check (player_name is null or char_length(player_name) <= 6);

drop policy if exists "Public can read players" on public.players;
create policy "Public can read players"
on public.players
for select
to anon
using (true);

grant usage on schema public to anon;
grant select, insert on public.game_attempts to anon;
grant select, insert on public.leaderboard_entries to anon;
grant select, insert, update on public.players to anon;
grant select on public.leaderboard_public to anon;
grant select on public.player_best_scores to anon;
grant select on public.admin_player_summary to anon;

create extension if not exists pgcrypto;

create table if not exists public.game_attempts (
  id uuid primary key default gen_random_uuid(),
  player_device_id text not null,
  player_name text,
  floor integer not null check (floor >= 0 and floor <= 999),
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint game_attempts_player_name_length check (player_name is null or char_length(player_name) <= 9)
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  player_device_id text not null,
  player_name text not null,
  floor integer not null check (floor >= 0 and floor <= 999),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint leaderboard_player_name_length check (char_length(player_name) between 1 and 9)
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
  constraint players_player_name_length check (player_name is null or char_length(player_name) <= 9)
);

alter table public.game_attempts
  drop constraint if exists game_attempts_player_name_length,
  add constraint game_attempts_player_name_length check (player_name is null or char_length(player_name) <= 9);

alter table public.leaderboard_entries
  drop constraint if exists leaderboard_player_name_length,
  add constraint leaderboard_player_name_length check (char_length(player_name) between 1 and 9);

alter table public.players
  drop constraint if exists players_player_name_length,
  add constraint players_player_name_length check (player_name is null or char_length(player_name) <= 9);

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

create or replace function public.normalize_player_name(value text)
returns text
language sql
immutable
as $$
  select nullif(left(btrim(value), 9), '');
$$;

create or replace function public.sync_player_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := public.normalize_player_name(new.player_name);
begin
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
  values (
    new.player_device_id,
    clean_name,
    new.floor,
    new.played_at,
    1,
    new.played_at,
    new.played_at,
    now()
  )
  on conflict (player_device_id) do update set
    player_name = coalesce(clean_name, public.players.player_name),
    best_floor = greatest(public.players.best_floor, excluded.best_floor),
    best_played_at = case
      when excluded.best_floor >= public.players.best_floor then excluded.best_played_at
      else public.players.best_played_at
    end,
    play_count = public.players.play_count + 1,
    first_played_at = least(public.players.first_played_at, excluded.first_played_at),
    last_played_at = greatest(public.players.last_played_at, excluded.last_played_at),
    updated_at = now();

  return new;
end;
$$;

create or replace function public.sync_player_from_leaderboard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := public.normalize_player_name(new.player_name);
begin
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
  values (
    new.player_device_id,
    clean_name,
    new.floor,
    new.submitted_at,
    0,
    new.submitted_at,
    new.submitted_at,
    now()
  )
  on conflict (player_device_id) do update set
    player_name = coalesce(clean_name, public.players.player_name),
    best_floor = greatest(public.players.best_floor, excluded.best_floor),
    best_played_at = case
      when excluded.best_floor >= public.players.best_floor then excluded.best_played_at
      else public.players.best_played_at
    end,
    first_played_at = least(public.players.first_played_at, excluded.first_played_at),
    last_played_at = greatest(public.players.last_played_at, excluded.last_played_at),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_player_from_attempt_trigger on public.game_attempts;
create trigger sync_player_from_attempt_trigger
after insert on public.game_attempts
for each row execute function public.sync_player_from_attempt();

drop trigger if exists sync_player_from_leaderboard_trigger on public.leaderboard_entries;
create trigger sync_player_from_leaderboard_trigger
after insert on public.leaderboard_entries
for each row execute function public.sync_player_from_leaderboard();

drop view if exists public.leaderboard_public;
drop view if exists public.player_best_scores;
drop view if exists public.admin_player_summary;

create or replace view public.leaderboard_public
with (security_invoker = false)
as
select
  id,
  player_name,
  floor,
  submitted_at
from public.leaderboard_entries
order by floor desc, submitted_at asc;

create or replace view public.player_best_scores
with (security_invoker = false)
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

create or replace function public.get_public_player_best(p_player_device_id text)
returns table (
  player_device_id text,
  player_name text,
  best_floor integer,
  best_played_at timestamptz,
  last_played_at timestamptz,
  play_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    players.player_device_id,
    players.player_name,
    players.best_floor,
    players.best_played_at,
    players.last_played_at,
    players.play_count
  from public.players
  where players.player_device_id = p_player_device_id
  limit 1;
$$;

alter table public.game_attempts enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.players enable row level security;

drop policy if exists "Public can insert game attempts" on public.game_attempts;
create policy "Public can insert game attempts"
on public.game_attempts
for insert
to anon
with check (
  player_device_id is not null
  and char_length(btrim(player_device_id)) between 1 and 120
  and floor >= 0
  and floor <= 999
  and (player_name is null or char_length(player_name) <= 9)
);

drop policy if exists "Public can read game attempts" on public.game_attempts;

drop policy if exists "Public can insert leaderboard entries" on public.leaderboard_entries;
create policy "Public can insert leaderboard entries"
on public.leaderboard_entries
for insert
to anon
with check (
  player_device_id is not null
  and char_length(btrim(player_device_id)) between 1 and 120
  and char_length(btrim(player_name)) between 1 and 9
  and floor >= 0
  and floor <= 999
);

drop policy if exists "Public can read leaderboard entries" on public.leaderboard_entries;

drop policy if exists "Public can insert players" on public.players;
drop policy if exists "Public can update players" on public.players;
drop policy if exists "Public can read players" on public.players;

grant usage on schema public to anon;
revoke all on public.game_attempts from anon, authenticated;
revoke all on public.leaderboard_entries from anon, authenticated;
revoke all on public.players from anon, authenticated;
revoke all on public.leaderboard_public from anon, authenticated;
revoke all on public.player_best_scores from anon, authenticated;
revoke all on public.admin_player_summary from anon, authenticated;
revoke all on function public.normalize_player_name(text) from public, anon, authenticated;
revoke all on function public.sync_player_from_attempt() from public, anon, authenticated;
revoke all on function public.sync_player_from_leaderboard() from public, anon, authenticated;
revoke all on function public.get_public_player_best(text) from public, anon, authenticated;

grant insert on public.game_attempts to anon;
grant insert on public.leaderboard_entries to anon;
grant select on public.leaderboard_public to anon;
grant execute on function public.get_public_player_best(text) to anon;

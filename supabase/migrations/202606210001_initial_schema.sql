-- Japan 2026 Family Planner — milestone one
-- Run with the Supabase CLI or paste into the hosted SQL editor.

create extension if not exists "pgcrypto";
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  theme text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint valid_trip_dates check (end_date >= start_date)
);

create table public.family_users (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  display_name text not null check (display_name in ('Nigel','Sarah','Harrison','Evelyn')),
  role text not null default 'member' check (role in ('parent','teen','member')),
  avatar_emoji text not null default '🎌',
  created_at timestamptz not null default now(),
  unique (trip_id, display_name)
);

-- One family profile can be used on several devices. Each device receives its own
-- anonymous Supabase Auth user and is mapped here after the shared PIN is verified.
create table public.family_user_sessions (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  family_user_id uuid not null references public.family_users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table private.trip_access (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

create table public.itinerary_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null,
  city text not null,
  title text not null,
  description text,
  start_time time not null,
  end_time time not null,
  sort_order numeric not null default 0,
  status text not null default 'draft' check (status in ('draft','confirmed','decision_needed','to_book','cancelled','done')),
  category text not null default 'activity' check (category in ('flight','hotel','transport','activity','food','shopping','free_time')),
  location_name text,
  google_maps_url text,
  start_point text,
  end_point text,
  teen_interest text,
  food_ideas text,
  created_by uuid references public.family_users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint event_time_window check (end_time > start_time)
);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  target_event_id uuid references public.itinerary_events(id) on delete set null,
  suggested_by uuid references public.family_users(id) on delete set null,
  title text not null,
  description text,
  city text,
  date date,
  preferred_time text,
  google_maps_url text,
  status text not null default 'open' check (status in ('open','accepted','rejected','parked')),
  votes_for integer not null default 0 check (votes_for >= 0),
  votes_against integer not null default 0 check (votes_against >= 0),
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  event_id uuid references public.itinerary_events(id) on delete cascade,
  suggestion_id uuid references public.suggestions(id) on delete cascade,
  user_id uuid references public.family_users(id) on delete set null,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  constraint exactly_one_comment_parent check ((event_id is not null) <> (suggestion_id is not null))
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  user_id uuid not null references public.family_users(id) on delete cascade,
  vote text not null check (vote in ('for','against')),
  created_at timestamptz not null default now(),
  unique (suggestion_id, user_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  booking text not null,
  city text,
  date_text text,
  priority text,
  status text,
  owner text,
  link text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  city text not null,
  area text,
  type text,
  idea text not null,
  priority text,
  booking_needed text,
  link text,
  notes text
);

create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  city text not null,
  dates text,
  recommended_area text,
  why_this_area text,
  actual_accommodation text,
  booking_link text,
  notes text
);

create table public.phrasebook (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null,
  english text not null,
  japanese text not null,
  romaji text,
  note text
);

create table public.signs_symbols (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  symbol text not null,
  meaning text not null,
  where_seen text
);

create table public.place_facts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place text not null,
  city text,
  fact text not null
);

create index itinerary_events_trip_date_idx on public.itinerary_events(trip_id, date, sort_order);
create index family_user_sessions_profile_idx on public.family_user_sessions(family_user_id);
create index suggestions_trip_status_idx on public.suggestions(trip_id, status, created_at desc);
create index comments_event_idx on public.comments(event_id, created_at);

create or replace function private.is_trip_member(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, extensions, pg_temp
as $$
  select exists (
    select 1 from public.family_user_sessions s
    where s.auth_user_id = auth.uid() and s.trip_id = target_trip_id
  );
$$;

revoke all on function private.is_trip_member(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_trip_member(uuid) to authenticated;

create or replace function public.set_trip_pin(p_trip_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_pin !~ '^[0-9]{6,}$' then
    raise exception 'Family PIN must contain at least six digits' using errcode = '22023';
  end if;
  insert into private.trip_access (trip_id, pin_hash, updated_at)
  values (p_trip_id, extensions.crypt(p_pin, extensions.gen_salt('bf')), now())
  on conflict (trip_id) do update
    set pin_hash = excluded.pin_hash, updated_at = now();
end;
$$;

revoke all on function public.set_trip_pin(uuid, text) from public, anon, authenticated;
grant execute on function public.set_trip_pin(uuid, text) to service_role;

create or replace function public.get_login_profiles(p_trip_slug text default 'japan-2026')
returns table (id uuid, display_name text, role text, avatar_emoji text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select f.id, f.display_name, f.role, f.avatar_emoji
  from public.family_users f
  join public.trips t on t.id = f.trip_id
  where t.slug = p_trip_slug
  order by case f.display_name
    when 'Nigel' then 1 when 'Sarah' then 2 when 'Harrison' then 3 else 4 end;
$$;

revoke all on function public.get_login_profiles(text) from public;
grant execute on function public.get_login_profiles(text) to anon, authenticated;

create or replace function public.claim_family_profile(p_profile_id uuid, p_pin text)
returns table (id uuid, display_name text, role text, avatar_emoji text)
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
  selected_profile public.family_users%rowtype;
  stored_hash text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into selected_profile from public.family_users where family_users.id = p_profile_id;
  if selected_profile.id is null then
    raise exception 'Unknown family profile' using errcode = '22023';
  end if;

  select pin_hash into stored_hash from private.trip_access where trip_id = selected_profile.trip_id;
  if stored_hash is null or extensions.crypt(p_pin, stored_hash) <> stored_hash then
    raise exception 'Incorrect family PIN' using errcode = '28P01';
  end if;

  insert into public.family_user_sessions (auth_user_id, family_user_id, trip_id)
  values (auth.uid(), selected_profile.id, selected_profile.trip_id)
  on conflict (auth_user_id) do update
    set family_user_id = excluded.family_user_id,
        trip_id = excluded.trip_id,
        created_at = now();

  return query select selected_profile.id, selected_profile.display_name,
    selected_profile.role, selected_profile.avatar_emoji;
end;
$$;

revoke all on function public.claim_family_profile(uuid, text) from public, anon;
grant execute on function public.claim_family_profile(uuid, text) to authenticated;

create or replace function public.reorder_itinerary_day(p_event_ids uuid[])
returns setof public.itinerary_events
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  target_trip uuid;
  target_date date;
  supplied_count integer;
  day_count integer;
  start_slots time[];
  end_slots time[];
  event_id uuid;
  position integer;
begin
  if auth.uid() is null or coalesce(array_length(p_event_ids, 1), 0) = 0 then
    raise exception 'A signed-in user and event IDs are required' using errcode = '42501';
  end if;

  select e.trip_id, e.date into target_trip, target_date
  from public.itinerary_events e where e.id = p_event_ids[1];

  if target_trip is null or not private.is_trip_member(target_trip) then
    raise exception 'Trip access denied' using errcode = '42501';
  end if;

  select count(distinct u.value) into supplied_count
  from unnest(p_event_ids) as u(value);
  if supplied_count <> array_length(p_event_ids, 1) then
    raise exception 'Duplicate event IDs are not allowed' using errcode = '22023';
  end if;

  select count(*) into day_count
  from public.itinerary_events e
  where e.trip_id = target_trip and e.date = target_date;

  if day_count <> supplied_count or (
    select count(*) from public.itinerary_events e
    where e.id = any(p_event_ids) and e.trip_id = target_trip and e.date = target_date
  ) <> day_count then
    raise exception 'Reorder must include every event from exactly one day' using errcode = '22023';
  end if;

  perform 1 from public.itinerary_events e
  where e.trip_id = target_trip and e.date = target_date for update;

  select array_agg(e.start_time order by e.sort_order, e.id),
         array_agg(e.end_time order by e.sort_order, e.id)
  into start_slots, end_slots
  from public.itinerary_events e
  where e.trip_id = target_trip and e.date = target_date;

  for position, event_id in
    select u.ordinality::integer, u.value
    from unnest(p_event_ids) with ordinality as u(value, ordinality)
  loop
    update public.itinerary_events
    set sort_order = position * 100,
        start_time = start_slots[position],
        end_time = end_slots[position],
        updated_at = now()
    where id = event_id;
  end loop;

  return query select e.* from public.itinerary_events e
    where e.trip_id = target_trip and e.date = target_date
    order by e.sort_order, e.id;
end;
$$;

revoke all on function public.reorder_itinerary_day(uuid[]) from public, anon;
grant execute on function public.reorder_itinerary_day(uuid[]) to authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger itinerary_events_touch_updated_at
before update on public.itinerary_events
for each row execute function public.touch_updated_at();

alter table public.trips enable row level security;
alter table public.family_users enable row level security;
alter table public.family_user_sessions enable row level security;
alter table public.itinerary_events enable row level security;
alter table public.suggestions enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.bookings enable row level security;
alter table public.restaurants enable row level security;
alter table public.accommodations enable row level security;
alter table public.phrasebook enable row level security;
alter table public.signs_symbols enable row level security;
alter table public.place_facts enable row level security;

create policy "members read trips" on public.trips for select to authenticated
  using (private.is_trip_member(id));
create policy "members read profiles" on public.family_users for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "users read their session" on public.family_user_sessions for select to authenticated
  using (auth_user_id = auth.uid());

create policy "members read itinerary" on public.itinerary_events for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members update itinerary" on public.itinerary_events for update to authenticated
  using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));

create policy "members read suggestions" on public.suggestions for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members read comments" on public.comments for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members read votes" on public.votes for select to authenticated
  using (exists (select 1 from public.suggestions s where s.id = suggestion_id and private.is_trip_member(s.trip_id)));
create policy "members read bookings" on public.bookings for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members read restaurants" on public.restaurants for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members read accommodations" on public.accommodations for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members read phrases" on public.phrasebook for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members read signs" on public.signs_symbols for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members read facts" on public.place_facts for select to authenticated
  using (private.is_trip_member(trip_id));

-- Direct writes use the service role for seeding. Later milestones will add narrow
-- insert/update policies alongside their corresponding user interfaces.

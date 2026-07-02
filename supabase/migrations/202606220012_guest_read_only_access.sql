-- Add a read-only Guest profile with its own PIN.
-- Guests can read the trip after login, but cannot edit, comment, vote, reorder,
-- create ideas, or make parent decisions.

alter table public.family_users
  drop constraint if exists family_users_display_name_check;

alter table public.family_users
  add constraint family_users_display_name_check
  check (display_name in ('Nigel','Sarah','Harrison','Evelyn','Guest'));

alter table public.family_users
  drop constraint if exists family_users_role_check;

alter table public.family_users
  add constraint family_users_role_check
  check (role in ('parent','teen','member','guest'));

create table if not exists private.guest_access (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_guest_pin(p_trip_id uuid, p_pin text)
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
    raise exception 'Guest PIN must contain at least six digits' using errcode = '22023';
  end if;
  insert into private.guest_access (trip_id, pin_hash, updated_at)
  values (p_trip_id, extensions.crypt(p_pin, extensions.gen_salt('bf')), now())
  on conflict (trip_id) do update
    set pin_hash = excluded.pin_hash,
        updated_at = now();
end;
$$;

revoke all on function public.set_guest_pin(uuid, text) from public, anon, authenticated;
grant execute on function public.set_guest_pin(uuid, text) to service_role;

create or replace function private.current_family_user_role(target_trip_id uuid)
returns text
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select profile.role
  from public.family_user_sessions session
  join public.family_users profile on profile.id = session.family_user_id
  where session.auth_user_id = auth.uid()
    and session.trip_id = target_trip_id
  limit 1;
$$;

revoke all on function private.current_family_user_role(uuid) from public;
grant execute on function private.current_family_user_role(uuid) to authenticated;

create or replace function private.can_edit_trip(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select coalesce(private.current_family_user_role(target_trip_id), '') <> 'guest'
    and private.is_trip_member(target_trip_id);
$$;

revoke all on function private.can_edit_trip(uuid) from public;
grant execute on function private.can_edit_trip(uuid) to authenticated;

insert into public.family_users (trip_id, display_name, role, avatar_emoji)
select trip.id, 'Guest', 'guest', '🧳'
from public.trips trip
where trip.slug = 'japan-2026'
on conflict (trip_id, display_name) do update
  set role = 'guest',
      avatar_emoji = excluded.avatar_emoji;

insert into private.guest_access (trip_id, pin_hash, updated_at)
select trip.id, extensions.crypt('123456', extensions.gen_salt('bf')), now()
from public.trips trip
where trip.slug = 'japan-2026'
on conflict (trip_id) do update
  set pin_hash = excluded.pin_hash,
      updated_at = now();

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
    when 'Nigel' then 1
    when 'Sarah' then 2
    when 'Harrison' then 3
    when 'Evelyn' then 4
    when 'Guest' then 5
    else 6
  end;
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

  if selected_profile.role = 'guest' then
    select pin_hash into stored_hash from private.guest_access where trip_id = selected_profile.trip_id;
    if stored_hash is null or extensions.crypt(p_pin, stored_hash) <> stored_hash then
      raise exception 'Incorrect family PIN' using errcode = '28P01';
    end if;
  else
    select pin_hash into stored_hash from private.trip_access where trip_id = selected_profile.trip_id;
    if stored_hash is null or extensions.crypt(p_pin, stored_hash) <> stored_hash then
      raise exception 'Incorrect family PIN' using errcode = '28P01';
    end if;
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

  if target_trip is null or not private.can_edit_trip(target_trip) then
    raise exception 'Read-only guests cannot change the itinerary' using errcode = '42501';
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

create or replace function public.update_itinerary_event(
  p_event_id uuid,
  p_title text,
  p_description text,
  p_start_time time,
  p_end_time time,
  p_google_maps_url text,
  p_status text,
  p_travel_mode text,
  p_travel_details text
)
returns public.itinerary_events
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  existing_event public.itinerary_events%rowtype;
  updated_event public.itinerary_events%rowtype;
begin
  select * into existing_event
  from public.itinerary_events
  where id = p_event_id
  for update;

  if existing_event.id is null or not private.can_edit_trip(existing_event.trip_id) then
    raise exception 'Read-only guests cannot edit the itinerary' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if p_end_time <= p_start_time then
    raise exception 'End time must be after start time' using errcode = '22023';
  end if;
  if p_status not in ('draft', 'confirmed', 'decision_needed', 'to_book', 'cancelled', 'done') then
    raise exception 'Invalid itinerary status' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_google_maps_url, '')), '') is not null
     and p_google_maps_url !~ '^https://(www\.)?google\.(com|co\.jp)/maps/' then
    raise exception 'Map link must be a Google Maps HTTPS URL' using errcode = '22023';
  end if;

  update public.itinerary_events
  set title = trim(p_title),
      description = nullif(trim(coalesce(p_description, '')), ''),
      start_time = p_start_time,
      end_time = p_end_time,
      google_maps_url = nullif(trim(coalesce(p_google_maps_url, '')), ''),
      status = p_status,
      travel_mode = nullif(trim(coalesce(p_travel_mode, '')), ''),
      travel_details = nullif(trim(coalesce(p_travel_details, '')), ''),
      updated_at = now()
  where id = p_event_id
  returning * into updated_event;

  return updated_event;
end;
$$;

revoke all on function public.update_itinerary_event(uuid, text, text, time, time, text, text, text, text) from public, anon;
grant execute on function public.update_itinerary_event(uuid, text, text, time, time, text, text, text, text) to authenticated;

-- Retire older itinerary edit RPC signatures so guests cannot bypass the newer
-- read-only check by calling a legacy overload directly.
drop function if exists public.update_itinerary_event(uuid, text, text, time, time, text);
drop function if exists public.update_itinerary_event(uuid, text, text, time, time, text, text);

drop policy if exists "members add event comments" on public.comments;

create policy "members add event comments"
on public.comments for insert to authenticated
with check (
  private.can_edit_trip(trip_id)
  and user_id = private.current_family_user_id(trip_id)
  and event_id is not null
  and suggestion_id is null
  and exists (
    select 1 from public.itinerary_events event
    where event.id = comments.event_id and event.trip_id = comments.trip_id
  )
);

create or replace function public.create_suggestion(
  p_title text,
  p_description text,
  p_target_event_id uuid,
  p_city text,
  p_date date,
  p_preferred_time text,
  p_google_maps_url text
)
returns public.suggestions
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  member_session public.family_user_sessions%rowtype;
  created_suggestion public.suggestions%rowtype;
begin
  select * into member_session
  from public.family_user_sessions
  where auth_user_id = auth.uid()
  limit 1;

  if member_session.auth_user_id is null or not private.can_edit_trip(member_session.trip_id) then
    raise exception 'Read-only guests cannot add ideas' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Suggestion title is required' using errcode = '22023';
  end if;
  if p_target_event_id is not null and not exists (
    select 1 from public.itinerary_events event
    where event.id = p_target_event_id and event.trip_id = member_session.trip_id
  ) then
    raise exception 'Target activity is not part of this trip' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_google_maps_url, '')), '') is not null
     and p_google_maps_url !~ '^https://(www\.)?google\.(com|co\.jp)/maps/' then
    raise exception 'Map link must be a Google Maps HTTPS URL' using errcode = '22023';
  end if;

  insert into public.suggestions (
    trip_id, target_event_id, suggested_by, title, description,
    city, date, preferred_time, google_maps_url
  ) values (
    member_session.trip_id,
    p_target_event_id,
    member_session.family_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    p_date,
    nullif(trim(coalesce(p_preferred_time, '')), ''),
    nullif(trim(coalesce(p_google_maps_url, '')), '')
  ) returning * into created_suggestion;

  return created_suggestion;
end;
$$;

revoke all on function public.create_suggestion(text, text, uuid, text, date, text, text) from public, anon;
grant execute on function public.create_suggestion(text, text, uuid, text, date, text, text) to authenticated;

create or replace function public.cast_suggestion_vote(
  p_suggestion_id uuid,
  p_vote text
)
returns public.suggestions
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  selected_suggestion public.suggestions%rowtype;
  family_user uuid;
  updated_suggestion public.suggestions%rowtype;
begin
  select * into selected_suggestion
  from public.suggestions
  where id = p_suggestion_id
  for update;

  if selected_suggestion.id is null or not private.can_edit_trip(selected_suggestion.trip_id) then
    raise exception 'Read-only guests cannot vote on ideas' using errcode = '42501';
  end if;
  if p_vote not in ('for', 'against') then
    raise exception 'Vote must be for or against' using errcode = '22023';
  end if;

  family_user := private.current_family_user_id(selected_suggestion.trip_id);
  if family_user is null then
    raise exception 'Family profile required' using errcode = '42501';
  end if;

  insert into public.votes (suggestion_id, user_id, vote)
  values (p_suggestion_id, family_user, p_vote)
  on conflict (suggestion_id, user_id) do update
    set vote = excluded.vote, created_at = now();

  update public.suggestions suggestion
  set votes_for = (
        select count(*) from public.votes vote
        where vote.suggestion_id = p_suggestion_id and vote.vote = 'for'
      ),
      votes_against = (
        select count(*) from public.votes vote
        where vote.suggestion_id = p_suggestion_id and vote.vote = 'against'
      )
  where suggestion.id = p_suggestion_id
  returning * into updated_suggestion;

  return updated_suggestion;
end;
$$;

revoke all on function public.cast_suggestion_vote(uuid, text) from public, anon;
grant execute on function public.cast_suggestion_vote(uuid, text) to authenticated;

create or replace function public.update_suggestion(
  p_suggestion_id uuid,
  p_title text,
  p_description text,
  p_target_event_id uuid,
  p_city text,
  p_date date,
  p_preferred_time text,
  p_google_maps_url text
)
returns public.suggestions
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  selected_suggestion public.suggestions%rowtype;
  current_profile uuid;
  updated_suggestion public.suggestions%rowtype;
begin
  select * into selected_suggestion
  from public.suggestions
  where id = p_suggestion_id
  for update;

  if selected_suggestion.id is null or not private.can_edit_trip(selected_suggestion.trip_id) then
    raise exception 'Read-only guests cannot edit ideas' using errcode = '42501';
  end if;
  current_profile := private.current_family_user_id(selected_suggestion.trip_id);
  if current_profile is null or selected_suggestion.suggested_by <> current_profile then
    raise exception 'Only the person who suggested this idea can edit it' using errcode = '42501';
  end if;
  if selected_suggestion.status <> 'open' then
    raise exception 'Only open ideas can be edited' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Suggestion title is required' using errcode = '22023';
  end if;
  if p_target_event_id is not null and not exists (
    select 1 from public.itinerary_events event
    where event.id = p_target_event_id and event.trip_id = selected_suggestion.trip_id
  ) then
    raise exception 'Target activity is not part of this trip' using errcode = '22023';
  end if;
  if p_date is not null and not exists (
    select 1 from public.trips trip
    where trip.id = selected_suggestion.trip_id
      and p_date between trip.start_date and trip.end_date
  ) then
    raise exception 'Suggested date must be within the trip' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_google_maps_url, '')), '') is not null
     and p_google_maps_url !~ '^https://(www\.)?google\.(com|co\.jp)/maps/' then
    raise exception 'Map link must be a Google Maps HTTPS URL' using errcode = '22023';
  end if;

  update public.suggestions
  set title = trim(p_title),
      description = nullif(trim(coalesce(p_description, '')), ''),
      target_event_id = p_target_event_id,
      city = nullif(trim(coalesce(p_city, '')), ''),
      date = p_date,
      preferred_time = nullif(trim(coalesce(p_preferred_time, '')), ''),
      google_maps_url = nullif(trim(coalesce(p_google_maps_url, '')), '')
  where id = p_suggestion_id
  returning * into updated_suggestion;

  return updated_suggestion;
end;
$$;

revoke all on function public.update_suggestion(uuid, text, text, uuid, text, date, text, text) from public, anon;
grant execute on function public.update_suggestion(uuid, text, text, uuid, text, date, text, text) to authenticated;

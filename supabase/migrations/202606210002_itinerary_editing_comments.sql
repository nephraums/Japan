-- Milestone two: safe itinerary editing and event comments.

create or replace function private.current_family_user_id(target_trip_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select s.family_user_id
  from public.family_user_sessions s
  where s.auth_user_id = auth.uid() and s.trip_id = target_trip_id
  limit 1;
$$;

revoke all on function private.current_family_user_id(uuid) from public;
grant execute on function private.current_family_user_id(uuid) to authenticated;

drop policy if exists "members update itinerary" on public.itinerary_events;

create or replace function public.update_itinerary_event(
  p_event_id uuid,
  p_title text,
  p_description text,
  p_start_time time,
  p_end_time time,
  p_google_maps_url text
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

  if existing_event.id is null or not private.is_trip_member(existing_event.trip_id) then
    raise exception 'Trip access denied' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if p_end_time <= p_start_time then
    raise exception 'End time must be after start time' using errcode = '22023';
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
      updated_at = now()
  where id = p_event_id
  returning * into updated_event;

  return updated_event;
end;
$$;

revoke all on function public.update_itinerary_event(uuid, text, text, time, time, text) from public, anon;
grant execute on function public.update_itinerary_event(uuid, text, text, time, time, text) to authenticated;

create policy "members add event comments"
on public.comments for insert to authenticated
with check (
  private.is_trip_member(trip_id)
  and user_id = private.current_family_user_id(trip_id)
  and event_id is not null
  and suggestion_id is null
  and exists (
    select 1 from public.itinerary_events event
    where event.id = comments.event_id and event.trip_id = comments.trip_id
  )
);

create index if not exists comments_trip_event_idx
on public.comments(trip_id, event_id, created_at);

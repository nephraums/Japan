create or replace function public.update_itinerary_event(
  p_event_id uuid,
  p_title text,
  p_description text,
  p_start_time time,
  p_end_time time,
  p_google_maps_url text,
  p_status text
)
returns public.itinerary_events
language plpgsql
security definer
set search_path = public, private, pg_temp
as $function$
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
      updated_at = now()
  where id = p_event_id
  returning * into updated_event;

  return updated_event;
end;
$function$;

revoke all on function public.update_itinerary_event(uuid, text, text, time, time, text, text) from public, anon;
grant execute on function public.update_itinerary_event(uuid, text, text, time, time, text, text) to authenticated;

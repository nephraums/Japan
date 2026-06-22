-- Milestone three follow-up: suggestion creators can edit their open ideas.

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
as $update_suggestion$
declare
  selected_suggestion public.suggestions%rowtype;
  current_profile uuid;
  updated_suggestion public.suggestions%rowtype;
begin
  select * into selected_suggestion
  from public.suggestions
  where id = p_suggestion_id
  for update;

  if selected_suggestion.id is null or not private.is_trip_member(selected_suggestion.trip_id) then
    raise exception 'Trip access denied' using errcode = '42501';
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
$update_suggestion$;

revoke all on function public.update_suggestion(uuid, text, text, uuid, text, date, text, text) from public, anon;
grant execute on function public.update_suggestion(uuid, text, text, uuid, text, date, text, text) to authenticated;

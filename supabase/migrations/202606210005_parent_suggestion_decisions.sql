-- Milestone four: Nigel and Sarah (role = parent) decide suggestion outcomes.

create or replace function public.decide_suggestion(
  p_suggestion_id uuid,
  p_decision text,
  p_accept_mode text,
  p_date date,
  p_city text,
  p_start_time time,
  p_end_time time
)
returns public.suggestions
language plpgsql
security definer
set search_path = public, private, pg_temp
as $decide_suggestion$
declare
  selected_suggestion public.suggestions%rowtype;
  parent_profile public.family_users%rowtype;
  trip_record public.trips%rowtype;
  next_order numeric;
  updated_suggestion public.suggestions%rowtype;
begin
  select * into selected_suggestion
  from public.suggestions
  where id = p_suggestion_id
  for update;

  if selected_suggestion.id is null or not private.is_trip_member(selected_suggestion.trip_id) then
    raise exception 'Trip access denied' using errcode = '42501';
  end if;

  select profile.* into parent_profile
  from public.family_users profile
  where profile.id = private.current_family_user_id(selected_suggestion.trip_id);

  if parent_profile.id is null or parent_profile.role <> 'parent' then
    raise exception 'Only Nigel or Sarah can decide ideas' using errcode = '42501';
  end if;
  if selected_suggestion.status not in ('open', 'parked') then
    raise exception 'This idea has already been decided' using errcode = '22023';
  end if;
  if p_decision not in ('accept', 'park', 'reject') then
    raise exception 'Decision must be accept, park or reject' using errcode = '22023';
  end if;

  if p_decision = 'park' then
    update public.suggestions set status = 'parked'
    where id = p_suggestion_id returning * into updated_suggestion;
    return updated_suggestion;
  end if;

  if p_decision = 'reject' then
    update public.suggestions set status = 'rejected'
    where id = p_suggestion_id returning * into updated_suggestion;
    return updated_suggestion;
  end if;

  if p_accept_mode = 'replace' then
    if selected_suggestion.target_event_id is null then
      raise exception 'This idea is not linked to an itinerary activity' using errcode = '22023';
    end if;

    update public.itinerary_events event
    set title = selected_suggestion.title,
        description = selected_suggestion.description,
        city = coalesce(selected_suggestion.city, event.city),
        google_maps_url = selected_suggestion.google_maps_url,
        status = 'draft',
        updated_at = now()
    where event.id = selected_suggestion.target_event_id
      and event.trip_id = selected_suggestion.trip_id;

    if not found then
      raise exception 'Linked itinerary activity was not found' using errcode = '22023';
    end if;
  elsif p_accept_mode = 'add' then
    select * into trip_record from public.trips where id = selected_suggestion.trip_id;
    if p_date is null or p_date not between trip_record.start_date and trip_record.end_date then
      raise exception 'Choose a date within the trip' using errcode = '22023';
    end if;
    if length(trim(coalesce(p_city, ''))) = 0 then
      raise exception 'Choose a city for the new activity' using errcode = '22023';
    end if;
    if p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
      raise exception 'End time must be after start time' using errcode = '22023';
    end if;

    select coalesce(max(event.sort_order), 0) + 100 into next_order
    from public.itinerary_events event
    where event.trip_id = selected_suggestion.trip_id and event.date = p_date;

    insert into public.itinerary_events (
      trip_id, date, city, title, description, start_time, end_time,
      sort_order, status, category, google_maps_url, created_by
    ) values (
      selected_suggestion.trip_id,
      p_date,
      trim(p_city),
      selected_suggestion.title,
      selected_suggestion.description,
      p_start_time,
      p_end_time,
      next_order,
      'draft',
      'activity',
      selected_suggestion.google_maps_url,
      parent_profile.id
    );
  else
    raise exception 'Choose whether to replace or add the accepted idea' using errcode = '22023';
  end if;

  update public.suggestions set status = 'accepted'
  where id = p_suggestion_id returning * into updated_suggestion;
  return updated_suggestion;
end;
$decide_suggestion$;

revoke all on function public.decide_suggestion(uuid, text, text, date, text, time, time) from public, anon;
grant execute on function public.decide_suggestion(uuid, text, text, date, text, time, time) to authenticated;

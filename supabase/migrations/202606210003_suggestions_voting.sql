-- Milestone three: family suggestions and one vote per person.

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
as $create_suggestion$
declare
  member_session public.family_user_sessions%rowtype;
  created_suggestion public.suggestions%rowtype;
begin
  select * into member_session
  from public.family_user_sessions
  where auth_user_id = auth.uid()
  limit 1;

  if member_session.auth_user_id is null then
    raise exception 'Family session required' using errcode = '42501';
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
$create_suggestion$;

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
as $cast_vote$
declare
  selected_suggestion public.suggestions%rowtype;
  family_user uuid;
  updated_suggestion public.suggestions%rowtype;
begin
  select * into selected_suggestion
  from public.suggestions
  where id = p_suggestion_id
  for update;

  if selected_suggestion.id is null or not private.is_trip_member(selected_suggestion.trip_id) then
    raise exception 'Trip access denied' using errcode = '42501';
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
$cast_vote$;

revoke all on function public.cast_suggestion_vote(uuid, text) from public, anon;
grant execute on function public.cast_suggestion_vote(uuid, text) to authenticated;

create index if not exists votes_user_idx on public.votes(user_id, suggestion_id);

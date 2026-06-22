-- Run this whole file in the Supabase SQL editor if seeding reports PostgreSQL 42883.
-- Supabase installs pgcrypto in the extensions schema, so its functions must be qualified.

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

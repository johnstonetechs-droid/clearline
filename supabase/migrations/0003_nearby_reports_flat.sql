-- ClearWire Field Reporter — nearby_reports returning flat lat/lng
--
-- Why: `returns setof reports` serializes the geography column as a WKB
-- hex string over PostgREST, which forces the client to parse binary.
-- Returning a custom row type with ST_X/ST_Y as plain doubles means the
-- client gets numbers and can skip geometry parsing entirely.

drop function if exists public.nearby_reports(double precision, double precision, numeric, int);

create or replace function public.nearby_reports(
  lat double precision,
  lng double precision,
  radius_miles numeric default 5,
  since_hours int default 72
)
returns table (
  id uuid,
  created_at timestamptz,
  damage_type text,
  description text,
  photo_url text,
  latitude double precision,
  longitude double precision,
  accuracy_meters numeric,
  status text,
  verified_by_pro boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    r.id,
    r.created_at,
    r.damage_type,
    r.description,
    r.photo_url,
    ST_Y(r.location::geometry) as latitude,
    ST_X(r.location::geometry) as longitude,
    r.accuracy_meters,
    r.status,
    r.verified_by_pro
  from public.reports r
  where r.is_test = false
    and r.created_at > now() - make_interval(hours => since_hours)
    and ST_DWithin(
      r.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_miles * 1609.34
    )
  order by r.created_at desc
  limit 200;
$$;

revoke all on function public.nearby_reports(double precision, double precision, numeric, int) from public;
grant execute on function public.nearby_reports(double precision, double precision, numeric, int) to anon, authenticated;

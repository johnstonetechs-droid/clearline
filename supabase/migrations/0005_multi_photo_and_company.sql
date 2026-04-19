-- ClearWire Field Reporter — multi-photo support + affected company
--
-- Why:
-- 1. Allow 1-5 photos per report (overview + close-up + angles). Using
--    a text[] keeps the write path simple; migrate to a child table
--    later if we need per-photo captions/ordering.
-- 2. Capture which provider/company is affected so pro users can filter
--    the map by their own customers. text for v1; normalize into a
--    `companies` table later if needed.
--
-- Both insert_report and nearby_reports RPCs are updated to match.

-- ============================================================================
-- reports table: photo_url (singular) → photo_urls (array) + affected_company
-- ============================================================================

alter table public.reports
  add column if not exists photo_urls text[] not null default '{}';

-- Backfill the array from any existing singular photo_url rows.
update public.reports
set photo_urls = array[photo_url]
where photo_url is not null
  and coalesce(array_length(photo_urls, 1), 0) = 0;

alter table public.reports
  drop column if exists photo_url;

alter table public.reports
  add constraint photo_urls_nonempty check (array_length(photo_urls, 1) between 1 and 5);

alter table public.reports
  add column if not exists affected_company text;

-- ============================================================================
-- insert_report RPC: takes photo_urls[] (plus optional affected_company)
-- ============================================================================

drop function if exists public.insert_report(
  text, text, text, double precision, double precision, numeric, text, boolean
);

create or replace function public.insert_report(
  p_damage_type text,
  p_description text,
  p_photo_urls text[],
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_meters numeric,
  p_reporter_device_id text,
  p_is_test boolean,
  p_affected_company text default null
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if p_damage_type not in (
    'downed_line','leaning_pole','tree_on_wire',
    'transformer','vegetation','other'
  ) then
    raise exception 'invalid damage_type: %', p_damage_type;
  end if;

  if p_photo_urls is null or array_length(p_photo_urls, 1) is null then
    raise exception 'at least one photo_url required';
  end if;

  if array_length(p_photo_urls, 1) > 5 then
    raise exception 'at most 5 photos per report';
  end if;

  if p_latitude is null or p_longitude is null then
    raise exception 'latitude and longitude required';
  end if;

  insert into public.reports (
    reporter_device_id,
    damage_type,
    description,
    photo_urls,
    location,
    accuracy_meters,
    is_test,
    affected_company
  ) values (
    p_reporter_device_id,
    p_damage_type,
    p_description,
    p_photo_urls,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_accuracy_meters,
    coalesce(p_is_test, false),
    nullif(trim(p_affected_company), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.insert_report(
  text, text, text[], double precision, double precision, numeric, text, boolean, text
) from public;

grant execute on function public.insert_report(
  text, text, text[], double precision, double precision, numeric, text, boolean, text
) to anon, authenticated;

-- ============================================================================
-- nearby_reports RPC: return photo_urls[] + affected_company
-- ============================================================================

drop function if exists public.nearby_reports(
  double precision, double precision, numeric, int
);

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
  photo_urls text[],
  latitude double precision,
  longitude double precision,
  accuracy_meters numeric,
  status text,
  verified_by_pro boolean,
  affected_company text
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
    r.photo_urls,
    ST_Y(r.location::geometry) as latitude,
    ST_X(r.location::geometry) as longitude,
    r.accuracy_meters,
    r.status,
    r.verified_by_pro,
    r.affected_company
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

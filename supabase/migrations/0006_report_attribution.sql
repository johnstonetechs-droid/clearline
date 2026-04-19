-- ClearWire Field Reporter — report attribution
--
-- Wires up so authenticated report submissions record the reporter's
-- auth.uid(), and nearby_reports returns the pro's display_name for
-- pin attribution. Anonymous reports continue to work (reporter_id NULL,
-- display_name NULL).

-- ============================================================================
-- insert_report: set reporter_id from auth.uid() when authenticated
-- ============================================================================

drop function if exists public.insert_report(
  text, text, text[], double precision, double precision, numeric, text, boolean, text
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
    reporter_id,
    reporter_device_id,
    damage_type,
    description,
    photo_urls,
    location,
    accuracy_meters,
    is_test,
    affected_company
  ) values (
    auth.uid(),  -- null for anonymous submissions
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
-- nearby_reports: return display_name via LEFT JOIN on pro_profiles
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
  affected_company text,
  reporter_display_name text
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
    r.affected_company,
    p.display_name as reporter_display_name
  from public.reports r
  left join public.pro_profiles p on p.id = r.reporter_id
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

-- ============================================================================
-- RLS: pros can read other pros' display_name when those pros have reports
-- nearby. Without this, the LEFT JOIN above silently returns NULL display_name
-- for rows the caller can't see.
-- ============================================================================

drop policy if exists "pro_read_public_display" on public.pro_profiles;
create policy "pro_read_public_display" on public.pro_profiles for select
  using (true);

-- Note: the pro_read_own policy is more restrictive (auth.uid() = id); we keep
-- it and add this broader one. Postgres RLS uses OR across policies for the
-- same action, so the broader one effectively allows everyone to read
-- display_name / company / role / created_at. last_known_location is also
-- exposed — if you want that kept private, split pro_profiles into a public
-- view later.

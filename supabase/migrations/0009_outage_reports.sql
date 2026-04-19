-- ClearWire Field Reporter — outage_reports table and RPCs
--
-- Separate from damage reports (public.reports): damage = physical
-- infrastructure damage with a photo and GPS of the damage site; outage =
-- customer-side service loss with a provider + service_type, located at
-- the reporter's service address. Different schemas, different audiences,
-- different workflows; keeping them in separate tables avoids sparse
-- columns and makes queries readable.

-- ============================================================================
-- Table
-- ============================================================================
create table if not exists public.outage_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_device_id text,
  service_type text not null check (service_type in (
    'internet','cable_tv','phone','electric','water','other'
  )),
  provider_company text not null,
  service_location geography(point, 4326) not null,
  description text,
  status text not null default 'reported' check (status in (
    'reported','confirmed','resolved','invalid'
  )),
  external_ticket text,
  is_test boolean not null default false
);

create index if not exists outage_reports_location_idx
  on public.outage_reports using gist(service_location);
create index if not exists outage_reports_created_at_idx
  on public.outage_reports(created_at desc);
create index if not exists outage_reports_provider_idx
  on public.outage_reports(provider_company);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.outage_reports enable row level security;

drop policy if exists "outage_read" on public.outage_reports;
create policy "outage_read" on public.outage_reports for select
  using (is_test = false or auth.uid() is not null);

drop policy if exists "outage_insert" on public.outage_reports;
create policy "outage_insert" on public.outage_reports for insert
  with check (true);

drop policy if exists "outage_update_pro" on public.outage_reports;
create policy "outage_update_pro" on public.outage_reports for update
  using (exists (select 1 from public.pro_profiles where id = auth.uid()));

-- ============================================================================
-- insert_outage_report RPC
-- ============================================================================
drop function if exists public.insert_outage_report(
  text, text, text, double precision, double precision, text, text, boolean
);

create or replace function public.insert_outage_report(
  p_service_type text,
  p_provider_company text,
  p_description text,
  p_latitude double precision,
  p_longitude double precision,
  p_reporter_device_id text,
  p_external_ticket text default null,
  p_is_test boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if p_service_type not in ('internet','cable_tv','phone','electric','water','other') then
    raise exception 'invalid service_type: %', p_service_type;
  end if;
  if p_provider_company is null or length(trim(p_provider_company)) = 0 then
    raise exception 'provider_company required';
  end if;
  if p_latitude is null or p_longitude is null then
    raise exception 'service location required';
  end if;

  insert into public.outage_reports (
    reporter_id,
    reporter_device_id,
    service_type,
    provider_company,
    service_location,
    description,
    external_ticket,
    is_test
  ) values (
    auth.uid(),
    p_reporter_device_id,
    p_service_type,
    trim(p_provider_company),
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    nullif(trim(p_description), ''),
    nullif(trim(p_external_ticket), ''),
    coalesce(p_is_test, false)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.insert_outage_report(
  text, text, text, double precision, double precision, text, text, boolean
) from public;

grant execute on function public.insert_outage_report(
  text, text, text, double precision, double precision, text, text, boolean
) to anon, authenticated;

-- ============================================================================
-- nearby_outages RPC
-- ============================================================================
drop function if exists public.nearby_outages(
  double precision, double precision, numeric, int
);

create or replace function public.nearby_outages(
  lat double precision,
  lng double precision,
  radius_miles numeric default 10,
  since_hours int default 72
)
returns table (
  id uuid,
  created_at timestamptz,
  resolved_at timestamptz,
  service_type text,
  provider_company text,
  description text,
  latitude double precision,
  longitude double precision,
  status text,
  external_ticket text,
  reporter_display_name text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    o.id,
    o.created_at,
    o.resolved_at,
    o.service_type,
    o.provider_company,
    o.description,
    ST_Y(o.service_location::geometry) as latitude,
    ST_X(o.service_location::geometry) as longitude,
    o.status,
    o.external_ticket,
    p.display_name as reporter_display_name
  from public.outage_reports o
  left join public.pro_profiles p on p.id = o.reporter_id
  where o.is_test = false
    and o.created_at > now() - make_interval(hours => since_hours)
    and ST_DWithin(
      o.service_location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_miles * 1609.34
    )
  order by o.created_at desc
  limit 500;
$$;

revoke all on function public.nearby_outages(double precision, double precision, numeric, int) from public;
grant execute on function public.nearby_outages(double precision, double precision, numeric, int) to anon, authenticated;

-- ClearWire Field Reporter — match pros to a report for proximity alerts
--
-- Called from the notify-nearby-pros Edge Function with the new report's
-- id. Returns pros whose last_known_location is within their own
-- alert_radius_miles of the report, and who have an Expo push token.
-- Excludes the reporter themselves so pros don't get alerts for their
-- own submissions.

create or replace function public.pros_within_radius_of_report(p_report_id uuid)
returns table (
  id uuid,
  display_name text,
  expo_push_token text,
  distance_miles numeric
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with r as (
    select id, location, reporter_id
    from public.reports
    where id = p_report_id
  )
  select
    p.id,
    p.display_name,
    p.expo_push_token,
    (ST_Distance(p.last_known_location, (select location from r)) / 1609.34)::numeric(10, 2)
      as distance_miles
  from public.pro_profiles p
  where p.expo_push_token is not null
    and p.last_known_location is not null
    and ST_DWithin(
      p.last_known_location,
      (select location from r),
      p.alert_radius_miles * 1609.34
    )
    and p.id is distinct from (select reporter_id from r);
$$;

revoke all on function public.pros_within_radius_of_report(uuid) from public;
grant execute on function public.pros_within_radius_of_report(uuid) to service_role;

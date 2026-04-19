-- ClearWire Field Reporter — display_name uniqueness
--
-- BACKLOG called this "recommended". Case-insensitive to avoid
-- Jane/jane duplicates. Partial index so NULL display_name is
-- permitted (pros can skip the field).

create unique index if not exists pro_profiles_display_name_unique
  on public.pro_profiles (lower(display_name))
  where display_name is not null;

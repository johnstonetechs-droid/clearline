import type { ServiceType } from '@clearwire/supabase';

// Highest → lowest. Electric is most safety-critical (downed live wire);
// water next (flooding/contamination); comms below those.
const SERVICE_PRIORITY: ServiceType[] = [
  'electric',
  'water',
  'internet',
  'cable_tv',
  'phone',
  'other',
];

/**
 * Pick the most safety-critical service from a services_affected array.
 * Used for map-pin glyph + color when a damage report has multiple services.
 * Returns null when the array is empty/null so callers can fall back to
 * damage_type-based rendering.
 */
export function primaryService(
  services: ServiceType[] | null | undefined
): ServiceType | null {
  if (!services || services.length === 0) return null;
  for (const s of SERVICE_PRIORITY) {
    if (services.includes(s)) return s;
  }
  return null;
}

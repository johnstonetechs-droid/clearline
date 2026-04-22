import type { SupabaseClient } from '@supabase/supabase-js';
import type { NearbyOutage, NearbyReport } from '@clearwire/supabase';

import { DEFAULT_RADIUS_MILES, DEFAULT_SINCE_HOURS } from './constants';

export interface NearbyQueryParams {
  lat: number;
  lng: number;
  radiusMiles?: number;
  sinceHours?: number;
}

export interface NearbyResult<T> {
  data: T[];
  error: string | null;
}

function normalize(params: NearbyQueryParams) {
  return {
    lat: params.lat,
    lng: params.lng,
    radius_miles: params.radiusMiles ?? DEFAULT_RADIUS_MILES,
    since_hours: params.sinceHours ?? DEFAULT_SINCE_HOURS,
  };
}

export async function fetchNearbyReports(
  client: SupabaseClient,
  params: NearbyQueryParams
): Promise<NearbyResult<NearbyReport>> {
  const { data, error } = await client.rpc('nearby_reports', normalize(params));
  return {
    data: (data ?? []) as NearbyReport[],
    error: error?.message ?? null,
  };
}

export async function fetchNearbyOutages(
  client: SupabaseClient,
  params: NearbyQueryParams
): Promise<NearbyResult<NearbyOutage>> {
  const { data, error } = await client.rpc('nearby_outages', normalize(params));
  return {
    data: (data ?? []) as NearbyOutage[],
    error: error?.message ?? null,
  };
}

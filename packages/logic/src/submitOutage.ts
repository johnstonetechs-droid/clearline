import type { ClearWireSupabase, ServiceType } from '@clearwire/supabase';

export interface SubmitOutageInput {
  supabase: ClearWireSupabase;
  serviceType: ServiceType;
  providerCompany: string;
  description?: string;
  latitude: number;
  longitude: number;
  deviceId: string;
  externalTicket?: string;
  isTest?: boolean;
}

export interface SubmitOutageResult {
  ok: true;
  outageId: string;
}

export interface SubmitOutageError {
  ok: false;
  error: string;
}

export async function submitOutage(
  input: SubmitOutageInput
): Promise<SubmitOutageResult | SubmitOutageError> {
  const {
    supabase,
    serviceType,
    providerCompany,
    description,
    latitude,
    longitude,
    deviceId,
    externalTicket,
    isTest = false,
  } = input;

  if (!providerCompany.trim()) {
    return { ok: false, error: 'Provider name required' };
  }

  const { data, error } = await supabase.rpc('insert_outage_report', {
    p_service_type: serviceType,
    p_provider_company: providerCompany.trim(),
    p_description: description ?? null,
    p_latitude: latitude,
    p_longitude: longitude,
    p_reporter_device_id: deviceId,
    p_external_ticket: externalTicket ?? null,
    p_is_test: isTest,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, outageId: data as string };
}

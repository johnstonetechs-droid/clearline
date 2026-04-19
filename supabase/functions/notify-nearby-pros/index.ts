// Supabase Edge Function: notify-nearby-pros
//
// Triggered by a Database Webhook on INSERT into public.reports. Looks up
// pros whose last_known_location is within their own alert_radius of the
// report (via the pros_within_radius_of_report RPC) and sends Expo push
// notifications to each.
//
// Deploy:
//   supabase functions deploy notify-nearby-pros --no-verify-jwt
//   supabase secrets set WEBHOOK_SECRET=<random-string>
//
// Webhook (Supabase dashboard → Database → Webhooks → Create):
//   Table:    public.reports
//   Events:   INSERT
//   Method:   POST
//   URL:      https://<project>.supabase.co/functions/v1/notify-nearby-pros
//   Headers:  x-webhook-secret: <same value as WEBHOOK_SECRET>

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

const DAMAGE_LABELS: Record<string, string> = {
  downed_line: 'Downed line',
  leaning_pole: 'Leaning pole',
  tree_on_wire: 'Tree on wire',
  transformer: 'Transformer issue',
  vegetation: 'Vegetation contact',
  other: 'Damage report',
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record?: {
    id?: string;
    is_test?: boolean;
    damage_type?: string;
    affected_company?: string | null;
  };
  old_record?: unknown;
};

type ProMatch = {
  id: string;
  display_name: string | null;
  expo_push_token: string;
  distance_miles: number;
};

Deno.serve(async (req) => {
  try {
    // Shared-secret check. The function is deployed --no-verify-jwt so
    // anyone with the URL could hit it otherwise.
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
    if (expectedSecret) {
      const got = req.headers.get('x-webhook-secret');
      if (got !== expectedSecret) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== 'INSERT' || payload.table !== 'reports') {
      return json({ skipped: 'not an INSERT on reports' });
    }

    const record = payload.record;
    if (!record?.id) {
      return json({ error: 'record.id missing' }, 400);
    }
    if (record.is_test) {
      return json({ skipped: 'test report' });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.rpc('pros_within_radius_of_report', {
      p_report_id: record.id,
    });

    if (error) {
      console.error('RPC error:', error);
      return json({ error: error.message }, 500);
    }

    const pros = (data ?? []) as ProMatch[];
    const messages = pros
      .filter((p) => typeof p.expo_push_token === 'string' && p.expo_push_token.length > 0)
      .map((p) => ({
        to: p.expo_push_token,
        title: 'Damage reported nearby',
        body: `${DAMAGE_LABELS[record.damage_type ?? 'other'] ?? 'Damage'} · ${
          Number(p.distance_miles).toFixed(1)
        } mi away${record.affected_company ? ` · ${record.affected_company}` : ''}`,
        sound: 'default',
        priority: 'high',
        data: { reportId: record.id },
      }));

    let sent = 0;
    const pushErrors: unknown[] = [];
    for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
      const batch = messages.slice(i, i + EXPO_BATCH_SIZE);
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(batch),
        });
        if (res.ok) {
          sent += batch.length;
        } else {
          pushErrors.push({ status: res.status, body: await res.text() });
        }
      } catch (e) {
        pushErrors.push({ thrown: String(e) });
      }
    }

    return json({
      sent,
      candidates: pros.length,
      errors: pushErrors,
    });
  } catch (e) {
    console.error('notify-nearby-pros failure:', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

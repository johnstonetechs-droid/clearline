# notify-nearby-pros

Edge Function that fans out Expo push notifications to pros whose last
known location is within their own `alert_radius_miles` of a freshly
inserted report.

## Deploy

Prereqs: Supabase CLI (`npm i -g supabase`) and `supabase login` done.

```sh
# One-time: link the local repo to the remote project.
supabase link --project-ref gumgyvmtquiupuifokhx

# Run the helper RPC migration. Paste into the Supabase SQL editor OR use
# the CLI if you have migrations wired up:
supabase db push  # runs pending migrations including 0007

# Generate a shared secret; anything random works.
openssl rand -hex 32  # copy the output

# Store it where the function can read it.
supabase secrets set WEBHOOK_SECRET=<paste-the-hex-string>

# Deploy. --no-verify-jwt lets the webhook call in without a session JWT;
# we authenticate it via the shared secret instead.
supabase functions deploy notify-nearby-pros --no-verify-jwt
```

## Wire up the database webhook

Dashboard → Database → **Webhooks** → **Create a new hook**:

- Name: `notify-nearby-pros`
- Table: `public.reports`
- Events: **INSERT**
- Type: **HTTP Request**
- Method: `POST`
- URL: `https://gumgyvmtquiupuifokhx.supabase.co/functions/v1/notify-nearby-pros`
- HTTP Headers:
  - `Content-Type: application/json`
  - `x-webhook-secret: <same-hex-string-you-put-in-secrets>`
- Payload: leave at default (Supabase sends `{ type, table, record, ... }`)

Save. The hook fires on every insert into `reports`.

## Verify

Submit a report from a device that's NOT the pro you're testing with,
at a location within their alert radius. Within a few seconds the pro's
device should receive a push titled "Damage reported nearby" with the
damage type and distance.

Useful logs:

- **Function logs:** Dashboard → Edge Functions → notify-nearby-pros → Logs
- **Webhook logs:** Dashboard → Database → Webhooks → click the hook → Recent Calls
- **Expo push receipts:** https://expo.dev/notifications (paste a token to inspect)

## Notes

- Test reports (`is_test = true`) are skipped.
- The reporter is never notified of their own submission (filtered out in
  the `pros_within_radius_of_report` RPC).
- If `pro_profiles.last_known_location` is NULL, that pro is skipped.
  They need to tap "Update my location now" on the profile screen at
  least once.
- Real Expo push delivery requires a development build of the app — push
  was removed from Expo Go in SDK 53. The function will still fire and
  return `sent` counts, but pushes to Expo Go tokens won't arrive.

// Placeholder periodic sync: refresh tokens (TODO) and pull busy events (TODO), upsert into external_busy_events
// Implement provider API calls before using in production.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

Deno.serve(async (_req) => {
  // Find accounts to sync
  const { data: accounts, error: accErr } = await supabaseAdmin
    .from("calendar_accounts")
    .select("id, user_id, provider, email, access_token, refresh_token, token_expires_at, sync_enabled")
    .eq("sync_enabled", true);
  if (accErr) return respond(500, { error: accErr.message });

  let upserts = 0;
  // Placeholder: for each account, fetch next 30 days busy slots from provider
  for (const acc of accounts || []) {
    // TODO: refresh token if expired, call provider API
    // For now, simulate one busy event tomorrow 9-10am UTC
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const external_id = `${acc.provider}-placeholder-${acc.user_id}-tomorrow-9`;
    const { error } = await supabaseAdmin
      .from("external_busy_events")
      .upsert({
        user_id: acc.user_id,
        provider: acc.provider,
        external_id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        summary: "Busy (placeholder)",
      }, { onConflict: "user_id,provider,external_id" });
    if (!error) upserts += 1;
  }

  return respond(200, { synced_accounts: (accounts || []).length, upserts });
});



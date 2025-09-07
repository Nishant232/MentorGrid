// Placeholder Edge Function for handling OAuth callback and storing tokens server-side.
// NOTE: Implement provider-specific code/token exchange before using in production.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), { status: 400, headers: { "content-type": "application/json" } });
}

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

// Accepts either:
// - GET:  ?provider=google|microsoft&email=...&user_id=...&code=...
// - POST: { provider, email, user_id, code }
Deno.serve(async (req) => {
  let provider: "google" | "microsoft" | null = null;
  let email: string | null = null;
  let userId: string | null = null;
  let code: string | null = null;

  if (req.method === "GET") {
    const url = new URL(req.url);
    provider = url.searchParams.get("provider") as any;
    email = url.searchParams.get("email");
    userId = url.searchParams.get("user_id");
    code = url.searchParams.get("code");
  } else if (req.method === "POST") {
    try {
      const body = await req.json();
      provider = body.provider ?? null;
      email = body.email ?? null;
      userId = body.user_id ?? null;
      code = body.code ?? null;
    } catch (_e) {
      return badRequest("invalid json body");
    }
  } else {
    return badRequest("unsupported method");
  }

  if (!provider || !email || !userId || !code) return badRequest("missing params");

  // TODO: Exchange code for tokens with provider and validate
  // const { access_token, refresh_token, expires_at } = await exchangeCode(provider, code)

  // Placeholder: store a dummy token record; replace with real values after exchange
  const { data, error } = await supabaseAdmin
    .from("calendar_accounts")
    .upsert({
      user_id: userId,
      provider,
      email,
      access_token: "PLACEHOLDER",
      refresh_token: "PLACEHOLDER",
      token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      sync_enabled: true,
    }, { onConflict: "user_id,provider,email" })
    .select("id")
    .single();

  if (error) return badRequest(error.message);
  return ok({ status: "stored", id: data?.id });
});



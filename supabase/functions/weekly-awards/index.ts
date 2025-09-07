import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

// Calls SQL function to award Top Mentor to current week top mentors
Deno.serve(async (_req) => {
  const { error } = await supabaseAdmin.rpc("award_top_mentors_current_week", { p_top_n: 10 });
  if (error) return respond(500, { error: error.message });
  return respond(200, { ok: true });
});



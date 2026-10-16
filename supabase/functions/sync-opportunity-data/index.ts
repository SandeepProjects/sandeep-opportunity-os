import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { runCanonicalSync } from "../_shared/canonicalSync.mjs";

const ALLOWED_ORIGINS = [
  "https://papayawhip-anteater-790324.hostingersite.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  const allowOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin"
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Enforce authentication: check Authorization Bearer token or apikey header
  const authHeader = req.headers.get("authorization") || req.headers.get("apikey");
  if (!authHeader) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unauthorized: Missing Authorization or apikey header",
        status: "Permission required"
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  let body: Record<string, any> = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  // Read environment secrets
  const googleSaEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const googlePrivateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://wgormlhylsfssuapxyfb.supabase.co";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  try {
    const result = await runCanonicalSync({
      googleSaEmail,
      googlePrivateKey,
      supabaseUrl,
      supabaseKey,
      currentRecords: Array.isArray(body.currentRecords) ? body.currentRecords : [],
      dryRun: Boolean(body.dryRun)
    });

    return new Response(
      JSON.stringify({
        ok: true,
        ...result.telemetry,
        records: result.records,
        pipelineCounts: result.pipelineCounts
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err.message || "Internal sync error",
        status: "Failed"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

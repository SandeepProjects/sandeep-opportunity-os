/**
 * Sandeep Opportunity OS — Server-Side Ingestion & 6-Hour Scheduled Sync Runner
 *
 * Runs server-side (in GitHub Actions cron or backend worker) every 6 hours:
 * 00:00, 06:00, 12:00, 18:00 UTC.
 *
 * THIN CLI WRAPPER around the shared canonical sync engine (src/pipeline/canonicalSyncEngine.mjs).
 * Guarantees 100% logic and count parity with Supabase Edge Function.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCanonicalSync } from "../src/pipeline/canonicalSyncEngine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, "../src/data/verified_seed_24.json");

export async function runServerSync(options = {}) {
  // Read .env.local if present
  const envLocalPath = path.resolve(__dirname, "../.env.local");
  let envDbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.VITE_NEON_DATABASE_URL;
  if (!envDbUrl && fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, "utf8").split("\n");
    for (const l of lines) {
      const match = l.match(/^(?:DATABASE_URL|VITE_NEON_DATABASE_URL|NEON_DATABASE_URL)=(.+)$/);
      if (match) {
        envDbUrl = match[1].trim();
        break;
      }
    }
  }

  // Load Google service account if not in process.env
  let googleSaEmail = options.googleSaEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let googlePrivateKey = options.googlePrivateKey || process.env.GOOGLE_PRIVATE_KEY;
  const saPath = path.resolve(__dirname, "../.secrets/google-sa-key.json");
  if ((!googleSaEmail || !googlePrivateKey) && fs.existsSync(saPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
      googleSaEmail = googleSaEmail || sa.client_email;
      googlePrivateKey = googlePrivateKey || sa.private_key;
    } catch {
      // Ignore
    }
  }

  const neonDatabaseUrl = options.neonDatabaseUrl !== undefined ? options.neonDatabaseUrl : envDbUrl;
  const supabaseUrl = options.supabaseUrl !== undefined ? options.supabaseUrl : (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseKey = options.supabaseKey !== undefined ? options.supabaseKey : process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Load baseline seed profile & opportunities (bootstrap/fallback)
  let seed = { opportunities: [], candidate_profile: {} };
  try {
    if (fs.existsSync(seedPath)) {
      seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    }
  } catch (err) {
    console.warn("[Opportunity OS Sync] Warning reading seed file:", err.message);
  }

  const currentRecords = options.currentRecords || seed.opportunities || [];
  const fetchFn = options.fetchFn || globalThis.fetch;

  console.log("[Opportunity OS Sync] Starting canonical server sync cycle...");

  const result = await runCanonicalSync({
    googleSaEmail,
    googlePrivateKey,
    supabaseUrl,
    supabaseKey,
    neonDatabaseUrl,
    currentRecords,
    fetchFn,
    dryRun: Boolean(options.dryRun),
    triggerType: options.triggerType || (isMainModule ? "SCHEDULED_5H" : "AUTOMATIC_5H")
  });

  const { telemetry, records, pipelineCounts } = result;

  console.log(`[Opportunity OS Sync] Cycle completed with status: ${telemetry.status}`);
  console.log(`[Opportunity OS Sync] Sources: ${telemetry.sourcesSucceeded}/${telemetry.sourcesAttempted} connected.`);
  console.log(`[Opportunity OS Sync] Pipeline: Raw ${pipelineCounts.rawTotal} -> Deduplicated ${pipelineCounts.deduplicated} (Active ${pipelineCounts.active}, Gated ${pipelineCounts.gated}) -> Preserved CRM ${telemetry.userFieldsPreserved}.`);

  return {
    ...telemetry,
    records,
    pipelineCounts
  };
}

// Auto-run if executed as CLI script (e.g. node scripts/sync-data.mjs)
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("sync-data.mjs") || process.argv[1].endsWith("sync-data"));

if (isMainModule) {
  runServerSync()
    .then((result) => {
      console.log(
        JSON.stringify(
          {
            runId: result.runId,
            status: result.status,
            sourcesSucceeded: result.sourcesSucceeded,
            sourcesFailed: result.sourcesFailed,
            totalRecords: result.totalRecords,
            pipelineCounts: result.pipelineCounts,
            sourceDiagnostics: result.sourceDiagnostics
          },
          null,
          2
        )
      );

      if (result.status === "FAILED") {
        console.log("[Opportunity OS Sync] Note: All remote Google sources returned Permission required or error.");
      }
    })
    .catch((err) => {
      console.error("[Opportunity OS Sync Fatal]", err);
      process.exit(1);
    });
}

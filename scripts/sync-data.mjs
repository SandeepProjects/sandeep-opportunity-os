/**
 * Sandeep Opportunity OS — Server-Side Ingestion & 6-Hour Scheduled Sync Runner
 *
 * Runs server-side (in GitHub Actions cron or backend worker) every 6 hours:
 * 00:00, 06:00, 12:00, 18:00 UTC.
 *
 * REAL INGESTION FLOW:
 * 1. Checks and requests Google OAuth2 bearer token via Google Service Account (RS256 JWT).
 * 2. Authenticates and makes genuine HTTP API calls to:
 *    a) Native Google Sheet ID 1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0 ("ALL LEADS")
 *    b) MASTER_JOB_APPLICATION_TRACKER.xlsx Drive ID 1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1
 *    c) master-spreadsheet.xlsx Drive ID 156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj ("MASTER_PROGRAMMES", "SCHOLARSHIPS")
 * 3. Records TRUTHFUL source status based on real HTTP status codes (200=Connected, 403=Permission required, 404=Not Found).
 * 4. Normalizes, deduplicates, and scores records using the canonical engine.
 * 5. Strictly preserves Sandeep's 7 user-owned CRM fields:
 *    status, priority, favorite, follow_up_date, personal_notes, contacted_date/at, applied_date/at.
 * 6. Upserts machine fields into Supabase opportunities table and logs telemetry to research_runs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getGoogleAccessToken,
  fetchMuseSocialLeads,
  fetchMasterJobTracker,
  fetchMastersWorkbook,
  normalizeMuseSocialLead,
  normalizeMasterJobTrackerRow,
  normalizeMasterProgrammeRow,
  normalizeScholarshipRow,
  normalizeAndMergeRecords
} from "../src/pipeline/adapters/index.mjs";
import { getNextScheduledSync } from "../src/config/dataSources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, "../src/data/verified_seed_24.json");

/**
 * Runs the genuine server-side synchronization and ingestion pipeline.
 *
 * @param {Object} [options]
 * @param {Array<Object>} [options.currentRecords] - Optional in-memory records to merge with
 * @param {Object} [options.candidateProfile] - Optional candidate profile
 * @param {Function} [options.fetchFn] - Custom fetch function for testing
 * @returns {Promise<Object>} Telemetry report and updated records
 */
export async function runServerSync(options = {}) {
  const startedAt = new Date();
  const startTime = startedAt.getTime();
  const runId = `SYNC-${startedAt.toISOString().slice(0, 10).replace(/-/g, "")}-${String(startTime).slice(-4)}`;
  const fetchFn = options.fetchFn || globalThis.fetch;

  console.log(`[Opportunity OS Sync] Starting 6-hour sync cycle (${runId}) at ${startedAt.toISOString()}...`);

  const googleSaEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const googleKey = process.env.GOOGLE_PRIVATE_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Load baseline seed profile & opportunities (bootstrap/fallback)
  let seed = { opportunities: [], candidate_profile: {} };
  try {
    if (fs.existsSync(seedPath)) {
      seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    }
  } catch (err) {
    console.warn("[Opportunity OS Sync] Warning reading seed file:", err.message);
  }

  const profile = options.candidateProfile || seed.candidate_profile || {};
  let existingRecords = options.currentRecords || seed.opportunities || [];

  // If Supabase is available, attempt to load existing records so CRM fields are preserved from DB
  if (supabaseUrl && supabaseKey) {
    try {
      const dbRes = await fetchFn(`${supabaseUrl}/rest/v1/opportunities?select=*,workflow_states(*)`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      });
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        if (Array.isArray(dbData) && dbData.length > 0) {
          existingRecords = dbData.map((d) => ({
            ...d,
            workflow: Array.isArray(d.workflow_states) && d.workflow_states[0] ? d.workflow_states[0] : d.workflow
          }));
        }
      }
    } catch (err) {
      console.warn("[Opportunity OS Sync] Notice fetching existing DB records:", err.message);
    }
  }

  const sourceDiagnostics = [];
  const newlyIngestedRaw = [];

  // 1. Obtain Google OAuth2 Token
  let googleToken = null;
  let authError = null;

  if (googleSaEmail && googleKey) {
    try {
      googleToken = await getGoogleAccessToken({
        email: googleSaEmail,
        privateKey: googleKey,
        fetchFn
      });
      console.log("[Opportunity OS Sync] Successfully authenticated with Google OAuth2 API.");
    } catch (err) {
      authError = err;
      console.warn(`[Opportunity OS Sync] Google OAuth2 authentication error: ${err.message}`);
    }
  }

  // 2. Ingest Native MUSE Facebook & Instagram Job Hunter Sheet
  const socialSheetId = "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0";
  if (!googleToken) {
    sourceDiagnostics.push({
      id: "muse_social_job_hunter",
      name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
      status: "Permission required",
      statusCode: 401,
      message: authError
        ? `OAuth2 authentication failed: ${authError.message}`
        : "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY not configured in environment.",
      recordsCount: 0
    });
  } else {
    try {
      console.log(`[Opportunity OS Sync] Fetching native MUSE Sheet ${socialSheetId} (ALL LEADS)...`);
      const res = await fetchMuseSocialLeads({
        token: googleToken,
        spreadsheetId: socialSheetId,
        tabName: "ALL LEADS",
        fetchFn
      });

      sourceDiagnostics.push({
        id: "muse_social_job_hunter",
        name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
        status: res.status,
        statusCode: res.statusCode,
        message: res.ok
          ? `Connected to native sheet. Retrieved ${res.rawCount} raw rows from ALL LEADS.`
          : res.error || `HTTP ${res.statusCode}`,
        recordsCount: res.rawCount || 0
      });

      if (res.ok && Array.isArray(res.records)) {
        res.records.forEach((row, idx) => {
          newlyIngestedRaw.push(normalizeMuseSocialLead(row, idx));
        });
      }
    } catch (err) {
      sourceDiagnostics.push({
        id: "muse_social_job_hunter",
        name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
        status: "Failed",
        statusCode: 0,
        message: err.message,
        recordsCount: 0
      });
    }
  }

  // 3. Ingest MASTER_JOB_APPLICATION_TRACKER.xlsx
  const masterTrackerId = "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1";
  if (!googleToken) {
    sourceDiagnostics.push({
      id: "master_job_application_tracker",
      name: "MASTER_JOB_APPLICATION_TRACKER.xlsx",
      status: "Permission required",
      statusCode: 401,
      message: authError
        ? `OAuth2 authentication failed: ${authError.message}`
        : "Drive XLSX requires Google Service Account authentication.",
      recordsCount: 0
    });
  } else {
    try {
      console.log(`[Opportunity OS Sync] Downloading and parsing Drive XLSX ${masterTrackerId}...`);
      const res = await fetchMasterJobTracker({
        fileId: masterTrackerId,
        token: googleToken,
        fetchFn
      });

      sourceDiagnostics.push({
        id: "master_job_application_tracker",
        name: "MASTER_JOB_APPLICATION_TRACKER.xlsx",
        status: res.status,
        statusCode: res.statusCode,
        message: res.ok
          ? `Connected to Drive XLSX. Retrieved ${res.records.length} records across tabs [${res.sheetNames.join(", ")}].`
          : res.error || `HTTP ${res.statusCode}`,
        recordsCount: res.records?.length || 0
      });

      if (res.ok && Array.isArray(res.records)) {
        res.records.forEach((row, idx) => {
          newlyIngestedRaw.push(normalizeMasterJobTrackerRow(row, idx));
        });
      }
    } catch (err) {
      sourceDiagnostics.push({
        id: "master_job_application_tracker",
        name: "MASTER_JOB_APPLICATION_TRACKER.xlsx",
        status: "Failed",
        statusCode: 0,
        message: err.message,
        recordsCount: 0
      });
    }
  }

  // 4. Ingest master-spreadsheet.xlsx (Master's Programmes & Scholarships)
  const mastersWorkbookId = "156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj";
  if (!googleToken) {
    sourceDiagnostics.push({
      id: "masters_workbook",
      name: "master-spreadsheet.xlsx",
      status: "Permission required",
      statusCode: 401,
      message: authError
        ? `OAuth2 authentication failed: ${authError.message}`
        : "Drive XLSX requires Google Service Account authentication.",
      recordsCount: 0
    });
  } else {
    try {
      console.log(`[Opportunity OS Sync] Downloading and parsing Drive XLSX ${mastersWorkbookId}...`);
      const res = await fetchMastersWorkbook({
        fileId: mastersWorkbookId,
        token: googleToken,
        fetchFn
      });

      const totalMasterRecords = (res.programmes?.length || 0) + (res.scholarships?.length || 0);

      sourceDiagnostics.push({
        id: "masters_workbook",
        name: "master-spreadsheet.xlsx",
        status: res.status,
        statusCode: res.statusCode,
        message: res.ok
          ? `Connected to Master's workbook. Found ${res.programmes.length} programmes and ${res.scholarships.length} scholarships.`
          : res.error || `HTTP ${res.statusCode}`,
        recordsCount: totalMasterRecords
      });

      if (res.ok) {
        if (Array.isArray(res.programmes)) {
          res.programmes.forEach((row, idx) => {
            newlyIngestedRaw.push(normalizeMasterProgrammeRow(row, idx));
          });
        }
        if (Array.isArray(res.scholarships)) {
          res.scholarships.forEach((row, idx) => {
            newlyIngestedRaw.push(normalizeScholarshipRow(row, idx));
          });
        }
      }
    } catch (err) {
      sourceDiagnostics.push({
        id: "masters_workbook",
        name: "master-spreadsheet.xlsx",
        status: "Failed",
        statusCode: 0,
        message: err.message,
        recordsCount: 0
      });
    }
  }

  // 5. Merge Newly Ingested Records with Existing CRM Records
  // If remote sources succeeded, merge incoming records with existing records.
  // If no remote records were retrieved, preserve existing/seed records without crashing.
  const recordsToMerge = newlyIngestedRaw.length > 0 ? newlyIngestedRaw : existingRecords;
  const mergeResult = normalizeAndMergeRecords(recordsToMerge, existingRecords, profile);

  // 6. Supabase Upsert & Telemetry Logging
  let supabaseSynced = false;
  let supabaseMessage = "Supabase not configured in environment";

  if (supabaseUrl && supabaseKey) {
    try {
      // Upsert opportunities
      const oppPayload = mergeResult.merged.map((o) => ({
        id: o.id,
        category: o.category,
        title: o.title,
        organization_name: o.organization,
        location: o.location,
        source_url: o.source_url,
        last_verified_at: o.last_verified_at,
        deadline: o.deadline,
        is_active: o.is_active,
        confidence: o.confidence,
        score_total: o.score_total,
        score_components_json: o.score_components,
        details_json: o.details
      }));

      const res = await fetchFn(`${supabaseUrl}/rest/v1/opportunities`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(oppPayload)
      });

      if (res.ok) {
        supabaseSynced = true;
        supabaseMessage = `Successfully synced ${oppPayload.length} opportunities to Supabase.`;
      } else {
        const errText = await res.text().catch(() => "");
        supabaseMessage = `Supabase opportunities upsert error HTTP ${res.status}: ${errText}`;
      }

      // Log telemetry run in research_runs table
      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
      const overallStatus =
        sourceDiagnostics.every((s) => s.status === "Connected")
          ? "SUCCESS"
          : sourceDiagnostics.some((s) => s.status === "Connected")
          ? "PARTIAL"
          : "FAILED";

      await fetchFn(`${supabaseUrl}/rest/v1/research_runs`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          run_id: runId,
          run_timestamp: startedAt.toISOString(),
          sources_checked: sourceDiagnostics.length,
          discovered_count: newlyIngestedRaw.length,
          accepted_count: mergeResult.merged.length,
          deduplicated_count: newlyIngestedRaw.length - mergeResult.addedCount,
          filtered_count: mergeResult.gatedCount,
          sheets_sync_status: overallStatus,
          duration_sec: parseFloat(durationSec)
        })
      }).catch((e) => console.warn("[Opportunity OS Sync] Telemetry logging warning:", e.message));

    } catch (err) {
      supabaseMessage = `Supabase sync error: ${err.message}`;
      console.warn(`[Opportunity OS Sync] ${supabaseMessage}`);
    }
  }

  // 7. Compute Final Telemetry
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startTime;
  const nextSync = getNextScheduledSync(completedAt);

  const sourcesAttempted = sourceDiagnostics.length;
  const sourcesSucceeded = sourceDiagnostics.filter((s) => s.status === "Connected").length;
  const sourcesFailed = sourceDiagnostics.filter((s) => s.status !== "Connected").length;

  let overallStatus = "SUCCESS";
  if (sourcesSucceeded === 0 && sourcesAttempted > 0) {
    overallStatus = "FAILED";
  } else if (sourcesFailed > 0) {
    overallStatus = "PARTIAL";
  }

  const telemetry = {
    runId,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs,
    status: overallStatus,
    sourcesAttempted,
    sourcesSucceeded,
    sourcesFailed,
    recordsAdded: mergeResult.addedCount,
    recordsUpdated: mergeResult.updatedCount,
    recordsUnchanged: mergeResult.preservedCount,
    recordsGated: mergeResult.gatedCount,
    userFieldsPreserved: mergeResult.preservedCount,
    totalRecords: mergeResult.merged.length,
    sourceDiagnostics,
    supabaseSynced,
    supabaseMessage,
    nextScheduledSyncIso: nextSync.iso,
    nextScheduledSyncUtc: nextSync.formattedUtc,
    records: mergeResult.merged
  };

  console.log(`[Opportunity OS Sync] Cycle completed with status: ${overallStatus}`);
  console.log(`[Opportunity OS Sync] Sources: ${sourcesSucceeded}/${sourcesAttempted} connected.`);
  console.log(`[Opportunity OS Sync] Records: Total ${telemetry.totalRecords}, Added ${telemetry.recordsAdded}, Preserved CRM ${telemetry.userFieldsPreserved}.`);

  return telemetry;
}

// Auto-run if executed as CLI script (e.g. node scripts/sync-data.mjs)
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("sync-data.mjs") || process.argv[1].endsWith("sync-data"));

if (isMainModule) {
  runServerSync()
    .then((telemetry) => {
      console.log(JSON.stringify({
        runId: telemetry.runId,
        status: telemetry.status,
        sourcesSucceeded: telemetry.sourcesSucceeded,
        sourcesFailed: telemetry.sourcesFailed,
        totalRecords: telemetry.totalRecords,
        sourceDiagnostics: telemetry.sourceDiagnostics
      }, null, 2));

      // Report clearly: if all sources failed, exit with diagnostic summary
      if (telemetry.status === "FAILED") {
        console.log("[Opportunity OS Sync] Note: All remote Google sources returned Permission required or error.");
      }
    })
    .catch((err) => {
      console.error("[Opportunity OS Sync Fatal]", err);
      process.exit(1);
    });
}

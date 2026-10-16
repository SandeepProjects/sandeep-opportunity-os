/**
 * Sandeep Opportunity OS — Canonical Sync Engine Facade
 *
 * Re-exports the unified canonical sync implementation from supabase/functions/_shared/canonicalSync.mjs.
 * Guarantees 100% logic and count parity between scheduled GitHub Actions cron and Supabase Edge Function.
 */

export {
  runCanonicalSync,
  normalizePrivateKey,
  getGoogleAccessToken,
  canonicalizeUrl,
  computeFingerprint,
  generateDeterministicId,
  parseXlsxBuffer,
  normalizeMuseSocialLead,
  normalizeMasterJobTrackerRow,
  normalizeMasterProgrammeRow,
  normalizeScholarshipRow,
  normalizeRegionalResearchRow,
  isDatedTab,
  preserveUserCrmFields,
  evaluateGating,
  normalizeAndMergeRecords,
  getNextScheduledSync
} from "../../supabase/functions/_shared/canonicalSync.mjs";

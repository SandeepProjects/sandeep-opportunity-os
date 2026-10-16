/**
 * Sandeep Opportunity OS — Multi-Source Normalizer, CRM Preservation & Gating
 *
 * Re-exports the unified canonical normalizers from the canonical sync engine.
 * Guarantees single-source-of-truth normalization across scheduled and manual runs.
 */

export {
  generateDeterministicId,
  normalizeMuseSocialLead,
  normalizeMasterJobTrackerRow,
  normalizeMasterProgrammeRow,
  normalizeScholarshipRow,
  evaluateGating,
  preserveUserCrmFields,
  normalizeAndMergeRecords
} from "../canonicalSyncEngine.mjs";

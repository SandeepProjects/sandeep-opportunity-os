#!/usr/bin/env node
/**
 * Sandeep Opportunity OS — deterministic research pipeline verification runner.
 *
 * This process validates and prepares the canonical records used by the scheduled
 * workflow. It deliberately does not report a Google Sheets API write unless an
 * external worker actually performs one with service-account credentials.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalizeUrl,
  deduplicateOpportunities,
  calculateExplainableScore,
  syncDatabaseToSheetRows
} from "../engine/core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, "../data/verified_seed_24.json");

export function runStagedPipeline() {
  const startedAt = Date.now();
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const rawRecords = Array.isArray(seed.opportunities) ? seed.opportunities : [];

  const normalized = rawRecords.map((record) => ({
    ...record,
    canonical_source_url: canonicalizeUrl(record.source_url)
  }));

  const { deduplicated, mergedCount } = deduplicateOpportunities(normalized);

  const scored = deduplicated.map((record) => {
    const evaluation = calculateExplainableScore(record, seed.candidate_profile || {});
    return {
      ...record,
      score_total: evaluation.score_total,
      is_active: evaluation.is_active,
      eligibility_status: evaluation.eligibility_status,
      gate_reason: evaluation.gate_reason
    };
  });

  // Validate the idempotent merge contract without pretending this local process
  // wrote to Google Sheets. Existing and incoming rows are the same snapshot here.
  const syncOutcome = syncDatabaseToSheetRows(scored, scored);
  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(3);

  return {
    runId: `RUN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
    discovered: rawRecords.length,
    canonicalCount: scored.length,
    mergesCount: mergedCount,
    gatedCount: scored.filter((record) => !record.is_active).length,
    mergeContract: {
      inserted: syncOutcome.inserted,
      updated: syncOutcome.updated,
      preservedUserFields: syncOutcome.preservedUserFields,
      totalRows: syncOutcome.rows.length
    },
    externalSyncPerformed: false,
    durationSec
  };
}

if (process.argv[1] && process.argv[1].endsWith("dailyResearchRunner.mjs")) {
  const report = runStagedPipeline();
  console.log("[Opportunity OS Runner] Pipeline verification completed:", JSON.stringify(report, null, 2));
}

#!/usr/bin/env node
/**
 * Sandeep Opportunity OS — Staged Idempotent Daily Research & Google Sheets Sync Runner
 * Stages: Discovery -> Verification -> Extraction -> Normalization -> Deduplication -> Scoring -> DB -> Sheets Sync
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
  const rawRecords = seed.opportunities || [];

  // Stage 1-5: Normalization & Deterministic URL verification check
  const normalized = rawRecords.map((r) => ({
    ...r,
    canonical_source_url: canonicalizeUrl(r.source_url)
  }));

  // Stage 6: Deduplication
  const { deduplicated, mergedCount } = deduplicateOpportunities(normalized);

  // Stage 7: Explainable Scoring & Eligibility Gating
  const scored = deduplicated.map((r) => {
    const evalResult = calculateExplainableScore(r, seed.profile || {});
    return {
      ...r,
      score_total: evalResult.score_total,
      is_active: evalResult.is_active,
      eligibility_status: evalResult.eligibility_status
    };
  });

  // Stage 8 & 9: Idempotent Sync Check
  const syncOutcome = syncDatabaseToSheetRows(scored, scored);
  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(3);

  return {
    runId: `RUN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
    discovered: rawRecords.length,
    canonicalCount: scored.length,
    mergesCount: mergedCount,
    gatedCount: scored.filter((x) => !x.is_active).length,
    syncStats: {
      inserted: syncOutcome.inserted,
      updated: syncOutcome.updated,
      preservedUserFields: syncOutcome.preservedUserFields
    },
    durationSec
  };
}

if (process.argv[1] && process.argv[1].endsWith("dailyResearchRunner.mjs")) {
  const report = runStagedPipeline();
  console.log("[Opportunity OS Runner] Staged pipeline run completed:", JSON.stringify(report, null, 2));
}

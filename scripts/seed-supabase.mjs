#!/usr/bin/env node
/**
 * Controlled Seed / Upsert Script for Canonical Supabase Database
 * Reads the 24 verified real opportunity records from src/data/verified_seed_24.json
 * and upserts machine-owned fields into Supabase while preserving user-owned workflow_states.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncDatabaseToSheetRows } from "../src/engine/core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, "../src/data/verified_seed_24.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`[SEED] Loaded ${seed.opportunities.length} verified records from src/data/verified_seed_24.json`);

  if (!supabaseUrl || !serviceKey) {
    const dryRun = syncDatabaseToSheetRows([], seed.opportunities);
    console.log(
      `[SEED DRY-RUN] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in environment. Verified idempotent payload for ${dryRun.inserted} canonical records.`
    );
    return;
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/opportunities`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(
      seed.opportunities.map((o) => ({
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
      }))
    )
  });

  if (!res.ok) {
    console.error(`[SEED ERROR] Supabase REST upsert returned HTTP ${res.status}`);
    process.exit(1);
  }

  console.log(`[SEED SUCCESS] Upserted ${seed.opportunities.length} canonical records into Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

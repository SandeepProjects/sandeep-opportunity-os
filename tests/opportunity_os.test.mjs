import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStagedPipeline } from "../src/pipeline/dailyResearchRunner.mjs";
import {
  canonicalizeUrl,
  computeFingerprint,
  deduplicateOpportunities,
  calculateExplainableScore,
  classifyFollowUpBucket,
  bucketFollowUps,
  buildTodayPriorityQueue,
  applyWorkflowTransition,
  syncDatabaseToSheetRows,
  normalizeScoreComponents
} from "../src/engine/core.mjs";

import {
  DATA_SOURCE_REGISTRY,
  getDataSourcesByCategory,
  getNextScheduledSync
} from "../src/config/dataSources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, "../src/data/verified_seed_24.json");
const seedData = JSON.parse(fs.readFileSync(seedPath, "utf8"));

describe("Sandeep Opportunity OS — Production Engine & Data Verification Suite", () => {
  it("1. canonicalizeUrl strips UTM/tracking params and normalizes hostname", () => {
    const cleaned = canonicalizeUrl(
      "https://www.DanosLawFirm.com/contact/?utm_source=linkedin&fbclid=abc123&ref= jobboard"
    );
    assert.equal(cleaned, "https://danoslawfirm.com/contact");
  });

  it("2. computeFingerprint generates deterministic category::org::title keys", () => {
    const fp1 = computeFingerprint({
      category: "remote_jobs",
      organization: "Lago",
      title: "Frontend React Developer (Remote)"
    });
    const fp2 = computeFingerprint({
      category: "remote_jobs",
      organization: "Lago!",
      title: "Frontend React Developer"
    });
    assert.equal(fp1, fp2);
  });

  it("3. deduplicateOpportunities merges duplicate listings and preserves all provenance URLs", () => {
    const { deduplicated, mergedCount } = deduplicateOpportunities([
      {
        id: "OPP-RM-002",
        category: "remote_jobs",
        organization: "Lago",
        title: "Frontend React / Shopify Hydrogen Developer",
        source_url: "https://apply.workable.com/lago-1/j/A99E34437C/"
      },
      {
        id: "OPP-RM-002-DUP",
        category: "remote_jobs",
        organization: "Lago",
        title: "Frontend React / Shopify Hydrogen Developer (EU)",
        source_url: "https://apply.workable.com/lago-1/j/D943CC3739/"
      }
    ]);
    assert.equal(deduplicated.length, 1);
    assert.equal(mergedCount, 1);
    assert.equal(deduplicated[0].provenance_urls.length, 2);
  });

  it("4. calculateExplainableScore enforces Regional Restriction Gate on non-Cyprus remote roles", () => {
    const africaOnly = seedData.opportunities.find((o) => o.id === "OPP-RM-005");
    const evaluated = calculateExplainableScore(africaOnly);
    assert.equal(evaluated.is_active, false);
    assert.equal(evaluated.eligibility_status, "NO");
    assert.equal(evaluated.gate_reason, "REGIONAL_RESTRICTION_GATE_NON_CYPRUS");
  });

  it("5. calculateExplainableScore enforces Seniority Gate on 5+ year Senior roles", () => {
    const seniorRole = seedData.opportunities.find((o) => o.id === "OPP-VJ-006");
    const evaluated = calculateExplainableScore(seniorRole);
    assert.equal(evaluated.is_active, false);
    assert.equal(evaluated.gate_reason, "SENIORITY_GATE_5_PLUS_YEARS");
  });

  it("6. calculateExplainableScore preserves UNKNOWN legal/eligibility state when profile is unconfirmed", () => {
    const ediss = seedData.opportunities.find((o) => o.id === "OPP-MS-002");
    const evaluated = calculateExplainableScore(ediss, {});
    assert.equal(evaluated.profile_legal_state.citizenship, "UNKNOWN");
    assert.equal(evaluated.profile_legal_state.eu_eea_status, "UNKNOWN");
    assert.equal(evaluated.eligibility_status, "UNKNOWN");
  });

  it("7. buildTodayPriorityQueue ranks active opportunities and excludes gated/archived records", () => {
    const queue = buildTodayPriorityQueue(seedData.opportunities, "2026-10-14");
    assert.equal(queue.length, 21);
    assert.ok(queue[0].queue_priority_score >= queue[queue.length - 1].queue_priority_score);
    assert.ok(!queue.some((o) => o.id === "OPP-VJ-006" || o.id === "OPP-RM-005" || o.id === "OPP-RM-006"));
  });

  it("8. classifyFollowUpBucket and bucketFollowUps group dates into exact relative buckets", () => {
    assert.equal(classifyFollowUpBucket("2026-10-12", "2026-10-14"), "Overdue");
    assert.equal(classifyFollowUpBucket("2026-10-14", "2026-10-14"), "Due today");
    assert.equal(classifyFollowUpBucket("2026-10-15", "2026-10-14"), "Tomorrow");
    assert.equal(classifyFollowUpBucket("2026-10-19", "2026-10-14"), "This week");
    assert.equal(classifyFollowUpBucket("2026-11-01", "2026-10-14"), "Later");
    assert.equal(classifyFollowUpBucket(null, "2026-10-14"), "No follow-up");

    const buckets = bucketFollowUps(seedData.opportunities, "2026-10-14");
    assert.ok(Array.isArray(buckets["Due today"]));
  });

  it("9. syncDatabaseToSheetRows preserves all user-owned [USER] CRM fields during machine refresh", () => {
    const existingRows = [
      {
        record_id: "OPP-VJ-001",
        title: "Old Title",
        score_total: 80,
        user_status: "Applied",
        priority: "High",
        favorite: true,
        follow_up_date: "2026-10-18",
        contacted_date: "2026-10-12",
        applied_date: "2026-10-14",
        personal_notes: "Submitted tailored React/WordPress CV"
      }
    ];
    const incomingMachine = [
      {
        id: "OPP-VJ-001",
        title: "Full Stack Websites Developer",
        score_total: 88,
        last_verified_at: "2026-10-14"
      }
    ];
    const synced = syncDatabaseToSheetRows(existingRows, incomingMachine);
    assert.equal(synced.updated, 1);
    assert.equal(synced.rows[0].title, "Full Stack Websites Developer");
    assert.equal(synced.rows[0].score_total, 88);
    assert.equal(synced.rows[0].user_status, "Applied");
    assert.equal(synced.rows[0].priority, "High");
    assert.equal(synced.rows[0].favorite, true);
    assert.equal(synced.rows[0].follow_up_date, "2026-10-18");
    assert.equal(synced.rows[0].applied_date, "2026-10-14");
    assert.equal(synced.rows[0].personal_notes, "Submitted tailored React/WordPress CV");
  });

  it("10. applyWorkflowTransition stamps contacted_date/applied_date and appends activity history", () => {
    const fl1 = JSON.parse(
      JSON.stringify(seedData.opportunities.find((o) => o.id === "OPP-FL-001"))
    );
    const afterContact = applyWorkflowTransition(
      fl1,
      {
        status: "Contacted",
        priority: "High",
        favorite: true,
        follow_up_date: "2026-10-15",
        personal_notes: "Sent legal booking case study to Andreas G. Danos & Co LLC"
      },
      "2026-10-14"
    );
    assert.equal(afterContact.workflow.status, "Contacted");
    assert.equal(afterContact.workflow.contacted_date, "2026-10-14");
    assert.equal(afterContact.workflow.follow_up_date, "2026-10-15");
    assert.ok(afterContact.activity_history.some((ev) => ev.label.includes("Status updated")));
  });

  it("11. production dataset contains 24 verified real opportunities and zero fake mock records", () => {
    assert.equal(seedData.opportunities.length, 24);
    const serialized = JSON.stringify(seedData.opportunities);
    for (const fakeName of ["Tech Corp", "StartupX", "Data Inc", "Tech University", "CloudWorks"]) {
      assert.ok(!serialized.includes(fakeName), `Forbidden mock entity found: ${fakeName}`);
    }
  });

  it("12. stored score_components sum accurately to pre-gate score across all active records", () => {
    const active = seedData.opportunities.filter((o) => o.is_active !== false);
    assert.equal(active.length, 21);
    for (const rec of active) {
      const comps = normalizeScoreComponents(rec);
      const sum = comps.reduce((acc, c) => acc + Number(c.points), 0);
      assert.equal(sum, rec.score_total, `Score component sum mismatch on ${rec.id}`);
    }
  });

  it("13. scheduled research runner completes without crashing and preserves the 24-record contract", () => {
    const report = runStagedPipeline();
    assert.equal(report.discovered, 24);
    assert.equal(report.canonicalCount, 24);
    assert.equal(report.gatedCount, 3);
    assert.equal(report.mergeContract.totalRows, 24);
    assert.equal(report.externalSyncPerformed, false);
  });

  it("14. canonical data source registry contains verified resources, correct Google IDs, and zero Windows paths", () => {
    assert.ok(DATA_SOURCE_REGISTRY.length >= 15);
    const socialHunter = DATA_SOURCE_REGISTRY.find((ds) => ds.id === "muse_social_job_hunter");
    assert.ok(socialHunter);
    assert.equal(socialHunter.spreadsheetId, "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0");
    assert.equal(socialHunter.status, "Permission required");
    assert.deepEqual(socialHunter.verifiedTabs, [
      "ALL LEADS",
      "DAILY RESULTS",
      "GROUP DIRECTORY",
      "OUTREACH TRACKER",
      "SEARCH LOG"
    ]);

    const masterApp = DATA_SOURCE_REGISTRY.find((ds) => ds.id === "master_job_application_tracker");
    assert.ok(masterApp);
    assert.equal(masterApp.driveId, "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1");
    assert.equal(masterApp.status, "Permission required");

    const mastersWb = DATA_SOURCE_REGISTRY.find((ds) => ds.id === "masters_workbook");
    assert.ok(mastersWb);
    assert.equal(mastersWb.status, "Stale");

    const legacy = getDataSourcesByCategory("legacy");
    assert.equal(legacy.length, 2);
    assert.ok(legacy.some((ds) => ds.id === "legacy_sheet_17nh"));
    assert.ok(legacy.some((ds) => ds.id === "legacy_workbook_19ig"));

    const localSources = getDataSourcesByCategory("local");
    assert.equal(localSources.length, 6);
    for (const src of localSources) {
      assert.equal(src.url, null);
      assert.ok(!JSON.stringify(src).includes("C:\\"), "Exposed local Windows path found in source registry");
    }
  });

  it("15. getNextScheduledSync calculates exact intervals in 00, 06, 12, 18 UTC sequence", () => {
    const t1 = new Date("2026-10-15T02:30:00Z");
    const next1 = getNextScheduledSync(t1);
    assert.equal(next1.formattedUtc, "06:00 UTC");
    assert.equal(next1.minutesRemaining, 210);

    const t2 = new Date("2026-10-15T06:00:00Z");
    const next2 = getNextScheduledSync(t2);
    assert.equal(next2.formattedUtc, "06:00 UTC");
    assert.equal(next2.minutesRemaining, 0);

    const t3 = new Date("2026-10-15T19:45:00Z");
    const next3 = getNextScheduledSync(t3);
    assert.equal(next3.formattedUtc, "00:00 UTC");
    assert.equal(next3.minutesRemaining, 255);
  });
});

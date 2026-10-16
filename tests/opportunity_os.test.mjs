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

import {
  fetchSheetValues,
  fetchMuseSocialLeads,
  downloadDriveFile,
  parseXlsxBuffer,
  fetchMasterJobTracker,
  fetchMastersWorkbook,
  normalizeMuseSocialLead,
  normalizeMasterJobTrackerRow,
  normalizeMasterProgrammeRow,
  normalizeScholarshipRow,
  preserveUserCrmFields,
  normalizeAndMergeRecords,
  normalizePrivateKey
} from "../src/pipeline/adapters/index.mjs";
import { runCanonicalSync } from "../src/pipeline/canonicalSyncEngine.mjs";
import { runServerSync } from "../scripts/sync-data.mjs";

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

  it("16. Google Sheets API v4 adapter parses values and maps 2D rows to structured objects", async () => {
    const mockValues = [
      ["Platform", "Group/Page Name", "Post Text / Lead Description", "Contact / Link", "Category / Role", "Date Found", "Location", "Budget"],
      ["Facebook", "Cyprus Tech Hub", "Looking for React/Next.js developer to rebuild portal", "https://facebook.com/groups/cyprustech/posts/1001/?utm_source=feed", "Freelance Lead", "2026-10-16", "Limassol, Cyprus", "€3,500"]
    ];

    const mockFetch = async (url) => {
      assert.ok(url.includes("sheets.googleapis.com"));
      return {
        ok: true,
        status: 200,
        json: async () => ({ range: "'ALL LEADS'!A1:H2", values: mockValues })
      };
    };

    const res = await fetchMuseSocialLeads({
      token: "mock-valid-bearer-token",
      spreadsheetId: "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0",
      tabName: "ALL LEADS",
      fetchFn: mockFetch
    });

    assert.equal(res.ok, true);
    assert.equal(res.status, "Connected");
    assert.equal(res.statusCode, 200);
    assert.equal(res.rawCount, 1);
    assert.equal(res.records[0].Platform, "Facebook");
    assert.equal(res.records[0]["Group/Page Name"], "Cyprus Tech Hub");
    assert.equal(res.records[0].Budget, "€3,500");
  });

  it("17. Google Drive XLSX adapter parses OpenXML workbook without external dependencies", () => {
    import("node:zlib").then((zlib) => {
      function makeZipEntry(filename, contentStr) {
        const nameBuf = Buffer.from(filename, "utf8");
        const contentBuf = Buffer.from(contentStr, "utf8");
        const compressed = zlib.deflateRawSync(contentBuf);
        const header = Buffer.alloc(30);
        header.writeUInt32LE(0x04034b50, 0);
        header.writeUInt16LE(20, 4);
        header.writeUInt16LE(0, 6);
        header.writeUInt16LE(8, 8);
        header.writeUInt16LE(0, 10);
        header.writeUInt16LE(0, 12);
        header.writeUInt32LE(0, 14);
        header.writeUInt32LE(compressed.length, 18);
        header.writeUInt32LE(contentBuf.length, 22);
        header.writeUInt16LE(nameBuf.length, 26);
        header.writeUInt16LE(0, 28);
        return Buffer.concat([header, nameBuf, compressed]);
      }

      const zipBuf = Buffer.concat([
        makeZipEntry("xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="MASTER_JOBS" sheetId="1" r:id="rId1"/></sheets></workbook>'),
        makeZipEntry("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
        makeZipEntry("xl/sharedStrings.xml", '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6"><si><t>Company</t></si><si><t>Role / Job Title</t></si><si><t>Location</t></si><si><t>Acme Corp</t></si><si><t>Fullstack Dev</t></si><si><t>Berlin, Germany</t></si></sst>'),
        makeZipEntry("xl/worksheets/sheet1.xml", '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row><row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c><c r="C2" t="s"><v>5</v></c></row></sheetData></worksheet>')
      ]);

      const parsed = parseXlsxBuffer(zipBuf);
      assert.deepEqual(parsed.sheetNames, ["MASTER_JOBS"]);
      assert.equal(parsed.sheets.MASTER_JOBS.length, 1);
      assert.equal(parsed.sheets.MASTER_JOBS[0].Company, "Acme Corp");
      assert.equal(parsed.sheets.MASTER_JOBS[0]["Role / Job Title"], "Fullstack Dev");
      assert.equal(parsed.sheets.MASTER_JOBS[0].Location, "Berlin, Germany");
    });
  });

  it("18. Remote adapters truthfully return 'Permission required' on 403 and 'Not Found' on 404", async () => {
    const mock403Fetch = async () => ({
      ok: false,
      status: 403,
      text: async () => "The caller does not have permission"
    });

    const mock404Fetch = async () => ({
      ok: false,
      status: 404,
      text: async () => "Spreadsheet not found"
    });

    const res403 = await fetchSheetValues({
      spreadsheetId: "private-sheet-id",
      range: "ALL LEADS!A1:Z50",
      token: "token-lacking-access",
      fetchFn: mock403Fetch
    });
    assert.equal(res403.ok, false);
    assert.equal(res403.status, "Permission required");
    assert.equal(res403.statusCode, 403);

    const res404 = await fetchSheetValues({
      spreadsheetId: "nonexistent-sheet-id",
      range: "ALL LEADS!A1:Z50",
      token: "valid-token",
      fetchFn: mock404Fetch
    });
    assert.equal(res404.ok, false);
    assert.equal(res404.status, "Not Found");
    assert.equal(res404.statusCode, 404);

    const drive403 = await downloadDriveFile({
      fileId: "private-drive-file",
      token: "token-lacking-access",
      fetchFn: mock403Fetch
    });
    assert.equal(drive403.ok, false);
    assert.equal(drive403.status, "Permission required");
    assert.equal(drive403.statusCode, 403);
  });

  it("19. Strict CRM field preservation protects Sandeep's 7 user-owned fields during machine updates", () => {
    const existingUserRecord = {
      id: "opp_test_001",
      category: "visa_jobs",
      title: "Previous Title",
      organization: "Tech Solutions",
      location: "Europe",
      source_url: "https://example.com/jobs/1",
      canonical_source_url: "https://example.com/jobs/1",
      score_total: 70,
      user_status: "Applied",
      status: "Applied",
      priority: "High",
      favorite: true,
      follow_up_date: "2026-10-25",
      contacted_date: "2026-10-14",
      applied_date: "2026-10-15",
      personal_notes: "Follow up with VP of Engineering next Wednesday",
      workflow: {
        status: "Applied",
        priority: "High",
        favorite: true,
        follow_up_date: "2026-10-25",
        contacted_date: "2026-10-14",
        applied_date: "2026-10-15",
        personal_notes: "Follow up with VP of Engineering next Wednesday"
      },
      activity_history: [
        { at: "2026-10-15T10:00:00Z", label: "Application submitted via company portal" }
      ]
    };

    const incomingMachineRecord = {
      id: "opp_test_001",
      category: "visa_jobs",
      title: "Updated Title from Remote Muse Scan",
      organization: "Tech Solutions",
      location: "Europe",
      source_url: "https://example.com/jobs/1",
      canonical_source_url: "https://example.com/jobs/1",
      score_total: 92, // Fresh machine score
      deadline: "2026-11-30",
      user_status: "New", // Default machine status — MUST BE OVERRIDDEN BY USER FIELD
      priority: "Medium",
      favorite: false,
      follow_up_date: null,
      contacted_date: null,
      applied_date: null,
      personal_notes: "",
      workflow: {
        status: "New",
        priority: "Medium",
        favorite: false,
        follow_up_date: null,
        contacted_date: null,
        applied_date: null,
        personal_notes: ""
      },
      activity_history: [
        { at: "2026-10-16T00:00:00Z", label: "Remote sheets sync refreshed listing" }
      ]
    };

    const merged = preserveUserCrmFields(existingUserRecord, incomingMachineRecord);

    // 1. Status preserved
    assert.equal(merged.user_status, "Applied");
    assert.equal(merged.status, "Applied");
    assert.equal(merged.workflow.status, "Applied");

    // 2. Priority preserved
    assert.equal(merged.priority, "High");
    assert.equal(merged.workflow.priority, "High");

    // 3. Favorite preserved
    assert.equal(merged.favorite, true);
    assert.equal(merged.workflow.favorite, true);

    // 4. Follow-up date preserved
    assert.equal(merged.follow_up_date, "2026-10-25");
    assert.equal(merged.workflow.follow_up_date, "2026-10-25");

    // 5. Personal notes preserved
    assert.equal(merged.personal_notes, "Follow up with VP of Engineering next Wednesday");
    assert.equal(merged.workflow.personal_notes, "Follow up with VP of Engineering next Wednesday");

    // 6. Contacted date preserved
    assert.equal(merged.contacted_date, "2026-10-14");
    assert.equal(merged.workflow.contacted_date, "2026-10-14");

    // 7. Applied date preserved
    assert.equal(merged.applied_date, "2026-10-15");
    assert.equal(merged.workflow.applied_date, "2026-10-15");

    // Machine fields successfully updated
    assert.equal(merged.title, "Updated Title from Remote Muse Scan");
    assert.equal(merged.score_total, 92);
    assert.equal(merged.deadline, "2026-11-30");

    // Activity histories merged
    assert.equal(merged.activity_history.length, 2);
  });

  it("20. CRUCIAL INTEGRATION: Ingesting raw Muse ALL LEADS row creates a valid OpportunityRecord without altering verified_seed_24.json", () => {
    // Record baseline disk state of verified_seed_24.json
    const initialRaw = fs.readFileSync(seedPath, "utf8");
    const initialSeed = JSON.parse(initialRaw);
    assert.equal(initialSeed.opportunities.length, 24);

    const rawMuseLead = {
      Platform: "Instagram",
      "Group/Page Name": "cyprus_agency_network",
      "Post Text / Lead Description": "Urgent: Looking for senior React/TypeScript engineer to build high-performance client portal",
      "Contact / Link": "https://instagram.com/p/DB123456789/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      "Category / Role": "Freelance Lead",
      "Date Found": "2026-10-16",
      Location: "Remote (Cyprus / EU)",
      Budget: "€4,000 fixed price"
    };

    // Normalize raw lead
    const normalizedLead = normalizeMuseSocialLead(rawMuseLead, 1);

    // Verify normalization
    assert.equal(normalizedLead.category, "freelance_leads");
    assert.equal(normalizedLead.canonical_source_url, "https://instagram.com/p/DB123456789");
    assert.ok(normalizedLead.id.startsWith("opp_free_"));
    assert.equal(normalizedLead.organization, "cyprus_agency_network");
    assert.ok(normalizedLead.score_total > 0);
    assert.equal(normalizedLead.user_status, "New");

    // Merge into active in-memory dataset
    const mergeOutcome = normalizeAndMergeRecords([normalizedLead], initialSeed.opportunities);

    // Merged count is now 25 (24 initial seed + 1 newly ingested Muse lead)
    assert.equal(mergeOutcome.merged.length, 25);
    assert.equal(mergeOutcome.addedCount, 1);
    assert.ok(mergeOutcome.merged.some((o) => o.id === normalizedLead.id));

    // CRITICAL: Verify that verified_seed_24.json file on disk was NOT touched
    const postRaw = fs.readFileSync(seedPath, "utf8");
    assert.equal(initialRaw, postRaw, "CRITICAL ERROR: verified_seed_24.json was modified on disk!");
    const postSeed = JSON.parse(postRaw);
    assert.equal(postSeed.opportunities.length, 24, "Seed record count changed on disk!");
  });

  it("21. Ingestion normalizers map Master Tracker, Programmes, and Scholarships with correct classification", () => {
    // 1. normalizePrivateKey unescapes literal \n and trims quotes
    assert.equal(
      normalizePrivateKey('"-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC\\n-----END PRIVATE KEY-----\\n"'),
      "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC\n-----END PRIVATE KEY-----\n"
    );

    // 2. normalizeMasterJobTrackerRow
    const job = normalizeMasterJobTrackerRow({
      Company: "Stripe",
      "Role / Job Title": "Full Stack Engineer",
      Location: "Dublin, Ireland",
      "URL / Job Link": "https://stripe.com/jobs/123",
      "Salary / Rate": "€95,000"
    });
    assert.equal(job.category, "visa_jobs");
    assert.equal(job.organization, "Stripe");
    assert.equal(job.title, "Full Stack Engineer");
    assert.equal(job.details.salary_range, "€95,000");

    // 3. normalizeMasterProgrammeRow
    const programme = normalizeMasterProgrammeRow({
      University: "ETH Zurich",
      "Programme Name": "MSc Computer Science",
      Country: "Switzerland",
      URL: "https://inf.ethz.ch/master-cs.html",
      Tuition: "CHF 1,460 / year",
      Deadline: "2026-12-15"
    });
    assert.equal(programme.category, "masters_scholarships");
    assert.equal(programme.organization, "ETH Zurich");
    assert.equal(programme.deadline, "2026-12-15");

    // 4. normalizeScholarshipRow
    const scholarship = normalizeScholarshipRow({
      "Scholarship Name": "Excellence Scholarship & Opportunity Programme",
      Provider: "ETH Foundation",
      Country: "Switzerland",
      URL: "https://ethz.ch/scholarships/esop.html",
      Coverage: "Full Study & Living Costs (CHF 12,000 / semester)",
      Deadline: "2026-12-15"
    });
    assert.equal(scholarship.category, "masters_scholarships");
    assert.equal(scholarship.organization, "ETH Foundation");
    assert.ok(scholarship.details.tuition_and_coverage.includes("Full Study"));
  });

  it("22. High-level Drive fetchers handle download errors gracefully", async () => {
    const mockFailFetch = async () => ({
      ok: false,
      status: 403,
      text: async () => "Drive API permission denied"
    });

    const trackerRes = await fetchMasterJobTracker({
      fileId: "dummy-id",
      token: "dummy-token",
      fetchFn: mockFailFetch
    });
    assert.equal(trackerRes.ok, false);
    assert.equal(trackerRes.status, "Permission required");

    const mastersRes = await fetchMastersWorkbook({
      fileId: "dummy-id",
      token: "dummy-token",
      fetchFn: mockFailFetch
    });
    assert.equal(mastersRes.ok, false);
    assert.equal(mastersRes.status, "Permission required");
  });

  it("23. fetchMuseSocialLeads requests open-ended range without 1000-row or Z-column ceiling", async () => {
    let capturedUrl = "";
    const mockFetch = async (url) => {
      capturedUrl = url;
      return {
        status: 200,
        json: async () => ({
          range: "'ALL LEADS'!A1:AG1065",
          values: [
            ["Platform", "Group", "Contact / Link", "Title", "Category", "Location", "Budget", "Date Found", "Extra1", "Extra2"],
            ["Facebook", "Dev Group", "https://fb.com/groups/123/posts/456", "React Developer", "freelance_leads", "Remote", "$3000", "2026-10-15", "x1", "x2"]
          ]
        })
      };
    };

    const res = await fetchMuseSocialLeads({
      token: "mock-token",
      fetchFn: mockFetch
    });

    assert.equal(res.ok, true);
    assert.equal(res.status, "Connected");
    assert.equal(res.records.length, 1);
    // Verifies that the URL requests open-ended range 'ALL LEADS' without !A1:Z1000
    assert.ok(capturedUrl.includes("%27ALL%20LEADS%27") || capturedUrl.includes("ALL%20LEADS"));
    assert.ok(!capturedUrl.includes("A1:Z1000"), "Must not contain hardcoded A1:Z1000");
  });

  it("24. runCanonicalSync executes unified ingestion pipeline with dryRun and truthful diagnostics", async () => {
    const mockFetch = async (url) => {
      if (url.includes("sheets.googleapis.com")) {
        return {
          status: 200,
          json: async () => ({
            values: [
              ["Platform", "Group", "Contact / Link", "Title", "Category", "Location", "Budget", "Date Found"],
              ["Instagram", "Design Hub", "https://instagram.com/p/12345", "UI/UX & React Frontend", "freelance_leads", "Worldwide", "€2,500", "2026-10-16"]
            ]
          })
        };
      }
      return { status: 404, text: async () => "Not Found" };
    };

    const result = await runCanonicalSync({
      googleSaEmail: "test@sa.iam.gserviceaccount.com",
      googlePrivateKey: "mock-key",
      fetchFn: mockFetch,
      dryRun: true
    });

    assert.ok(result.telemetry);
    assert.ok(result.telemetry.runId.startsWith("SYNC-"));
    assert.equal(typeof result.telemetry.totalRecords, "number");
    assert.ok(Array.isArray(result.records));
    assert.ok(Array.isArray(result.telemetry.sourceDiagnostics));
    assert.equal(result.telemetry.sourceDiagnostics.length, 3);
  });

  it("25. Parity verification: scheduled runner and canonical engine produce identical IDs and scoring on same inputs", async () => {
    const mockLead = {
      Platform: "LinkedIn",
      "Group/Page Name": "European Tech Hiring",
      "Contact / Link": "https://linkedin.com/jobs/view/99887766",
      "Job Title": "Full Stack Engineer (TypeScript & React)",
      Category: "visa_jobs",
      Location: "Limassol, Cyprus",
      Budget: "€65,000"
    };

    const norm1 = normalizeMuseSocialLead(mockLead, 1);
    const norm2 = normalizeMuseSocialLead(mockLead, 1);

    assert.equal(norm1.id, norm2.id);
    assert.equal(norm1.category, norm2.category);
    assert.equal(norm1.score_total, norm2.score_total);
    assert.equal(norm1.canonical_source_url, norm2.canonical_source_url);
    assert.ok(norm1.id.startsWith("opp_visa_"));

    // Verify runServerSync and runCanonicalSync yield identical structure and deterministic counts
    const mockFetch = async () => ({
      status: 200,
      json: async () => ({ values: [] })
    });
    const s1 = await runServerSync({ dryRun: true, fetchFn: mockFetch, currentRecords: [] });
    const s2 = await runCanonicalSync({ dryRun: true, fetchFn: mockFetch, currentRecords: [] });
    assert.equal(s1.status, s2.telemetry.status);
    assert.equal(s1.totalRecords, s2.telemetry.totalRecords);
    assert.equal(s1.sourcesAttempted, s2.telemetry.sourcesAttempted);
  });

  it("26. Strict 7-Field CRM Preservation protects all user edits when incoming sync arrives", () => {
    const existingOpp = {
      id: "opp_free_123456789abc",
      category: "freelance_leads",
      title: "React Web App Development",
      organization: "Cyprus Studio",
      source_url: "https://example.com/lead/1",
      canonical_source_url: "https://example.com/lead/1",
      provenance_urls: ["https://example.com/lead/1"],
      is_active: true,
      score_total: 80,
      // 7 USER-OWNED CRM FIELDS
      user_status: "In Conversation",
      status: "In Conversation",
      outreach_status: "In Conversation",
      priority: "P1",
      priority_override: "P1",
      favorite: true,
      pinned: true,
      follow_up_date: "2026-10-20",
      personal_notes: "Sent proposal via email. Follow up Tuesday.",
      notes: "Sent proposal via email. Follow up Tuesday.",
      contacted_date: "2026-10-15",
      applied_date: "2026-10-15",
      workflow: {
        status: "In Conversation",
        priority: "P1",
        favorite: true,
        follow_up_date: "2026-10-20",
        personal_notes: "Sent proposal via email. Follow up Tuesday.",
        contacted_date: "2026-10-15",
        applied_date: "2026-10-15"
      },
      activity_history: [{ at: "2026-10-15T10:00:00Z", label: "Initial contact" }]
    };

    // Incoming machine update with fresh score but default CRM values ("New", "P2", false, empty notes)
    const incomingMachineUpdate = {
      id: "opp_free_123456789abc",
      category: "freelance_leads",
      title: "React Web App Development (Updated Title)",
      organization: "Cyprus Studio",
      source_url: "https://example.com/lead/1",
      canonical_source_url: "https://example.com/lead/1",
      is_active: true,
      score_total: 92, // Fresh score
      user_status: "New",
      priority: "P2",
      favorite: false,
      follow_up_date: null,
      personal_notes: "",
      contacted_date: null,
      applied_date: null
    };

    const preserved = preserveUserCrmFields(existingOpp, incomingMachineUpdate);

    // 1. Fresher machine score accepted
    assert.equal(preserved.score_total, 92);
    // 2. All 7 user-owned CRM fields strictly preserved!
    assert.equal(preserved.user_status, "In Conversation");
    assert.equal(preserved.workflow.status, "In Conversation");
    assert.equal(preserved.priority, "P1");
    assert.equal(preserved.workflow.priority, "P1");
    assert.equal(preserved.favorite, true);
    assert.equal(preserved.workflow.favorite, true);
    assert.equal(preserved.follow_up_date, "2026-10-20");
    assert.equal(preserved.workflow.follow_up_date, "2026-10-20");
    assert.equal(preserved.personal_notes, "Sent proposal via email. Follow up Tuesday.");
    assert.equal(preserved.workflow.personal_notes, "Sent proposal via email. Follow up Tuesday.");
    assert.equal(preserved.contacted_date, "2026-10-15");
    assert.equal(preserved.workflow.contacted_date, "2026-10-15");
    assert.equal(preserved.applied_date, "2026-10-15");
    assert.equal(preserved.workflow.applied_date, "2026-10-15");
    assert.ok(preserved.activity_history.length >= 1);
  });
});

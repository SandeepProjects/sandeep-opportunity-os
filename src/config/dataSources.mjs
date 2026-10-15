/**
 * Sandeep Opportunity OS — Canonical Data Sources & Resource Registry (Runtime Definition)
 *
 * Central source of truth for all Google Drive, Google Sheets, local Muse,
 * and Supabase infrastructure resources.
 *
 * SECURITY:
 * Never include API keys, Google service-account private keys, or tokens in this file.
 */

export const DATA_SOURCE_REGISTRY = [
  // 1. Social Job Hunter — Native Google Sheet
  {
    id: "muse_social_job_hunter",
    name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
    type: "Native Google Sheet",
    url: "https://docs.google.com/spreadsheets/d/1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0/edit",
    spreadsheetId: "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0",
    purpose: "Social-job leads, social freelance leads, source provenance, research discovery metadata",
    pipeline: "social_jobs",
    syncEnabled: true,
    syncMode: "AUTOMATIC_6H",
    status: "Permission required",
    verifiedTabs: [
      "ALL LEADS",
      "DAILY RESULTS",
      "GROUP DIRECTORY",
      "OUTREACH TRACKER",
      "SEARCH LOG"
    ],
    notes:
      "Primary social leads dataset in 'ALL LEADS'. Private Google Sheet owned by Sandeep; requires Google Service Account invitation for server-side ingestion."
  },

  // 2. Master Job Application Tracker (XLSX in Drive)
  {
    id: "master_job_application_tracker",
    name: "MASTER_JOB_APPLICATION_TRACKER.xlsx",
    type: "Drive XLSX",
    url: "https://drive.google.com/file/d/1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1/view",
    driveId: "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1",
    folderId: "1oFzWuAryur86ArpOn5mH-oUWzm8uOUL_",
    purpose: "Job application engine, graduate scheme sweep, weekday job search, Friday pipeline review",
    pipeline: "visa_jobs",
    syncEnabled: true,
    syncMode: "AUTOMATIC_6H",
    status: "Permission required",
    notes:
      "Important employment/application source stored in 'Job Apply — Trackers' Drive folder. Private XLSX workbook requiring server-side download and normalization."
  },

  // 3. Job Apply Root Folder
  {
    id: "job_apply_root",
    name: "Job Apply",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/1g0XUzrlsOr9ze6Peaw6SMhcDLDYZSuE0",
    folderId: "1g0XUzrlsOr9ze6Peaw6SMhcDLDYZSuE0",
    purpose: "Root directory containing application packs, staged subfolders, and review assets",
    pipeline: "operations",
    syncEnabled: false,
    syncMode: "MANUAL_ONLY",
    status: "Connected",
    notes: "Top-level Google Drive container for all candidate job application folders."
  },

  // 4. Job Apply — Pending
  {
    id: "job_apply_pending",
    name: "Job Apply — Pending",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/1OMDTYRW4uQmz8P1cCTXFTSz0yrGmpc_l",
    folderId: "1OMDTYRW4uQmz8P1cCTXFTSz0yrGmpc_l",
    purpose: "Application packs currently being drafted or prepared by automated pipelines",
    pipeline: "visa_jobs",
    syncEnabled: false,
    syncMode: "MANUAL_ONLY",
    status: "Connected",
    notes: "Staged folder for in-progress draft application packs before final candidate review."
  },

  // 5. Job Apply — Ready for Approval
  {
    id: "job_apply_ready_for_approval",
    name: "Job Apply — Ready for Approval",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/17dpw5xNHDm3yPy1KiBnDt_xfkyBrF3wy",
    folderId: "17dpw5xNHDm3yPy1KiBnDt_xfkyBrF3wy",
    purpose: "Prepared applications and tailored CV/cover letter packs waiting for Sandeep's approval",
    pipeline: "visa_jobs",
    syncEnabled: false,
    syncMode: "MANUAL_ONLY",
    status: "Connected",
    notes: "Reviewed application packs awaiting final approval before submission."
  },

  // 6. Job Apply — Applied
  {
    id: "job_apply_applied",
    name: "Job Apply — Applied",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/1eS96WrT6HQ8zqbSntUPgtnICYRNa-bUM",
    folderId: "1eS96WrT6HQ8zqbSntUPgtnICYRNa-bUM",
    purpose: "Submitted application packs archived for reference and interview preparation",
    pipeline: "visa_jobs",
    syncEnabled: false,
    syncMode: "MANUAL_ONLY",
    status: "Connected",
    notes: "Historical audit and review folder for submitted job applications."
  },

  // 7. Job Apply — Failed
  {
    id: "job_apply_failed",
    name: "Job Apply — Failed",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/101_-5fPC16bivgpNVkP7uueF49MpjHgq",
    folderId: "101_-5fPC16bivgpNVkP7uueF49MpjHgq",
    purpose: "Applications blocked by technical failure, portal issues, or validation errors",
    pipeline: "visa_jobs",
    syncEnabled: false,
    syncMode: "MANUAL_ONLY",
    status: "Connected",
    notes: "Error quarantine folder for failed submissions."
  },

  // 8. Job Apply — Rejected
  {
    id: "job_apply_rejected",
    name: "Job Apply — Rejected",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/1y4UyghfocbkmyoGnUpD5oHSVQb4HuBk1",
    folderId: "1y4UyghfocbkmyoGnUpD5oHSVQb4HuBk1",
    purpose: "Formal employer rejections archived for telemetry and post-mortem learning",
    pipeline: "visa_jobs",
    syncEnabled: false,
    syncMode: "MANUAL_ONLY",
    status: "Connected",
    notes: "Archived rejection records."
  },

  // 9. Job Apply — Trackers
  {
    id: "job_apply_trackers",
    name: "Job Apply — Trackers",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/1oFzWuAryur86ArpOn5mH-oUWzm8uOUL_",
    folderId: "1oFzWuAryur86ArpOn5mH-oUWzm8uOUL_",
    purpose: "Folder hosting MASTER_JOB_APPLICATION_TRACKER.xlsx and related tracking assets",
    pipeline: "operations",
    syncEnabled: false,
    syncMode: "MANUAL_ONLY",
    status: "Connected",
    notes: "Container folder for master application tracking spreadsheets."
  },

  // 10. Reports
  {
    id: "reports_folder",
    name: "Reports",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/1yqpyzPa2FmuNNrzqM56J4qBAVm2bbBix",
    folderId: "1yqpyzPa2FmuNNrzqM56J4qBAVm2bbBix",
    purpose: "Periodic research summaries and pipeline reports",
    pipeline: "operations",
    syncEnabled: false,
    syncMode: "DISABLED",
    status: "Unused / available",
    notes: "Currently unused repository folder. Registered as available without fake sync claims."
  },

  // 11. Master's Admissions
  {
    id: "masters_admissions_folder",
    name: "Master's Admissions",
    type: "Drive Folder",
    url: "https://drive.google.com/drive/folders/1S_FYU8b1xeP6S098SkYaADWYIkH5a_Nf",
    folderId: "1S_FYU8b1xeP6S098SkYaADWYIkH5a_Nf",
    purpose: "Master's admissions documentation, personal statements, and scholarship packs",
    pipeline: "masters_scholarships",
    syncEnabled: false,
    syncMode: "MANUAL_ONLY",
    status: "Connected",
    notes: "Drive folder containing Master's research workbook and application submissions."
  },

  // 12. Master's Workbook
  {
    id: "masters_workbook",
    name: "master-spreadsheet.xlsx",
    type: "Drive XLSX",
    url: "https://docs.google.com/spreadsheets/d/156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj/edit",
    driveId: "156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj",
    spreadsheetId: "156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj",
    purpose: "Master's programmes, funded scholarships, application deadlines, eligibility evidence",
    pipeline: "masters_scholarships",
    syncEnabled: true,
    syncMode: "AUTOMATIC_6H",
    status: "Stale",
    staleWarning:
      "Drive copy may be older than the active local Muse version. Verification required before live production overwrite.",
    verifiedTabs: ["MASTER_PROGRAMMES", "SCHOLARSHIPS"],
    notes:
      "Important Master's pipeline workbook. Displayed with a stale warning until timestamp parity is confirmed with local Muse research."
  },

  // 13. Local-Only Muse Files (No Windows paths exposed in UI)
  {
    id: "local_lead_tracker",
    name: "lead-tracker.xlsx",
    type: "Local File",
    url: null,
    purpose: "Local Muse freelance client lead tracker and outreach staging sheet",
    pipeline: "freelance_leads",
    syncEnabled: false,
    syncMode: "LOCAL_ONLY",
    status: "Local only",
    notes: "Not available to production sync. Local Muse workbook on Sandeep's workstation."
  },
  {
    id: "local_job_trackers",
    name: "job-tracker-YYYY-MM-DD.xlsx (Series)",
    type: "Local File",
    url: null,
    purpose: "Dated execution snapshots (e.g. JOBER 200, EU Jobs Master 2026-09-29)",
    pipeline: "visa_jobs",
    syncEnabled: false,
    syncMode: "LOCAL_ONLY",
    status: "Local only",
    notes: "Not available to production sync. Series of local job application snapshots."
  },
  {
    id: "local_agency_outreach_log",
    name: "agency_outreach_log.csv",
    type: "Local File",
    url: null,
    purpose: "Local agency outreach records and recruiter dispatch logs",
    pipeline: "freelance_leads",
    syncEnabled: false,
    syncMode: "LOCAL_ONLY",
    status: "Local only",
    notes: "Not available to production sync. Local CSV tracking agency communications."
  },
  {
    id: "local_agencies_final",
    name: "agencies_final.csv",
    type: "Local File",
    url: null,
    purpose: "Verified agency database including Cyprus & EU IT recruitment contacts",
    pipeline: "freelance_leads",
    syncEnabled: false,
    syncMode: "LOCAL_ONLY",
    status: "Local only",
    notes: "Not available to production sync. Local agency contact dataset."
  },
  {
    id: "local_outreach_drafts",
    name: "outreach-drafts-YYYY-MM-DD.md",
    type: "Local File",
    url: null,
    purpose: "Generated personalized pitch drafts and client proposal notes",
    pipeline: "general",
    syncEnabled: false,
    syncMode: "LOCAL_ONLY",
    status: "Local only",
    notes: "Not available to production sync. Local Markdown outreach drafts."
  },
  {
    id: "local_social_hunter",
    name: "social-hunter-local.xlsx / JSON",
    type: "Local File",
    url: null,
    purpose: "Local scrapers and staging outputs from Facebook & Instagram job hunting",
    pipeline: "social_jobs",
    syncEnabled: false,
    syncMode: "LOCAL_ONLY",
    status: "Local only",
    notes: "Not available to production sync. Local raw social lead cache."
  },

  // 14. Legacy / Disconnected Resources
  {
    id: "legacy_sheet_17nh",
    name: "Old Opportunity OS Native Sheet",
    type: "Native Google Sheet",
    url: "https://docs.google.com/spreadsheets/d/17NhC05g7jyTqDZRo62sGzERh9XUad4KJ8X8OBcXqb5Q/edit",
    spreadsheetId: "17NhC05g7jyTqDZRo62sGzERh9XUad4KJ8X8OBcXqb5Q",
    purpose: "Historical Google Sheet reference from initial prototype",
    pipeline: "operations",
    syncEnabled: false,
    syncMode: "DISABLED",
    status: "Legacy / Disconnected",
    isLegacy: true,
    notes:
      "Disconnected / unresolvable with current Google account. Retained in registry as historical marker without fake sync claims."
  },
  {
    id: "legacy_workbook_19ig",
    name: "Old Uploaded 6-Tab Master Workbook",
    type: "Drive XLSX",
    url: "https://drive.google.com/file/d/19igEOYpemKTRojy4b94QPbCE78gT7n2O/view",
    driveId: "19igEOYpemKTRojy4b94QPbCE78gT7n2O",
    purpose: "Historical 6-tab master spreadsheet from legacy prototype",
    pipeline: "operations",
    syncEnabled: false,
    syncMode: "DISABLED",
    status: "Legacy / Disconnected",
    isLegacy: true,
    notes:
      "Disconnected / unverified Drive ID. Retained as legacy marker; superseded by MASTER_JOB_APPLICATION_TRACKER.xlsx."
  },

  // 15. Supabase Canonical Database
  {
    id: "supabase_canonical_db",
    name: "Supabase / PostgreSQL Canonical DB",
    type: "Database",
    url: null,
    purpose: "Primary system-of-record storing opportunities, workflow states, and sync telemetry",
    pipeline: "general",
    syncEnabled: true,
    syncMode: "DATABASE_STORAGE",
    status: "Connected (DB)",
    notes: "PostgreSQL database storing canonical records with strict user-owned CRM protection."
  }
];

export function getDataSources() {
  return DATA_SOURCE_REGISTRY;
}

export function getDataSourceById(id) {
  return DATA_SOURCE_REGISTRY.find((ds) => ds.id === id);
}

export function getDataSourcesByCategory(category) {
  switch (category) {
    case "sheets":
      return DATA_SOURCE_REGISTRY.filter(
        (ds) => ds.type === "Native Google Sheet" && !ds.isLegacy
      );
    case "drive":
      return DATA_SOURCE_REGISTRY.filter(
        (ds) => (ds.type === "Drive XLSX" || ds.type === "Drive Folder") && !ds.isLegacy
      );
    case "local":
      return DATA_SOURCE_REGISTRY.filter((ds) => ds.type === "Local File");
    case "supabase":
      return DATA_SOURCE_REGISTRY.filter((ds) => ds.type === "Database");
    case "legacy":
      return DATA_SOURCE_REGISTRY.filter((ds) => ds.isLegacy);
    default:
      return [];
  }
}

export function getNextScheduledSync(referenceTime = new Date()) {
  const intervals = [0, 6, 12, 18];
  const ref = new Date(referenceTime);

  const currentHour = ref.getUTCHours();
  const currentMinute = ref.getUTCMinutes();

  let targetHour = intervals.find(
    (h) => h > currentHour || (h === currentHour && currentMinute === 0)
  );
  const targetDate = new Date(ref);

  if (targetHour === undefined) {
    targetHour = 0;
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  }

  targetDate.setUTCHours(targetHour, 0, 0, 0);

  const diffMs = targetDate.getTime() - ref.getTime();
  const minutesRemaining = Math.max(0, Math.round(diffMs / 60000));
  const hourPadded = String(targetHour).padStart(2, "0");

  return {
    iso: targetDate.toISOString(),
    formattedUtc: `${hourPadded}:00 UTC`,
    minutesRemaining
  };
}

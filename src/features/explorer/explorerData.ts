/**
 * Sandeep Opportunity OS — Drive Explorer & Workspace Hierarchy
 *
 * Defines the canonical file tree and navigation model for:
 * 1. WORKSPACE AGENTS:
 *    - Bago Muse (BM)
 *    - Kattu AI (KA)
 *    - Haya Satnam (HS)
 *    - Haya Arsh (HA)
 *    (Sandy Muse is strictly excluded from the agent switcher)
 *
 * 2. DRIVE EXPLORER ROOT WORKSPACES:
 *    - BAGOMUSE - SANDY MUSE
 *    - MUSESATNAM
 *    - Projects KattuAI
 *    - Haya Arsh workspace
 *    - Job Apply
 *    - JOB_CMS_AGENTS
 */

import type { OpportunityRecord, PipelineCategory } from "../../types/opportunity";

export type ExplorerAgentId = "bago_muse" | "kattu_ai" | "haya_satnam" | "haya_arsh";

export interface ExplorerAgent {
  id: ExplorerAgentId;
  name: string;
  codename: string;
  role: string;
  initials: string;
  themeColor: string;
  status: "online" | "idle" | "syncing";
  defaultWorkspaceId: string;
  description: string;
}

export interface SheetTabConfig {
  id: string;
  label: string;
  filterFn?: (opp: OpportunityRecord) => boolean;
}

export interface SheetConfig {
  id: string;
  name: string;
  spreadsheetId?: string;
  driveId?: string;
  fileType: "google_sheet" | "xlsx" | "csv";
  sourceId?: string;
  category: PipelineCategory | "all";
  tabs: SheetTabConfig[];
  description: string;
  externalUrl?: string;
}

export interface FolderConfig {
  id: string;
  name: string;
  folderId?: string;
  description: string;
  sheets: SheetConfig[];
  subfolders?: FolderConfig[];
  externalUrl?: string;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  ownerAgentId?: ExplorerAgentId;
  description: string;
  folders: FolderConfig[];
  sheets: SheetConfig[];
}

export const WORKSPACE_AGENTS: ExplorerAgent[] = [
  {
    id: "bago_muse",
    name: "Bago Muse",
    codename: "MUSE-01-BAGO",
    role: "Lead AI Scout & Social Freelance Hunter",
    initials: "BM",
    themeColor: "#3b82f6", // Electric Blue
    status: "online",
    defaultWorkspaceId: "ws_bagomuse",
    description: "Autonomously scans Facebook groups, Instagram feeds, developer communities, and Cypriot business forums for active software, frontend, and website overhaul leads."
  },
  {
    id: "kattu_ai",
    name: "Kattu AI",
    codename: "KATTU-AI-DISTRIBUTED",
    role: "Remote EMEA & Distributed Developer Scout",
    initials: "KA",
    themeColor: "#f59e0b", // Amber
    status: "online",
    defaultWorkspaceId: "ws_kattu",
    description: "Indexes verified remote engineering roles across Cyprus and EMEA timezones, filtering out US-only/Africa-only restricted listings."
  },
  {
    id: "haya_satnam",
    name: "Haya Satnam",
    codename: "HAYA-SATNAM-CAREERS",
    role: "Enterprise Application & Visa Employment Hunter",
    initials: "HS",
    themeColor: "#10b981", // Emerald Mint
    status: "online",
    defaultWorkspaceId: "ws_musesatnam",
    description: "Orchestrates enterprise job applications, graduate engineering schemes, and Cyprus/EU visa-sponsoring roles across Facebook, Instagram, and LinkedIn portals."
  },
  {
    id: "haya_arsh",
    name: "Haya Arsh",
    codename: "HAYA-ARSH-ACADEMIC",
    role: "Academic & Funded Scholarship Intelligence Scout",
    initials: "HA",
    themeColor: "#8b5cf6", // Violet / Purple
    status: "online",
    defaultWorkspaceId: "ws_haya_arsh",
    description: "Tracks Master's degree programmes, Erasmus Mundus consortia, and 40% UCLan Cyprus Alumni funded scholarships for 2026/2027 admissions."
  }
];

export const WORKSPACE_TREE: WorkspaceConfig[] = [
  // 1. BAGOMUSE - SANDY MUSE
  {
    id: "ws_bagomuse",
    name: "BAGOMUSE - SANDY MUSE",
    ownerAgentId: "bago_muse",
    description: "Primary social job hunting and client research workspace with multi-channel outreach sheets.",
    sheets: [],
    folders: [
      {
        id: "f_social_hunter",
        name: "Social Job Hunter",
        description: "Social media intelligence streams and graduate scheme trackers.",
        sheets: [
          {
            id: "muse_social_job_hunter",
            name: "FB / Insta Applications",
            spreadsheetId: "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0",
            sourceId: "muse_social_job_hunter",
            fileType: "google_sheet",
            category: "freelance_leads",
            description: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER native spreadsheet across 33 columns.",
            externalUrl: "https://docs.google.com/spreadsheets/d/1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0/edit",
            tabs: [
              { id: "ALL LEADS", label: "ALL LEADS" },
              { id: "DAILY RESULTS", label: "DAILY RESULTS", filterFn: (opp) => opp.workflow?.status === "New" },
              { id: "GROUP DIRECTORY", label: "GROUP DIRECTORY", filterFn: (opp) => (opp.source_url || "").includes("facebook.com/groups") },
              { id: "OUTREACH TRACKER", label: "OUTREACH TRACKER", filterFn: (opp) => ["Contacted", "Follow-Up", "Interviewing"].includes(opp.workflow?.status || opp.user_status) },
              { id: "SEARCH LOG", label: "SEARCH LOG" }
            ]
          },
          {
            id: "sheet_grad_schemes",
            name: "Graduate Schemes - Master Tracker",
            driveId: "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1",
            sourceId: "master_job_application_tracker",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "Graduate schemes, UK/EU technology tracks, and enterprise engineering applications.",
            tabs: [
              { id: "ALL SCHEMES", label: "ALL SCHEMES" },
              { id: "PORTALS", label: "PORTALS" },
              { id: "DEADLINES", label: "DEADLINES", filterFn: (opp) => Boolean(opp.deadline) },
              { id: "ARCHIVED", label: "ARCHIVED", filterFn: (opp) => opp.is_active === false }
            ]
          }
        ]
      },
      {
        id: "f_eu_job_help",
        name: "EU Job Help",
        description: "European on-site and relocation engineering pipeline.",
        sheets: [
          {
            id: "sheet_eu_job_search",
            name: "Job Search",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "EU early-career engineering positions with work visa authorization.",
            tabs: [
              { id: "ACTIVE ROLES", label: "ACTIVE ROLES" },
              { id: "VISA SPONSORS", label: "VISA SPONSORS", filterFn: (opp) => (opp.details as Record<string, unknown> | undefined)?.visaSponsorship === true },
              { id: "APPLIED", label: "APPLIED", filterFn: (opp) => opp.workflow?.status === "Applied" }
            ]
          },
          {
            id: "sheet_pipeline_review",
            name: "Friday Pipeline Review",
            fileType: "google_sheet",
            category: "visa_jobs",
            description: "Weekly cadence review of active submissions and response rates.",
            tabs: [
              { id: "WEEKLY DIGEST", label: "WEEKLY DIGEST" },
              { id: "INTERVIEWS", label: "INTERVIEWS", filterFn: (opp) => opp.workflow?.status === "Interviewing" },
              { id: "FOLLOW UPS", label: "FOLLOW UPS", filterFn: (opp) => Boolean(opp.workflow?.follow_up_date) }
            ]
          }
        ]
      },
      {
        id: "f_web_client",
        name: "Web Client",
        description: "Commercial freelance contracts and website renovation leads.",
        sheets: [
          {
            id: "sheet_web_client_tracker",
            name: "Client Lead Pipeline",
            fileType: "xlsx",
            category: "freelance_leads",
            description: "Cyprus & UK SME clients needing frontend engineering and modern web rebuilds.",
            tabs: [
              { id: "LEADS", label: "ALL LEADS" },
              { id: "PITCHES", label: "PROPOSALS SENT", filterFn: (opp) => opp.workflow?.status === "Contacted" },
              { id: "CONTRACTS", label: "ACTIVE CONTRACTS", filterFn: (opp) => opp.workflow?.status === "Interviewing" }
            ]
          }
        ]
      },
      {
        id: "f_masters_help",
        name: "Masters Help",
        description: "Academic documentation and funding opportunity trackers.",
        sheets: [
          {
            id: "sheet_masters_help_overview",
            name: "Programmes Overview",
            fileType: "google_sheet",
            category: "masters_scholarships",
            description: "High-value funded MSc Computing and Data Science programmes.",
            tabs: [
              { id: "PROGRAMMES", label: "PROGRAMMES" },
              { id: "SCHOLARSHIPS", label: "SCHOLARSHIPS" }
            ]
          }
        ]
      },
      {
        id: "f_recruitment_agencies",
        name: "Recruitment Agencies",
        description: "Verified IT recruitment and headhunting agency directory.",
        sheets: [
          {
            id: "sheet_agencies_directory",
            name: "Agencies Final Registry",
            fileType: "csv",
            category: "freelance_leads",
            description: "Curated tech recruitment partners across Limassol, Nicosia, and Athens.",
            tabs: [
              { id: "CYPRUS AGENCIES", label: "CYPRUS AGENCIES" },
              { id: "EU TECH RECRUITERS", label: "EU TECH RECRUITERS" }
            ]
          }
        ]
      },
      {
        id: "f_shared_resources",
        name: "Shared Resources",
        description: "Shared templates, outreach scripts, and evaluation criteria.",
        sheets: []
      },
      {
        id: "f_legacy_review",
        name: "Legacy Review",
        description: "Archived prototype sheets and historical records.",
        sheets: []
      },
      {
        id: "f_documentation",
        name: "Documentation",
        description: "Agent specifications, operational schedules, and onboarding guides.",
        sheets: []
      }
    ]
  },

  // 2. MUSESATNAM
  {
    id: "ws_musesatnam",
    name: "MUSESATNAM",
    ownerAgentId: "haya_satnam",
    description: "Haya Satnam's dedicated enterprise job application workspace and country-based trackers.",
    sheets: [],
    folders: [
      {
        id: "f_cyprus_visa",
        name: "Cyprus Visa & On-Site Engineering",
        description: "Nicosia and Limassol based engineering roles with relocation and visa readiness.",
        sheets: [
          {
            id: "master_job_application_tracker",
            name: "MASTER_JOB_APPLICATION_TRACKER.xlsx",
            driveId: "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1",
            sourceId: "master_job_application_tracker",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "Canonical OpenXML application engine tracking Cyprus on-site and EU visa roles.",
            externalUrl: "https://drive.google.com/file/d/1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1/view",
            tabs: [
              { id: "All Applications", label: "All Applications" },
              { id: "Facebook", label: "Facebook" },
              { id: "Instagram", label: "Instagram" },
              { id: "Pending Actions", label: "Pending Actions", filterFn: (opp) => ["New", "Preparing"].includes(opp.workflow?.status || opp.user_status) },
              { id: "Threads", label: "Threads" }
            ]
          }
        ]
      },
      {
        id: "f_uk_eu_strategic",
        name: "UK & EU Strategic Applications",
        description: "Graduate programs and structured technology trainee schemes.",
        sheets: [
          {
            id: "sheet_satnam_grad_schemes",
            name: "Graduate Schemes Tracker",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "Tier-2 / skilled worker visa sponsoring technology graduate programmes.",
            tabs: [
              { id: "ACTIVE SCHEMES", label: "ACTIVE SCHEMES" },
              { id: "DEADLINES", label: "DEADLINES", filterFn: (opp) => Boolean(opp.deadline) },
              { id: "PORTALS", label: "PORTALS" }
            ]
          }
        ]
      },
      {
        id: "f_country_direct",
        name: "Country Direct Applications",
        description: "Direct company portal submissions by country.",
        sheets: [
          {
            id: "sheet_country_direct_tracker",
            name: "Country Trackers",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "Targeted applications across Cyprus, Germany, and the Netherlands.",
            tabs: [
              { id: "CYPRUS DIRECT", label: "CYPRUS DIRECT" },
              { id: "GERMANY DIRECT", label: "GERMANY DIRECT" },
              { id: "NETHERLANDS DIRECT", label: "NETHERLANDS DIRECT" }
            ]
          }
        ]
      }
    ]
  },

  // 3. Projects KattuAI
  {
    id: "ws_kattu",
    name: "Projects KattuAI",
    ownerAgentId: "kattu_ai",
    description: "Kattu AI's distributed workspace focusing on European remote roles and regional tech hubs.",
    sheets: [],
    folders: [
      {
        id: "f_emea_remote",
        name: "EMEA Remote Engineering",
        description: "Full-time remote engineering positions compatible with Cyprus timezone (UTC+2).",
        sheets: [
          {
            id: "sheet_remote_devs",
            name: "Remote Developers & Interns",
            fileType: "google_sheet",
            category: "remote_jobs",
            description: "Distributed software development roles verified for Mediterranean/European contractors.",
            tabs: [
              { id: "ACTIVE REMOTE", label: "ACTIVE REMOTE" },
              { id: "CONTRACT", label: "CONTRACT / FREELANCE" },
              { id: "FULL-TIME", label: "FULL-TIME REMOTE" },
              { id: "INTERNS", label: "PAID INTERNSHIPS" }
            ]
          }
        ]
      },
      {
        id: "f_tech_hubs",
        name: "Tech Hub Trackers",
        description: "Dedicated trackers for European technology centers.",
        sheets: [
          {
            id: "sheet_tech_hubs_tracker",
            name: "Berlin, Amsterdam & Dublin Trackers",
            fileType: "xlsx",
            category: "remote_jobs",
            description: "Direct-to-engineering leads across major European tech capitals.",
            tabs: [
              { id: "BERLIN TECH", label: "BERLIN TECH" },
              { id: "AMSTERDAM TECH", label: "AMSTERDAM TECH" },
              { id: "DUBLIN FINTECH", label: "DUBLIN FINTECH" }
            ]
          }
        ]
      }
    ]
  },

  // 4. Haya Arsh workspace
  {
    id: "ws_haya_arsh",
    name: "Haya Arsh workspace",
    ownerAgentId: "haya_arsh",
    description: "Haya Arsh's academic intelligence workspace covering university admissions and funded scholarships.",
    sheets: [],
    folders: [
      {
        id: "f_masters_programmes_scholarships",
        name: "Master's Programmes & Funded Scholarships",
        description: "Canonical Master's workbook tracking EU/Cyprus degrees and 40% alumni grants.",
        sheets: [
          {
            id: "masters_workbook",
            name: "master-spreadsheet.xlsx",
            driveId: "156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj",
            spreadsheetId: "156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj",
            sourceId: "masters_workbook",
            fileType: "xlsx",
            category: "masters_scholarships",
            description: "Academic master's and scholarship spreadsheet across UCLan Cyprus and Erasmus Mundus.",
            externalUrl: "https://docs.google.com/spreadsheets/d/156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj/edit",
            tabs: [
              { id: "MASTER_PROGRAMMES", label: "MASTER_PROGRAMMES" },
              { id: "SCHOLARSHIPS", label: "SCHOLARSHIPS" }
            ]
          }
        ]
      },
      {
        id: "f_admissions_staging",
        name: "Admissions Staging & Documents",
        description: "Application documentation, transcript reviews, and submission timelines.",
        sheets: [
          {
            id: "sheet_admissions_deadlines",
            name: "Admissions Applications & Deadlines",
            fileType: "xlsx",
            category: "masters_scholarships",
            description: "Structured deadlines for UCLan Cyprus MSc Computing and European consortia.",
            tabs: [
              { id: "UCLan CYPRUS", label: "UCLan CYPRUS (40% ALUMNI)" },
              { id: "ERASMUS MUNDUS", label: "ERASMUS MUNDUS" },
              { id: "EU MSc", label: "EU MSc PROGRAMMES" }
            ]
          }
        ]
      }
    ]
  },

  // 5. Job Apply
  {
    id: "ws_job_apply",
    name: "Job Apply",
    description: "Staged application packs, document containers, and submission audit trail.",
    sheets: [],
    folders: [
      {
        id: "job_apply_pending",
        name: "Job Apply — Pending",
        folderId: "1OMDTYRW4uQmz8P1cCTXFTSz0yrGmpc_l",
        description: "Application packs currently being drafted or prepared by automated pipelines.",
        externalUrl: "https://drive.google.com/drive/folders/1OMDTYRW4uQmz8P1cCTXFTSz0yrGmpc_l",
        sheets: [
          {
            id: "sheet_apply_pending",
            name: "Pending Draft Applications",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "In-progress draft applications awaiting final resume customization.",
            tabs: [
              { id: "DRAFTS", label: "ALL DRAFTS" },
              { id: "STAGED PACKS", label: "STAGED PACKS" }
            ]
          }
        ]
      },
      {
        id: "job_apply_ready_for_approval",
        name: "Job Apply — Ready for Approval",
        folderId: "17dpw5xNHDm3yPy1KiBnDt_xfkyBrF3wy",
        description: "Prepared applications and tailored CV/cover letter packs waiting for Sandeep's approval.",
        externalUrl: "https://drive.google.com/drive/folders/17dpw5xNHDm3yPy1KiBnDt_xfkyBrF3wy",
        sheets: [
          {
            id: "sheet_apply_ready",
            name: "Approval Queue",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "High-priority roles with finished application documents ready for review.",
            tabs: [
              { id: "FOR APPROVAL", label: "READY FOR APPROVAL" },
              { id: "CV TAILORED", label: "TAILORED PACKS" }
            ]
          }
        ]
      },
      {
        id: "job_apply_applied",
        name: "Job Apply — Applied",
        folderId: "1eS96WrT6HQ8zqbSntUPgtnICYRNa-bUM",
        description: "Submitted application packs archived for reference and interview preparation.",
        externalUrl: "https://drive.google.com/drive/folders/1eS96WrT6HQ8zqbSntUPgtnICYRNa-bUM",
        sheets: [
          {
            id: "sheet_apply_applied",
            name: "Submitted Applications Log",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "Submitted job applications with confirmation records.",
            tabs: [
              { id: "SUBMITTED", label: "ALL SUBMITTED" },
              { id: "CONFIRMATIONS", label: "CONFIRMATIONS" }
            ]
          }
        ]
      },
      {
        id: "job_apply_trackers",
        name: "Job Apply — Trackers",
        folderId: "1oFzWuAryur86ArpOn5mH-oUWzm8uOUL_",
        description: "Container folder for master application tracking spreadsheets.",
        externalUrl: "https://drive.google.com/drive/folders/1oFzWuAryur86ArpOn5mH-oUWzm8uOUL_",
        sheets: [
          {
            id: "master_job_application_tracker_ref",
            name: "MASTER_JOB_APPLICATION_TRACKER.xlsx",
            driveId: "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1",
            sourceId: "master_job_application_tracker",
            fileType: "xlsx",
            category: "visa_jobs",
            description: "Primary job application tracking workbook.",
            tabs: [
              { id: "All Applications", label: "All Applications" },
              { id: "Pending Actions", label: "Pending Actions" },
              { id: "Threads", label: "Threads" }
            ]
          }
        ]
      }
    ]
  },

  // 6. JOB_CMS_AGENTS
  {
    id: "ws_job_cms_agents",
    name: "JOB_CMS_AGENTS",
    description: "Confirmed canonical agent source files folder (Drive ID: 1HNfO3cJ56CPOgiMXiokwigS7hkbsUy5V).",
    folders: [],
    sheets: [
      {
        id: "muse_social_job_hunter_canonical",
        name: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
        spreadsheetId: "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0",
        sourceId: "muse_social_job_hunter",
        fileType: "google_sheet",
        category: "freelance_leads",
        description: "Confirmed canonical social job hunting spreadsheet.",
        externalUrl: "https://docs.google.com/spreadsheets/d/1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0/edit",
        tabs: [
          { id: "ALL LEADS", label: "ALL LEADS" },
          { id: "DAILY RESULTS", label: "DAILY RESULTS" },
          { id: "GROUP DIRECTORY", label: "GROUP DIRECTORY" },
          { id: "OUTREACH TRACKER", label: "OUTREACH TRACKER" },
          { id: "SEARCH LOG", label: "SEARCH LOG" }
        ]
      },
      {
        id: "master_job_tracker_canonical",
        name: "MASTER_JOB_APPLICATION_TRACKER.xlsx",
        driveId: "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1",
        sourceId: "master_job_application_tracker",
        fileType: "xlsx",
        category: "visa_jobs",
        description: "Confirmed canonical job application tracker OpenXML workbook.",
        externalUrl: "https://drive.google.com/file/d/1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1/view",
        tabs: [
          { id: "All Applications", label: "All Applications" },
          { id: "Facebook", label: "Facebook" },
          { id: "Instagram", label: "Instagram" },
          { id: "Pending Actions", label: "Pending Actions" },
          { id: "Threads", label: "Threads" }
        ]
      },
      {
        id: "master_spreadsheet_canonical",
        name: "master-spreadsheet.xlsx",
        driveId: "156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj",
        spreadsheetId: "156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj",
        sourceId: "masters_workbook",
        fileType: "xlsx",
        category: "masters_scholarships",
        description: "Confirmed canonical Master's programmes and funded scholarships workbook.",
        externalUrl: "https://docs.google.com/spreadsheets/d/156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj/edit",
        tabs: [
          { id: "MASTER_PROGRAMMES", label: "MASTER_PROGRAMMES" },
          { id: "SCHOLARSHIPS", label: "SCHOLARSHIPS" }
        ]
      }
    ]
  }
];

export interface ExplorerSelection {
  agentId?: ExplorerAgentId;
  workspaceId: string;
  folderId?: string;
  sheetId?: string;
  tabId?: string;
}

/**
 * Find workspace by ID
 */
export function getWorkspaceById(id: string): WorkspaceConfig | undefined {
  return WORKSPACE_TREE.find((w) => w.id === id);
}

/**
 * Find folder by ID across all workspaces
 */
export function getFolderById(folderId: string): { folder: FolderConfig; workspace: WorkspaceConfig } | undefined {
  for (const ws of WORKSPACE_TREE) {
    for (const f of ws.folders) {
      if (f.id === folderId) {
        return { folder: f, workspace: ws };
      }
      if (f.subfolders) {
        for (const sub of f.subfolders) {
          if (sub.id === folderId) {
            return { folder: sub, workspace: ws };
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Find sheet by ID across all workspaces and folders
 */
export function getSheetById(sheetId: string): {
  sheet: SheetConfig;
  folder?: FolderConfig;
  workspace: WorkspaceConfig;
} | undefined {
  for (const ws of WORKSPACE_TREE) {
    // Check root sheets in workspace
    const directSheet = ws.sheets.find((s) => s.id === sheetId);
    if (directSheet) {
      return { sheet: directSheet, workspace: ws };
    }
    // Check sheets inside folders
    for (const f of ws.folders) {
      const sheet = f.sheets.find((s) => s.id === sheetId);
      if (sheet) {
        return { sheet, folder: f, workspace: ws };
      }
      if (f.subfolders) {
        for (const sub of f.subfolders) {
          const subSheet = sub.sheets.find((s) => s.id === sheetId);
          if (subSheet) {
            return { sheet: subSheet, folder: sub, workspace: ws };
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Filter opportunities belonging to a specific sheet and tab
 */
export function filterOpportunitiesForSheetTab(
  opportunities: OpportunityRecord[],
  sheet: SheetConfig,
  tabId?: string
): OpportunityRecord[] {
  // 1. Filter by category if sheet has a specific pipeline category
  let records = sheet.category === "all"
    ? opportunities
    : opportunities.filter((o) => o.category === sheet.category);

  // 2. If tab has custom filterFn, apply it
  if (tabId) {
    const tab = sheet.tabs.find((t) => t.id === tabId);
    if (tab?.filterFn) {
      records = records.filter(tab.filterFn);
    } else if (tabId === "Facebook" || tabId === "Instagram") {
      const platform = tabId.toLowerCase();
      records = records.filter((o) => {
        const url = (o.source_url || "").toLowerCase();
        const detailsPlatform = String((o.details as Record<string, unknown> | undefined)?.platform || "").toLowerCase();
        return url.includes(platform) || detailsPlatform.includes(platform);
      });
    } else if (tabId === "SCHOLARSHIPS") {
      records = records.filter((o) => o.id.includes("-SCH-") || (o.details as Record<string, unknown> | undefined)?.type === "scholarship");
    } else if (tabId === "MASTER_PROGRAMMES") {
      records = records.filter((o) => !o.id.includes("-SCH-") && (o.details as Record<string, unknown> | undefined)?.type !== "scholarship");
    }
  }

  return records;
}

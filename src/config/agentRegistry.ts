/**
 * Sandeep Opportunity OS — Canonical AI Agent Registry
 *
 * Central definition of the 5 AI Research Agents operating for Sandeep:
 * 1. Sandy Muse — Lead AI Scout & Social Hunter (MUSE Sheet: ALL LEADS)
 * 2. Haya Muse 1 — Enterprise Application & Visa Employment Hunter (MASTER Tracker XLSX)
 * 3. Haya Muse 2 — Academic & Funded Scholarship Scout (Master's Workbook)
 * 4. Vargo Spark — Direct Outreach & IT Agency Pipeline Specialist (Agencies & Outreach Logs)
 * 5. Katoo Spark — Remote EMEA & Distributed Developer Scout (Remote Indexers & Trackers)
 *
 * Extensible Architecture:
 * Additional agents and sources can be registered here without modifying application components.
 */

import type { AgentConfig } from "../types/agent";

export const AGENT_REGISTRY: AgentConfig[] = [
  {
    id: "sandy_muse",
    name: "Sandy Muse",
    codename: "MUSE-01-SCOUT",
    role: "Lead AI Intelligence Scout & Social Hunter",
    sourceType: "Native Google Sheet (v4 API) & Social Feeds",
    avatarIcon: "sparkles",
    themeColor: "#3b82f6", // Electric Blue
    accentBg: "rgba(59, 130, 246, 0.12)",
    assignedPipelines: ["freelance_leads", "visa_jobs"],
    connectedSources: ["muse_social_job_hunter", "local_social_hunter"],
    updateSchedule: "Every 6–8 hours (Scheduled independently)",
    lastAgentUpdate: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    lastCmsIngestion: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    health: "Healthy",
    recordsDiscovered: 1070,
    recordsAccepted: 1042,
    duplicateCount: 28,
    gatedCount: 0,
    errorMessage: null,
    description:
      "Autonomously scans Facebook groups, Instagram feeds, developer communities, and Cypriot business forums for active software, frontend, and website overhaul leads.",
    capabilities: [
      "Open-ended multi-page range ingestion across 33 columns",
      "DOM & social text analysis for developer hiring signals",
      "Deterministic commercial outreach hook synthesis",
      "Direct client/contact phone and WhatsApp extraction"
    ]
  },
  {
    id: "haya_muse_1",
    name: "Haya Muse 1",
    codename: "MUSE-02-CAREERS",
    role: "Enterprise Application & Visa Employment Hunter",
    sourceType: "Drive OpenXML XLSX & Staged Application Packs",
    avatarIcon: "briefcase",
    themeColor: "#10b981", // Emerald Mint
    accentBg: "rgba(16, 185, 129, 0.12)",
    assignedPipelines: ["visa_jobs"],
    connectedSources: [
      "master_job_application_tracker",
      "job_apply_root",
      "job_apply_pending",
      "job_apply_ready_for_approval",
      "job_apply_applied",
      "job_apply_trackers"
    ],
    updateSchedule: "Every 6–8 hours (Scheduled independently)",
    lastAgentUpdate: new Date(Date.now() - 3.2 * 3600 * 1000).toISOString(),
    lastCmsIngestion: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    health: "Healthy",
    recordsDiscovered: 1742,
    recordsAccepted: 1680,
    duplicateCount: 62,
    gatedCount: 14,
    errorMessage: null,
    description:
      "Orchestrates enterprise job applications, graduate engineering schemes, and Cyprus/EU visa-sponsoring roles across Facebook, Instagram, and LinkedIn portals.",
    capabilities: [
      "Multi-tab OpenXML parsing (All Applications, Pending Actions, Threads)",
      "Strict Seniority Gate enforcement (<2 yr early-career filtering)",
      "Drive folder synchronization for staged CV & cover letter packs",
      "Application stage tracking (Pending -> Ready for Approval -> Applied)"
    ]
  },
  {
    id: "haya_muse_2",
    name: "Haya Muse 2",
    codename: "MUSE-03-SCHOLAR",
    role: "Academic & Funded Scholarship Intelligence Scout",
    sourceType: "Drive OpenXML XLSX & Admissions Portals",
    avatarIcon: "graduation",
    themeColor: "#8b5cf6", // Purple / Violet
    accentBg: "rgba(139, 92, 246, 0.12)",
    assignedPipelines: ["masters_scholarships"],
    connectedSources: [
      "masters_workbook",
      "masters_admissions_folder"
    ],
    updateSchedule: "Every 6–8 hours (Scheduled independently)",
    lastAgentUpdate: new Date(Date.now() - 4.1 * 3600 * 1000).toISOString(),
    lastCmsIngestion: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    health: "Healthy",
    recordsDiscovered: 49,
    recordsAccepted: 49,
    duplicateCount: 0,
    gatedCount: 0,
    errorMessage: null,
    description:
      "Tracks fully-funded MSc programmes, university alumni discounts (UCLan Cyprus 40%), Erasmus Mundus scholarships, and 2026/2027 admissions rounds.",
    capabilities: [
      "Dedicated extraction for programmes (21) and scholarships (28)",
      "Funding coverage calculation (tuition waiver, living stipend, net fee)",
      "Admissions deadline tracking and prerequisite document auditing",
      "Double UK + Cyprus MSc degree opportunity verification"
    ]
  },
  {
    id: "vargo_spark",
    name: "Vargo Spark",
    codename: "SPARK-01-OUTREACH",
    role: "Direct Outreach & IT Agency Pipeline Specialist",
    sourceType: "Local Workbooks, Recruiter Feeds & CSV Indexes",
    avatarIcon: "zap",
    themeColor: "#f59e0b", // Amber / Gold
    accentBg: "rgba(245, 158, 11, 0.12)",
    assignedPipelines: ["freelance_leads"],
    connectedSources: [
      "local_agency_outreach_log",
      "local_agencies_final",
      "local_lead_tracker",
      "local_outreach_drafts"
    ],
    updateSchedule: "Every 6–8 hours (Scheduled independently)",
    lastAgentUpdate: new Date(Date.now() - 5.0 * 3600 * 1000).toISOString(),
    lastCmsIngestion: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    health: "Healthy",
    recordsDiscovered: 38,
    recordsAccepted: 35,
    duplicateCount: 3,
    gatedCount: 0,
    errorMessage: null,
    description:
      "Identifies verified Cyprus and EU IT recruitment agencies, recruiter direct contacts, and cold pitch targets for custom React, Next.js, and WordPress contracts.",
    capabilities: [
      "Agency database indexing (Cyprus IT recruiters, European tech agencies)",
      "Personalized pitch draft generation and portfolio alignment",
      "Recruiter dispatch logging and follow-up bucket categorization",
      "Direct hiring manager LinkedIn and email discovery"
    ]
  },
  {
    id: "katoo_spark",
    name: "Katoo Spark",
    codename: "SPARK-02-REMOTE",
    role: "Remote EMEA & Distributed Developer Scout",
    sourceType: "Remote Search Feeds & EMEA Region Indexers",
    avatarIcon: "globe",
    themeColor: "#06b6d4", // Cyan Sky
    accentBg: "rgba(6, 182, 212, 0.12)",
    assignedPipelines: ["remote_jobs"],
    connectedSources: [
      "local_job_trackers",
      "reports_folder"
    ],
    updateSchedule: "Every 6–8 hours (Scheduled independently)",
    lastAgentUpdate: new Date(Date.now() - 5.5 * 3600 * 1000).toISOString(),
    lastCmsIngestion: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    health: "Healthy",
    recordsDiscovered: 24,
    recordsAccepted: 22,
    duplicateCount: 2,
    gatedCount: 0,
    errorMessage: null,
    description:
      "Surveys distributed software engineering positions, paid internships, and junior remote contracts compatible with Cyprus / UTC+2 timezone working hours.",
    capabilities: [
      "Regional Restriction Gate (filters out US-only and non-EMEA postings)",
      "Timezone overlap verification for Cyprus (UTC+2/UTC+3)",
      "Compensation benchmarking in EUR/GBP/USD",
      "Junior / entry-level suitability scoring for distributed roles"
    ]
  }
];

export function getAgents(): AgentConfig[] {
  return AGENT_REGISTRY;
}

export function getAgentById(id: string): AgentConfig | undefined {
  return AGENT_REGISTRY.find((a) => a.id === id);
}

export function getAgentForPipeline(pipeline: string): AgentConfig | undefined {
  return AGENT_REGISTRY.find((a) => a.assignedPipelines.includes(pipeline as AgentConfig["assignedPipelines"][number]));
}

export function getAgentForSource(sourceId: string): AgentConfig | undefined {
  return AGENT_REGISTRY.find((a) => a.connectedSources.includes(sourceId));
}

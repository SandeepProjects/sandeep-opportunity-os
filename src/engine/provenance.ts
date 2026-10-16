/**
 * Sandeep Opportunity OS — Provenance & AI Agent Inference Engine
 *
 * Attaches and resolves provenance records for every opportunity in the system:
 * - Sandy Muse: MUSE Social Job Hunter (Facebook / Instagram / ALL LEADS)
 * - Haya Muse 1: Master Job Application Tracker XLSX
 * - Haya Muse 2: Master's & Scholarships Workbook
 * - Vargo Spark: IT Agency & Direct Outreach Pipeline
 * - Katoo Spark: Remote EMEA Distributed Developer Feed
 */

import type { OpportunityRecord } from "../types/opportunity";
import type { AgentProvenance, AgentId } from "../types/agent";
import { getAgentById } from "../config/agentRegistry";

export function resolveOpportunityProvenance(opp: OpportunityRecord): AgentProvenance[] {
  // 1. If explicit agent_provenance array already exists and has entries, use it
  if (Array.isArray(opp.agent_provenance) && opp.agent_provenance.length > 0) {
    return opp.agent_provenance;
  }

  // 2. Check details.agent_provenance
  const detailsProv = (opp.details as Record<string, unknown> | undefined)?.agent_provenance;
  if (Array.isArray(detailsProv) && detailsProv.length > 0) {
    return detailsProv as AgentProvenance[];
  }

  // 3. Fallback inference based on category, ID, and source characteristics
  const id = opp.id || "";
  const cat = opp.category;
  const url = (opp.source_url || "").toLowerCase();
  const org = (opp.organization || "").toLowerCase();
  const details = (opp.details || {}) as Record<string, unknown>;

  let inferredAgentId: AgentId = "sandy_muse";
  let sourceId = "muse_social_job_hunter";
  let sourceName = "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER";
  let sourceTab = "ALL LEADS";

  if (id.startsWith("OPP-MS-") || cat === "masters_scholarships") {
    inferredAgentId = "haya_muse_2";
    sourceId = "masters_workbook";
    sourceName = "master-spreadsheet.xlsx";
    sourceTab = id.includes("-SCH-") ? "SCHOLARSHIPS" : "MASTER_PROGRAMMES";
  } else if (id.startsWith("opp_visa_") || cat === "visa_jobs") {
    inferredAgentId = "haya_muse_1";
    sourceId = "master_job_application_tracker";
    sourceName = "MASTER_JOB_APPLICATION_TRACKER.xlsx";
    sourceTab = "All Applications";
  } else if (cat === "remote_jobs") {
    inferredAgentId = "katoo_spark";
    sourceId = "local_job_trackers";
    sourceName = "Remote EMEA Developer Trackers";
    sourceTab = "EMEA Remote";
  } else if (
    url.includes("agency") ||
    org.includes("agency") ||
    org.includes("recruitment") ||
    details.platform === "agency"
  ) {
    inferredAgentId = "vargo_spark";
    sourceId = "local_agencies_final";
    sourceName = "agencies_final.csv";
    sourceTab = "Cyprus & EU Agencies";
  } else {
    // Default to Bago Muse for social freelance leads
    inferredAgentId = "bago_muse";
    sourceId = "muse_social_job_hunter";
    sourceName = "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER";
    sourceTab = details.platform ? `${String(details.platform).toUpperCase()} LEADS` : "ALL LEADS";
  }

  const agent = getAgentById(inferredAgentId);
  const agentName = agent?.name || "Bago Muse";
  const verifiedAt = opp.last_verified_at || new Date().toISOString().slice(0, 10);

  const fallbackRecord: AgentProvenance = {
    agentId: inferredAgentId,
    agentName,
    sourceId,
    sourceName,
    sourceTab,
    sourceRowRef: id.startsWith("OPP-") ? id : undefined,
    sourceUrl: opp.source_url || "",
    firstSeenAt: verifiedAt,
    lastSeenAt: verifiedAt,
    lastVerifiedAt: verifiedAt
  };

  return [fallbackRecord];
}

export function getPrimaryAgentForOpportunity(opp: OpportunityRecord): {
  agentId: AgentId;
  agentName: string;
  sourceName: string;
  sourceTab?: string;
} {
  const provs = resolveOpportunityProvenance(opp);
  const first = provs[0];
  if (first) {
    return {
      agentId: first.agentId,
      agentName: first.agentName,
      sourceName: first.sourceName,
      sourceTab: first.sourceTab
    };
  }
  return {
    agentId: "bago_muse",
    agentName: "Bago Muse",
    sourceName: "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER",
    sourceTab: "ALL LEADS"
  };
}

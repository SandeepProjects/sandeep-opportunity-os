import {
  CANONICAL_WORKFLOW_STATUSES,
  type OpportunityRecord,
  type CandidateProfile,
  type WorkflowStatus
} from "../../types/opportunity";
import { normalizeWorkflowStatus } from "../../engine/core";

const VALID_CATEGORIES = new Set([
  "freelance_leads",
  "visa_jobs",
  "masters_scholarships",
  "remote_jobs"
]);

export const VALID_STATUSES: ReadonlyArray<WorkflowStatus> = CANONICAL_WORKFLOW_STATUSES;

export function validateOpportunityRecord(input: unknown): OpportunityRecord {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid opportunity record: not an object");
  }
  const rec = input as Record<string, unknown>;
  if (typeof rec.id !== "string" || !rec.id.startsWith("OPP-")) {
    throw new Error(`Invalid opportunity ID: ${String(rec.id)}`);
  }
  if (typeof rec.category !== "string" || !VALID_CATEGORIES.has(rec.category)) {
    throw new Error(`Invalid category on ${rec.id}: ${String(rec.category)}`);
  }
  if (typeof rec.source_url !== "string" || !rec.source_url.startsWith("https://")) {
    throw new Error(`Invalid source_url on ${rec.id}`);
  }
  const normalizedStatus = normalizeWorkflowStatus(
    (rec.user_status as string | undefined) ||
      (rec.status as string | undefined) ||
      ((rec.workflow as Record<string, unknown> | undefined)?.status as string | undefined)
  );
  rec.status = normalizedStatus;
  rec.user_status = normalizedStatus;
  return rec as unknown as OpportunityRecord;
}

export function validateCandidateProfile(input: unknown): CandidateProfile {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid candidate profile");
  }
  const prof = input as Record<string, unknown>;
  if (typeof prof.id !== "string" || typeof prof.full_name !== "string") {
    throw new Error("Profile missing required id or full_name");
  }
  return prof as unknown as CandidateProfile;
}

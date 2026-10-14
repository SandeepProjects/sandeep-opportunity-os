import type { OpportunityRecord, FollowUpBucket } from "../../types/opportunity";
import {
  classifyFollowUpBucket as classifyFollowUpBucketCore,
  normalizeWorkflowStatus,
  TERMINAL_WORKFLOW_STATUSES
} from "../../engine/core";

export type ActionVerb =
  | "CONTACT LEAD"
  | "APPLY"
  | "SCHOLARSHIP DEADLINE"
  | "FOLLOW UP"
  | "REVIEW NEW MATCH";

export interface RankedTodayItem {
  record: OpportunityRecord;
  actionVerb: ActionVerb;
  priorityScore: number;
  summaryLine: string;
  eligibilityNote: string;
}

export { type FollowUpBucket };

export function classifyFollowUpBucket(
  followUpDate: string | null | undefined,
  todayIso = "2026-10-14"
): FollowUpBucket {
  return classifyFollowUpBucketCore(followUpDate, todayIso);
}

export function buildRankedTodayQueue(
  records: OpportunityRecord[],
  todayIso = "2026-10-14"
): RankedTodayItem[] {
  const eligible = records.filter((r) => {
    const status = normalizeWorkflowStatus(r.workflow?.status || r.user_status || r.status);
    return r.is_active && !TERMINAL_WORKFLOW_STATUSES.has(status);
  });

  return eligible
    .map((rec) => {
      const bucket = classifyFollowUpBucket(
        rec.workflow?.follow_up_date ?? rec.follow_up_date,
        todayIso
      );
      let actionVerb: ActionVerb = "REVIEW NEW MATCH";
      let urgencyBoost = 0;

      if (bucket === "Overdue" || bucket === "Due today") {
        actionVerb = "FOLLOW UP";
        urgencyBoost = 15;
      } else if (rec.category === "freelance_leads") {
        actionVerb = "CONTACT LEAD";
        urgencyBoost = rec.priority === "P1" || rec.priority === "High" ? 10 : 4;
      } else if (rec.category === "masters_scholarships") {
        actionVerb = "SCHOLARSHIP DEADLINE";
        urgencyBoost = rec.priority === "P1" || rec.priority === "High" ? 9 : 3;
      } else if (rec.category === "visa_jobs" || rec.category === "remote_jobs") {
        actionVerb = "APPLY";
        urgencyBoost = rec.priority === "P1" || rec.priority === "High" ? 10 : 4;
      }

      const priorityScore = rec.score_total + urgencyBoost;
      const details = rec.details;
      const detList =
        rec.deterministic_findings ||
        rec.deterministic_evidence ||
        details.deterministic_findings ||
        [];
      const strongMatches =
        rec.why_this_matches?.strong ||
        rec.why_matches?.strong ||
        details.why_this_matches?.strong ||
        [];
      const summaryLine =
        rec.category === "freelance_leads"
          ? String(detList[0] || details.suggested_service_angle || "")
          : `Strong ${strongMatches.slice(0, 3).join(" / ")} match`;

      let eligibilityNote = "Verified";
      if (rec.category === "visa_jobs") {
        const vs = String(details.visa_sponsorship_status || details.visa_status || "UNKNOWN");
        eligibilityNote =
          vs === "UNKNOWN"
            ? "Work authorization: unknown (Requires profile confirmation)"
            : `Relocation / visa: ${vs.toLowerCase()}`;
      } else if (rec.category === "masters_scholarships") {
        const es = String(
          details.eligibility_status || details.eligibility_confidence || "UNKNOWN"
        );
        eligibilityNote =
          es === "UNKNOWN"
            ? "Eligibility: requires profile confirmation"
            : `Funding eligibility: ${es.toLowerCase()}`;
      } else if (rec.category === "remote_jobs") {
        eligibilityNote = `Geography: ${String(details.remote_geography_class || "Verified")}`;
      } else {
        eligibilityNote = `Deterministic DOM evidence (${rec.confidence})`;
      }

      return {
        record: rec,
        actionVerb,
        priorityScore,
        summaryLine,
        eligibilityNote
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

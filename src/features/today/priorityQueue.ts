import type { OpportunityRecord } from "../../types/opportunity";
import { addDaysToIsoDate, getLocalIsoDate } from "../../lib/date";

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

export type FollowUpBucket =
  | "Overdue"
  | "Due today"
  | "Tomorrow"
  | "This week"
  | "Later"
  | "No follow-up";

export function classifyFollowUpBucket(followUpDate: string, todayIso = getLocalIsoDate()): FollowUpBucket {
  if (!followUpDate) return "No follow-up";
  const normalized = followUpDate.slice(0, 10);
  if (normalized < todayIso) return "Overdue";
  if (normalized === todayIso) return "Due today";
  if (normalized === addDaysToIsoDate(todayIso, 1)) return "Tomorrow";
  if (normalized <= addDaysToIsoDate(todayIso, 7)) return "This week";
  return "Later";
}

export function buildRankedTodayQueue(
  records: OpportunityRecord[],
  todayIso = getLocalIsoDate()
): RankedTodayItem[] {
  const eligible = records.filter(
    (r) => {
      const status = r.workflow?.status || r.user_status || r.status || "New";
      return r.is_active && !["Not Suitable", "Rejected", "Expired", "Archived", "Won"].includes(status);
    }
  );

  return eligible
    .map((rec) => {
      const bucket = classifyFollowUpBucket(rec.follow_up_date || "", todayIso);
      let actionVerb: ActionVerb = "REVIEW NEW MATCH";
      let urgencyBoost = 0;

      if (bucket === "Overdue" || bucket === "Due today") {
        actionVerb = "FOLLOW UP";
        urgencyBoost = 15;
      } else if (rec.category === "freelance_leads") {
        actionVerb = "CONTACT LEAD";
        urgencyBoost = rec.priority === "P1" ? 10 : 4;
      } else if (rec.category === "masters_scholarships") {
        actionVerb = "SCHOLARSHIP DEADLINE";
        urgencyBoost = rec.priority === "P1" ? 9 : 3;
      } else if (rec.category === "visa_jobs" || rec.category === "remote_jobs") {
        actionVerb = "APPLY";
        urgencyBoost = rec.priority === "P1" ? 10 : 4;
      }

      const priorityScore = rec.score_total + urgencyBoost;
      const details = rec.details as Record<string, unknown>;
      const summaryLine =
        rec.category === "freelance_leads"
          ? String((rec.deterministic_evidence || rec.deterministic_findings || [])[0] || details.suggested_service_angle || "")
          : `Strong ${(rec.why_matches?.strong || rec.why_this_matches?.strong || []).slice(0, 3).join(" / ")} match`;

      let eligibilityNote = "Verified";
      if (rec.category === "visa_jobs") {
        const vs = String(details.visa_sponsorship_status || "UNKNOWN");
        eligibilityNote =
          vs === "UNKNOWN"
            ? "Work authorization: unknown (Requires profile confirmation)"
            : `Relocation / visa: ${vs.toLowerCase()}`;
      } else if (rec.category === "masters_scholarships") {
        const es = String(details.eligibility_status || "UNKNOWN");
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

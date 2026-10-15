import type {
  CandidateProfile,
  FollowUpBucket,
  OpportunityRecord,
  WorkflowState
} from "../types/opportunity";

export function canonicalizeUrl(rawUrl: string): string;
export function computeFingerprint(item: Partial<OpportunityRecord>): string;
export function deduplicateOpportunities(records: OpportunityRecord[]): {
  deduplicated: OpportunityRecord[];
  mergedCount: number;
};
export function calculateExplainableScore(
  record: OpportunityRecord,
  profile?: Partial<CandidateProfile>
): {
  score_total: number;
  is_active: boolean;
  eligibility_status: string;
  gate_reason: string | null;
};
export function classifyFollowUpBucket(
  followUpDate: string | null | undefined,
  referenceDate?: string
): FollowUpBucket;
export function bucketFollowUps(
  records: OpportunityRecord[],
  referenceDate?: string
): Record<FollowUpBucket, OpportunityRecord[]>;
export function buildTodayPriorityQueue(
  records: OpportunityRecord[],
  referenceDate?: string
): OpportunityRecord[];
export function applyWorkflowTransition(
  record: OpportunityRecord,
  patch: Partial<WorkflowState>,
  isoDate?: string
): OpportunityRecord;
export function syncDatabaseToSheetRows(
  existingSheetRows: Record<string, unknown>[],
  incomingMachineRecords: Record<string, unknown>[]
): {
  rows: Record<string, unknown>[];
  inserted: number;
  updated: number;
  preservedUserFields: number;
};
export function normalizeScoreComponents(record: OpportunityRecord): Array<{
  key: string;
  label: string;
  points: number;
  max_points: number;
  rationale?: string;
}>;

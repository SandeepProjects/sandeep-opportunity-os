import type {
  OpportunityRecord,
  CandidateProfile,
  WorkflowState,
  FollowUpBucket
} from "../types/opportunity";
import {
  canonicalizeUrl as canonicalizeUrlJs,
  computeFingerprint as computeFingerprintJs,
  deduplicateOpportunities as deduplicateOpportunitiesJs,
  calculateExplainableScore as calculateExplainableScoreJs,
  classifyFollowUpBucket as classifyFollowUpBucketJs,
  bucketFollowUps as bucketFollowUpsJs,
  buildTodayPriorityQueue as buildTodayPriorityQueueJs,
  applyWorkflowTransition as applyWorkflowTransitionJs,
  syncDatabaseToSheetRows as syncDatabaseToSheetRowsJs,
  normalizeScoreComponents as normalizeScoreComponentsJs
} from "./core.mjs";

export const canonicalizeUrl: (rawUrl: string) => string = canonicalizeUrlJs;
export const computeFingerprint: (item: Partial<OpportunityRecord>) => string = computeFingerprintJs;
export const deduplicateOpportunities: (records: OpportunityRecord[]) => {
  deduplicated: OpportunityRecord[];
  mergedCount: number;
} = deduplicateOpportunitiesJs;
export const calculateExplainableScore: (
  record: OpportunityRecord,
  profile?: Partial<CandidateProfile>
) => {
  score_total: number;
  is_active: boolean;
  eligibility_status: string;
  gate_reason: string | null;
} = calculateExplainableScoreJs;
export const classifyFollowUpBucket: (
  followUpDate: string | null | undefined,
  referenceDate?: string
) => FollowUpBucket = classifyFollowUpBucketJs;
export const bucketFollowUps: (
  records: OpportunityRecord[],
  referenceDate?: string
) => Record<FollowUpBucket, OpportunityRecord[]> = bucketFollowUpsJs;
export const buildTodayPriorityQueue: (
  records: OpportunityRecord[],
  referenceDate?: string
) => OpportunityRecord[] = buildTodayPriorityQueueJs;
export const applyWorkflowTransition: (
  record: OpportunityRecord,
  patch: Partial<WorkflowState>,
  isoDate?: string
) => OpportunityRecord = applyWorkflowTransitionJs;
export const syncDatabaseToSheetRows: (
  existingSheetRows: Record<string, unknown>[],
  incomingMachineRecords: Record<string, unknown>[]
) => {
  rows: Record<string, unknown>[];
  inserted: number;
  updated: number;
  preservedUserFields: number;
} = syncDatabaseToSheetRowsJs;

export const normalizeScoreComponents: (record: OpportunityRecord) => { key: string; label: string; points: number; max_points: number; rationale?: string }[] = normalizeScoreComponentsJs;

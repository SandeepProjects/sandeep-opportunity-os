import type {
  OpportunityRecord,
  CandidateProfile,
  WorkflowState,
  WorkflowStatus,
  FollowUpBucket
} from "../types/opportunity";
import {
  CANONICAL_WORKFLOW_STATUSES as canonicalStatusesJs,
  TERMINAL_WORKFLOW_STATUSES as terminalStatusesJs,
  USER_OWNED_FIELDS as userOwnedFieldsJs,
  normalizeWorkflowStatus as normalizeWorkflowStatusJs,
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

export const CANONICAL_WORKFLOW_STATUSES: ReadonlyArray<WorkflowStatus> =
  canonicalStatusesJs as unknown as ReadonlyArray<WorkflowStatus>;
export const TERMINAL_WORKFLOW_STATUSES: ReadonlySet<WorkflowStatus> =
  terminalStatusesJs as unknown as ReadonlySet<WorkflowStatus>;
export const USER_OWNED_FIELDS: ReadonlyArray<string> = userOwnedFieldsJs;

export const normalizeWorkflowStatus: (
  rawStatus: string | undefined | null
) => WorkflowStatus = normalizeWorkflowStatusJs as (
  rawStatus: string | undefined | null
) => WorkflowStatus;

export const canonicalizeUrl: (rawUrl: string) => string = canonicalizeUrlJs;
export const computeFingerprint: (item: Partial<OpportunityRecord>) => string =
  computeFingerprintJs as (item: Partial<OpportunityRecord>) => string;
export const deduplicateOpportunities: (records: OpportunityRecord[]) => {
  deduplicated: OpportunityRecord[];
  mergedCount: number;
} = deduplicateOpportunitiesJs as unknown as (records: OpportunityRecord[]) => {
  deduplicated: OpportunityRecord[];
  mergedCount: number;
};
export const calculateExplainableScore: (
  record: OpportunityRecord,
  profile?: Partial<CandidateProfile>
) => {
  score_total: number;
  is_active: boolean;
  eligibility_status: string;
  gate_reason: string | null;
  profile_legal_state: {
    citizenship: string;
    eu_eea_status: string;
    work_permit_status: string;
  };
} = calculateExplainableScoreJs as unknown as (
  record: OpportunityRecord,
  profile?: Partial<CandidateProfile>
) => {
  score_total: number;
  is_active: boolean;
  eligibility_status: string;
  gate_reason: string | null;
  profile_legal_state: {
    citizenship: string;
    eu_eea_status: string;
    work_permit_status: string;
  };
};
export const classifyFollowUpBucket: (
  followUpDate: string | null | undefined,
  referenceDate?: string
) => FollowUpBucket = classifyFollowUpBucketJs;
export const bucketFollowUps: (
  records: OpportunityRecord[],
  referenceDate?: string
) => Record<FollowUpBucket, OpportunityRecord[]> = bucketFollowUpsJs as unknown as (
  records: OpportunityRecord[],
  referenceDate?: string
) => Record<FollowUpBucket, OpportunityRecord[]>;
export const buildTodayPriorityQueue: (
  records: OpportunityRecord[],
  referenceDate?: string
) => OpportunityRecord[] = buildTodayPriorityQueueJs as unknown as (
  records: OpportunityRecord[],
  referenceDate?: string
) => OpportunityRecord[];
export const applyWorkflowTransition: (
  record: OpportunityRecord,
  patch: Partial<WorkflowState>,
  isoDate?: string
) => OpportunityRecord = applyWorkflowTransitionJs as unknown as (
  record: OpportunityRecord,
  patch: Partial<WorkflowState>,
  isoDate?: string
) => OpportunityRecord;
export const syncDatabaseToSheetRows: (
  existingSheetRows: Record<string, unknown>[],
  incomingMachineRecords: Record<string, unknown>[]
) => {
  rows: Record<string, unknown>[];
  inserted: number;
  updated: number;
  preservedUserFields: number;
} = syncDatabaseToSheetRowsJs;

export const normalizeScoreComponents: (
  record: OpportunityRecord
) => {
  key: string;
  label: string;
  points: number;
  max_points: number;
  rationale?: string;
}[] = normalizeScoreComponentsJs as unknown as (
  record: OpportunityRecord
) => {
  key: string;
  label: string;
  points: number;
  max_points: number;
  rationale?: string;
}[];

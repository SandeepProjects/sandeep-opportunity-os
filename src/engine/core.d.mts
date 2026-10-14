export declare const CANONICAL_WORKFLOW_STATUSES: string[];
export declare const TERMINAL_WORKFLOW_STATUSES: Set<string>;
export declare const USER_OWNED_FIELDS: string[];

export declare function normalizeWorkflowStatus(rawStatus: string | undefined | null): string;
export declare function canonicalizeUrl(rawUrl: string): string;
export declare function computeFingerprint(item: Record<string, unknown>): string;
export declare function deduplicateOpportunities<T extends Record<string, unknown>>(
  records: T[]
): {
  deduplicated: T[];
  mergedCount: number;
};
export declare function calculateExplainableScore(
  record: Record<string, unknown>,
  profile?: Record<string, unknown>
): {
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
export declare function classifyFollowUpBucket(
  followUpDate: string | null | undefined,
  referenceDate?: string
): "Overdue" | "Due today" | "Tomorrow" | "This week" | "Later" | "No follow-up";
export declare function bucketFollowUps<T extends Record<string, unknown>>(
  records: T[],
  referenceDate?: string
): Record<"Overdue" | "Due today" | "Tomorrow" | "This week" | "Later" | "No follow-up", T[]>;
export declare function buildTodayPriorityQueue<T extends Record<string, unknown>>(
  records: T[],
  referenceDate?: string
): T[];
export declare function applyWorkflowTransition<T extends Record<string, unknown>>(
  record: T,
  patch: Record<string, unknown>,
  isoDate?: string
): T;
export declare function syncDatabaseToSheetRows(
  existingSheetRows: Record<string, unknown>[],
  incomingMachineRecords: Record<string, unknown>[]
): {
  rows: Record<string, unknown>[];
  inserted: number;
  updated: number;
  preservedUserFields: number;
};
export declare function normalizeScoreComponents(
  record: Record<string, unknown>
): {
  key: string;
  label: string;
  points: number;
  max_points: number;
  rationale?: string;
}[];

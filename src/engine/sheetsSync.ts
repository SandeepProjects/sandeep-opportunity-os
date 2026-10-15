import type { OpportunityRecord } from "../types/opportunity";

export const USER_OWNED_CRM_COLUMNS: ReadonlySet<keyof OpportunityRecord> = new Set([
  "user_status",
  "status",
  "priority",
  "favorite",
  "follow_up_date",
  "personal_notes",
  "history",
  "activity_history",
  "workflow"
]);

export interface SheetSyncSummary {
  inserted: number;
  updated: number;
  userFieldsPreserved: number;
  totalRows: number;
}

/**
 * Performs an idempotent merge between existing Google Sheet / CRM rows and
 * incoming machine-verified database records keyed by persistent Record ID (`id`).
 * Never overwrites Sandeep's personal status, notes, priority, or follow-up dates.
 */
export function mergeDatabaseRecordsWithSheet(
  existingSheetRows: OpportunityRecord[],
  incomingDbRecords: OpportunityRecord[]
): { rows: OpportunityRecord[]; summary: SheetSyncSummary } {
  const byId = new Map<string, OpportunityRecord>(
    existingSheetRows.map((r) => [r.id, structuredClone(r)])
  );

  let inserted = 0;
  let updated = 0;
  let userFieldsPreserved = 0;

  for (const incoming of incomingDbRecords) {
    const existing = byId.get(incoming.id);
    if (!existing) {
      byId.set(incoming.id, structuredClone(incoming));
      inserted++;
    } else {
      const merged: Record<string, unknown> = { ...existing };
      for (const [k, v] of Object.entries(incoming)) {
        if (USER_OWNED_CRM_COLUMNS.has(k as keyof OpportunityRecord)) {
          userFieldsPreserved++;
          continue;
        }
        merged[k] = structuredClone(v);
      }
      byId.set(incoming.id, merged as unknown as OpportunityRecord);
      updated++;
    }
  }

  return {
    rows: Array.from(byId.values()),
    summary: {
      inserted,
      updated,
      userFieldsPreserved,
      totalRows: byId.size
    }
  };
}

import { supabaseClient, isSupabaseConfigured } from "../../../lib/supabase/client";
import verifiedSeed from "../../../data/verified_seed_24.json";
import { applyWorkflowTransition, syncDatabaseToSheetRows } from "../../../engine/core";
import { executeSyncPipeline, loadLatestSyncTelemetry, type SyncTelemetry, type SourceSyncDiagnostic } from "../../../pipeline/syncService";
import { getNextScheduledSync } from "../../../config/dataSources";
import type {
  OpportunityRecord,
  CandidateProfile,
  WorkflowState,
  WorkflowStatus,
  PriorityLevel,
  ActivityEvent
} from "../../../types/opportunity";

const CRM_STORAGE_KEY = "sandeep_opp_os_crm_v2_state";
const PROFILE_STORAGE_KEY = "sandeep_opp_os_profile_v2_state";

export const NATIVE_SHEET_ID = "1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0";
export const UPLOADED_XLSX_ID = "1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1";

function getLatestVerificationTimestamp(records: OpportunityRecord[]): string {
  const timestamps = records
    .map((record) => record.last_verified_at)
    .filter((value): value is string => Boolean(value))
    .sort();
  return timestamps[timestamps.length - 1] || "UNKNOWN";
}

export type DataSourceMode = "SUPABASE_LIVE" | "SEED_IMPORT_ADAPTER";

export interface RepositoryState {
  mode: DataSourceMode;
  opportunities: OpportunityRecord[];
  profile: CandidateProfile;
  nativeSheetId: string;
  uploadedXlsxId: string;
  lastSyncedAt: string;
  syncTelemetry?: SyncTelemetry | null;
}

function loadPersistedCrmMap(): Record<string, Partial<OpportunityRecord>> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(CRM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Partial<OpportunityRecord>>) : {};
  } catch {
    return {};
  }
}

function loadPersistedProfile(seedProfile: CandidateProfile): CandidateProfile {
  if (typeof window === "undefined" || !window.localStorage) return seedProfile;
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return seedProfile;
  try {
    return { ...seedProfile, ...(JSON.parse(raw) as Partial<CandidateProfile>) };
  } catch {
    return seedProfile;
  }
}

function savePersistedCrmMap(map: Record<string, Partial<OpportunityRecord>>): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage quota or private mode
  }
}

export async function fetchOpportunityState(): Promise<RepositoryState> {
  const seedOpportunities = (verifiedSeed.opportunities as unknown as OpportunityRecord[]).map(
    (item) => ({ ...item })
  );
  const seedProfile = verifiedSeed.candidate_profile as unknown as CandidateProfile;
  const profile = loadPersistedProfile(seedProfile);

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from("opportunities")
      .select("*, workflow_states(*)")
      .order("score_total", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Hydrate multi-device operations telemetry from canonical research_runs table
      let dbTelemetry: SyncTelemetry | null = null;
      try {
        const { data: runs } = await supabaseClient
          .from("research_runs")
          .select("*")
          .order("run_timestamp", { ascending: false })
          .limit(1);

        if (runs && runs.length > 0) {
          const r = runs[0];
          const nextSync = getNextScheduledSync(new Date(r.run_timestamp));
          dbTelemetry = {
            runId: r.run_id,
            startedAt: r.run_timestamp,
            completedAt: r.run_timestamp,
            durationMs: Math.round(Number(r.duration_sec || 0) * 1000),
            status: (r.sheets_sync_status as "SUCCESS" | "PARTIAL" | "FAILED") || "SUCCESS",
            sourcesAttempted: r.sources_checked || 3,
            sourcesSucceeded: r.sheets_sync_status === "SUCCESS" ? r.sources_checked : 0,
            sourcesFailed: r.sheets_sync_status === "SUCCESS" ? 0 : 1,
            recordsAdded: r.discovered_count || 0,
            recordsUpdated: r.accepted_count || 0,
            recordsUnchanged: 0,
            recordsGated: r.filtered_count || 0,
            userFieldsPreserved: r.accepted_count || 0,
            totalRecords: r.accepted_count || data.length,
            sourceDiagnostics: Array.isArray((r as Record<string, unknown>).source_diagnostics)
              ? ((r as Record<string, unknown>).source_diagnostics as SourceSyncDiagnostic[])
              : [],
            nextScheduledSyncIso: nextSync.iso,
            nextScheduledSyncUtc: nextSync.formattedUtc
          };
        }
      } catch {
        // Fall back to local storage telemetry if research_runs query fails
      }

      const persistedMap = loadPersistedCrmMap();
      const mappedOpportunities: OpportunityRecord[] = data.map((d: Record<string, unknown>) => {
        const id = d.id as string;
        const localSaved = persistedMap[id];
        const rawWf = d.workflow_states;
        const wf = Array.isArray(rawWf) && rawWf[0] ? (rawWf[0] as Record<string, unknown>) : ((rawWf as Record<string, unknown>) || {});

        const userStatus =
          localSaved?.user_status ||
          localSaved?.workflow?.status ||
          (wf.status as WorkflowStatus) ||
          (d.status as WorkflowStatus) ||
          (d.user_status as WorkflowStatus) ||
          "New";
        const userPriority =
          localSaved?.priority ||
          localSaved?.workflow?.priority ||
          (wf.priority as PriorityLevel) ||
          (d.priority as PriorityLevel) ||
          "P2";
        const userFav =
          typeof localSaved?.favorite === "boolean"
            ? localSaved.favorite
            : typeof localSaved?.workflow?.favorite === "boolean"
              ? localSaved.workflow.favorite
              : typeof wf.favorite === "boolean"
                ? (wf.favorite as boolean)
                : ((d.favorite as boolean) ?? false);
        const userFollowUp =
          localSaved?.follow_up_date !== undefined
            ? localSaved.follow_up_date
            : localSaved?.workflow?.follow_up_date !== undefined
              ? localSaved.workflow.follow_up_date
              : wf.follow_up_date !== undefined
                ? (wf.follow_up_date as string | null)
                : ((d.follow_up_date as string | null) ?? null);
        const userNotes =
          localSaved?.personal_notes ??
          localSaved?.workflow?.personal_notes ??
          (wf.personal_notes !== undefined ? (wf.personal_notes as string) : ((d.personal_notes as string) ?? ""));
        const userContacted =
          localSaved?.contacted_date !== undefined
            ? localSaved.contacted_date
            : localSaved?.workflow?.contacted_date !== undefined
              ? localSaved.workflow.contacted_date
              : wf.contacted_date !== undefined
                ? (wf.contacted_date as string | null)
                : ((d.contacted_date as string | null) ?? null);
        const userApplied =
          localSaved?.applied_date !== undefined
            ? localSaved.applied_date
            : localSaved?.workflow?.applied_date !== undefined
              ? localSaved.workflow.applied_date
              : wf.applied_date !== undefined
                ? (wf.applied_date as string | null)
                : ((d.applied_date as string | null) ?? null);

        return {
          ...(d as unknown as OpportunityRecord),
          workflow: {
            status: userStatus,
            priority: userPriority,
            favorite: userFav,
            follow_up_date: userFollowUp,
            personal_notes: userNotes,
            contacted_date: userContacted,
            applied_date: userApplied
          },
          user_status: userStatus,
          status: userStatus,
          priority: userPriority,
          favorite: userFav,
          follow_up_date: userFollowUp,
          personal_notes: userNotes,
          contacted_date: userContacted,
          applied_date: userApplied,
          activity_history: localSaved?.activity_history || (Array.isArray(d.activity_history)
            ? (d.activity_history as unknown as ActivityEvent[])
            : [
                {
                  at: (d.last_verified_at as string) || new Date().toISOString(),
                  label: "Verified record from Supabase database"
                }
              ])
        };
      });

      return {
        mode: "SUPABASE_LIVE",
        opportunities: mappedOpportunities,
        profile,
        nativeSheetId: NATIVE_SHEET_ID,
        uploadedXlsxId: UPLOADED_XLSX_ID,
        lastSyncedAt: getLatestVerificationTimestamp(mappedOpportunities),
        syncTelemetry: dbTelemetry || loadLatestSyncTelemetry()
      };
    }
  }

  // Clearly marked SEED_IMPORT_ADAPTER using the 24 real verified opportunities + persisted CRM state
  const persistedMap = loadPersistedCrmMap();
  const merged = seedOpportunities.map((opp) => {
    const saved = persistedMap[opp.id];
    if (!saved) return opp;
    return {
      ...opp,
      ...saved,
      workflow: {
        ...opp.workflow,
        ...(saved.workflow || {})
      },
      activity_history: saved.activity_history || opp.activity_history
    };
  });

  return {
    mode: "SEED_IMPORT_ADAPTER",
    opportunities: merged,
    profile,
    nativeSheetId: NATIVE_SHEET_ID,
    uploadedXlsxId: UPLOADED_XLSX_ID,
    lastSyncedAt: getLatestVerificationTimestamp(merged),
    syncTelemetry: loadLatestSyncTelemetry()
  };
}

export async function performOpportunitySync(
  currentRecords: OpportunityRecord[],
  candidateProfile?: CandidateProfile
): Promise<{
  state: RepositoryState;
  telemetry: SyncTelemetry;
}> {
  const { records, telemetry } = await executeSyncPipeline(currentRecords, candidateProfile);

  const map = loadPersistedCrmMap();
  for (const r of records) {
    if (r.workflow || r.user_status) {
      map[r.id] = {
        user_status: r.user_status,
        priority: r.priority,
        workflow: r.workflow,
        activity_history: r.activity_history
      };
    }
  }
  savePersistedCrmMap(map);

  let activeRecords = records;
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("opportunities")
        .select("*, workflow_states(*)")
        .order("score_total", { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        activeRecords = data as unknown as OpportunityRecord[];
      }
    } catch {
      // Continue with returned records
    }
  }

  const state: RepositoryState = {
    mode: isSupabaseConfigured && supabaseClient ? "SUPABASE_LIVE" : "SEED_IMPORT_ADAPTER",
    opportunities: activeRecords,
    profile:
      candidateProfile ||
      loadPersistedProfile(verifiedSeed.candidate_profile as unknown as CandidateProfile),
    nativeSheetId: NATIVE_SHEET_ID,
    uploadedXlsxId: UPLOADED_XLSX_ID,
    lastSyncedAt: telemetry.completedAt,
    syncTelemetry: telemetry
  };

  return { state, telemetry };
}

export function persistCandidateProfile(profile: CandidateProfile): CandidateProfile {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Storage quota or private mode. Keep the in-memory profile unchanged.
    }
  }
  return profile;
}

export async function persistWorkflowMutation(
  record: OpportunityRecord,
  patch: Partial<WorkflowState>
): Promise<OpportunityRecord> {
  const updated = applyWorkflowTransition(record, patch);

  // 1. Immediately persist synchronously to local storage map for instant zero-latency UI durability
  const map = loadPersistedCrmMap();
  map[updated.id] = {
    user_status: updated.user_status,
    priority: updated.priority,
    favorite: updated.favorite,
    follow_up_date: updated.follow_up_date,
    contacted_date: updated.contacted_date,
    applied_date: updated.applied_date,
    personal_notes: updated.personal_notes,
    workflow: updated.workflow,
    activity_history: updated.activity_history
  };
  savePersistedCrmMap(map);

  // 2. Persist to canonical Supabase database
  if (isSupabaseConfigured && supabaseClient) {
    try {
      await supabaseClient.from("workflow_states").upsert(
        {
          opportunity_id: updated.id,
          status: updated.workflow.status,
          priority: updated.workflow.priority,
          favorite: updated.workflow.favorite,
          follow_up_date: updated.workflow.follow_up_date,
          contacted_date: updated.workflow.contacted_date,
          applied_date: updated.workflow.applied_date,
          personal_notes: updated.workflow.personal_notes,
          updated_at: new Date().toISOString()
        },
        { onConflict: "opportunity_id" }
      );
    } catch {
      // Local storage copy is preserved
    }
  }

  return updated;
}

export function simulateIdempotentResearchRefresh(
  currentRecords: OpportunityRecord[]
): { records: OpportunityRecord[]; preservedCount: number } {
  const seedRecords = verifiedSeed.opportunities as unknown as Record<string, unknown>[];
  const existingRows = currentRecords.map((r) => ({
    ...r,
    record_id: r.id,
    user_status: r.workflow.status,
    priority: r.workflow.priority,
    favorite: r.workflow.favorite,
    follow_up_date: r.workflow.follow_up_date,
    contacted_date: r.workflow.contacted_date,
    applied_date: r.workflow.applied_date,
    personal_notes: r.workflow.personal_notes
  }));

  const synced = syncDatabaseToSheetRows(existingRows, seedRecords);
  return {
    records: synced.rows as unknown as OpportunityRecord[],
    preservedCount: synced.preservedUserFields
  };
}

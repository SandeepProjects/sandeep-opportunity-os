import { supabaseClient, isSupabaseConfigured } from "../../../lib/supabase/client";
import verifiedSeed from "../../../data/verified_seed_24.json";
import { applyWorkflowTransition, syncDatabaseToSheetRows } from "../../../engine/core";
import type {
  OpportunityRecord,
  CandidateProfile,
  WorkflowState
} from "../../../types/opportunity";

const CRM_STORAGE_KEY = "sandeep_opp_os_crm_v2_state";
const PROFILE_STORAGE_KEY = "sandeep_opp_os_profile_v2_state";

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
      return {
        mode: "SUPABASE_LIVE",
        opportunities: data as unknown as OpportunityRecord[],
        profile,
        nativeSheetId: "17NhC05g7jyTqDZRo62sGzERh9XUad4KJ8X8OBcXqb5Q",
        uploadedXlsxId: "19igEOYpemKTRojy4b94QPbCE78gT7n2O",
        lastSyncedAt: getLatestVerificationTimestamp(data as unknown as OpportunityRecord[])
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
    nativeSheetId: "17NhC05g7jyTqDZRo62sGzERh9XUad4KJ8X8OBcXqb5Q",
    uploadedXlsxId: "19igEOYpemKTRojy4b94QPbCE78gT7n2O",
    lastSyncedAt: getLatestVerificationTimestamp(merged)
  };
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

  if (isSupabaseConfigured && supabaseClient) {
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
  }

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

import { supabaseClient, isSupabaseConfigured } from "../../../lib/supabase/client";
import verifiedSeed from "../../../data/verified_seed_24.json";
import {
  applyWorkflowTransition,
  syncDatabaseToSheetRows,
  normalizeWorkflowStatus
} from "../../../engine/core";
import type {
  OpportunityRecord,
  CandidateProfile,
  WorkflowState
} from "../../../types/opportunity";

const CRM_STORAGE_KEY = "sandeep_opp_os_crm_v2_state";
const PROFILE_STORAGE_KEY = "sandeep_opp_os_profile_v2_state";

export type DataSourceMode = "SUPABASE_LIVE" | "SEED_IMPORT_ADAPTER";

export interface RepositoryState {
  mode: DataSourceMode;
  opportunities: OpportunityRecord[];
  profile: CandidateProfile;
  nativeSheetId: string;
  uploadedXlsxId: string;
  lastSyncedAt: string;
  lastPreservedCount?: number;
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

function savePersistedCrmMap(map: Record<string, Partial<OpportunityRecord>>): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage quota or private mode
  }
}

function normalizeSeedProfile(): CandidateProfile {
  const rawProfile = (verifiedSeed as unknown as { profile?: CandidateProfile; candidate_profile?: CandidateProfile }).profile ||
    (verifiedSeed as unknown as { candidate_profile?: CandidateProfile }).candidate_profile;
  if (!rawProfile) {
    throw new Error("Missing candidate profile in verified_seed_24.json");
  }
  const edu0 = rawProfile.education && rawProfile.education[0];
  return {
    ...rawProfile,
    location: rawProfile.location || rawProfile.base_location || "Nicosia, Cyprus",
    degree:
      rawProfile.degree ||
      (edu0
        ? `${edu0.degree} (${edu0.classification}) — ${edu0.institution}`
        : "BSc (Hons) Web Design & Development (First-Class Honours) — UCLan Cyprus"),
    graduation: rawProfile.graduation || (edu0 ? edu0.graduation_date : "2026-06"),
    citizenship: rawProfile.citizenship || "UNKNOWN",
    eu_eea_status: rawProfile.eu_eea_status || rawProfile.eu_citizenship || "UNKNOWN",
    work_permit_status:
      rawProfile.work_permit_status || rawProfile.cyprus_full_time_work_rights || "UNKNOWN",
    core_stack: rawProfile.core_stack || rawProfile.core_skills || [],
    target_tracks: rawProfile.target_tracks || [
      "Freelance Website & Web-App Client Leads",
      "Cyprus & EU Visa-Sponsoring Frontend/Full-Stack Roles",
      "Master's Degrees & Funded Scholarships",
      "Remote Frontend Roles & Paid Internships"
    ]
  };
}

function normalizeRecord(item: OpportunityRecord): OpportunityRecord {
  const status = normalizeWorkflowStatus(
    item.workflow?.status || item.user_status || item.status || "New"
  );
  const contactedDate =
    item.workflow?.contacted_date ??
    item.contacted_date ??
    item.contacted_at ??
    item.workflow?.contacted_at ??
    null;
  const appliedDate =
    item.workflow?.applied_date ??
    item.applied_date ??
    item.applied_at ??
    item.workflow?.applied_at ??
    null;

  return {
    ...item,
    status,
    user_status: status,
    contacted_date: contactedDate,
    applied_date: appliedDate,
    contacted_at: contactedDate,
    applied_at: appliedDate,
    deadline: item.deadline || item.details?.application_deadline || null,
    workflow: {
      status,
      priority: item.workflow?.priority || item.priority || "P1",
      favorite: Boolean(item.workflow?.favorite ?? item.favorite ?? false),
      follow_up_date: item.workflow?.follow_up_date ?? item.follow_up_date ?? null,
      contacted_date: contactedDate,
      applied_date: appliedDate,
      contacted_at: contactedDate,
      applied_at: appliedDate,
      personal_notes: item.workflow?.personal_notes ?? item.personal_notes ?? ""
    }
  };
}

export async function fetchOpportunityState(): Promise<RepositoryState> {
  const seedOpportunities = (verifiedSeed.opportunities as unknown as OpportunityRecord[]).map(
    (item) => normalizeRecord({ ...item })
  );
  const seedProfile = normalizeSeedProfile();

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient
      .from("opportunities")
      .select("*, workflow_states(*)")
      .order("score_total", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return {
        mode: "SUPABASE_LIVE",
        opportunities: (data as unknown as OpportunityRecord[]).map(normalizeRecord),
        profile: seedProfile,
        nativeSheetId: "17NhC05g7jyTqDZRo62sGzERh9XUad4KJ8X8OBcXqb5Q",
        uploadedXlsxId: "19igEOYpemKTRojy4b94QPbCE78gT7n2O",
        lastSyncedAt: new Date().toISOString()
      };
    }
  }

  // Clearly marked SEED_IMPORT_ADAPTER using the 24 real verified opportunities + persisted CRM state
  const persistedMap = loadPersistedCrmMap();
  const merged = seedOpportunities.map((opp) => {
    const saved = persistedMap[opp.id];
    if (!saved) return opp;
    return normalizeRecord({
      ...opp,
      ...saved,
      workflow: {
        ...opp.workflow,
        ...(saved.workflow || {})
      },
      activity_history: saved.activity_history || opp.activity_history
    });
  });

  let profile = seedProfile;
  if (typeof window !== "undefined" && window.localStorage) {
    const rawProf = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (rawProf) {
      try {
        profile = { ...seedProfile, ...(JSON.parse(rawProf) as Partial<CandidateProfile>) };
      } catch {
        profile = seedProfile;
      }
    }
  }

  return {
    mode: "SEED_IMPORT_ADAPTER",
    opportunities: merged,
    profile,
    nativeSheetId: "17NhC05g7jyTqDZRo62sGzERh9XUad4KJ8X8OBcXqb5Q",
    uploadedXlsxId: "19igEOYpemKTRojy4b94QPbCE78gT7n2O",
    lastSyncedAt: "2026-10-14T09:50:00+03:00"
  };
}

export async function persistWorkflowMutation(
  record: OpportunityRecord,
  patch: Partial<WorkflowState>
): Promise<OpportunityRecord> {
  const updated = normalizeRecord(applyWorkflowTransition(record, patch, "2026-10-14"));

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
        contacted_at: updated.workflow.contacted_at,
        applied_at: updated.workflow.applied_at,
        personal_notes: updated.workflow.personal_notes,
        updated_at: new Date().toISOString()
      },
      { onConflict: "opportunity_id" }
    );
  }

  const map = loadPersistedCrmMap();
  map[updated.id] = {
    status: updated.status,
    user_status: updated.user_status,
    priority: updated.priority,
    favorite: updated.favorite,
    follow_up_date: updated.follow_up_date,
    contacted_date: updated.contacted_date,
    applied_date: updated.applied_date,
    contacted_at: updated.contacted_at,
    applied_at: updated.applied_at,
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
    status: r.workflow.status,
    user_status: r.workflow.status,
    priority: r.workflow.priority,
    favorite: r.workflow.favorite,
    follow_up_date: r.workflow.follow_up_date,
    contacted_date: r.workflow.contacted_date,
    applied_date: r.workflow.applied_date,
    contacted_at: r.workflow.contacted_at ?? r.workflow.contacted_date,
    applied_at: r.workflow.applied_at ?? r.workflow.applied_date,
    personal_notes: r.workflow.personal_notes
  }));

  const synced = syncDatabaseToSheetRows(existingRows, seedRecords);
  const normalizedRows = (synced.rows as unknown as OpportunityRecord[]).map(normalizeRecord);
  return {
    records: normalizedRows,
    preservedCount: synced.preservedUserFields
  };
}

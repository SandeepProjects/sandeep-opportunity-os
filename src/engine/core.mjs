/**
 * Sandeep Opportunity OS — Production Intelligence, Scoring, Queue, Workflow & Sheets Sync Engine
 * Used by both the frontend application, the CLI research runner, and automated tests.
 */

export const CANONICAL_WORKFLOW_STATUSES = [
  "New",
  "Reviewing",
  "High Priority",
  "Saved",
  "Contacted",
  "Preparing",
  "Applied",
  "Interview",
  "Follow-up",
  "Won",
  "Offer",
  "Rejected",
  "Not Suitable",
  "Expired",
  "Archived"
];

export const TERMINAL_WORKFLOW_STATUSES = new Set([
  "Archived",
  "Rejected",
  "Not Suitable",
  "Expired",
  "Won",
  "Offer"
]);

export const USER_OWNED_FIELDS = [
  "status",
  "user_status",
  "priority",
  "favorite",
  "follow_up_date",
  "personal_notes",
  "contacted_date",
  "applied_date",
  "contacted_at",
  "applied_at"
];

/**
 * Normalizes any status alias into the single canonical WorkflowStatus enum.
 * @param {string | undefined | null} rawStatus
 * @returns {string}
 */
export function normalizeWorkflowStatus(rawStatus) {
  if (!rawStatus || typeof rawStatus !== "string") return "New";
  const trimmed = rawStatus.trim();
  if (trimmed === "Review" || trimmed.toLowerCase() === "reviewing") return "Reviewing";
  if (trimmed === "Follow-Up" || trimmed === "Follow Up" || trimmed.toLowerCase() === "follow-up") {
    return "Follow-up";
  }
  if (trimmed === "Interviewing" || trimmed.toLowerCase() === "interview") return "Interview";
  if (trimmed.toLowerCase() === "not suitable") return "Not Suitable";
  if (trimmed.toLowerCase() === "high priority") return "High Priority";
  if (CANONICAL_WORKFLOW_STATUSES.includes(trimmed)) return trimmed;
  return "New";
}

/**
 * Strips UTM/tracking parameters, lowercases hostname, and removes trailing slashes.
 * @param {string} rawUrl
 * @returns {string}
 */
export function canonicalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const stripParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source"
    ];
    for (const p of stripParams) {
      parsed.searchParams.delete(p);
    }
    let cleanPath = parsed.pathname.replace(/\/+$/, "");
    if (!cleanPath) cleanPath = "";
    const qs = parsed.searchParams.toString();
    return `${parsed.protocol}//${parsed.hostname}${cleanPath}${qs ? "?" + qs : ""}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Deterministic fingerprint from category, normalized organization name, and normalized title.
 * @param {{ category?: string, organization?: string, title?: string }} item
 * @returns {string}
 */
export function computeFingerprint(item) {
  const cat = String(item.category || "unknown").toLowerCase().trim();
  const org = String(item.organization || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const title = String(item.title || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `${cat}::${org}::${title}`;
}

/**
 * Deduplicates candidate records by canonical URL or deterministic fingerprint,
 * merging secondary provenance URLs onto the surviving canonical record.
 * @param {Array<Object>} records
 * @returns {{ deduplicated: Array<Object>, mergedCount: number }}
 */
export function deduplicateOpportunities(records) {
  const byFingerprint = new Map();
  const byUrl = new Map();
  let mergedCount = 0;

  for (const raw of records) {
    const canonUrl = canonicalizeUrl(raw.source_url || "");
    const fp = computeFingerprint(raw);
    const existing = byFingerprint.get(fp) || (canonUrl ? byUrl.get(canonUrl) : undefined);

    if (existing) {
      mergedCount += 1;
      const urls = new Set(existing.provenance_urls || [existing.source_url]);
      if (raw.source_url) urls.add(raw.source_url);
      if (Array.isArray(raw.secondary_sources)) {
        for (const u of raw.secondary_sources) urls.add(u);
      }
      if (Array.isArray(raw.provenance_urls)) {
        for (const u of raw.provenance_urls) urls.add(u);
      }
      existing.provenance_urls = Array.from(urls).filter(Boolean);
    } else {
      const clone = {
        ...raw,
        canonical_url: canonUrl,
        fingerprint: fp,
        provenance_urls: Array.from(
          new Set(
            [
              raw.source_url,
              ...(raw.secondary_sources || []),
              ...(raw.provenance_urls || [])
            ].filter(Boolean)
          )
        )
      };
      byFingerprint.set(fp, clone);
      if (canonUrl) byUrl.set(canonUrl, clone);
    }
  }

  return {
    deduplicated: Array.from(byFingerprint.values()),
    mergedCount
  };
}

/**
 * Enforces non-inferred legal/eligibility defaults and calculates explainable 0-100 score
 * with Seniority Gate (5+ years) and Regional Gate (non-Cyprus/non-EMEA exclusion).
 * @param {Object} record
 * @param {Object} profile
 * @returns {Object}
 */
export function calculateExplainableScore(record, profile = {}) {
  const safeProfile = {
    citizenship: profile.citizenship || "UNKNOWN",
    eu_eea_status: profile.eu_eea_status || profile.eu_citizenship || "UNKNOWN",
    work_permit_status:
      profile.work_permit_status || profile.cyprus_full_time_work_rights || "UNKNOWN"
  };

  const details = record.details || {};
  const yearsRequired = Number(details.years_required || 0);
  const expText = String(details.experience_required || "");
  const seniorityGated =
    yearsRequired >= 5 ||
    /\b([5-9]|\d{2,})\+?\s*years/i.test(expText) ||
    /\b(senior|lead|principal|staff)\b/i.test(String(record.title || ""));
  const regionRestricted =
    Boolean(details.region_restricted_out_of_cyprus) ||
    details.region_eligibility === "NO" ||
    details.cyprus_eligibility === "NO" ||
    details.remote_geography_class === "Excluded" ||
    /\b(us-only|africa-only|united states only|remote from:\s*africa|nigeria|kenya|egypt only)\b/i.test(
      `${record.title || ""} ${record.location || ""} ${details.remote_boundary || ""} ${details.remote_region_restrictions || ""}`
    );

  // Never infer legal eligibility if unconfirmed
  let resolvedEligibility =
    record.eligibility_status ||
    details.eligibility_confidence ||
    details.eligibility_status ||
    details.visa_status ||
    details.visa_sponsorship_status ||
    details.cyprus_eligibility ||
    "UNKNOWN";
  if (
    resolvedEligibility === "CONFIRMED" &&
    details.requires_eu_citizenship &&
    safeProfile.eu_eea_status === "UNKNOWN"
  ) {
    resolvedEligibility = "UNKNOWN";
  }

  const components = normalizeScoreComponents(record);
  let rawSum = components.reduce((acc, c) => acc + Number(c.points || 0), 0);
  if (rawSum === 0 && typeof record.score_total === "number") {
    rawSum = record.score_total;
  }

  let penalty = 0;
  let gateReason = null;
  let isActive = record.is_active !== false;

  if (seniorityGated && record.category === "visa_jobs") {
    penalty = Math.max(penalty, 50);
    gateReason = "SENIORITY_GATE_5_PLUS_YEARS";
    isActive = false;
  }

  if (regionRestricted && record.category === "remote_jobs") {
    penalty = Math.max(penalty, 40);
    gateReason = "REGIONAL_RESTRICTION_GATE_NON_CYPRUS";
    resolvedEligibility = "NO";
    isActive = false;
  }

  const finalScore = Math.max(0, Math.min(100, rawSum - penalty));

  return {
    score_total: finalScore,
    is_active: isActive,
    eligibility_status: resolvedEligibility,
    gate_reason: gateReason,
    profile_legal_state: safeProfile
  };
}

/**
 * Classifies a follow-up date relative to a reference ISO date (YYYY-MM-DD).
 * @param {string | null | undefined} followUpDate
 * @param {string} referenceDate
 * @returns {"Overdue" | "Due today" | "Tomorrow" | "This week" | "Later" | "No follow-up"}
 */
export function classifyFollowUpBucket(followUpDate, referenceDate = "2026-10-14") {
  if (!followUpDate) return "No follow-up";
  const ref = new Date(`${referenceDate}T00:00:00Z`).getTime();
  const target = new Date(`${String(followUpDate).slice(0, 10)}T00:00:00Z`).getTime();
  if (Number.isNaN(target)) return "No follow-up";
  const diffDays = Math.round((target - ref) / 86400000);
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return "This week";
  return "Later";
}

/**
 * Groups records into Follow-Up Buckets for the Today Command Center and Saved view.
 * @param {Array<Object>} records
 * @param {string} referenceDate
 */
export function bucketFollowUps(records, referenceDate = "2026-10-14") {
  const buckets = {
    "Overdue": [],
    "Due today": [],
    "Tomorrow": [],
    "This week": [],
    "Later": [],
    "No follow-up": []
  };
  for (const r of records) {
    const wf = r.workflow || {};
    const fDate = wf.follow_up_date !== undefined ? wf.follow_up_date : r.follow_up_date;
    const b = classifyFollowUpBucket(fDate, referenceDate);
    buckets[b].push(r);
  }
  return buckets;
}

/**
 * Dynamically ranks opportunities for the Today Command Center combining score,
 * deadline urgency, eligibility confidence, workflow state, follow-up due date, and freshness.
 * Excludes gated/inactive records and terminal workflow items.
 * @param {Array<Object>} records
 * @param {string} referenceDate
 */
export function buildTodayPriorityQueue(records, referenceDate = "2026-10-14") {
  const active = records.filter((r) => {
    const rawStatus = (r.workflow && r.workflow.status) || r.user_status || r.status || "New";
    const status = normalizeWorkflowStatus(rawStatus);
    if (TERMINAL_WORKFLOW_STATUSES.has(status)) return false;
    if (r.is_active === false) return false;
    return true;
  });

  const scored = active.map((r) => {
    const wf = r.workflow || {};
    const status = normalizeWorkflowStatus(wf.status || r.user_status || r.status || "New");
    const priority = wf.priority || r.priority || "P1";
    const followUp = wf.follow_up_date !== undefined ? wf.follow_up_date : r.follow_up_date;
    const bucket = classifyFollowUpBucket(followUp, referenceDate);

    let urgencyBoost = 0;
    let actionBadge = "REVIEW NEW MATCH";

    if (bucket === "Overdue" || bucket === "Due today") {
      urgencyBoost += 18;
      actionBadge = "FOLLOW UP";
    } else if (bucket === "Tomorrow") {
      urgencyBoost += 12;
      actionBadge = "FOLLOW UP";
    } else if (r.category === "freelance_leads") {
      actionBadge = status === "Contacted" || status === "Follow-up" ? "FOLLOW UP" : "CONTACT LEAD";
      if (status === "New" || status === "High Priority" || status === "Saved") urgencyBoost += 8;
    } else if (r.category === "masters_scholarships") {
      actionBadge = "SCHOLARSHIP DEADLINE";
      const dl = r.deadline || (r.details && r.details.application_deadline) || "";
      if (dl) urgencyBoost += 10;
    } else if (r.category === "visa_jobs" || r.category === "remote_jobs") {
      actionBadge =
        status === "Applied" || status === "Interview" || status === "Follow-up"
          ? "FOLLOW UP"
          : "APPLY";
      if (status === "Preparing" || status === "High Priority" || status === "Saved") {
        urgencyBoost += 6;
      }
    }

    if (priority === "High" || priority === "P0" || priority === "P1") urgencyBoost += 7;
    if (status === "High Priority") urgencyBoost += 5;
    if (wf.favorite || r.favorite) urgencyBoost += 4;

    // Freshness boost if verified today
    if (String(r.last_verified_at || "").startsWith(referenceDate)) {
      urgencyBoost += 2;
    }

    const queuePriorityScore = Number(r.score_total || 0) + urgencyBoost;

    return {
      ...r,
      status,
      user_status: status,
      action_badge: actionBadge,
      follow_up_bucket: bucket,
      queue_priority_score: queuePriorityScore
    };
  });

  return scored.sort((a, b) => b.queue_priority_score - a.queue_priority_score);
}

/**
 * Applies a user CRM mutation to an opportunity record, automatically stamping
 * contacted_date/contacted_at or applied_date/applied_at and appending a genuine timestamped activity event.
 * @param {Object} record
 * @param {Object} patch
 * @param {string} isoDate
 */
export function applyWorkflowTransition(record, patch, isoDate = "2026-10-14") {
  const prevStatus = normalizeWorkflowStatus(
    (record.workflow && record.workflow.status) || record.user_status || record.status || "New"
  );
  const prevWf = {
    status: prevStatus,
    priority: (record.workflow && record.workflow.priority) || record.priority || "P1",
    favorite: Boolean((record.workflow && record.workflow.favorite) ?? record.favorite),
    follow_up_date:
      (record.workflow && record.workflow.follow_up_date) ?? record.follow_up_date ?? null,
    contacted_date:
      (record.workflow && record.workflow.contacted_date) ??
      record.contacted_date ??
      record.contacted_at ??
      null,
    applied_date:
      (record.workflow && record.workflow.applied_date) ??
      record.applied_date ??
      record.applied_at ??
      null,
    contacted_at:
      (record.workflow && record.workflow.contacted_at) ??
      record.contacted_at ??
      record.contacted_date ??
      null,
    applied_at:
      (record.workflow && record.workflow.applied_at) ??
      record.applied_at ??
      record.applied_date ??
      null,
    personal_notes:
      (record.workflow && record.workflow.personal_notes) ?? record.personal_notes ?? ""
  };

  const normalizedPatch = { ...patch };
  if (normalizedPatch.status) {
    normalizedPatch.status = normalizeWorkflowStatus(normalizedPatch.status);
  }
  if (normalizedPatch.contacted_at !== undefined && normalizedPatch.contacted_date === undefined) {
    normalizedPatch.contacted_date = normalizedPatch.contacted_at;
  }
  if (normalizedPatch.contacted_date !== undefined && normalizedPatch.contacted_at === undefined) {
    normalizedPatch.contacted_at = normalizedPatch.contacted_date;
  }
  if (normalizedPatch.applied_at !== undefined && normalizedPatch.applied_date === undefined) {
    normalizedPatch.applied_date = normalizedPatch.applied_at;
  }
  if (normalizedPatch.applied_date !== undefined && normalizedPatch.applied_at === undefined) {
    normalizedPatch.applied_at = normalizedPatch.applied_date;
  }

  const nextWf = { ...prevWf, ...normalizedPatch };
  const rawHistory = Array.isArray(record.activity_history)
    ? record.activity_history
    : Array.isArray(record.history)
      ? record.history
      : [];
  const events = rawHistory.map((ev) => ({
    at: ev.at || (ev.ts ? String(ev.ts).replace("T", " ").replace("Z", "") : `${isoDate} 12:00`),
    label: ev.label || ev.event || "Activity recorded",
    ts: ev.ts || ev.at || `${isoDate}T12:00:00Z`,
    event: ev.event || ev.label || "Activity recorded",
    actor: ev.actor || "user"
  }));

  if (normalizedPatch.status && normalizedPatch.status !== prevWf.status) {
    if (normalizedPatch.status === "Contacted" && !nextWf.contacted_date) {
      nextWf.contacted_date = isoDate;
      nextWf.contacted_at = isoDate;
    }
    if (normalizedPatch.status === "Applied" && !nextWf.applied_date) {
      nextWf.applied_date = isoDate;
      nextWf.applied_at = isoDate;
    }
    const label = `Status updated from ${prevWf.status} to ${normalizedPatch.status}`;
    events.unshift({
      at: `${isoDate} 15:45`,
      label,
      ts: `${isoDate}T15:45:00Z`,
      event: label,
      actor: "user"
    });
  }

  if (normalizedPatch.priority && normalizedPatch.priority !== prevWf.priority) {
    const label = `Priority set to ${normalizedPatch.priority}`;
    events.unshift({
      at: `${isoDate} 15:45`,
      label,
      ts: `${isoDate}T15:45:00Z`,
      event: label,
      actor: "user"
    });
  }

  if (
    normalizedPatch.follow_up_date !== undefined &&
    normalizedPatch.follow_up_date !== prevWf.follow_up_date
  ) {
    const label = normalizedPatch.follow_up_date
      ? `Follow-up scheduled for ${normalizedPatch.follow_up_date}`
      : "Follow-up cleared";
    events.unshift({
      at: `${isoDate} 15:45`,
      label,
      ts: `${isoDate}T15:45:00Z`,
      event: label,
      actor: "user"
    });
  }

  if (
    normalizedPatch.contacted_date !== undefined &&
    normalizedPatch.contacted_date !== prevWf.contacted_date
  ) {
    const label = normalizedPatch.contacted_date
      ? `Contacted date recorded: ${normalizedPatch.contacted_date}`
      : "Contacted date cleared";
    events.unshift({
      at: `${isoDate} 15:45`,
      label,
      ts: `${isoDate}T15:45:00Z`,
      event: label,
      actor: "user"
    });
  }

  if (
    normalizedPatch.applied_date !== undefined &&
    normalizedPatch.applied_date !== prevWf.applied_date
  ) {
    const label = normalizedPatch.applied_date
      ? `Applied date recorded: ${normalizedPatch.applied_date}`
      : "Applied date cleared";
    events.unshift({
      at: `${isoDate} 15:45`,
      label,
      ts: `${isoDate}T15:45:00Z`,
      event: label,
      actor: "user"
    });
  }

  if (
    normalizedPatch.personal_notes !== undefined &&
    normalizedPatch.personal_notes !== prevWf.personal_notes
  ) {
    const label = "Personal CRM note saved";
    events.unshift({
      at: `${isoDate} 15:45`,
      label,
      ts: `${isoDate}T15:45:00Z`,
      event: label,
      actor: "user"
    });
  }

  return {
    ...record,
    status: nextWf.status,
    user_status: nextWf.status,
    priority: nextWf.priority,
    favorite: nextWf.favorite,
    follow_up_date: nextWf.follow_up_date,
    contacted_date: nextWf.contacted_date,
    applied_date: nextWf.applied_date,
    contacted_at: nextWf.contacted_at,
    applied_at: nextWf.applied_at,
    personal_notes: nextWf.personal_notes,
    workflow: nextWf,
    activity_history: events,
    history: events
  };
}

/**
 * Idempotent synchronization between canonical database records and Google Sheets rows
 * keyed by persistent Record ID (Column A). Machine fields update; user-owned [USER]
 * CRM fields are strictly preserved.
 * @param {Array<Object>} existingSheetRows
 * @param {Array<Object>} incomingMachineRecords
 */
export function syncDatabaseToSheetRows(existingSheetRows, incomingMachineRecords) {
  const rowMap = new Map();
  for (const row of existingSheetRows) {
    const id = row.record_id || row.id;
    if (id) rowMap.set(id, { ...row, record_id: id });
  }

  let inserted = 0;
  let updated = 0;
  let preservedUserFields = 0;

  for (const machine of incomingMachineRecords) {
    const id = machine.id || machine.record_id;
    if (!id) continue;
    const existing = rowMap.get(id);

    if (!existing) {
      inserted += 1;
      const wf = machine.workflow || {};
      const status = normalizeWorkflowStatus(wf.status || machine.user_status || machine.status || "New");
      rowMap.set(id, {
        ...machine,
        record_id: id,
        status,
        user_status: status,
        priority: wf.priority || machine.priority || "P1",
        favorite: Boolean(wf.favorite ?? machine.favorite ?? false),
        follow_up_date: wf.follow_up_date ?? machine.follow_up_date ?? null,
        contacted_date: wf.contacted_date ?? machine.contacted_date ?? machine.contacted_at ?? null,
        applied_date: wf.applied_date ?? machine.applied_date ?? machine.applied_at ?? null,
        contacted_at: wf.contacted_at ?? machine.contacted_at ?? machine.contacted_date ?? null,
        applied_at: wf.applied_at ?? machine.applied_at ?? machine.applied_date ?? null,
        personal_notes: wf.personal_notes ?? machine.personal_notes ?? ""
      });
    } else {
      updated += 1;
      const merged = {
        ...existing,
        ...machine,
        record_id: id
      };
      for (const field of USER_OWNED_FIELDS) {
        if (existing[field] !== undefined && existing[field] !== null && existing[field] !== "") {
          merged[field] = existing[field];
          preservedUserFields += 1;
        }
      }
      const resolvedStatus = normalizeWorkflowStatus(
        existing.user_status || existing.status || (existing.workflow && existing.workflow.status) || merged.status
      );
      merged.status = resolvedStatus;
      merged.user_status = resolvedStatus;
      merged.contacted_date = existing.contacted_date ?? existing.contacted_at ?? merged.contacted_date ?? null;
      merged.contacted_at = existing.contacted_at ?? existing.contacted_date ?? merged.contacted_at ?? null;
      merged.applied_date = existing.applied_date ?? existing.applied_at ?? merged.applied_date ?? null;
      merged.applied_at = existing.applied_at ?? existing.applied_date ?? merged.applied_at ?? null;

      if (merged.workflow || existing.workflow) {
        merged.workflow = {
          ...(merged.workflow || {}),
          ...(existing.workflow || {}),
          status: resolvedStatus,
          priority: merged.priority || (merged.workflow && merged.workflow.priority) || "P1",
          favorite: Boolean(merged.favorite ?? (merged.workflow && merged.workflow.favorite)),
          follow_up_date:
            merged.follow_up_date ?? (merged.workflow && merged.workflow.follow_up_date) ?? null,
          contacted_date: merged.contacted_date,
          applied_date: merged.applied_date,
          contacted_at: merged.contacted_at,
          applied_at: merged.applied_at,
          personal_notes:
            merged.personal_notes ?? (merged.workflow && merged.workflow.personal_notes) ?? ""
        };
      }
      if (Array.isArray(existing.activity_history) && existing.activity_history.length > 0) {
        merged.activity_history = existing.activity_history;
      }
      rowMap.set(id, merged);
    }
  }

  return {
    rows: Array.from(rowMap.values()),
    inserted,
    updated,
    preservedUserFields
  };
}

export function normalizeScoreComponents(record) {
  const sc = record && record.score_components;
  if (!sc) return [];
  const explanations = Array.isArray(record.score_explanation) ? record.score_explanation : [];
  if (Array.isArray(sc)) return sc;
  const cat = record.category || "";
  const labelsByCat = {
    freelance_leads: {
      fit: ["Profile & Case-Study Fit", 30],
      evidence: ["Deterministic Audit Evidence", 25],
      value: ["Business Ticket Value", 20],
      contact: ["Public Contact Path", 15],
      urgency: ["Urgency", 10]
    },
    visa_jobs: {
      fit: ["Stack & Level Fit", 35],
      evidence: ["Source & ATS Evidence", 20],
      eligibility: ["Visa / Location Eligibility", 20],
      quality: ["Employer & Comp Quality", 15],
      urgency: ["Urgency", 10]
    },
    masters_scholarships: {
      fit: ["Academic & Portfolio Fit", 30],
      funding: ["Funding Coverage Strength", 25],
      eligibility: ["Eligibility Confidence", 25],
      evidence: ["Official Source Evidence", 10],
      urgency: ["Deadline Urgency", 10]
    },
    remote_jobs: {
      fit: ["Stack & Level Fit", 35],
      evidence: ["Official Source Evidence", 20],
      eligibility: ["Remote Region & TZ Eligibility", 20],
      quality: ["Compensation & Role Quality", 15],
      urgency: ["Urgency", 10]
    }
  };
  const map = labelsByCat[cat] || {};
  return Object.entries(sc).map(([k, pts], idx) => ({
    key: k,
    label: (map[k] && map[k][0]) || k,
    points: Number(pts || 0),
    max_points: (map[k] && map[k][1]) || 25,
    rationale: explanations[idx] || "Verified from primary source"
  }));
}

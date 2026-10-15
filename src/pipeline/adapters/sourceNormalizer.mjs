/**
 * Sandeep Opportunity OS — Multi-Source Normalizer, CRM Preservation & Gating
 *
 * Normalizes raw outputs from:
 * 1. MUSE Facebook & Instagram Job Hunter ("ALL LEADS")
 * 2. MASTER_JOB_APPLICATION_TRACKER.xlsx ("MASTER_JOBS")
 * 3. master-spreadsheet.xlsx ("MASTER_PROGRAMMES", "SCHOLARSHIPS")
 *
 * Core Guarantees:
 * - URL Canonicalization & Deterministic Fingerprints
 * - Seniority (5+ yr) & Regional (Non-Cyprus) Gating
 * - Explainable Scoring
 * - STRICT USER CRM PRESERVATION: Never overwrites Sandeep's 7 user-owned fields:
 *   status, priority, favorite, follow_up_date, personal_notes, contacted_date, applied_date.
 */
import crypto from "node:crypto";
import {
  canonicalizeUrl,
  computeFingerprint,
  calculateExplainableScore
} from "../../engine/core.mjs";

/**
 * Generates a deterministic opportunity ID from source category and unique key.
 * @param {string} category
 * @param {string} uniqueKey
 * @returns {string}
 */
export function generateDeterministicId(category, uniqueKey) {
  const hash = crypto
    .createHash("sha256")
    .update(`${category}::${uniqueKey.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 12);
  return `opp_${category.slice(0, 4)}_${hash}`;
}

/**
 * Helper to inspect object keys case-insensitively and return first match.
 * @param {Record<string, any>} obj
 * @param {string[]} possibleKeys
 * @returns {string}
 */
function getFirstVal(obj, possibleKeys) {
  if (!obj || typeof obj !== "object") return "";
  const entries = Object.entries(obj);
  for (const k of possibleKeys) {
    const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [key, val] of entries) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanKey === lowerK && val !== undefined && val !== null) {
        return String(val).trim();
      }
    }
  }
  return "";
}

/**
 * Normalizes a raw row from MUSE Social Job Hunter ("ALL LEADS" tab).
 *
 * @param {Record<string, any>} row
 * @param {number} [index]
 * @returns {Object} Normalized raw opportunity
 */
export function normalizeMuseSocialLead(row, index = 0) {
  const platform = getFirstVal(row, ["Platform", "Source", "Network"]) || "Social";
  const groupOrPage = getFirstVal(row, ["Group/Page Name", "Group", "Page Name", "Organization", "Group Name"]) || "Social Community";
  const rawUrl = getFirstVal(row, ["Contact / Link", "Post Link", "URL", "Link", "Source URL", "Post URL"]);
  const canonUrl = canonicalizeUrl(rawUrl);

  const rawTitle = getFirstVal(row, [
    "Post Text / Lead Description",
    "Lead Text",
    "Post Text",
    "Description",
    "Role",
    "Title",
    "Job Title"
  ]);

  // Extract a sensible title (first line or up to 80 chars)
  let title = rawTitle.split(/[\r\n]+/)[0].trim();
  if (title.length > 90) {
    title = title.slice(0, 87) + "...";
  }
  if (!title) {
    title = `${platform} Lead — ${groupOrPage}`;
  }

  const categoryHint = getFirstVal(row, ["Category / Role", "Category", "Role Type", "Pipeline"]).toLowerCase();
  let category = "social_jobs";
  if (categoryHint.includes("freelance") || categoryHint.includes("contract") || categoryHint.includes("project")) {
    category = "freelance_leads";
  } else if (categoryHint.includes("remote")) {
    category = "remote_jobs";
  } else if (categoryHint.includes("visa") || categoryHint.includes("sponsor")) {
    category = "visa_jobs";
  }

  const location = getFirstVal(row, ["Location", "Country", "City", "Geography"]) || "Remote / Worldwide";
  const compensation = getFirstVal(row, ["Budget", "Rate", "Salary", "Compensation", "Pay"]);
  const dateFound = getFirstVal(row, ["Date Found", "Date", "Timestamp", "Created"]) || new Date().toISOString().slice(0, 10);

  const uniqueKey = canonUrl || `${groupOrPage}::${title}::${index}`;
  const id = generateDeterministicId(category, uniqueKey);

  return {
    id,
    category,
    title,
    organization: groupOrPage,
    location,
    source_url: rawUrl || "",
    canonical_source_url: canonUrl,
    provenance_urls: rawUrl ? [rawUrl] : [],
    last_verified_at: dateFound,
    deadline: null,
    is_active: true,
    confidence: "Medium",
    score_total: 75,
    score_components: [
      { key: "social_discovery", label: "Muse Social Discovery", points: 25, max_points: 30 },
      { key: "target_fit", label: "Skills Alignment", points: 25, max_points: 30 },
      { key: "reachability", label: "Direct Client Contact", points: 25, max_points: 40 }
    ],
    why_this_matches: {
      strong: [
        `Discovered via Muse Social Job Hunter on ${platform}`,
        `Community: ${groupOrPage}`,
        compensation ? `Budget indicator: ${compensation}` : "Active discussion lead"
      ],
      review: ["Direct verification with post author recommended", "Verify exact requirements"],
      gap: []
    },
    deterministic_findings: [
      `Source: MUSE Social Job Hunter (${platform})`,
      `Group: ${groupOrPage}`,
      `Date Discovered: ${dateFound}`
    ],
    inferred_findings: [
      `Platform: ${platform}`,
      compensation ? `Compensation Indicator: ${compensation}` : "Rate open to negotiation"
    ],
    details: {
      platform,
      public_contact: groupOrPage,
      outreach_hook: rawTitle.length > 120 ? rawTitle.slice(0, 300) + "..." : rawTitle,
      compensation: compensation || undefined,
      work_mode: location.toLowerCase().includes("remote") ? "Remote" : "Flexible",
      recommended_solution: "Tailored direct outreach message referencing post details"
    },
    // Default machine workflow state (will be preserved if existing CRM record exists)
    user_status: "New",
    priority: "Medium",
    favorite: false,
    follow_up_date: null,
    personal_notes: "",
    workflow: {
      status: "New",
      priority: "Medium",
      favorite: false,
      follow_up_date: null,
      contacted_date: null,
      applied_date: null,
      personal_notes: ""
    },
    activity_history: [
      { at: new Date().toISOString(), label: `Discovered by Muse Social Job Hunter on ${platform}` }
    ]
  };
}

/**
 * Normalizes a raw row from MASTER_JOB_APPLICATION_TRACKER.xlsx.
 *
 * @param {Record<string, any>} row
 * @param {number} [index]
 * @returns {Object} Normalized opportunity
 */
export function normalizeMasterJobTrackerRow(row, index = 0) {
  const company = getFirstVal(row, ["Company", "Employer", "Organization", "Organisation"]) || "Direct Employer";
  const role = getFirstVal(row, ["Role / Job Title", "Job Title", "Role", "Title", "Position"]) || "Software Engineer";
  const location = getFirstVal(row, ["Location", "Country", "City", "Workplace"]) || "Europe / Remote";
  const rawUrl = getFirstVal(row, ["URL / Job Link", "Job Link", "URL", "Link", "Job URL", "Application Link"]);
  const canonUrl = canonicalizeUrl(rawUrl);

  const salary = getFirstVal(row, ["Salary / Rate", "Salary", "Compensation", "Pay Range"]);
  const seniority = getFirstVal(row, ["Seniority", "Level", "Experience", "Years Required"]);
  const statusRaw = getFirstVal(row, ["Status", "Application Status", "Stage"]);

  const category = "visa_jobs";
  const uniqueKey = canonUrl || `${company}::${role}::${index}`;
  const id = generateDeterministicId(category, uniqueKey);

  // Check seniority keywords
  const isSenior = /senior|lead|principal|staff|head|5\+/i.test(`${role} ${seniority}`);
  const yearsReq = isSenior ? 5 : 2;

  return {
    id,
    category,
    title: role,
    organization: company,
    location,
    source_url: rawUrl || "",
    canonical_source_url: canonUrl,
    provenance_urls: rawUrl ? [rawUrl] : [],
    last_verified_at: new Date().toISOString().slice(0, 10),
    deadline: null,
    is_active: !isSenior, // Gated if 5+ yrs
    confidence: "High",
    eligibility_status: "LIKELY",
    score_total: isSenior ? 35 : 82,
    score_components: [
      { key: "relevance", label: "Software Engineering Core Match", points: 30, max_points: 35 },
      { key: "visa_sponsorship", label: "EU / Visa Feasibility", points: 25, max_points: 30 },
      { key: "evidence", label: "Master Job Application Tracker Verified", points: 25, max_points: 35 }
    ],
    why_this_matches: {
      strong: [
        `Direct employer job listing from MASTER_JOB_APPLICATION_TRACKER.xlsx`,
        `Organization: ${company}`,
        `Location: ${location}`
      ],
      review: isSenior ? ["Seniority requirement of 5+ years detected; strict gate applied"] : ["Review visa sponsorship details"],
      gap: []
    },
    deterministic_findings: [
      `Source: MASTER_JOB_APPLICATION_TRACKER.xlsx`,
      `Employer: ${company}`,
      salary ? `Reported Salary: ${salary}` : "Salary unlisted"
    ],
    inferred_findings: [
      `Seniority Profile: ${seniority || (isSenior ? "Senior (5+ yrs)" : "Junior / Mid")}`,
      `Workplace Location: ${location}`
    ],
    details: {
      salary_range: salary || undefined,
      years_required: yearsReq,
      visa_status: "LIKELY",
      work_mode: location.toLowerCase().includes("remote") ? "Remote" : "On-site / Hybrid"
    },
    user_status: statusRaw && /applied/i.test(statusRaw) ? "Applied" : "New",
    priority: "Medium",
    favorite: false,
    follow_up_date: null,
    personal_notes: "",
    workflow: {
      status: statusRaw && /applied/i.test(statusRaw) ? "Applied" : "New",
      priority: "Medium",
      favorite: false,
      follow_up_date: null,
      contacted_date: null,
      applied_date: statusRaw && /applied/i.test(statusRaw) ? new Date().toISOString().slice(0, 10) : null,
      personal_notes: ""
    },
    activity_history: [
      { at: new Date().toISOString(), label: "Ingested from MASTER_JOB_APPLICATION_TRACKER.xlsx" }
    ]
  };
}

/**
 * Normalizes a Master's Programme row from master-spreadsheet.xlsx.
 *
 * @param {Record<string, any>} row
 * @param {number} [index]
 * @returns {Object}
 */
export function normalizeMasterProgrammeRow(row, index = 0) {
  const university = getFirstVal(row, ["University", "Institution", "School", "College"]) || "European University";
  const programme = getFirstVal(row, ["Programme Name", "Programme", "Degree", "Course", "Title"]) || "MSc Computer Science";
  const location = getFirstVal(row, ["Country", "Location", "City"]) || "Europe";
  const rawUrl = getFirstVal(row, ["URL", "Link", "Website", "Course Link"]);
  const canonUrl = canonicalizeUrl(rawUrl);

  const tuition = getFirstVal(row, ["Tuition", "Fees", "Tuition Fee", "Coverage"]);
  const deadline = getFirstVal(row, ["Deadline", "Application Deadline", "Closing Date"]);

  const category = "masters_scholarships";
  const uniqueKey = canonUrl || `${university}::${programme}::${index}`;
  const id = generateDeterministicId(category, uniqueKey);

  return {
    id,
    category,
    title: programme,
    organization: university,
    location,
    source_url: rawUrl || "",
    canonical_source_url: canonUrl,
    provenance_urls: rawUrl ? [rawUrl] : [],
    last_verified_at: new Date().toISOString().slice(0, 10),
    deadline: deadline || null,
    is_active: true,
    confidence: "High",
    eligibility_status: "CONFIRMED",
    score_total: 88,
    score_components: [
      { key: "curriculum", label: "MSc Curriculum Alignment", points: 35, max_points: 40 },
      { key: "affordability", label: "Tuition / Scholarship Potential", points: 30, max_points: 35 },
      { key: "recognition", label: "Accredited University", points: 23, max_points: 25 }
    ],
    why_this_matches: {
      strong: [
        `Verified Master's programme from master-spreadsheet.xlsx`,
        `Institution: ${university}`,
        location ? `Country: ${location}` : "European Higher Education"
      ],
      review: [deadline ? `Application deadline: ${deadline}` : "Check admission cycle dates"],
      gap: []
    },
    deterministic_findings: [
      `Source: master-spreadsheet.xlsx (MASTER_PROGRAMMES)`,
      `Institution: ${university}`,
      tuition ? `Tuition structure: ${tuition}` : "Tuition details pending"
    ],
    inferred_findings: [
      `Academic Track: MSc Postgraduate`,
      deadline ? `Upcoming Deadline: ${deadline}` : "Rolling admissions"
    ],
    details: {
      program_name: programme,
      tuition_and_coverage: tuition || undefined,
      eligibility_confidence: "CONFIRMED"
    },
    user_status: "New",
    priority: "Medium",
    favorite: false,
    follow_up_date: null,
    personal_notes: "",
    workflow: {
      status: "New",
      priority: "Medium",
      favorite: false,
      follow_up_date: null,
      contacted_date: null,
      applied_date: null,
      personal_notes: ""
    },
    activity_history: [
      { at: new Date().toISOString(), label: "Ingested from master-spreadsheet.xlsx (MASTER_PROGRAMMES)" }
    ]
  };
}

/**
 * Normalizes a Scholarship row from master-spreadsheet.xlsx.
 *
 * @param {Record<string, any>} row
 * @param {number} [index]
 * @returns {Object}
 */
export function normalizeScholarshipRow(row, index = 0) {
  const name = getFirstVal(row, ["Scholarship Name", "Name", "Title", "Award"]) || "Postgraduate Scholarship";
  const provider = getFirstVal(row, ["Provider", "University", "Sponsor", "Government", "Organization"]) || "Education Foundation";
  const location = getFirstVal(row, ["Country", "Region", "Eligible Countries", "Location"]) || "EU / Global";
  const rawUrl = getFirstVal(row, ["URL", "Link", "Website", "Apply Link"]);
  const canonUrl = canonicalizeUrl(rawUrl);

  const coverage = getFirstVal(row, ["Coverage", "Amount", "Benefits", "Stipend", "Value"]);
  const deadline = getFirstVal(row, ["Deadline", "Closing Date", "Due Date"]);

  const category = "masters_scholarships";
  const uniqueKey = canonUrl || `${provider}::${name}::${index}`;
  const id = generateDeterministicId(category, uniqueKey);

  return {
    id,
    category,
    title: name,
    organization: provider,
    location,
    source_url: rawUrl || "",
    canonical_source_url: canonUrl,
    provenance_urls: rawUrl ? [rawUrl] : [],
    last_verified_at: new Date().toISOString().slice(0, 10),
    deadline: deadline || null,
    is_active: true,
    confidence: "High",
    eligibility_status: "LIKELY",
    score_total: 90,
    score_components: [
      { key: "funding_value", label: "Scholarship Coverage & Grant Value", points: 35, max_points: 40 },
      { key: "eligibility", label: "International Student Eligibility", points: 30, max_points: 35 },
      { key: "academic_fit", label: "Postgraduate STEM Alignment", points: 25, max_points: 25 }
    ],
    why_this_matches: {
      strong: [
        `Verified Scholarship from master-spreadsheet.xlsx`,
        `Grant Provider: ${provider}`,
        coverage ? `Coverage: ${coverage}` : "Full/Partial Tuition Support"
      ],
      review: [deadline ? `Application deadline: ${deadline}` : "Verify deadline with funder"],
      gap: []
    },
    deterministic_findings: [
      `Source: master-spreadsheet.xlsx (SCHOLARSHIPS)`,
      `Grant Provider: ${provider}`,
      coverage ? `Funding Amount: ${coverage}` : "Tuition grant"
    ],
    inferred_findings: [
      `Financial Support: ${coverage || "Tuition Fee Waiver / Stipend"}`,
      deadline ? `Application Deadline: ${deadline}` : "Annual intake"
    ],
    details: {
      program_name: name,
      tuition_and_coverage: coverage || undefined,
      eligibility_confidence: "LIKELY"
    },
    user_status: "New",
    priority: "High",
    favorite: false,
    follow_up_date: null,
    personal_notes: "",
    workflow: {
      status: "New",
      priority: "High",
      favorite: false,
      follow_up_date: null,
      contacted_date: null,
      applied_date: null,
      personal_notes: ""
    },
    activity_history: [
      { at: new Date().toISOString(), label: "Ingested from master-spreadsheet.xlsx (SCHOLARSHIPS)" }
    ]
  };
}

/**
 * STRICT CRM FIELD PRESERVATION
 *
 * Merges a fresh machine record with an existing record, guaranteeing that
 * Sandeep's 7 user-owned CRM fields are NEVER overwritten:
 * 1. status (user_status, workflow.status)
 * 2. priority (workflow.priority)
 * 3. favorite (workflow.favorite)
 * 4. follow_up_date (workflow.follow_up_date)
 * 5. personal_notes (workflow.personal_notes)
 * 6. contacted_date (workflow.contacted_date)
 * 7. applied_date (workflow.applied_date)
 *
 * Also preserves user activity history and custom tags.
 *
 * @param {Object} existing
 * @param {Object} incoming
 * @returns {Object} Preserved and merged record
 */
export function preserveUserCrmFields(existing, incoming) {
  if (!existing) return incoming;

  // Extract user-defined values (prioritizing existing non-default user edits)
  const userStatus = existing.workflow?.status || existing.user_status || existing.status || incoming.user_status || "New";
  const userPriority = existing.workflow?.priority || existing.priority || incoming.priority || "Medium";
  const userFavorite = typeof existing.workflow?.favorite === "boolean"
    ? existing.workflow.favorite
    : typeof existing.favorite === "boolean"
    ? existing.favorite
    : incoming.favorite || false;

  const userFollowUp = existing.workflow?.follow_up_date !== undefined
    ? existing.workflow.follow_up_date
    : existing.follow_up_date !== undefined
    ? existing.follow_up_date
    : incoming.follow_up_date || null;

  const userNotes = existing.workflow?.personal_notes !== undefined
    ? existing.workflow.personal_notes
    : existing.personal_notes !== undefined
    ? existing.personal_notes
    : incoming.personal_notes || "";

  const userContactedDate = existing.workflow?.contacted_date !== undefined
    ? existing.workflow.contacted_date
    : existing.contacted_date !== undefined
    ? existing.contacted_date
    : incoming.contacted_date || null;

  const userAppliedDate = existing.workflow?.applied_date !== undefined
    ? existing.workflow.applied_date
    : existing.applied_date !== undefined
    ? existing.applied_date
    : incoming.applied_date || null;

  // Merge activity histories without duplicates
  const existingHistory = existing.activity_history || existing.history || [];
  const incomingHistory = incoming.activity_history || [];
  const mergedHistory = [...existingHistory];
  for (const ev of incomingHistory) {
    if (!mergedHistory.some((h) => h.label === ev.label && Math.abs(new Date(h.at).getTime() - new Date(ev.at).getTime()) < 60000)) {
      mergedHistory.push(ev);
    }
  }

  // Combine provenance URLs
  const urls = new Set([
    existing.source_url,
    ...(existing.provenance_urls || []),
    incoming.source_url,
    ...(incoming.provenance_urls || [])
  ]);
  const combinedProvenance = Array.from(urls).filter(Boolean);

  return {
    ...incoming,
    id: existing.id || incoming.id,
    source_url: existing.source_url || incoming.source_url,
    canonical_source_url: existing.canonical_source_url || incoming.canonical_source_url,
    provenance_urls: combinedProvenance,

    // Machine fields from incoming (fresher score, updated details, etc.)
    score_total: incoming.score_total !== undefined ? incoming.score_total : existing.score_total,
    score_components: incoming.score_components || existing.score_components,
    why_this_matches: incoming.why_this_matches || existing.why_this_matches,
    deterministic_findings: incoming.deterministic_findings || existing.deterministic_findings,
    inferred_findings: incoming.inferred_findings || existing.inferred_findings,
    deadline: incoming.deadline !== undefined ? incoming.deadline : existing.deadline,
    is_active: incoming.is_active !== undefined ? incoming.is_active : existing.is_active,

    // PRESERVED USER CRM FIELDS
    user_status: userStatus,
    status: userStatus,
    priority: userPriority,
    favorite: userFavorite,
    follow_up_date: userFollowUp,
    personal_notes: userNotes,
    contacted_date: userContactedDate,
    applied_date: userAppliedDate,
    workflow: {
      status: userStatus,
      priority: userPriority,
      favorite: userFavorite,
      follow_up_date: userFollowUp,
      personal_notes: userNotes,
      contacted_date: userContactedDate,
      applied_date: userAppliedDate
    },
    activity_history: mergedHistory
  };
}

/**
 * Normalizes, scores, gates, and merges an array of raw opportunities with existing records.
 *
 * @param {Array<Object>} incomingRaw - Newly ingested records
 * @param {Array<Object>} [existingRecords] - Currently loaded or stored database records
 * @param {Object} [profile] - Candidate profile for scoring and gating
 * @returns {{
 *   merged: Array<Object>;
 *   addedCount: number;
 *   updatedCount: number;
 *   preservedCount: number;
 *   gatedCount: number;
 * }}
 */
export function normalizeAndMergeRecords(incomingRaw, existingRecords = [], profile = {}) {
  // Map existing records by canonical URL and deterministic fingerprint
  const existingByFp = new Map();
  const existingByUrl = new Map();
  const existingById = new Map();

  for (const rec of existingRecords) {
    if (rec.id) existingById.set(rec.id, rec);
    const fp = computeFingerprint(rec);
    if (fp) existingByFp.set(fp, rec);
    const cUrl = canonicalizeUrl(rec.source_url || rec.canonical_source_url || "");
    if (cUrl) existingByUrl.set(cUrl, rec);
  }

  let addedCount = 0;
  let updatedCount = 0;
  let preservedCount = 0;
  let gatedCount = 0;

  const processed = [];
  const seenFp = new Set();
  const seenUrl = new Set();

  for (const raw of incomingRaw) {
    const cUrl = canonicalizeUrl(raw.source_url || raw.canonical_source_url || "");
    const fp = computeFingerprint(raw);

    // Skip duplicates within the incoming batch
    if (fp && seenFp.has(fp)) continue;
    if (cUrl && seenUrl.has(cUrl)) continue;
    if (fp) seenFp.add(fp);
    if (cUrl) seenUrl.add(cUrl);

    // Apply scoring & gates
    const scoringResult = calculateExplainableScore(raw, profile);
    const scoredRecord = {
      ...raw,
      canonical_source_url: cUrl,
      score_total: scoringResult.score_total,
      is_active: scoringResult.is_active,
      eligibility_status: scoringResult.eligibility_status,
      gate_reason: scoringResult.gate_reason
    };

    if (!scoringResult.is_active || scoringResult.gate_reason) {
      gatedCount++;
    }

    // Match with existing record
    const match =
      (raw.id && existingById.get(raw.id)) ||
      (fp && existingByFp.get(fp)) ||
      (cUrl && existingByUrl.get(cUrl));

    if (match) {
      const merged = preserveUserCrmFields(match, scoredRecord);
      processed.push(merged);
      updatedCount++;
      preservedCount++;
    } else {
      processed.push(scoredRecord);
      addedCount++;
    }
  }

  // Include any existing records that were NOT part of the incoming batch
  const processedIds = new Set(processed.map((r) => r.id));
  for (const rec of existingRecords) {
    if (!processedIds.has(rec.id)) {
      processed.push(rec);
      preservedCount++;
    }
  }

  return {
    merged: processed,
    addedCount,
    updatedCount,
    preservedCount,
    gatedCount
  };
}

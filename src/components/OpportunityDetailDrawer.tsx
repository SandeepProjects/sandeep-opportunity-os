import React, { useState, useEffect } from "react";
import { normalizeScoreComponents } from "../engine/core";
import {
  CANONICAL_WORKFLOW_STATUSES,
  CANONICAL_PRIORITIES,
  type OpportunityRecord,
  type WorkflowState,
  type WorkflowStatus,
  type PriorityLevel
} from "../types/opportunity";

interface DetailDrawerProps {
  opportunity: OpportunityRecord | null;
  onClose: () => void;
  onUpdateWorkflow: (record: OpportunityRecord, patch: Partial<WorkflowState>) => void;
}

export const OpportunityDetailDrawer: React.FC<DetailDrawerProps> = ({
  opportunity,
  onClose,
  onUpdateWorkflow
}) => {
  const [notesDraft, setNotesDraft] = useState<string>("");

  useEffect(() => {
    if (opportunity) {
      setNotesDraft(opportunity.workflow?.personal_notes ?? opportunity.personal_notes ?? "");
    }
  }, [opportunity]);

  if (!opportunity) return null;

  const wf = opportunity.workflow || {
    status: opportunity.user_status || opportunity.status || "New",
    priority: opportunity.priority || "P1",
    favorite: Boolean(opportunity.favorite),
    follow_up_date: opportunity.follow_up_date || null,
    contacted_date: opportunity.contacted_date || opportunity.contacted_at || null,
    applied_date: opportunity.applied_date || opportunity.applied_at || null,
    contacted_at: opportunity.contacted_at || opportunity.contacted_date || null,
    applied_at: opportunity.applied_at || opportunity.applied_date || null,
    personal_notes: opportunity.personal_notes || ""
  };

  const details = opportunity.details || {};
  const why =
    opportunity.why_this_matches ||
    opportunity.why_matches ||
    details.why_this_matches ||
    details.why_matches || { strong: [], review: [], gap: [] };

  const detFindings =
    opportunity.deterministic_findings ||
    opportunity.deterministic_evidence ||
    details.deterministic_findings ||
    details.observable_issues ||
    [];

  const infFindings =
    opportunity.inferred_findings ||
    opportunity.inferred_observations ||
    details.inferred_findings ||
    [];

  const provenanceUrls = Array.from(
    new Set(
      [
        opportunity.source_url,
        ...(opportunity.secondary_sources || []),
        ...(opportunity.provenance_urls || []),
        details.programme_url,
        details.scholarship_url,
        details.direct_apply_url
      ].filter((u): u is string => Boolean(u && typeof u === "string"))
    )
  );

  const eligibilityState =
    opportunity.eligibility_status ||
    details.eligibility_confidence ||
    details.eligibility_status ||
    details.visa_sponsorship_status ||
    details.visa_status ||
    details.cyprus_eligibility ||
    "UNKNOWN";

  const deadlineValue =
    opportunity.deadline ||
    details.application_deadline ||
    details.funding_deadline ||
    details.programme_deadline ||
    "Rolling / Open";

  const compensationOrValue =
    details.salary_range ||
    details.compensation ||
    details.project_band ||
    details.funding_coverage ||
    details.tuition_fee ||
    "See primary source";

  const requirementsList: string[] = [
    ...(details.experience_required ? [`Experience: ${details.experience_required}`] : []),
    ...(details.core_stack && details.core_stack.length
      ? [`Core Stack: ${details.core_stack.join(", ")}`]
      : []),
    ...(details.academic_requirements ? [`Academic: ${details.academic_requirements}`] : []),
    ...(details.english_requirements ? [`English: ${details.english_requirements}`] : []),
    ...(details.language_req ? [`Language: ${details.language_req}`] : []),
    ...(details.citizenship_rules ? [`Citizenship Rules: ${details.citizenship_rules}`] : []),
    ...(details.remote_region_restrictions
      ? [`Remote Boundary: ${details.remote_region_restrictions}`]
      : []),
    ...(details.timezone_constraint ? [`Timezone: ${details.timezone_constraint}`] : []),
    ...(details.missing_requirements && details.missing_requirements.length
      ? [`Gaps / Missing: ${details.missing_requirements.join("; ")}`]
      : [])
  ];

  const unknownItems: string[] = [];
  if (eligibilityState === "UNKNOWN") {
    unknownItems.push(
      "Legal / citizenship / work-permit eligibility is UNKNOWN until explicitly verified in Profile."
    );
  }
  if (details.visa_sponsorship_status === "UNKNOWN") {
    unknownItems.push(
      "Employer visa sponsorship policy is not explicitly confirmed on the public job listing."
    );
  }
  if (details.eligibility_status === "UNKNOWN" || details.eligibility_confidence === "UNKNOWN") {
    unknownItems.push(
      "Scholarship / fee tier depends on unconfirmed EU/EEA vs. International statutory status."
    );
  }
  if (unknownItems.length === 0) {
    unknownItems.push(
      "Candidate citizenship, EU/EEA fee status, and Cyprus work permit category remain UNKNOWN unless verified."
    );
  }

  return (
    <aside
      id="detail-drawer"
      className="detail-drawer-backdrop open"
      role="dialog"
      aria-modal="true"
      aria-label={opportunity.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="detail-drawer-panel">
        <header className="detail-drawer-header">
          <div className="detail-header-main">
            <div className="detail-meta-row">
              <span id="drawer-id" className="badge-mono">
                {opportunity.id}
              </span>
              <span className="badge-category">{opportunity.category}</span>
              <span
                className={`badge-eligibility ${
                  opportunity.is_active === false
                    ? "elig-no"
                    : eligibilityState === "CONFIRMED"
                      ? "elig-confirmed"
                      : eligibilityState === "LIKELY"
                        ? "elig-likely"
                        : "elig-unknown"
                }`}
              >
                Eligibility: {opportunity.is_active === false ? "GATED / EXCLUDED" : eligibilityState}
              </span>
            </div>
            <h2 className="detail-title">{opportunity.title}</h2>
            <p className="detail-subtitle">
              <strong>{opportunity.organization}</strong> · {opportunity.location}
            </p>
          </div>
          <div className="detail-header-actions">
            <span className="score-pill-large mono">{opportunity.score_total}/100</span>
            <button
              type="button"
              className={`btn-secondary ${wf.favorite ? "btn-saved-active" : ""}`}
              onClick={() => onUpdateWorkflow(opportunity, { favorite: !wf.favorite })}
            >
              {wf.favorite ? "★ Saved" : "☆ Save"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <div className="detail-drawer-body">
          {/* 1. Overview */}
          <section className="detail-section">
            <h3>Overview</h3>
            <div className="overview-kv-grid">
              <div className="kv-box">
                <span className="kv-label">Organization</span>
                <span className="kv-val">{opportunity.organization}</span>
              </div>
              <div className="kv-box">
                <span className="kv-label">Location / Mode</span>
                <span className="kv-val">
                  {opportunity.location}
                  {details.work_model || details.work_type
                    ? ` (${details.work_model || details.work_type})`
                    : ""}
                </span>
              </div>
              <div className="kv-box">
                <span className="kv-label">Value / Compensation / Funding</span>
                <span className="kv-val">{compensationOrValue}</span>
              </div>
              <div className="kv-box">
                <span className="kv-label">Deadline / Timeline</span>
                <span className="kv-val mono">{deadlineValue}</span>
              </div>
            </div>
            {(details.suggested_service_angle || details.outreach_hook || details.public_contact) && (
              <div className="overview-pitch-box">
                {details.public_contact && (
                  <p>
                    <strong>Public Contact:</strong> <span className="mono">{details.public_contact}</span>
                  </p>
                )}
                {details.suggested_service_angle && (
                  <p>
                    <strong>Recommended Angle:</strong> {details.suggested_service_angle}
                  </p>
                )}
                {details.outreach_hook && (
                  <p>
                    <strong>Outreach Hook:</strong> “{details.outreach_hook}”
                  </p>
                )}
              </div>
            )}
          </section>

          {/* 2. CRM Controls & Persisted Workflow */}
          <section className="detail-section">
            <h3>CRM Workflow & Protected [USER] Fields</h3>
            <div className="crm-controls-grid">
              <label className="crm-field">
                <span>Workflow Status</span>
                <select
                  aria-label="Workflow Status"
                  value={wf.status}
                  onChange={(e) =>
                    onUpdateWorkflow(opportunity, { status: e.target.value as WorkflowStatus })
                  }
                >
                  {CANONICAL_WORKFLOW_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>

              <label className="crm-field">
                <span>Priority</span>
                <select
                  aria-label="Priority"
                  value={wf.priority}
                  onChange={(e) =>
                    onUpdateWorkflow(opportunity, { priority: e.target.value as PriorityLevel })
                  }
                >
                  {CANONICAL_PRIORITIES.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="crm-field">
                <span>Follow-Up Date</span>
                <input
                  type="date"
                  aria-label="Follow-Up Date"
                  value={wf.follow_up_date || ""}
                  onChange={(e) =>
                    onUpdateWorkflow(opportunity, {
                      follow_up_date: e.target.value ? e.target.value : null
                    })
                  }
                />
              </label>

              <label className="crm-field">
                <span>Contacted Date</span>
                <input
                  type="date"
                  aria-label="Contacted Date"
                  value={wf.contacted_date || wf.contacted_at || ""}
                  onChange={(e) =>
                    onUpdateWorkflow(opportunity, {
                      contacted_date: e.target.value ? e.target.value : null,
                      contacted_at: e.target.value ? e.target.value : null
                    })
                  }
                />
              </label>

              <label className="crm-field">
                <span>Applied Date</span>
                <input
                  type="date"
                  aria-label="Applied Date"
                  value={wf.applied_date || wf.applied_at || ""}
                  onChange={(e) =>
                    onUpdateWorkflow(opportunity, {
                      applied_date: e.target.value ? e.target.value : null,
                      applied_at: e.target.value ? e.target.value : null
                    })
                  }
                />
              </label>

              <label className="crm-field checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(wf.favorite)}
                  onChange={(e) => onUpdateWorkflow(opportunity, { favorite: e.target.checked })}
                />
                <span>Saved / Favorite</span>
              </label>
            </div>

            <div className="crm-notes-box">
              <label htmlFor="crm-notes-textarea">Personal Notes (Protected [USER] Field)</label>
              <textarea
                id="crm-notes-textarea"
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Write outreach context, CV version, or interview notes..."
              />
              <div className="crm-notes-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onUpdateWorkflow(opportunity, { personal_notes: notesDraft })}
                >
                  Save Note
                </button>
              </div>
            </div>
          </section>

          {/* 3. Why This Matches */}
          <section className="detail-section">
            <h3>Why This Matches</h3>
            <div className="why-grid">
              <div className="why-card strong">
                <strong>Strong Alignment</strong>
                <ul>
                  {(why.strong || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="why-card review">
                <strong>Verify / Review</strong>
                <ul>
                  {(why.review || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="why-card gap">
                <strong>Known Gaps / Constraints</strong>
                <ul>
                  {(why.gap || []).length > 0 ? (
                    why.gap.map((item, idx) => <li key={idx}>{item}</li>)
                  ) : (
                    <li>No hard technical blockers identified</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Requirements & Eligibility */}
          <section className="detail-section">
            <h3>Requirements & Eligibility Assessment</h3>
            <div className="evidence-columns">
              <div className="evidence-card">
                <h4>Role / Programme Requirements</h4>
                <ul>
                  {requirementsList.length > 0 ? (
                    requirementsList.map((req, i) => <li key={i}>{req}</li>)
                  ) : (
                    <li>Refer to official primary source for full specification.</li>
                  )}
                </ul>
              </div>
              <div className="evidence-card">
                <h4>Eligibility & Gate Status</h4>
                <p className="mono">
                  <strong>Status:</strong> {eligibilityState}{" "}
                  {opportunity.is_active === false ? "(Excluded from Active Queue)" : "(Active)"}
                </p>
                {details.visa_evidence && <p>{details.visa_evidence}</p>}
                {details.tuition_fee && (
                  <p>
                    <strong>Tuition:</strong> {details.tuition_fee}
                  </p>
                )}
                {details.funding_coverage && (
                  <p>
                    <strong>Scholarship Coverage:</strong> {details.funding_coverage}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 5. Evidence: Observed Facts vs Inferred Findings vs Unknown Information */}
          <section className="detail-section">
            <h3>Evidence: Observed Facts vs. Inferred Findings vs. Unknowns</h3>
            <div className="why-grid">
              <div className="why-card strong">
                <strong>
                  <span className="badge-deterministic">OBSERVED FACTS</span> Deterministic Inspection
                </strong>
                <ul>
                  {detFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="why-card review">
                <strong>
                  <span className="badge-inferred">INFERRED</span> Commercial / Fit Inference
                </strong>
                <ul>
                  {infFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="why-card gap">
                <strong>
                  <span className="badge-unknown-inline">UNKNOWN</span> Unverified Information
                </strong>
                <ul>
                  {unknownItems.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 6. Explainable Score Breakdown */}
          <section className="detail-section">
            <h3>Score Breakdown ({opportunity.score_total}/100)</h3>
            <div className="table-scroll">
              <table className="data-table score-breakdown-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Points</th>
                    <th>Max</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizeScoreComponents(opportunity).map((comp, idx) => (
                    <tr key={idx}>
                      <td>{comp.label}</td>
                      <td className="mono">{comp.points}</td>
                      <td className="mono">{comp.max_points}</td>
                      <td>{comp.rationale || "Verified from primary source"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Source URL, Provenance & Research Metadata */}
          <section className="detail-section">
            <h3>Source URL, Provenance & Research Metadata</h3>
            <div className="metadata-strip mono">
              <span>Source Type: {opportunity.source_type || "OFFICIAL_SOURCE"}</span>
              <span>Confidence: {opportunity.confidence}</span>
              <span>Retrieved: {opportunity.retrieved_at || opportunity.last_verified_at}</span>
              <span>Last Verified: {opportunity.last_verified_at}</span>
            </div>
            <ul className="provenance-list">
              {provenanceUrls.map((url, idx) => (
                <li key={idx}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                  </a>
                  {idx === 0 ? <span className="badge-mono">Primary</span> : null}
                </li>
              ))}
            </ul>
          </section>

          {/* 8. Activity Timeline */}
          <section className="detail-section">
            <h3>Activity History</h3>
            <ul className="activity-timeline">
              {(opportunity.activity_history || []).map((ev, idx) => (
                <li key={idx}>
                  <span className="mono">{ev.at || ev.ts}</span> — {ev.label || ev.event}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </aside>
  );
};

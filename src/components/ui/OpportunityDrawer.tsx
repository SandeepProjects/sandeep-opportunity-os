import React, { useState, useEffect, useRef } from "react";
import { normalizeScoreComponents } from "../../engine/core";
import type {
  OpportunityRecord,
  WorkflowState,
  WorkflowStatus,
  PriorityLevel
} from "../../types/opportunity";
import { Score } from "./Score";
import { StatusBadge } from "./StatusBadge";
import { EligibilityBadge } from "./EligibilityBadge";
import { PriorityBadge } from "./PriorityBadge";

interface OpportunityDrawerProps {
  opportunity: OpportunityRecord | null;
  onClose: () => void;
  onUpdateWorkflow: (record: OpportunityRecord, patch: Partial<WorkflowState>) => void;
}

const STATUS_OPTIONS: WorkflowStatus[] = [
  "New",
  "Saved",
  "Preparing",
  "Contacted",
  "Applied",
  "Interviewing",
  "Follow-Up",
  "Won",
  "Rejected",
  "Archived"
];

const PRIORITY_OPTIONS: PriorityLevel[] = ["High", "Medium", "Low", "P0", "P1", "P2"];

export const OpportunityDrawer: React.FC<OpportunityDrawerProps> = ({
  opportunity,
  onClose,
  onUpdateWorkflow
}) => {
  const [notesDraft, setNotesDraft] = useState<string>("");
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const opportunityId = opportunity?.id;
  const opportunityNotes = opportunity?.workflow?.personal_notes ?? opportunity?.personal_notes ?? "";

  useEffect(() => {
    if (!opportunityId) return;
    setNotesDraft(opportunityNotes);
  }, [opportunityId, opportunityNotes]);

  useEffect(() => {
    if (!opportunityId) return;
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [opportunityId]);

  useEffect(() => {
    if (!opportunityId) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [opportunityId, onClose]);

  if (!opportunity) return null;

  const wf = opportunity.workflow || {
    status: opportunity.user_status,
    priority: opportunity.priority,
    favorite: opportunity.favorite,
    follow_up_date: opportunity.follow_up_date,
    contacted_date: opportunity.contacted_date || null,
    applied_date: opportunity.applied_date || null,
    personal_notes: opportunity.personal_notes
  };

  const why = opportunity.why_this_matches || { strong: [], review: [], gap: [] };
  const detFindings =
    opportunity.deterministic_findings || opportunity.details?.deterministic_findings || [];
  const infFindings =
    opportunity.inferred_findings || opportunity.details?.inferred_findings || [];
  const provenanceUrls = Array.from(
    new Set([opportunity.source_url, ...(opportunity.provenance_urls || [])].filter(Boolean))
  );
  const scoreComponents = normalizeScoreComponents(opportunity);

  return (
    <div
      className="os-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="opportunity-drawer-title"
      onClick={onClose}
    >
      <aside ref={panelRef} className="os-drawer-panel" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <header className="os-drawer-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span className="os-badge neutral mono">{opportunity.id}</span>
              <EligibilityBadge opportunity={opportunity} />
              <PriorityBadge priority={wf.priority} />
              <StatusBadge status={wf.status} />
            </div>
            <h2 id="opportunity-drawer-title" className="os-drawer-title">{opportunity.title}</h2>
            <p className="os-drawer-subtitle">
              {opportunity.organization} · {opportunity.location}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Score score={opportunity.score_total} showBar={false} />
            <button
              ref={closeBtnRef}
              type="button"
              className="btn-secondary"
              onClick={onClose}
              aria-label="Close inspector drawer (Escape)"
            >
              Esc ✕
            </button>
          </div>
        </header>

        <div className="os-drawer-body">
          {/* 1. Overview & Value Proposition */}
          <section className="os-drawer-section">
            <h3 className="os-drawer-section-title">
              <span>1. Overview & Commercial / Career Context</span>
              <a href={opportunity.source_url} target="_blank" rel="noopener noreferrer">
                Open Primary URL ↗
              </a>
            </h3>
            <p style={{ margin: "0 0 8px", fontSize: "13px" }}>
              {opportunity.details?.suggested_service_angle ||
                opportunity.details?.recommended_solution ||
                opportunity.details?.tuition_and_coverage ||
                opportunity.details?.salary_range ||
                opportunity.details?.compensation ||
                "Verified directly from official primary source."}
            </p>
            {opportunity.details?.outreach_hook && (
              <div className="os-why-box" style={{ marginTop: "8px" }}>
                <strong>Tailored Outreach Hook / Pitch Angle</strong>
                <span>{opportunity.details.outreach_hook}</span>
              </div>
            )}
          </section>

          {/* 2. Why This Matches & Requirements */}
          <section className="os-drawer-section">
            <h3 className="os-drawer-section-title">
              <span>2. Why This Matches & Requirements</span>
              <span className="mono">Target: 0–2 yr Early-Career</span>
            </h3>
            <div className="os-why-grid">
              <div className="os-why-box">
                <strong style={{ color: "var(--status-success-fg)" }}>
                  Strong Alignment ({why.strong.length})
                </strong>
                <ul>
                  {why.strong.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="os-why-box">
                <strong style={{ color: "var(--status-warning-fg)" }}>
                  Eligibility & Verification Review ({why.review.length})
                </strong>
                <ul>
                  {why.review.length > 0 ? (
                    why.review.map((r, idx) => <li key={idx}>{r}</li>)
                  ) : (
                    <li>No blocking verification items flagged.</li>
                  )}
                </ul>
              </div>
              <div className="os-why-box">
                <strong style={{ color: "var(--status-danger-fg)" }}>
                  Gaps / Gate Constraints ({why.gap.length})
                </strong>
                <ul>
                  {why.gap.length > 0 ? (
                    why.gap.map((g, idx) => <li key={idx}>{g}</li>)
                  ) : (
                    <li>Zero disqualifying skill or regional gaps.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Explainable Score Breakdown */}
          <section className="os-drawer-section">
            <h3 className="os-drawer-section-title">
              <span>3. Explainable Score Breakdown</span>
              <span className="mono">Total: {opportunity.score_total}/100</span>
            </h3>
            <table className="os-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Points</th>
                  <th>Weight</th>
                  <th>Visual Share</th>
                </tr>
              </thead>
              <tbody>
                {scoreComponents.map((comp) => (
                  <tr key={comp.key}>
                    <td>{comp.label}</td>
                    <td className="mono">{comp.points}</td>
                    <td className="mono">/{comp.max_points}</td>
                    <td>
                      <div className="os-score-bar-track" style={{ width: "80px" }}>
                        <div
                          className="os-score-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.round((comp.points / comp.max_points) * 100))}%`,
                            backgroundColor: "var(--accent-primary)"
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 4. Deterministic vs. Inferred Evidence */}
          <section className="os-drawer-section">
            <h3 className="os-drawer-section-title">
              <span>4. Deterministic vs. Inferred Evidence</span>
            </h3>
            <div className="os-why-grid">
              <div className="os-why-box">
                <strong style={{ color: "var(--status-info-fg)" }}>
                  [DETERMINISTIC] Directly Inspected DOM / Official Facts
                </strong>
                <ul>
                  {detFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="os-why-box">
                <strong style={{ color: "var(--status-warning-fg)" }}>
                  [INFERRED] Commercial & Fit Assessment
                </strong>
                <ul>
                  {infFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 5. CRM Workflow, Follow-Up & Protected [USER] Notes */}
          <section className="os-drawer-section">
            <h3 className="os-drawer-section-title">
              <span>5. CRM Workflow & Protected [USER] State</span>
              <span className="os-badge info mono">Protected on Sync</span>
            </h3>
            <div className="os-crm-form-grid">
              <label className="os-field-label">
                <span>Workflow Status [USER]</span>
                <select
                  className="os-select"
                  value={wf.status}
                  onChange={(e) =>
                    onUpdateWorkflow(opportunity, { status: e.target.value as WorkflowStatus })
                  }
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>

              <label className="os-field-label">
                <span>Priority Level [USER]</span>
                <select
                  className="os-select"
                  value={wf.priority}
                  onChange={(e) =>
                    onUpdateWorkflow(opportunity, { priority: e.target.value as PriorityLevel })
                  }
                >
                  {PRIORITY_OPTIONS.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="os-field-label">
                <span>Follow-Up Date [USER]</span>
                <input
                  type="date"
                  className="os-input"
                  value={wf.follow_up_date || ""}
                  onChange={(e) =>
                    onUpdateWorkflow(opportunity, {
                      follow_up_date: e.target.value ? e.target.value : null
                    })
                  }
                />
              </label>

              <label className="os-field-label" style={{ justifyContent: "flex-end" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(wf.favorite)}
                    onChange={(e) => onUpdateWorkflow(opportunity, { favorite: e.target.checked })}
                  />
                  <span>Star / Save to CRM Queue</span>
                </span>
              </label>
            </div>

            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="drawer-crm-note" className="os-field-label">
                Personal CRM Notes [USER] (Never overwritten by daily research refresh)
              </label>
              <textarea
                id="drawer-crm-note"
                className="os-textarea"
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {wf.contacted_date ? `Contacted: ${wf.contacted_date} ` : ""}
                  {wf.applied_date ? `Applied: ${wf.applied_date}` : ""}
                </span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onUpdateWorkflow(opportunity, { personal_notes: notesDraft })}
                >
                  Save CRM Note
                </button>
              </div>
            </div>
          </section>

          {/* 6. Sources & Files / Drive Pack */}
          <section className="os-drawer-section">
            <h3 className="os-drawer-section-title">
              <span>6. Sources &amp; Files / Drive Pack</span>
              <span className="os-badge info mono">Google Workspace</span>
            </h3>
            <div className="os-drive-pack-grid">
              <div className="os-drive-pack-card">
                <span className="os-tabs-label">Source Tracker</span>
                <h4>
                  {opportunity.category === "masters_scholarships"
                    ? "master-spreadsheet.xlsx (Drive XLSX)"
                    : opportunity.category === "visa_jobs"
                      ? "MASTER_JOB_APPLICATION_TRACKER.xlsx"
                      : "MUSE | FACEBOOK & INSTAGRAM JOB HUNTER"}
                </h4>
                <span className="os-source-notes">
                  {opportunity.category === "masters_scholarships"
                    ? "Tabs: MASTER_PROGRAMMES, SCHOLARSHIPS"
                    : opportunity.category === "visa_jobs"
                      ? "Folder: Job Apply — Trackers"
                      : "Tab: ALL LEADS"}
                </span>
                <div style={{ marginTop: "auto", paddingTop: "6px" }}>
                  {opportunity.category === "masters_scholarships" ? (
                    <a
                      href="https://docs.google.com/spreadsheets/d/156pTG6IBQ00x6AP2BFm3sg-zy_iZ4PLj/edit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                    >
                      Open Master's Workbook ↗
                    </a>
                  ) : opportunity.category === "visa_jobs" ? (
                    <a
                      href="https://drive.google.com/file/d/1F8p-KNl8PLMfRIzRxZ0nFORRHOuF5qL1/view"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                    >
                      Open Master Tracker ↗
                    </a>
                  ) : (
                    <a
                      href="https://docs.google.com/spreadsheets/d/1-jsydfLBJibFJjy4dabDCOZpG7m_6bJxdxPYRWHJ1x0/edit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                    >
                      Open Social Hunter Sheet ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="os-drive-pack-card">
                <span className="os-tabs-label">Drive Application Pack</span>
                <h4>
                  {opportunity.category === "masters_scholarships"
                    ? "Master's Admissions Folder"
                    : wf.status === "Applied"
                      ? "Job Apply — Applied"
                      : wf.status === "Preparing" || wf.status === "Saved"
                        ? "Job Apply — Pending"
                        : "Job Apply (Root)"}
                </h4>
                <span className="os-source-notes">
                  {opportunity.category === "masters_scholarships"
                    ? "Admissions packs & scholarship statements"
                    : `Application workflow stage: ${wf.status}`}
                </span>
                <div style={{ marginTop: "auto", paddingTop: "6px" }}>
                  <a
                    href={
                      opportunity.category === "masters_scholarships"
                        ? "https://drive.google.com/drive/folders/1S_FYU8b1xeP6S098SkYaADWYIkH5a_Nf"
                        : wf.status === "Applied"
                          ? "https://drive.google.com/drive/folders/1eS96WrT6HQ8zqbSntUPgtnICYRNa-bUM"
                          : wf.status === "Preparing" || wf.status === "Saved"
                            ? "https://drive.google.com/drive/folders/1OMDTYRW4uQmz8P1cCTXFTSz0yrGmpc_l"
                            : "https://drive.google.com/drive/folders/1g0XUzrlsOr9ze6Peaw6SMhcDLDYZSuE0"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                  >
                    Open Drive Folder ↗
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Source Provenance & Research Metadata */}
          <section className="os-drawer-section">
            <h3 className="os-drawer-section-title">
              <span>7. Source Provenance & Research Metadata</span>
              <span className="mono">Verified: {opportunity.last_verified_at}</span>
            </h3>
            <ul style={{ margin: "0 0 10px", paddingLeft: "18px", fontSize: "12.5px" }}>
              {provenanceUrls.map((u, i) => (
                <li key={i}>
                  <a href={u} target="_blank" rel="noopener noreferrer">
                    {u}
                  </a>
                </li>
              ))}
            </ul>
            <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", margin: "10px 0 6px" }}>
              Activity & Audit Trail
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--text-secondary)" }}>
              {(opportunity.activity_history || []).map((ev, idx) => (
                <li key={idx}>
                  <span className="mono">{ev.at}</span> — {ev.label}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
};

import React from "react";
import { buildTodayPriorityQueue, bucketFollowUps, normalizeWorkflowStatus } from "../../engine/core";
import type { OpportunityRecord, FollowUpBucket } from "../../types/opportunity";

interface TodayPageProps {
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (opp: OpportunityRecord) => void;
}

const BUCKET_ORDER: FollowUpBucket[] = [
  "Overdue",
  "Due today",
  "Tomorrow",
  "This week",
  "Later"
];

export const TodayPage: React.FC<TodayPageProps> = ({
  opportunities,
  onSelectOpportunity
}) => {
  const queue = buildTodayPriorityQueue(opportunities, "2026-10-14");
  const buckets = bucketFollowUps(opportunities, "2026-10-14");

  const activeRecords = opportunities.filter((o) => o.is_active !== false);
  const savedCount = opportunities.filter((o) => o.workflow?.favorite || o.favorite).length;
  const dueSoonCount =
    buckets["Overdue"].length + buckets["Due today"].length + buckets["Tomorrow"].length;

  const scholarshipDeadlines = activeRecords
    .filter((o) => o.category === "masters_scholarships")
    .sort((a, b) => b.score_total - a.score_total);

  const highFitJobs = activeRecords
    .filter((o) => o.category === "visa_jobs")
    .sort((a, b) => b.score_total - a.score_total);

  const bestFreelance = activeRecords
    .filter((o) => o.category === "freelance_leads")
    .sort((a, b) => b.score_total - a.score_total);

  const strongRemote = activeRecords
    .filter((o) => o.category === "remote_jobs")
    .sort((a, b) => b.score_total - a.score_total);

  const newOpportunities = activeRecords
    .filter((o) => {
      const st = normalizeWorkflowStatus(o.workflow?.status || o.user_status || o.status);
      return st === "New" || st === "Reviewing";
    })
    .sort((a, b) => b.score_total - a.score_total);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">DAILY COMMAND CENTER · NICOSIA, CYPRUS</p>
          <h1 id="topbar-title">What should Sandeep work on today?</h1>
          <p className="subtext">
            Ranked by fit score, deadline urgency, eligibility confidence, workflow state, follow-up date, and verification freshness.
          </p>
        </div>
        <div className="metric-strip">
          <div className="metric-chip">
            <span className="metric-val mono">{activeRecords.length}</span>
            <span className="metric-lbl">Active Verified</span>
          </div>
          <div className="metric-chip">
            <span className="metric-val mono">{dueSoonCount}</span>
            <span className="metric-lbl">Follow-Ups Due / Tomorrow</span>
          </div>
          <div className="metric-chip">
            <span className="metric-val mono">{savedCount}</span>
            <span className="metric-lbl">Saved / Starred</span>
          </div>
          <div className="metric-chip">
            <span className="metric-val mono">{newOpportunities.length}</span>
            <span className="metric-lbl">New / Reviewing</span>
          </div>
        </div>
      </header>

      {/* Section 1: Best opportunities today */}
      <section className="panel-section">
        <div className="section-head-row">
          <h2>Best Opportunities Today (Top Ranked Queue)</h2>
          <span className="mono-small">Showing top 10 of {queue.length} active items</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Next Action</th>
                <th>Opportunity & Organization</th>
                <th>Pipeline</th>
                <th>Fit Score</th>
                <th>Queue Score</th>
                <th>Status</th>
                <th>Follow-Up</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 10).map((item) => (
                <tr
                  key={item.id}
                  className="opp-row"
                  onClick={() => onSelectOpportunity(item)}
                >
                  <td>
                    <span className="badge-action">{item.action_badge}</span>
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                    <div className="subtext">
                      {item.organization} · {item.location}
                    </div>
                  </td>
                  <td className="mono">{item.category}</td>
                  <td className="mono">
                    <strong>{item.score_total}/100</strong>
                  </td>
                  <td className="mono">{item.queue_priority_score}</td>
                  <td>
                    <span className="status-pill">
                      {item.workflow?.status || item.user_status || item.status}
                    </span>
                  </td>
                  <td className="mono">
                    {item.workflow?.follow_up_date || item.follow_up_date || "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOpportunity(item);
                      }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Follow-ups due */}
      <section className="panel-section">
        <div className="section-head-row">
          <h2>Follow-Ups Due & Scheduled Buckets</h2>
          <span className="mono-small">Reference Date: 2026-10-14</span>
        </div>
        <div className="buckets-grid">
          {BUCKET_ORDER.map((bucketName) => (
            <div key={bucketName} className="bucket-card">
              <h3>
                <span>{bucketName}</span>
                <span className="mono">({buckets[bucketName].length})</span>
              </h3>
              <ul>
                {buckets[bucketName].length === 0 ? (
                  <li className="empty-bucket-item">None scheduled</li>
                ) : (
                  buckets[bucketName].map((opp) => (
                    <li key={opp.id}>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => onSelectOpportunity(opp)}
                      >
                        <strong>{opp.organization}</strong> — {opp.title}{" "}
                        <span className="mono">
                          ({opp.workflow?.follow_up_date || opp.follow_up_date})
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Sections 3, 4, 5, 6: Pipeline Spotlight Grid */}
      <div className="today-quad-grid">
        {/* Section 3: Scholarship deadlines */}
        <section className="panel-section compact-panel">
          <div className="section-head-row">
            <h2>Scholarship Deadlines</h2>
            <span className="mono-small">{scholarshipDeadlines.length} active</span>
          </div>
          <ul className="compact-opp-list">
            {scholarshipDeadlines.slice(0, 4).map((opp) => (
              <li key={opp.id} onClick={() => onSelectOpportunity(opp)}>
                <div className="compact-opp-top">
                  <strong>{opp.organization}</strong>
                  <span className="mono score-inline">{opp.score_total}/100</span>
                </div>
                <div className="compact-opp-title">{opp.title}</div>
                <div className="compact-opp-meta mono">
                  Deadline: {opp.deadline || opp.details?.application_deadline || "Open"} ·{" "}
                  {opp.workflow?.status || opp.status}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 4: High-fit jobs */}
        <section className="panel-section compact-panel">
          <div className="section-head-row">
            <h2>High-Fit Jobs (Cyprus & Visa)</h2>
            <span className="mono-small">{highFitJobs.length} active</span>
          </div>
          <ul className="compact-opp-list">
            {highFitJobs.slice(0, 4).map((opp) => (
              <li key={opp.id} onClick={() => onSelectOpportunity(opp)}>
                <div className="compact-opp-top">
                  <strong>{opp.organization}</strong>
                  <span className="mono score-inline">{opp.score_total}/100</span>
                </div>
                <div className="compact-opp-title">{opp.title}</div>
                <div className="compact-opp-meta mono">
                  {opp.location} · {opp.workflow?.status || opp.status}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 5: Best freelance prospects */}
        <section className="panel-section compact-panel">
          <div className="section-head-row">
            <h2>Best Freelance Prospects</h2>
            <span className="mono-small">{bestFreelance.length} active</span>
          </div>
          <ul className="compact-opp-list">
            {bestFreelance.slice(0, 4).map((opp) => (
              <li key={opp.id} onClick={() => onSelectOpportunity(opp)}>
                <div className="compact-opp-top">
                  <strong>{opp.organization}</strong>
                  <span className="mono score-inline">{opp.score_total}/100</span>
                </div>
                <div className="compact-opp-title">{opp.title}</div>
                <div className="compact-opp-meta mono">
                  {opp.details?.project_band || opp.location} · {opp.workflow?.status || opp.status}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 6: Strong remote opportunities */}
        <section className="panel-section compact-panel">
          <div className="section-head-row">
            <h2>Strong Remote Opportunities</h2>
            <span className="mono-small">{strongRemote.length} active</span>
          </div>
          <ul className="compact-opp-list">
            {strongRemote.slice(0, 4).map((opp) => (
              <li key={opp.id} onClick={() => onSelectOpportunity(opp)}>
                <div className="compact-opp-top">
                  <strong>{opp.organization}</strong>
                  <span className="mono score-inline">{opp.score_total}/100</span>
                </div>
                <div className="compact-opp-title">{opp.title}</div>
                <div className="compact-opp-meta mono">
                  {opp.details?.compensation || opp.location} · {opp.workflow?.status || opp.status}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Section 7: New opportunities */}
      <section className="panel-section">
        <div className="section-head-row">
          <h2>New & Reviewing Opportunities</h2>
          <span className="mono-small">{newOpportunities.length} records awaiting triage</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Organization & Title</th>
                <th>Category</th>
                <th>Location</th>
                <th>Score</th>
                <th>Status</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {newOpportunities.map((opp) => (
                <tr key={opp.id} className="opp-row" onClick={() => onSelectOpportunity(opp)}>
                  <td className="mono">{opp.id}</td>
                  <td>
                    <strong>{opp.organization}</strong> — {opp.title}
                  </td>
                  <td className="mono">{opp.category}</td>
                  <td>{opp.location}</td>
                  <td className="mono">
                    <strong>{opp.score_total}/100</strong>
                  </td>
                  <td>
                    <span className="status-pill">{opp.workflow?.status || opp.status}</span>
                  </td>
                  <td className="mono">{String(opp.last_verified_at).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

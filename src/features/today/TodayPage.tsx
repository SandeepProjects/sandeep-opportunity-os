import React from "react";
import { buildTodayPriorityQueue, bucketFollowUps } from "../../engine/core";
import type { OpportunityRecord } from "../../types/opportunity";
import type { AppRoutePath } from "../../app/router/router";
import { PageHeader } from "../../components/ui/PageHeader";
import { MetricStrip } from "../../components/ui/Metric";
import { SectionPanel } from "../../components/ui/SectionPanel";
import { Score } from "../../components/ui/Score";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EligibilityBadge } from "../../components/ui/EligibilityBadge";
import { PriorityBadge } from "../../components/ui/PriorityBadge";
import { formatLongDate, getGreeting, getLocalIsoDate } from "../../lib/date";

interface TodayPageProps {
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (opp: OpportunityRecord) => void;
  onNavigate?: (path: AppRoutePath) => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  opportunities,
  onSelectOpportunity,
  onNavigate
}) => {
  const todayIso = getLocalIsoDate();
  const queue = buildTodayPriorityQueue(opportunities, todayIso);
  const buckets = bucketFollowUps(opportunities, todayIso);

  const activeRecords = opportunities.filter((o) => o.is_active !== false);
  const highFitCount = activeRecords.filter((o) => o.score_total >= 85).length;
  const dueFollowUps = buckets["Overdue"].length + buckets["Due today"].length + buckets["Tomorrow"].length;
  const gatedCount = opportunities.filter((o) => o.is_active === false).length;
  const savedActiveCount = opportunities.filter(
    (o) =>
      o.workflow?.favorite ||
      o.favorite ||
      ["Saved", "Preparing", "Contacted", "Applied", "Interviewing"].includes(
        o.workflow?.status || o.user_status
      )
  ).length;

  const topFreelance = activeRecords
    .filter((o) => o.category === "freelance_leads")
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, 4);

  const topJobs = activeRecords
    .filter((o) => o.category === "visa_jobs")
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, 4);

  const topScholarships = activeRecords
    .filter((o) => o.category === "masters_scholarships")
    .sort((a, b) => String(a.deadline || "9999").localeCompare(String(b.deadline || "9999")))
    .slice(0, 4);

  const topRemote = activeRecords
    .filter((o) => o.category === "remote_jobs")
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="EXECUTIVE COMMAND CENTER · NICOSIA, CYPRUS (EEST)"
        title={`${getGreeting()}, Sandeep · ${formatLongDate(todayIso)}`}
        subtitle={`Ranked daily action queue across ${opportunities.length} verified opportunities (${activeRecords.length} active matches, ${gatedCount} excluded by hard eligibility gates).`}
      />

      <MetricStrip
        items={[
          { label: "Active Verified Matches", value: activeRecords.length, delta: "Across 4 core pipelines", tone: "info" },
          { label: "High-Fit (85+ Score)", value: highFitCount, delta: "Immediate action tier", tone: "success" },
          { label: "Follow-Ups (Now / 24h)", value: dueFollowUps, delta: `${buckets["Overdue"].length} overdue · ${buckets["Due today"].length} today`, tone: dueFollowUps > 0 ? "warning" : "default" },
          { label: "Active CRM Pipeline", value: savedActiveCount, delta: "Saved, Preparing, Contacted & Applied" },
          { label: "Gated / Excluded", value: gatedCount, delta: "Excluded from the active queue by hard gates", tone: "danger" }
        ]}
      />

      <SectionPanel
        title="Priority Action Queue"
        subtitle="Dynamically ranked by explainable fit score, deadline urgency, eligibility confidence, and CRM follow-up status"
        rightSlot={
          <span className="os-badge info mono">Showing Top 10 of {queue.length} Active</span>
        }
      >
        <div className="os-table-wrap responsive-switch">
          <table className="os-table">
            <thead>
              <tr>
                <th>Next Action</th>
                <th>Opportunity & Organization</th>
                <th>Pipeline</th>
                <th>Eligibility</th>
                <th>Fit Score</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Follow-Up / Deadline</th>
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 10).map((item) => {
                const st = item.workflow?.status || item.user_status || "New";
                const pr = item.workflow?.priority || item.priority || "P1";
                const fu = item.workflow?.follow_up_date || item.follow_up_date;
                return (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Inspect ${item.title} at ${item.organization}`}
                    onClick={() => onSelectOpportunity(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectOpportunity(item);
                      }
                    }}
                  >
                    <td>
                      <span className="os-badge info mono">{item.action_badge}</span>
                    </td>
                    <td>
                      <div className="os-cell-primary">{item.title}</div>
                      <div className="os-cell-secondary">
                        {item.id} · {item.organization} · {item.location}
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: "11.5px" }}>
                      {item.category}
                    </td>
                    <td>
                      <EligibilityBadge opportunity={item} />
                    </td>
                    <td>
                      <Score score={item.score_total} />
                    </td>
                    <td>
                      <PriorityBadge priority={pr} />
                    </td>
                    <td>
                      <StatusBadge status={st} />
                    </td>
                    <td className="mono" style={{ fontSize: "12px" }}>
                      {fu ? `Follow-up: ${fu}` : item.deadline ? `Due: ${item.deadline}` : "Rolling"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="os-mobile-card-list">
            {queue.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="os-mobile-card"
                role="button"
                tabIndex={0}
                onClick={() => onSelectOpportunity(item)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="os-badge info mono">{item.action_badge}</span>
                  <Score score={item.score_total} />
                </div>
                <div className="os-cell-primary">{item.title}</div>
                <div className="os-cell-secondary">
                  {item.organization} · {item.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionPanel>

      <div className="os-grid-2">
        <SectionPanel
          title="Best Freelance Prospects (Cyprus & UK)"
          subtitle="High-ticket web redesign & booking portal leads with deterministic DOM audit findings"
          rightSlot={
            onNavigate && (
              <button type="button" className="btn-ghost" onClick={() => onNavigate("/freelance")}>
                View All →
              </button>
            )
          }
        >
          <ul className="os-compact-list">
            {topFreelance.map((lead) => (
              <li
                key={lead.id}
                className="os-compact-item"
                onClick={() => onSelectOpportunity(lead)}
              >
                <div>
                  <div className="os-cell-primary">{lead.organization}</div>
                  <div className="os-cell-secondary">
                    {lead.details?.project_band || lead.title} ·{" "}
                    {(lead.deterministic_findings || []).length} deterministic DOM findings
                  </div>
                </div>
                <Score score={lead.score_total} showBar={false} />
              </li>
            ))}
          </ul>
        </SectionPanel>

        <SectionPanel
          title="High-Fit Cyprus & Visa Jobs"
          subtitle="Junior / Graduate & Mid-Level frontend/full-stack roles matching React, TS & WordPress"
          rightSlot={
            onNavigate && (
              <button type="button" className="btn-ghost" onClick={() => onNavigate("/jobs")}>
                View All →
              </button>
            )
          }
        >
          <ul className="os-compact-list">
            {topJobs.map((job) => (
              <li
                key={job.id}
                className="os-compact-item"
                onClick={() => onSelectOpportunity(job)}
              >
                <div>
                  <div className="os-cell-primary">{job.title}</div>
                  <div className="os-cell-secondary">
                    {job.organization} · {job.location}
                  </div>
                </div>
                <Score score={job.score_total} showBar={false} />
              </li>
            ))}
          </ul>
        </SectionPanel>

        <SectionPanel
          title="Scholarship Deadlines & MSc Intakes"
          subtitle="Sorted by upcoming application deadline; unverified fee status remains UNKNOWN"
          rightSlot={
            onNavigate && (
              <button type="button" className="btn-ghost" onClick={() => onNavigate("/masters")}>
                View All →
              </button>
            )
          }
        >
          <ul className="os-compact-list">
            {topScholarships.map((ms) => (
              <li
                key={ms.id}
                className="os-compact-item"
                onClick={() => onSelectOpportunity(ms)}
              >
                <div>
                  <div className="os-cell-primary">{ms.title}</div>
                  <div className="os-cell-secondary">
                    {ms.organization} · Deadline: <span className="mono">{ms.deadline || "Rolling"}</span>
                  </div>
                </div>
                <EligibilityBadge opportunity={ms} />
              </li>
            ))}
          </ul>
        </SectionPanel>

        <SectionPanel
          title="Strong Remote Opportunities (Cyprus / EMEA)"
          subtitle="Verified remote engineering roles compatible with Cyprus (UTC+2/UTC+3) timezone"
          rightSlot={
            onNavigate && (
              <button type="button" className="btn-ghost" onClick={() => onNavigate("/remote")}>
                View All →
              </button>
            )
          }
        >
          <ul className="os-compact-list">
            {topRemote.map((rm) => (
              <li
                key={rm.id}
                className="os-compact-item"
                onClick={() => onSelectOpportunity(rm)}
              >
                <div>
                  <div className="os-cell-primary">{rm.title}</div>
                  <div className="os-cell-secondary">
                    {rm.organization} · {rm.location}
                  </div>
                </div>
                <Score score={rm.score_total} showBar={false} />
              </li>
            ))}
          </ul>
        </SectionPanel>
      </div>
    </>
  );
};

import React, { useState, useMemo } from "react";
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
import { getNextScheduledSync } from "../../config/dataSources";
import { formatRelativeTime } from "../../pipeline/syncService";
import { resolveOpportunityProvenance } from "../../engine/provenance";
import { getAgentById } from "../../config/agentRegistry";
import { formatCategoryName, decodeHtmlEntities } from "../../lib/formatters";

interface TodayPageProps {
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (opp: OpportunityRecord) => void;
  onNavigate?: (path: AppRoutePath) => void;
  lastSyncedAt?: string;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

type TodayQueueTab = "top" | "new" | "followups" | "applications" | "deadlines";

export const TodayPage: React.FC<TodayPageProps> = ({
  opportunities,
  onSelectOpportunity,
  onNavigate,
  lastSyncedAt
}) => {
  const todayIso = getLocalIsoDate();
  const queue = useMemo(() => buildTodayPriorityQueue(opportunities, todayIso), [opportunities, todayIso]);
  const buckets = useMemo(() => bucketFollowUps(opportunities, todayIso), [opportunities, todayIso]);
  const nextSync = getNextScheduledSync();

  const [activeTab, setActiveTab] = useState<TodayQueueTab>("top");

  const activeRecords = useMemo(() => opportunities.filter((o) => o.is_active !== false), [opportunities]);
  const highFitCount = useMemo(() => activeRecords.filter((o) => o.score_total >= 85).length, [activeRecords]);
  const dueFollowUps =
    buckets["Overdue"].length + buckets["Due today"].length + buckets["Tomorrow"].length;
  const gatedCount = useMemo(() => opportunities.filter((o) => o.is_active === false).length, [opportunities]);
  const savedActiveCount = useMemo(
    () =>
      opportunities.filter(
        (o) =>
          o.workflow?.favorite ||
          o.favorite ||
          ["Saved", "Preparing", "Contacted", "Applied", "Interviewing"].includes(
            o.workflow?.status || o.user_status
          )
      ).length,
    [opportunities]
  );

  // Spotlight: Top 4 highest priority immediate actions
  const spotlightItems = useMemo(() => queue.slice(0, 4), [queue]);

  // Filtered queue rows based on active view tab
  const tabFilteredQueue = useMemo(() => {
    switch (activeTab) {
      case "new":
        return queue.filter((item) => (item.workflow?.status || item.user_status || "New") === "New");
      case "followups":
        return queue.filter(
          (item) =>
            item.follow_up_bucket === "Overdue" ||
            item.follow_up_bucket === "Due today" ||
            item.follow_up_bucket === "Tomorrow"
        );
      case "applications":
        return queue.filter((item) =>
          ["Preparing", "Contacted", "Applied", "Interviewing"].includes(
            item.workflow?.status || item.user_status || ""
          )
        );
      case "deadlines":
        return queue.filter((item) => Boolean(item.deadline));
      case "top":
      default:
        return queue.slice(0, 20);
    }
  }, [queue, activeTab]);

  const topFreelance = useMemo(
    () =>
      activeRecords
        .filter((o) => o.category === "freelance_leads")
        .sort((a, b) => b.score_total - a.score_total)
        .slice(0, 4),
    [activeRecords]
  );

  const topJobs = useMemo(
    () =>
      activeRecords
        .filter((o) => o.category === "visa_jobs")
        .sort((a, b) => b.score_total - a.score_total)
        .slice(0, 4),
    [activeRecords]
  );

  const topScholarships = useMemo(
    () =>
      activeRecords
        .filter((o) => o.category === "masters_scholarships")
        .sort((a, b) => String(a.deadline || "9999").localeCompare(String(b.deadline || "9999")))
        .slice(0, 4),
    [activeRecords]
  );

  const topRemote = useMemo(
    () =>
      activeRecords
        .filter((o) => o.category === "remote_jobs")
        .sort((a, b) => b.score_total - a.score_total)
        .slice(0, 4),
    [activeRecords]
  );

  return (
    <>
      <PageHeader
        eyebrow="EXECUTIVE COMMAND CENTER · NICOSIA, CYPRUS (EEST)"
        title={`${getGreeting()}, Sandeep · ${formatLongDate(todayIso)}`}
        subtitle={`Ranked daily action queue across ${opportunities.length} verified opportunities (${activeRecords.length} active matches, ${gatedCount} excluded by hard eligibility gates).`}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              className="os-badge neutral mono"
              title={`Last synced: ${lastSyncedAt || "Seed Snapshot"} · Next automatic sync: ${nextSync.formattedUtc}`}
            >
              🔄 Synced {formatRelativeTime(lastSyncedAt)} · Next scheduled {nextSync.formattedUtc}
            </span>
          </div>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Active Verified Matches",
            value: activeRecords.length,
            delta: "Across 4 core research pipelines",
            tone: "default"
          },
          {
            label: "High-Fit (85+ Score)",
            value: highFitCount,
            delta: "Immediate action tier",
            tone: "success"
          },
          {
            label: "Follow-Ups (Now / 24h)",
            value: dueFollowUps,
            delta: `${buckets["Overdue"].length} overdue · ${buckets["Due today"].length} today`,
            tone: dueFollowUps > 0 ? "warning" : "default"
          },
          {
            label: "Active CRM Pipeline",
            value: savedActiveCount,
            delta: "Saved, Preparing, Contacted & Applied",
            tone: "info"
          },
          {
            label: "Gated / Excluded",
            value: gatedCount,
            delta: "Seniority & regional boundary locks",
            tone: "danger"
          }
        ]}
      />

      {/* 1. Immediate Priority Spotlight (Top 4 Ranked Action Cards) */}
      <SectionPanel
        title="Immediate Priority Spotlight"
        subtitle="Top-ranked opportunities requiring today's attention based on fit score, approaching deadlines, and CRM workflow state"
        rightSlot={
          <span className="os-badge info mono">Top {spotlightItems.length} Spotlighted</span>
        }
      >
        <div className="os-spotlight-grid">
          {spotlightItems.map((item, idx) => {
            const rank = idx + 1;
            const prov = resolveOpportunityProvenance(item);
            const primaryProv = prov[0];
            const agent = primaryProv ? getAgentById(primaryProv.agentId) : undefined;
            const wf = item.workflow || {};
            const status = wf.status || item.user_status || "New";

            return (
              <div
                key={item.id}
                className="os-spotlight-card"
                tabIndex={0}
                role="button"
                aria-label={`Inspect ${item.title} at ${item.organization} (Rank #${rank})`}
                onClick={() => onSelectOpportunity(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectOpportunity(item);
                  }
                }}
              >
                <div className="os-spotlight-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="os-spotlight-rank" aria-label={`Rank ${rank}`}>
                      #{rank}
                    </span>
                    <span
                      className={`os-badge ${
                        item.action_badge === "Follow Up"
                          ? "warning"
                          : item.action_badge === "Contact Lead" || item.action_badge === "Complete Application"
                          ? "info"
                          : "neutral"
                      } mono`}
                      style={{ fontSize: "11px", fontWeight: 700 }}
                    >
                      {item.action_badge}
                    </span>
                  </div>
                  <Score score={item.score_total} size="sm" />
                </div>

                <div>
                  <h4 className="os-spotlight-title">{decodeHtmlEntities(item.title)}</h4>
                  <p className="os-spotlight-meta">
                    <strong>{decodeHtmlEntities(item.organization)}</strong> · {decodeHtmlEntities(item.location)}
                  </p>
                </div>

                <div className="os-spotlight-reason">
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Context:</span>{" "}
                  {decodeHtmlEntities(item.action_reason) || `${item.score_total} fit · Top recommendation`}
                </div>

                <div className="os-spotlight-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      className="os-badge mono"
                      style={{
                        backgroundColor: agent?.accentBg || "var(--bg-elevated)",
                        color: agent?.themeColor || "var(--text-secondary)",
                        border: `1px solid ${agent?.themeColor || "var(--border-default)"}33`,
                        fontSize: "10.5px"
                      }}
                    >
                      {agent?.name || "Bago Muse"}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                      {formatCategoryName(item.category)}
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionPanel>

      {/* 2. Priority Action Queue Table & Saved View Tabs */}
      <SectionPanel
        title="Priority Action Queue"
        subtitle="Ranked queue across all active opportunities with explainable fit scores, deadline urgency, and verified evidence"
        rightSlot={
          <span className="os-badge neutral mono">
            Showing {tabFilteredQueue.length} of {queue.length} Active
          </span>
        }
      >
        <div className="os-queue-toolbar">
          <div className="os-saved-views" role="tablist" aria-label="Action queue views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "top"}
              className={`os-view-tab ${activeTab === "top" ? "active" : ""}`}
              onClick={() => setActiveTab("top")}
            >
              Top Actions ({Math.min(20, queue.length)})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "new"}
              className={`os-view-tab ${activeTab === "new" ? "active" : ""}`}
              onClick={() => setActiveTab("new")}
            >
              New Leads ({queue.filter((o) => (o.workflow?.status || o.user_status || "New") === "New").length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "followups"}
              className={`os-view-tab ${activeTab === "followups" ? "active" : ""}`}
              onClick={() => setActiveTab("followups")}
            >
              Follow-ups Due ({dueFollowUps})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "applications"}
              className={`os-view-tab ${activeTab === "applications" ? "active" : ""}`}
              onClick={() => setActiveTab("applications")}
            >
              Active Applications ({savedActiveCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "deadlines"}
              className={`os-view-tab ${activeTab === "deadlines" ? "active" : ""}`}
              onClick={() => setActiveTab("deadlines")}
            >
              Deadlines ({queue.filter((o) => Boolean(o.deadline)).length})
            </button>
          </div>
        </div>

        <div className="os-table-wrap responsive-switch">
          <table className="os-table" aria-label="Today priority action queue">
            <thead>
              <tr>
                <th className="col-rank">#</th>
                <th className="col-action">Next Action</th>
                <th className="col-title">Opportunity &amp; Organization</th>
                <th className="col-pipeline">Pipeline</th>
                <th className="col-agent">Agent</th>
                <th className="col-score">Fit Score</th>
                <th className="col-eligibility">Eligibility</th>
                <th className="col-priority">Priority</th>
                <th className="col-status">Status</th>
                <th className="col-date">Follow-Up / Due</th>
              </tr>
            </thead>
            <tbody>
              {tabFilteredQueue.map((item, idx) => {
                const rank = idx + 1;
                const st = item.workflow?.status || item.user_status || "New";
                const pr = item.workflow?.priority || item.priority || "P1";
                const fu = item.workflow?.follow_up_date || item.follow_up_date;
                const prov = resolveOpportunityProvenance(item);
                const primaryProv = prov[0];
                const agent = primaryProv ? getAgentById(primaryProv.agentId) : undefined;

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
                    <td className="col-rank mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {rank}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span
                          className={`os-badge ${
                            item.action_badge === "Follow Up"
                              ? "warning"
                              : item.action_badge === "Contact Lead" || item.action_badge === "Complete Application"
                              ? "info"
                              : "neutral"
                          } mono`}
                          style={{ fontSize: "11px" }}
                        >
                          {item.action_badge}
                        </span>
                        {item.action_reason && (
                          <span
                            style={{
                              fontSize: "10.5px",
                              color: "var(--text-muted)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "140px"
                            }}
                            title={item.action_reason}
                          >
                            {item.action_reason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="os-cell-primary">{decodeHtmlEntities(item.title)}</div>
                      <div className="os-cell-secondary">
                        <strong style={{ color: "var(--text-primary)" }}>{decodeHtmlEntities(item.organization)}</strong> · {decodeHtmlEntities(item.location)}
                      </div>
                    </td>
                    <td>
                      <span className="os-badge neutral" style={{ fontSize: "11px" }}>
                        {formatCategoryName(item.category)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="os-badge mono"
                        style={{
                          backgroundColor: agent?.accentBg || "var(--bg-elevated)",
                          color: agent?.themeColor || "var(--text-secondary)",
                          border: `1px solid ${agent?.themeColor || "var(--border-default)"}33`,
                          fontSize: "11px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {agent?.name || "Bago Muse"}
                      </span>
                    </td>
                    <td>
                      <Score score={item.score_total} size="sm" />
                    </td>
                    <td>
                      <EligibilityBadge opportunity={item} />
                    </td>
                    <td>
                      <PriorityBadge priority={pr} />
                    </td>
                    <td>
                      <StatusBadge status={st} />
                    </td>
                    <td className="mono" style={{ fontSize: "11.5px" }}>
                      {fu ? (
                        <span style={{ color: item.follow_up_bucket === "Overdue" ? "var(--status-danger-fg)" : "inherit" }}>
                          {fu}
                        </span>
                      ) : item.deadline ? (
                        <span>Due {item.deadline}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Rolling</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile responsive card list for screens <= 768px */}
          <div className="os-mobile-card-list">
            {tabFilteredQueue.slice(0, 10).map((item, idx) => (
              <div
                key={item.id}
                className="os-mobile-card"
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${item.title}`}
                onClick={() => onSelectOpportunity(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectOpportunity(item);
                  }
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      #{idx + 1}
                    </span>
                    <span className="os-badge info mono">{item.action_badge}</span>
                  </div>
                  <Score score={item.score_total} size="sm" />
                </div>
                <div className="os-cell-primary">{decodeHtmlEntities(item.title)}</div>
                <div className="os-cell-secondary">
                  <strong>{decodeHtmlEntities(item.organization)}</strong> · {decodeHtmlEntities(item.location)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                  <span className="os-badge neutral" style={{ fontSize: "10.5px" }}>
                    {formatCategoryName(item.category)}
                  </span>
                  <StatusBadge status={item.workflow?.status || item.user_status || "New"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionPanel>

      {/* 3. Domain Pipeline Spotlights */}
      <div className="os-grid-2">
        <SectionPanel
          title="Best Freelance Prospects (Cyprus & UK)"
          subtitle="High-ticket web redesign & booking portal leads with deterministic DOM audit findings"
          rightSlot={
            onNavigate && (
              <button type="button" className="btn-ghost" onClick={() => onNavigate("/freelance")}>
                View All Freelance →
              </button>
            )
          }
        >
          <ul className="os-compact-list">
            {topFreelance.map((lead) => (
              <li
                key={lead.id}
                className="os-compact-item"
                tabIndex={0}
                role="button"
                onClick={() => onSelectOpportunity(lead)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectOpportunity(lead);
                  }
                }}
              >
                <div>
                  <div className="os-cell-primary">{lead.organization}</div>
                  <div className="os-cell-secondary">
                    {lead.details?.project_band || lead.title} ·{" "}
                    {(lead.deterministic_findings || []).length} DOM findings
                  </div>
                </div>
                <Score score={lead.score_total} size="sm" showBar={false} />
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
                View All Jobs →
              </button>
            )
          }
        >
          <ul className="os-compact-list">
            {topJobs.map((job) => (
              <li
                key={job.id}
                className="os-compact-item"
                tabIndex={0}
                role="button"
                onClick={() => onSelectOpportunity(job)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectOpportunity(job);
                  }
                }}
              >
                <div>
                  <div className="os-cell-primary">{job.title}</div>
                  <div className="os-cell-secondary">
                    <strong>{job.organization}</strong> · {job.location}
                  </div>
                </div>
                <Score score={job.score_total} size="sm" showBar={false} />
              </li>
            ))}
          </ul>
        </SectionPanel>

        <SectionPanel
          title="Scholarship Deadlines & MSc Intakes"
          subtitle="Sorted by upcoming application deadline; unverified fee status remains unassumed"
          rightSlot={
            onNavigate && (
              <button type="button" className="btn-ghost" onClick={() => onNavigate("/masters")}>
                View All Master’s →
              </button>
            )
          }
        >
          <ul className="os-compact-list">
            {topScholarships.map((ms) => (
              <li
                key={ms.id}
                className="os-compact-item"
                tabIndex={0}
                role="button"
                onClick={() => onSelectOpportunity(ms)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectOpportunity(ms);
                  }
                }}
              >
                <div>
                  <div className="os-cell-primary">{ms.title}</div>
                  <div className="os-cell-secondary">
                    <strong>{ms.organization}</strong> · Deadline: <span className="mono">{ms.deadline || "Rolling"}</span>
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
                View All Remote →
              </button>
            )
          }
        >
          <ul className="os-compact-list">
            {topRemote.map((rm) => (
              <li
                key={rm.id}
                className="os-compact-item"
                tabIndex={0}
                role="button"
                onClick={() => onSelectOpportunity(rm)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectOpportunity(rm);
                  }
                }}
              >
                <div>
                  <div className="os-cell-primary">{rm.title}</div>
                  <div className="os-cell-secondary">
                    <strong>{rm.organization}</strong> · {rm.location}
                  </div>
                </div>
                <Score score={rm.score_total} size="sm" showBar={false} />
              </li>
            ))}
          </ul>
        </SectionPanel>
      </div>
    </>
  );
};

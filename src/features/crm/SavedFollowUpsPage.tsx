import React, { useMemo, useState } from "react";
import { bucketFollowUps, classifyFollowUpBucket } from "../../engine/core";
import type { OpportunityRecord } from "../../types/opportunity";
import { PageHeader } from "../../components/ui/PageHeader";
import { MetricStrip } from "../../components/ui/Metric";
import { SectionPanel } from "../../components/ui/SectionPanel";
import { Score } from "../../components/ui/Score";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { PriorityBadge } from "../../components/ui/PriorityBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { getLocalIsoDate } from "../../lib/date";

interface SavedPageProps {
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (opp: OpportunityRecord) => void;
}

const PRIORITY_RANK: Record<string, number> = {
  P0: 1,
  High: 1,
  P1: 2,
  Medium: 2,
  P2: 3,
  Low: 3
};

export const SavedFollowUpsPage: React.FC<SavedPageProps> = ({ opportunities, onSelectOpportunity }) => {
  const [stageTab, setStageTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("followup");
  const todayIso = getLocalIsoDate();

  const crmRecords = useMemo(
    () =>
      opportunities.filter((o) => {
        const status = o.workflow?.status || o.user_status;
        return (
          o.workflow?.favorite ||
          o.favorite ||
          ["Saved", "Preparing", "Contacted", "Applied", "Interviewing", "Follow-Up"].includes(status) ||
          Boolean(o.workflow?.follow_up_date || o.follow_up_date)
        );
      }),
    [opportunities]
  );

  const buckets = useMemo(() => bucketFollowUps(crmRecords, todayIso), [crmRecords, todayIso]);

  const visibleRecords = useMemo(() => {
    const staged =
      stageTab === "ALL"
        ? crmRecords
        : stageTab === "DUE"
        ? [...buckets["Overdue"], ...buckets["Due today"], ...buckets["Tomorrow"]]
        : crmRecords.filter((o) => (o.workflow?.status || o.user_status) === stageTab);

    const query = searchQuery.trim().toLowerCase();
    return staged
      .filter((o) =>
        !query ||
        o.title.toLowerCase().includes(query) ||
        o.organization.toLowerCase().includes(query) ||
        o.location.toLowerCase().includes(query) ||
        o.id.toLowerCase().includes(query) ||
        (o.workflow?.personal_notes || o.personal_notes || "").toLowerCase().includes(query)
      )
      .sort((a, b) => {
        if (sortBy === "score") return b.score_total - a.score_total;
        if (sortBy === "priority") {
          const aRank = PRIORITY_RANK[a.workflow?.priority || a.priority || "P1"] || 9;
          const bRank = PRIORITY_RANK[b.workflow?.priority || b.priority || "P1"] || 9;
          return aRank - bRank || b.score_total - a.score_total;
        }
        if (sortBy === "status") {
          return (a.workflow?.status || a.user_status).localeCompare(b.workflow?.status || b.user_status);
        }
        const aDate = a.workflow?.follow_up_date || a.follow_up_date || "9999-12-31";
        const bDate = b.workflow?.follow_up_date || b.follow_up_date || "9999-12-31";
        return aDate.localeCompare(bDate) || b.score_total - a.score_total;
      });
  }, [crmRecords, buckets, stageTab, searchQuery, sortBy]);

  const preparingCount = crmRecords.filter((o) => ["Saved", "Preparing"].includes(o.workflow?.status || o.user_status)).length;
  const appliedCount = crmRecords.filter((o) => (o.workflow?.status || o.user_status) === "Applied").length;
  const awaitingResponseCount = crmRecords.filter((o) => ["Contacted", "Applied", "Interviewing", "Follow-Up"].includes(o.workflow?.status || o.user_status)).length;
  const dueCount = buckets["Overdue"].length + buckets["Due today"].length;

  const resetFilters = (): void => {
    setStageTab("ALL");
    setSearchQuery("");
    setSortBy("followup");
  };

  return (
    <>
      <PageHeader
        eyebrow="PERSONAL CRM & FOLLOW-UP WORKSPACE"
        title="Saved Opportunities, Outreach & Follow-Up Schedule"
        subtitle="User-owned status, priority, follow-up dates, favorites and notes stay protected during research refreshes. Search, sort and stage views operate on the real CRM state."
      />

      <MetricStrip
        items={[
          { label: "CRM Pipeline", value: crmRecords.length, delta: "Saved or actioned records", tone: "info" },
          { label: "Due / Overdue", value: dueCount, delta: `${buckets["Tomorrow"].length} due tomorrow`, tone: dueCount > 0 ? "warning" : "default" },
          { label: "Applied", value: appliedCount, delta: "Applications submitted", tone: "success" },
          { label: "Awaiting Response", value: awaitingResponseCount, delta: "Contacted, applied, interviewing or follow-up" },
          { label: "Preparing / Saved", value: preparingCount, delta: "Ready for outreach or tailoring" }
        ]}
      />

      <div className="os-filter-bar">
        <div className="os-saved-views" role="tablist" aria-label="CRM stage filter">
          {[
            { id: "ALL", label: `All CRM (${crmRecords.length})` },
            { id: "DUE", label: `Due / Tomorrow (${dueCount + buckets["Tomorrow"].length})` },
            { id: "Preparing", label: "Preparing" },
            { id: "Contacted", label: "Contacted" },
            { id: "Applied", label: "Applied" },
            { id: "Saved", label: "Saved" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={stageTab === tab.id}
              className={`os-view-tab ${stageTab === tab.id ? "active" : ""}`}
              onClick={() => setStageTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="os-filter-controls">
          <input
            type="search"
            className="os-input os-crm-search"
            placeholder="Search CRM or notes..."
            aria-label="Search saved CRM records"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="os-select" aria-label="Sort CRM records" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="followup">Sort: Follow-up</option>
            <option value="priority">Sort: Priority</option>
            <option value="score">Sort: Fit score</option>
            <option value="status">Sort: Status</option>
          </select>
          <button type="button" className="btn-ghost" onClick={resetFilters}>Reset</button>
        </div>
      </div>

      <SectionPanel
        title={`CRM Records (${visibleRecords.length})`}
        subtitle="Click a row or card to update status, schedule follow-ups, edit notes, or inspect full evidence"
      >
        {visibleRecords.length === 0 ? (
          <EmptyState
            title="No CRM records match this view"
            description="Adjust the stage, search query, or sorting controls to return to your saved opportunities."
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="os-table-wrap responsive-switch">
            <table className="os-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Opportunity & Organization</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Follow-Up Bucket</th>
                  <th>Follow-Up Date</th>
                  <th>Note Preview</th>
                  <th>Fit Score</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((opp) => {
                  const workflow = opp.workflow || {
                    status: opp.user_status,
                    priority: opp.priority,
                    follow_up_date: opp.follow_up_date,
                    personal_notes: opp.personal_notes
                  };
                  const bucket = classifyFollowUpBucket(workflow.follow_up_date, todayIso);
                  return (
                    <tr
                      key={opp.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Inspect CRM record ${opp.title} at ${opp.organization}`}
                      onClick={() => onSelectOpportunity(opp)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectOpportunity(opp);
                        }
                      }}
                    >
                      <td className="mono">{opp.id}</td>
                      <td>
                        <div className="os-cell-primary">{opp.title}</div>
                        <div className="os-cell-secondary">{opp.organization} · {opp.location}</div>
                      </td>
                      <td><StatusBadge status={workflow.status} /></td>
                      <td><PriorityBadge priority={workflow.priority} /></td>
                      <td>
                        <span className={`os-badge ${bucket === "Overdue" ? "danger" : bucket === "Due today" || bucket === "Tomorrow" ? "warning" : "neutral"}`}>
                          {bucket}
                        </span>
                      </td>
                      <td className="mono">{workflow.follow_up_date || "—"}</td>
                      <td className="os-note-preview">{workflow.personal_notes || "Click to add outreach or application note..."}</td>
                      <td><Score score={opp.score_total} showBar={false} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="os-mobile-card-list">
              {visibleRecords.map((opp) => {
                const workflow = opp.workflow;
                const bucket = classifyFollowUpBucket(workflow?.follow_up_date || opp.follow_up_date, todayIso);
                return (
                  <div
                    key={opp.id}
                    className="os-mobile-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectOpportunity(opp)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectOpportunity(opp);
                      }
                    }}
                  >
                    <div className="os-mobile-card-head">
                      <span className="mono os-muted-text">{opp.id}</span>
                      <Score score={opp.score_total} />
                    </div>
                    <div>
                      <div className="os-cell-primary">{opp.title}</div>
                      <div className="os-cell-secondary">{opp.organization} · {opp.location}</div>
                    </div>
                    <div className="os-mobile-badges">
                      <StatusBadge status={workflow?.status || opp.user_status} />
                      <PriorityBadge priority={workflow?.priority || opp.priority} />
                      <span className={`os-badge ${bucket === "Overdue" ? "danger" : bucket === "Due today" || bucket === "Tomorrow" ? "warning" : "neutral"}`}>{bucket}</span>
                    </div>
                    {(workflow?.personal_notes || opp.personal_notes) && <p className="os-mobile-note">{workflow?.personal_notes || opp.personal_notes}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SectionPanel>
    </>
  );
};

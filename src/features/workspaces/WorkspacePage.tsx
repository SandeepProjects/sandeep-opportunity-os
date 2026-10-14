import React, { useMemo, useState } from "react";
import {
  CANONICAL_WORKFLOW_STATUSES,
  type OpportunityRecord,
  type PipelineCategory,
  type WorkflowState
} from "../../types/opportunity";
import { normalizeWorkflowStatus } from "../../engine/core";

interface WorkspacePageProps {
  category: PipelineCategory;
  title: string;
  subtitle: string;
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (opp: OpportunityRecord) => void;
  onUpdateWorkflow?: (record: OpportunityRecord, patch: Partial<WorkflowState>) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  category,
  title,
  subtitle,
  opportunities,
  onSelectOpportunity,
  onUpdateWorkflow
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [showGated, setShowGated] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"score" | "deadline" | "organization" | "priority">("score");

  const filtered = useMemo(() => {
    return opportunities
      .filter((o) => o.category === category)
      .filter((o) => (showGated ? true : o.is_active !== false))
      .filter((o) => (savedOnly ? Boolean(o.workflow?.favorite ?? o.favorite) : true))
      .filter((o) => {
        if (statusFilter === "ALL") return true;
        const st = normalizeWorkflowStatus(o.workflow?.status || o.user_status || o.status);
        return st === statusFilter;
      })
      .filter((o) => {
        if (priorityFilter === "ALL") return true;
        const pr = o.workflow?.priority || o.priority;
        if (priorityFilter === "P1") return pr === "P1" || pr === "P0" || pr === "High";
        if (priorityFilter === "P2") return pr === "P2" || pr === "Medium";
        if (priorityFilter === "P3") return pr === "P3" || pr === "Low";
        return pr === priorityFilter;
      })
      .filter((o) => {
        if (locationFilter === "ALL") return true;
        const loc = `${o.location} ${o.country || ""}`.toLowerCase();
        if (locationFilter === "CYPRUS") return loc.includes("cyprus") || loc.includes("nicosia") || loc.includes("limassol") || loc.includes("paphos");
        if (locationFilter === "UK") return loc.includes("uk") || loc.includes("united kingdom") || loc.includes("london") || loc.includes("barnet") || loc.includes("hertfordshire");
        if (locationFilter === "EU") return loc.includes("finland") || loc.includes("netherlands") || loc.includes("france") || loc.includes("paris") || loc.includes("europe") || loc.includes("emea");
        if (locationFilter === "REMOTE") return loc.includes("remote");
        return true;
      })
      .filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q) ||
          o.organization.toLowerCase().includes(q) ||
          o.location.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.score_total - a.score_total;
        if (sortBy === "deadline") {
          const da = String(a.deadline || a.details?.application_deadline || a.follow_up_date || "9999");
          const db = String(b.deadline || b.details?.application_deadline || b.follow_up_date || "9999");
          return da.localeCompare(db);
        }
        if (sortBy === "priority") {
          const pa = String(a.workflow?.priority || a.priority || "P9");
          const pb = String(b.workflow?.priority || b.priority || "P9");
          return pa.localeCompare(pb);
        }
        return a.organization.localeCompare(b.organization);
      });
  }, [
    opportunities,
    category,
    showGated,
    savedOnly,
    statusFilter,
    priorityFilter,
    locationFilter,
    searchQuery,
    sortBy
  ]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">PIPELINE WORKSPACE · {category.toUpperCase()}</p>
          <h1 id="topbar-title">{title}</h1>
          <p className="subtext">{subtitle}</p>
        </div>
        <div className="workspace-controls">
          <input
            type="search"
            aria-label="Search opportunities"
            placeholder="Search ID, organization, role, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Status: All</option>
            {CANONICAL_WORKFLOW_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">Priority: All</option>
            <option value="P1">P1 / High</option>
            <option value="P2">P2 / Medium</option>
            <option value="P3">P3 / Low</option>
          </select>
          <select
            aria-label="Filter by location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="ALL">Location: All</option>
            <option value="CYPRUS">Cyprus</option>
            <option value="UK">United Kingdom</option>
            <option value="EU">EU / EMEA</option>
            <option value="REMOTE">Remote</option>
          </select>
          <select
            aria-label="Sort records"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "score" | "deadline" | "organization" | "priority")
            }
          >
            <option value="score">Sort: Fit Score</option>
            <option value="deadline">Sort: Date / Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="organization">Sort: Organization</option>
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
            />
            Saved Only
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showGated}
              onChange={(e) => setShowGated(e.target.checked)}
            />
            Show Gated
          </label>
        </div>
      </header>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Saved</th>
              <th>ID</th>
              <th>Organization & Title</th>
              <th>Location</th>
              <th>Eligibility / Gate</th>
              <th>Fit Score</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Deadline / Follow-Up</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((opp) => {
              const elig =
                opp.eligibility_status ||
                opp.details?.eligibility_confidence ||
                opp.details?.eligibility_status ||
                opp.details?.visa_sponsorship_status ||
                opp.details?.visa_status ||
                opp.details?.cyprus_eligibility ||
                opp.details?.region_eligibility ||
                "UNKNOWN";
              const isFav = Boolean(opp.workflow?.favorite ?? opp.favorite);
              const statusVal = normalizeWorkflowStatus(
                opp.workflow?.status || opp.user_status || opp.status
              );
              const priorityVal = opp.workflow?.priority || opp.priority || "P2";
              const dateVal =
                opp.deadline ||
                opp.details?.application_deadline ||
                opp.workflow?.follow_up_date ||
                opp.follow_up_date ||
                opp.published_date ||
                "—";

              return (
                <tr
                  key={opp.id}
                  className={`opp-row ${opp.is_active === false ? "row-gated" : ""}`}
                  onClick={() => onSelectOpportunity(opp)}
                >
                  <td>
                    <button
                      type="button"
                      className={`btn-star ${isFav ? "starred" : ""}`}
                      aria-label={isFav ? `Unsave ${opp.id}` : `Save ${opp.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateWorkflow) {
                          onUpdateWorkflow(opp, { favorite: !isFav });
                        } else {
                          onSelectOpportunity(opp);
                        }
                      }}
                    >
                      {isFav ? "★" : "☆"}
                    </button>
                  </td>
                  <td className="mono">{opp.id}</td>
                  <td>
                    <strong>{opp.organization}</strong>
                    <div className="subtext">{opp.title}</div>
                  </td>
                  <td>{opp.location}</td>
                  <td>
                    {opp.is_active === false ? (
                      <span className="badge-excluded">Excluded / Gated</span>
                    ) : elig === "UNKNOWN" ? (
                      <span className="badge-unknown">UNKNOWN · Profile unconfirmed</span>
                    ) : (
                      <span className="badge-confirmed">{elig}</span>
                    )}
                  </td>
                  <td className="mono">
                    <strong>{opp.score_total}/100</strong>
                  </td>
                  <td className="mono">{priorityVal}</td>
                  <td>
                    <span className="status-pill">{statusVal}</span>
                  </td>
                  <td className="mono">{dateVal}</td>
                  <td>
                    <a
                      href={opp.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Source ↗
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

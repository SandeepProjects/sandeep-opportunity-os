import React from "react";
import type { OpportunityRecord } from "../../types/opportunity";
import { Score } from "./Score";
import { StatusBadge } from "./StatusBadge";
import { EligibilityBadge } from "./EligibilityBadge";
import { PriorityBadge } from "./PriorityBadge";
import { EmptyState } from "./EmptyState";

interface DataTableProps {
  records: OpportunityRecord[];
  selectedId?: string | null;
  onSelect: (opp: OpportunityRecord) => void;
  contextColumnLabel?: string;
  renderContextCell?: (opp: OpportunityRecord) => React.ReactNode;
  onResetFilters?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  selectedId,
  onSelect,
  contextColumnLabel = "Key Evidence / Value",
  renderContextCell,
  onResetFilters
}) => {
  if (records.length === 0) {
    return (
      <EmptyState
        title="No matching opportunities in current view"
        description="Adjust your search query, status filter, or saved view tab to see verified records."
        actionLabel={onResetFilters ? "Reset Filters" : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="os-table-wrap responsive-switch">
      <table className="os-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Opportunity & Organization</th>
            <th>{contextColumnLabel}</th>
            <th>Eligibility / Gate</th>
            <th>Fit Score</th>
            <th>Priority</th>
            <th>CRM Status</th>
            <th>Deadline / Follow-Up</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {records.map((opp) => {
            const st = opp.workflow?.status || opp.user_status || "New";
            const pr = opp.workflow?.priority || opp.priority || "P1";
            const fu = opp.workflow?.follow_up_date || opp.follow_up_date;
            return (
              <tr
                key={opp.id}
                tabIndex={0}
                role="button"
                aria-label={`Inspect ${opp.title} at ${opp.organization}, score ${opp.score_total}`}
                className={`${selectedId === opp.id ? "selected" : ""} ${
                  opp.is_active === false ? "row-gated" : ""
                }`}
                onClick={() => onSelect(opp)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(opp);
                  }
                }}
              >
                <td className="mono" style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  {opp.id}
                </td>
                <td>
                  <div className="os-cell-primary">
                    {(opp.workflow?.favorite || opp.favorite) && (
                      <span style={{ color: "var(--status-warning-fg)" }} aria-label="Starred">
                        ★
                      </span>
                    )}
                    <span>{opp.title}</span>
                  </div>
                  <div className="os-cell-secondary">
                    {opp.organization} · {opp.location}
                  </div>
                </td>
                <td>
                  {renderContextCell ? (
                    renderContextCell(opp)
                  ) : (
                    <span className="os-cell-secondary">
                      {opp.details?.project_band ||
                        opp.details?.salary_range ||
                        opp.details?.tuition_and_coverage ||
                        opp.details?.compensation ||
                        "Verified primary source"}
                    </span>
                  )}
                </td>
                <td>
                  <EligibilityBadge opportunity={opp} />
                </td>
                <td>
                  <Score score={opp.score_total} />
                </td>
                <td>
                  <PriorityBadge priority={pr} />
                </td>
                <td>
                  <StatusBadge status={st} />
                </td>
                <td className="mono" style={{ fontSize: "12px" }}>
                  {fu ? `Follow-up: ${fu}` : opp.deadline ? `Due: ${opp.deadline}` : "Rolling"}
                </td>
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

      {/* Intelligent Mobile Structured Cards (<=768px, 430px, 390px) */}
      <div className="os-mobile-card-list">
        {records.map((opp) => {
          const st = opp.workflow?.status || opp.user_status || "New";
          const pr = opp.workflow?.priority || opp.priority || "P1";
          return (
            <div
              key={opp.id}
              className="os-mobile-card"
              role="button"
              tabIndex={0}
              onClick={() => onSelect(opp)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(opp);
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {opp.id}
                </span>
                <Score score={opp.score_total} />
              </div>
              <div>
                <div className="os-cell-primary">{opp.title}</div>
                <div className="os-cell-secondary">
                  {opp.organization} · {opp.location}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                <EligibilityBadge opportunity={opp} />
                <PriorityBadge priority={pr} />
                <StatusBadge status={st} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

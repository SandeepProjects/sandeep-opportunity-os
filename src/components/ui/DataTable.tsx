import React, { useState, useMemo, useEffect } from "react";
import type { OpportunityRecord } from "../../types/opportunity";
import { Score } from "./Score";
import { StatusBadge } from "./StatusBadge";
import { EligibilityBadge } from "./EligibilityBadge";
import { PriorityBadge } from "./PriorityBadge";
import { EmptyState } from "./EmptyState";
import { resolveOpportunityProvenance } from "../../engine/provenance";
import { getAgentById } from "../../config/agentRegistry";
import { formatCategoryName, decodeHtmlEntities } from "../../lib/formatters";

interface DataTableProps {
  records: OpportunityRecord[];
  selectedId?: string | null;
  onSelect: (opp: OpportunityRecord) => void;
  contextColumnLabel?: string;
  renderContextCell?: (opp: OpportunityRecord) => React.ReactNode;
  onResetFilters?: () => void;
  showCategory?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  selectedId,
  onSelect,
  contextColumnLabel = "Key Evidence / Value",
  renderContextCell,
  onResetFilters,
  showCategory
}) => {
  const [pageSize, setPageSize] = useState<number | "ALL">(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [records]);

  const totalPages = pageSize === "ALL" ? 1 : Math.max(1, Math.ceil(records.length / pageSize));
  const paginatedRecords = useMemo(() => {
    if (pageSize === "ALL") return records;
    const start = (currentPage - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, currentPage, pageSize]);
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

  // Auto-detect if records span multiple categories
  const hasMultipleCategories =
    showCategory !== undefined
      ? showCategory
      : new Set(records.map((r) => r.category)).size > 1;

  return (
    <div className="os-table-wrap responsive-switch">
      <table className="os-table" aria-label="Opportunities directory table">
        <thead>
          <tr>
            <th className="mono" style={{ width: "85px" }}>
              ID
            </th>
            <th style={{ minWidth: "260px" }}>Opportunity &amp; Organization</th>
            {hasMultipleCategories && <th style={{ width: "130px" }}>Pipeline</th>}
            <th style={{ width: "115px" }}>Agent</th>
            <th>{contextColumnLabel}</th>
            <th style={{ width: "85px" }}>Eligibility</th>
            <th style={{ width: "85px" }}>Fit Score</th>
            <th style={{ width: "75px" }}>Priority</th>
            <th style={{ width: "95px" }}>CRM Status</th>
            <th style={{ width: "125px" }}>Due / Follow-Up</th>
            <th style={{ width: "75px" }}>Source</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRecords.map((opp) => {
            const st = opp.workflow?.status || opp.user_status || "New";
            const pr = opp.workflow?.priority || opp.priority || "P1";
            const fu = opp.workflow?.follow_up_date || opp.follow_up_date;
            const prov = resolveOpportunityProvenance(opp);
            const primaryProv = prov[0];
            const agent = primaryProv ? getAgentById(primaryProv.agentId) : undefined;

            return (
              <tr
                key={opp.id}
                tabIndex={0}
                role="button"
                aria-label={`Inspect ${decodeHtmlEntities(opp.title)} at ${decodeHtmlEntities(opp.organization)}, score ${opp.score_total}`}
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
                <td className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {opp.id}
                </td>
                <td>
                  <div className="os-cell-primary">
                    {(opp.workflow?.favorite || opp.favorite) && (
                      <span style={{ color: "var(--status-warning-fg)" }} aria-label="Starred">
                        ★
                      </span>
                    )}
                    <span>{decodeHtmlEntities(opp.title)}</span>
                  </div>
                  <div className="os-cell-secondary">
                    <strong style={{ color: "var(--text-primary)" }}>{decodeHtmlEntities(opp.organization)}</strong> · {decodeHtmlEntities(opp.location)}
                  </div>
                </td>
                {hasMultipleCategories && (
                  <td>
                    <span className="os-badge neutral" style={{ fontSize: "11px" }}>
                      {formatCategoryName(opp.category)}
                    </span>
                  </td>
                )}
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
                    title={`Discovered by ${prov.map((p) => p.agentName.replace("Sandy Muse", "Bago Muse")).join(", ")}`}
                  >
                    {agent?.name || "Bago Muse"}
                    {prov.length > 1 && (
                      <span style={{ opacity: 0.85, marginLeft: 4, fontWeight: 700 }}>
                        +{prov.length - 1}
                      </span>
                    )}
                  </span>
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
                  <Score score={opp.score_total} size="sm" />
                </td>
                <td>
                  <PriorityBadge priority={pr} />
                </td>
                <td>
                  <StatusBadge status={st} />
                </td>
                <td className="mono" style={{ fontSize: "11.5px" }}>
                  {fu ? (
                    <span>{fu}</span>
                  ) : opp.deadline ? (
                    <span>Due {opp.deadline}</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>Rolling</span>
                  )}
                </td>
                <td>
                  <a
                    href={opp.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{ fontSize: "11px", padding: "2px 6px" }}
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
        {paginatedRecords.map((opp) => {
          const st = opp.workflow?.status || opp.user_status || "New";
          const pr = opp.workflow?.priority || opp.priority || "P1";
          return (
            <div
              key={opp.id}
              className="os-mobile-card"
              role="button"
              tabIndex={0}
              aria-label={`Inspect ${decodeHtmlEntities(opp.title)}`}
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
                <Score score={opp.score_total} size="sm" />
              </div>
              <div>
                <div className="os-cell-primary">{decodeHtmlEntities(opp.title)}</div>
                <div className="os-cell-secondary">
                  <strong>{decodeHtmlEntities(opp.organization)}</strong> · {decodeHtmlEntities(opp.location)}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                <span className="os-badge neutral" style={{ fontSize: "10.5px" }}>
                  {formatCategoryName(opp.category)}
                </span>
                <EligibilityBadge opportunity={opp} />
                <PriorityBadge priority={pr} />
                <StatusBadge status={st} />
              </div>
            </div>
          );
        })}
      </div>

      {records.length > 25 && (
        <div className="os-pagination-bar" role="navigation" aria-label="Table pagination">
          <div className="os-pagination-info mono">
            Showing {records.length === 0 ? 0 : (currentPage - 1) * (pageSize === "ALL" ? records.length : pageSize) + 1}–
            {Math.min(currentPage * (pageSize === "ALL" ? records.length : pageSize), records.length)} of {records.length} records
          </div>
          <div className="os-pagination-controls">
            <label className="os-pagination-size-label">
              Rows:
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className="os-table-select os-pagination-select"
                aria-label="Rows per page"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value="ALL">All ({records.length})</option>
              </select>
            </label>
            <div className="os-pagination-buttons">
              <button
                type="button"
                className="btn-ghost os-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                ‹ Prev
              </button>
              <span className="os-page-current mono">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                type="button"
                className="btn-ghost os-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

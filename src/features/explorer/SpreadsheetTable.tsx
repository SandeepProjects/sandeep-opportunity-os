import React, { useState, useMemo, useEffect } from "react";
import type { OpportunityRecord } from "../../types/opportunity";
import { Score } from "../../components/ui/Score";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { PriorityBadge } from "../../components/ui/PriorityBadge";
import { EligibilityBadge } from "../../components/ui/EligibilityBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { resolveOpportunityProvenance } from "../../engine/provenance";
import {
  formatCategoryName,
  decodeHtmlEntities,
  parseDeadlineTimestamp,
  normalizePriority
} from "../../lib/formatters";

interface SpreadsheetTableProps {
  records: OpportunityRecord[];
  selectedId?: string | null;
  onSelect: (opp: OpportunityRecord) => void;
  sheetTitle: string;
  tabLabel?: string;
}

type SortField = "score" | "title" | "org" | "priority" | "status" | "deadline" | "agent";
type SortDirection = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = {
  P0: 1,
  Critical: 1,
  High: 2,
  P1: 2,
  Medium: 3,
  P2: 3,
  Low: 4,
  P3: 4
};

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({
  records,
  selectedId,
  onSelect,
  sheetTitle,
  tabLabel
}) => {
  const [inSheetSearch, setInSheetSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number | "ALL">(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset pagination on filter or sheet tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [inSheetSearch, statusFilter, priorityFilter, sheetTitle, tabLabel]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "score" || field === "priority" ? "desc" : "asc");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(filteredRecords.map((r) => r.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredRecords = useMemo(() => {
    return records
      .filter((opp) => {
        if (statusFilter !== "ALL") {
          const st = opp.workflow?.status || opp.user_status || "New";
          if (st !== statusFilter) return false;
        }
        if (priorityFilter !== "ALL") {
          const pr = normalizePriority(opp.workflow?.priority || opp.priority);
          if (pr !== normalizePriority(priorityFilter)) return false;
        }
        if (inSheetSearch.trim()) {
          const q = inSheetSearch.toLowerCase();
          const matches =
            opp.title.toLowerCase().includes(q) ||
            opp.organization.toLowerCase().includes(q) ||
            opp.location.toLowerCase().includes(q) ||
            opp.id.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === "score") {
          diff = a.score_total - b.score_total;
        } else if (sortField === "title") {
          diff = a.title.localeCompare(b.title);
        } else if (sortField === "org") {
          diff = a.organization.localeCompare(b.organization);
        } else if (sortField === "priority") {
          const pa = PRIORITY_ORDER[a.workflow?.priority || a.priority || "P1"] || 9;
          const pb = PRIORITY_ORDER[b.workflow?.priority || b.priority || "P1"] || 9;
          diff = pb - pa; // higher priority first
        } else if (sortField === "status") {
          const sa = a.workflow?.status || a.user_status || "New";
          const sb = b.workflow?.status || b.user_status || "New";
          diff = sa.localeCompare(sb);
        } else if (sortField === "deadline") {
          const da = a.deadline || (a.details as Record<string, unknown> | undefined)?.deadline as string || "";
          const db = b.deadline || (b.details as Record<string, unknown> | undefined)?.deadline as string || "";
          const ta = parseDeadlineTimestamp(da);
          const tb = parseDeadlineTimestamp(db);
          diff = ta - tb;
          if (diff === 0) {
            diff = b.score_total - a.score_total;
          }
        } else if (sortField === "agent") {
          const pa = resolveOpportunityProvenance(a)[0]?.agentName || "";
          const pb = resolveOpportunityProvenance(b)[0]?.agentName || "";
          diff = pa.localeCompare(pb);
        }

        return sortDir === "desc" ? -diff : diff;
      });
  }, [records, statusFilter, priorityFilter, inSheetSearch, sortField, sortDir]);

  const totalPages = pageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    if (pageSize === "ALL") return filteredRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const allSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedRowIds.has(r.id));

  return (
    <div className="os-spreadsheet-workspace">
      {/* Table Toolbar / Controls */}
      <div className="os-spreadsheet-toolbar">
        <div className="os-table-search-group">
          <span className="os-table-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            className="os-table-search-input"
            placeholder={`Filter ${records.length} rows in ${tabLabel || sheetTitle}...`}
            value={inSheetSearch}
            onChange={(e) => setInSheetSearch(e.target.value)}
            aria-label={`Filter rows in ${sheetTitle}`}
          />
          {inSheetSearch && (
            <button
              type="button"
              className="os-search-clear-btn"
              onClick={() => setInSheetSearch("")}
              aria-label="Clear filter"
            >
              ×
            </button>
          )}
        </div>

        <div className="os-table-filter-group">
          {/* Status Filter */}
          <select
            className="os-table-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by CRM Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Saved">Saved</option>
            <option value="Preparing">Preparing</option>
            <option value="Contacted">Contacted</option>
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Follow-Up">Follow-Up</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Priority Filter */}
          <select
            className="os-table-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by Priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="P0">P0 · Critical</option>
            <option value="P1">P1 · High</option>
            <option value="P2">P2 · Medium</option>
            <option value="P3">P3 · Low</option>
          </select>

          {selectedRowIds.size > 0 && (
            <span className="os-selected-count-badge mono">
              {selectedRowIds.size} selected
            </span>
          )}
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <EmptyState
          title="No records matching filter criteria"
          description={`Found 0 of ${records.length} total rows in this view.`}
          actionLabel="Clear Filters"
          onAction={() => {
            setInSheetSearch("");
            setStatusFilter("ALL");
            setPriorityFilter("ALL");
          }}
        />
      ) : (
        <div className="os-table-wrap responsive-switch">
          <table className="os-table os-spreadsheet-table" aria-label={`Spreadsheet data for ${sheetTitle}`}>
            <thead>
              <tr>
                <th style={{ width: "36px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all visible rows"
                  />
                </th>
                <th
                  className="mono sortable"
                  style={{ width: "90px" }}
                  onClick={() => handleSort("score")}
                >
                  Score {sortField === "score" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th className="sortable" style={{ minWidth: "240px" }} onClick={() => handleSort("title")}>
                  Opportunity &amp; Role {sortField === "title" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th className="sortable" style={{ width: "160px" }} onClick={() => handleSort("org")}>
                  Organization {sortField === "org" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th style={{ width: "110px" }}>Category</th>
                <th style={{ width: "120px" }} className="sortable" onClick={() => handleSort("agent")}>
                  Agent {sortField === "agent" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th style={{ width: "90px" }}>Eligibility</th>
                <th className="sortable" style={{ width: "85px" }} onClick={() => handleSort("priority")}>
                  Priority {sortField === "priority" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th className="sortable" style={{ width: "105px" }} onClick={() => handleSort("status")}>
                  CRM Status {sortField === "status" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th className="sortable" style={{ width: "115px" }} onClick={() => handleSort("deadline")}>
                  Due / Follow-Up {sortField === "deadline" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th style={{ width: "80px", textAlign: "center" }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((opp) => {
                const isRowSelected = selectedRowIds.has(opp.id);
                const isCurrentActive = selectedId === opp.id;
                const status = opp.workflow?.status || opp.user_status || "New";
                const priority = opp.workflow?.priority || opp.priority || "P1";
                const followUp = opp.workflow?.follow_up_date || opp.follow_up_date;
                const provs = resolveOpportunityProvenance(opp);
                const firstProv = provs[0];
                const deadlineText = opp.deadline || (opp.details as Record<string, unknown> | undefined)?.deadline as string || "";

                return (
                  <tr
                    key={opp.id}
                    className={`${isCurrentActive ? "selected" : ""} ${isRowSelected ? "row-checked" : ""} ${
                      opp.is_active === false ? "row-gated" : ""
                    }`}
                    onClick={() => onSelect(opp)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Inspect ${decodeHtmlEntities(opp.title)} at ${decodeHtmlEntities(opp.organization)}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(opp);
                      }
                    }}
                  >
                    <td style={{ textAlign: "center" }} onClick={(e) => handleToggleRow(opp.id, e)}>
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={() => {}}
                        aria-label={`Select row ${opp.id}`}
                      />
                    </td>
                    <td>
                      <Score score={opp.score_total} />
                    </td>
                    <td>
                      <div className="os-cell-primary">
                        {(opp.workflow?.favorite || opp.favorite) && (
                          <span style={{ color: "var(--status-warning-fg)", marginRight: 4 }} aria-label="Starred">
                            ★
                          </span>
                        )}
                        <span style={{ fontWeight: 600 }}>{decodeHtmlEntities(opp.title)}</span>
                      </div>
                      <div className="os-cell-secondary" style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        {decodeHtmlEntities(opp.location)} · ID: <span className="mono">{opp.id}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{decodeHtmlEntities(opp.organization)}</span>
                    </td>
                    <td>
                      <span className="os-badge neutral" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                        {formatCategoryName(opp.category)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="os-badge mono"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-default)",
                          fontSize: "10.5px",
                          whiteSpace: "nowrap"
                        }}
                        title={`Discovered by ${provs.map((p) => (p?.agentName || "Bago Muse").replace("Sandy Muse", "Bago Muse")).join(", ")}`}
                      >
                        {(firstProv?.agentName || "Bago Muse").replace("Sandy Muse", "Bago Muse")}
                        {provs.length > 1 && (
                          <span style={{ marginLeft: 3, fontWeight: 700, color: "var(--accent-primary)" }}>
                            +{provs.length - 1}
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <EligibilityBadge opportunity={opp} />
                    </td>
                    <td>
                      <PriorityBadge priority={priority} />
                    </td>
                    <td>
                      <StatusBadge status={status} />
                    </td>
                    <td>
                      {followUp ? (
                        <span className="mono" style={{ fontSize: "11px", color: "var(--status-info-fg)" }}>
                          📅 {followUp}
                        </span>
                      ) : deadlineText ? (
                        <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          ⏰ {decodeHtmlEntities(deadlineText)}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      {opp.source_url ? (
                        <a
                          href={opp.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="os-source-link"
                          title="Open source URL in new tab"
                        >
                          ↗
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Card Fallback (matches Playwright selector .responsive-switch .os-mobile-card) */}
          <div className="os-mobile-card-list">
            {paginatedRecords.map((opp) => {
              const status = opp.workflow?.status || opp.user_status || "New";
              const priority = opp.workflow?.priority || opp.priority || "P1";

              return (
                <div
                  key={`mobile-${opp.id}`}
                  className="os-mobile-card"
                  tabIndex={0}
                  role="button"
                  onClick={() => onSelect(opp)}
                >
                  <div className="os-mobile-card-header">
                    <div>
                      <div className="os-mobile-card-title">{decodeHtmlEntities(opp.title)}</div>
                      <div className="os-mobile-card-org">{decodeHtmlEntities(opp.organization)}</div>
                    </div>
                    <Score score={opp.score_total} size="sm" />
                  </div>
                  <div className="os-mobile-card-badges">
                    <StatusBadge status={status} />
                    <PriorityBadge priority={priority} />
                    <span className="os-badge neutral mono" style={{ fontSize: "10.5px" }}>
                      {formatCategoryName(opp.category)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Pagination Controls */}
          {filteredRecords.length > 0 && (
            <div className="os-pagination-bar" role="navigation" aria-label="Table pagination">
              <div className="os-pagination-info mono">
                Showing {filteredRecords.length === 0 ? 0 : (currentPage - 1) * (pageSize === "ALL" ? filteredRecords.length : pageSize) + 1}–
                {Math.min(currentPage * (pageSize === "ALL" ? filteredRecords.length : pageSize), filteredRecords.length)} of {filteredRecords.length} records
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
                    <option value="ALL">All ({filteredRecords.length})</option>
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
      )}
    </div>
  );
};

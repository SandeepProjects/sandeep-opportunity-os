import React from "react";

export interface SavedViewOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  views: SavedViewOption[];
  activeView: string;
  onSelectView: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  views,
  activeView,
  onSelectView,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  onReset
}) => (
  <div className="os-filter-bar" role="region" aria-label="Workspace Filters and Saved Views">
    <div className="os-saved-views" role="tablist" aria-label="Saved workspace views">
      {views.map((v) => (
        <button
          key={v.id}
          type="button"
          role="tab"
          aria-selected={activeView === v.id}
          className={`os-view-tab ${activeView === v.id ? "active" : ""}`}
          onClick={() => onSelectView(v.id)}
        >
          {v.label} {v.count !== undefined ? `(${v.count})` : ""}
        </button>
      ))}
    </div>

    <div className="os-filter-controls">
      <input
        type="search"
        className="os-input"
        placeholder="Search org, role, stack, location..."
        aria-label="Filter opportunities by keyword"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="os-select"
        aria-label="Filter by CRM status"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="ALL">Status: All</option>
        <option value="New">New</option>
        <option value="Saved">Saved</option>
        <option value="Preparing">Preparing</option>
        <option value="Contacted">Contacted</option>
        <option value="Applied">Applied</option>
        <option value="Interviewing">Interviewing</option>
        <option value="Follow-Up">Follow-Up</option>
      </select>
      <select
        className="os-select"
        aria-label="Sort opportunities"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="score">Sort: Fit Score (High → Low)</option>
        <option value="priority">Sort: Priority (P0/High → Low)</option>
        <option value="deadline">Sort: Deadline (Soonest)</option>
        <option value="organization">Sort: Organization (A → Z)</option>
      </select>
      {(searchQuery || statusFilter !== "ALL" || activeView !== "all_active") && (
        <button type="button" className="btn-ghost" onClick={onReset}>
          Reset
        </button>
      )}
    </div>
  </div>
);

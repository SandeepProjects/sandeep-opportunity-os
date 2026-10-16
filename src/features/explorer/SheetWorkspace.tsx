import React, { useMemo } from "react";
import type { SheetConfig, WorkspaceConfig, FolderConfig } from "./explorerData";
import type { OpportunityRecord } from "../../types/opportunity";
import { CompactMetricCard, type CompactMetricItem } from "./CompactMetricCard";
import { SheetTabs } from "./SheetTabs";
import { SpreadsheetTable } from "./SpreadsheetTable";
import { filterOpportunitiesForSheetTab } from "./explorerData";

interface SheetWorkspaceProps {
  sheet: SheetConfig;
  folder?: FolderConfig;
  workspace: WorkspaceConfig;
  selectedTabId: string;
  onSelectTab: (tabId: string) => void;
  opportunities: OpportunityRecord[];
  selectedOpportunityId?: string | null;
  onSelectOpportunity: (opp: OpportunityRecord) => void;
  lastSyncedAt: string;
}

export const SheetWorkspace: React.FC<SheetWorkspaceProps> = ({
  sheet,
  folder,
  workspace,
  selectedTabId,
  onSelectTab,
  opportunities,
  selectedOpportunityId,
  onSelectOpportunity,
  lastSyncedAt
}) => {
  // 1. Calculate counts for each tab in this sheet
  const tabCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of sheet.tabs) {
      counts[tab.id] = filterOpportunitiesForSheetTab(opportunities, sheet, tab.id).length;
    }
    return counts;
  }, [opportunities, sheet]);

  // 2. Filter opportunities for the active tab
  const activeTabRecords = useMemo(() => {
    return filterOpportunitiesForSheetTab(opportunities, sheet, selectedTabId);
  }, [opportunities, sheet, selectedTabId]);

  // 3. Compute 4 compact summary metrics
  const totalSheetRows = useMemo(() => {
    return filterOpportunitiesForSheetTab(opportunities, sheet).length;
  }, [opportunities, sheet]);

  const highPriorityCount = useMemo(() => {
    return activeTabRecords.filter(
      (o) =>
        (o.workflow?.priority || o.priority) === "High" ||
        String(o.workflow?.priority || o.priority) === "P0" ||
        o.score_total >= 85
    ).length;
  }, [activeTabRecords]);

  const duplicatesMerged = useMemo(() => {
    return activeTabRecords.filter(
      (o) => Array.isArray(o.agent_provenance) && o.agent_provenance.length > 1
    ).length;
  }, [activeTabRecords]);

  // Format relative last synced time
  const formatLastSync = (iso: string): string => {
    if (!iso) return "Recently";
    const deltaMs = Date.now() - new Date(iso).getTime();
    if (isNaN(deltaMs) || deltaMs < 0) return "Just now";
    const mins = Math.floor(deltaMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  const metrics: CompactMetricItem[] = [
    {
      id: "total_rows",
      label: "Total Rows",
      value: totalSheetRows.toLocaleString(),
      subValue: `${activeTabRecords.length.toLocaleString()} in current tab`,
      badge: "Verified",
      badgeTone: "success"
    },
    {
      id: "high_priority",
      label: "High Priority",
      value: highPriorityCount,
      subValue: "Score 85+ or P0/P1",
      badge: "Actionable",
      badgeTone: "info"
    },
    {
      id: "duplicates_merged",
      label: "Duplicates Merged",
      value: duplicatesMerged,
      subValue: "Multi-agent matches",
      badge: "Deduplicated",
      badgeTone: "neutral"
    },
    {
      id: "last_sync",
      label: "Last Sync",
      value: formatLastSync(lastSyncedAt),
      subValue: "Automated cron",
      badgeTone: "neutral"
    }
  ];

  const currentTabConfig = sheet.tabs.find((t) => t.id === selectedTabId);
  const activeTabLabel = currentTabConfig?.label || selectedTabId;

  return (
    <div className="os-sheet-workspace-container" role="main" aria-label={`Spreadsheet View: ${sheet.name}`}>
      {/* Sheet Header */}
      <div className="os-sheet-workspace-header">
        <div className="os-sheet-title-area">
          <div className="os-sheet-title-badge">
            <span className="os-sheet-brand-icon" aria-hidden="true">
              📊
            </span>
            <span className="os-sheet-type-pill mono">{sheet.fileType.toUpperCase()}</span>
          </div>

          <div>
            <h1 className="os-sheet-title">{sheet.name}</h1>
            <div className="os-sheet-meta-subtitle">
              <span>{workspace.name}</span>
              {folder && (
                <>
                  <span className="os-breadcrumb-sep">/</span>
                  <span>{folder.name}</span>
                </>
              )}
              <span className="os-breadcrumb-sep">/</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{sheet.name}</span>
            </div>
          </div>
        </div>

        {sheet.externalUrl && (
          <a
            href={sheet.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            title="Open in Google Drive / Google Sheets"
            style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>Open in Google Sheets</span>
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      {/* 3–4 Compact Summary Cards */}
      <CompactMetricCard metrics={metrics} />

      {/* Horizontal Internal Sheet Tabs */}
      <SheetTabs
        tabs={sheet.tabs}
        selectedTabId={selectedTabId}
        onSelectTab={onSelectTab}
        counts={tabCounts}
      />

      {/* Large Enterprise Spreadsheet Table dominating the page */}
      <SpreadsheetTable
        records={activeTabRecords}
        selectedId={selectedOpportunityId}
        onSelect={onSelectOpportunity}
        sheetTitle={sheet.name}
        tabLabel={activeTabLabel}
      />
    </div>
  );
};

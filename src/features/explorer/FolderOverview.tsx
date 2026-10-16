import React from "react";
import type { FolderConfig, SheetConfig, WorkspaceConfig } from "./explorerData";
import type { OpportunityRecord } from "../../types/opportunity";
import { CompactMetricCard, type CompactMetricItem } from "./CompactMetricCard";
import { filterOpportunitiesForSheetTab } from "./explorerData";

interface FolderOverviewProps {
  folder: FolderConfig;
  workspace: WorkspaceConfig;
  opportunities: OpportunityRecord[];
  onOpenSheet: (sheet: SheetConfig) => void;
  onOpenSubfolder?: (subfolder: FolderConfig) => void;
  lastSyncedAt: string;
}

export const FolderOverview: React.FC<FolderOverviewProps> = ({
  folder,
  workspace,
  opportunities,
  onOpenSheet,
  onOpenSubfolder,
  lastSyncedAt
}) => {
  // Calculate total rows across all sheets in this folder
  const totalFolderRows = folder.sheets.reduce((acc, s) => {
    return acc + filterOpportunitiesForSheetTab(opportunities, s).length;
  }, 0);

  const subfolderCount = folder.subfolders ? folder.subfolders.length : 0;

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
      id: "sheets",
      label: "Sheets Inside",
      value: folder.sheets.length,
      badge: "Google Drive",
      badgeTone: "info"
    },
    {
      id: "subfolders",
      label: "Subfolders",
      value: subfolderCount,
      badge: "Directory",
      badgeTone: "neutral"
    },
    {
      id: "total_rows",
      label: "Total Rows",
      value: totalFolderRows.toLocaleString(),
      badge: "Active Data",
      badgeTone: "success"
    },
    {
      id: "last_updated",
      label: "Last Updated",
      value: formatLastSync(lastSyncedAt),
      subValue: "Automated sync",
      badgeTone: "neutral"
    }
  ];

  return (
    <div className="os-folder-overview" role="region" aria-label={`Folder Overview: ${folder.name}`}>
      {/* Folder Header */}
      <div className="os-folder-header">
        <div className="os-folder-title-row">
          <span className="os-folder-large-icon" aria-hidden="true">
            📂
          </span>
          <div>
            <h1 className="os-folder-title">{folder.name}</h1>
            <div className="os-folder-breadcrumb-subtitle">
              <span>{workspace.name}</span>
              <span className="os-breadcrumb-sep">/</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{folder.name}</span>
            </div>
          </div>
        </div>

        {folder.externalUrl && (
          <a
            href={folder.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>Open in Google Drive</span>
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <p className="os-folder-description">{folder.description}</p>

      {/* 4 Compact Metrics */}
      <CompactMetricCard metrics={metrics} />

      {/* Subfolders Section (if any) */}
      {folder.subfolders && folder.subfolders.length > 0 && (
        <div className="os-folder-section">
          <h2 className="os-folder-section-title">Subfolders ({folder.subfolders.length})</h2>
          <div className="os-folder-grid">
            {folder.subfolders.map((sub) => (
              <div
                key={sub.id}
                className="os-folder-card"
                onClick={() => {
                  if (onOpenSubfolder) onOpenSubfolder(sub);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onOpenSubfolder) onOpenSubfolder(sub);
                  }
                }}
              >
                <div className="os-folder-card-header">
                  <span className="os-folder-card-icon" aria-hidden="true">
                    📁
                  </span>
                  <div>
                    <div className="os-folder-card-name">{sub.name}</div>
                    <div className="os-folder-card-meta">{sub.sheets.length} sheets inside</div>
                  </div>
                </div>
                <div className="os-folder-card-desc">{sub.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sheets in this Folder */}
      <div className="os-folder-section">
        <h2 className="os-folder-section-title">Spreadsheets &amp; Trackers ({folder.sheets.length})</h2>
        {folder.sheets.length === 0 ? (
          <div className="os-folder-empty-note">
            No direct sheets in this folder. Browse subfolders above or add resources in Data Sources.
          </div>
        ) : (
          <div className="os-sheet-list">
            {folder.sheets.map((sheet) => {
              const rows = filterOpportunitiesForSheetTab(opportunities, sheet);

              return (
                <div key={sheet.id} className="os-sheet-card">
                  <div className="os-sheet-card-left">
                    <span className="os-sheet-card-icon" aria-hidden="true">
                      📊
                    </span>
                    <div>
                      <div className="os-sheet-card-name">{sheet.name}</div>
                      <div className="os-sheet-card-desc">{sheet.description}</div>
                      <div className="os-sheet-card-tabs">
                        {sheet.tabs.map((tab) => (
                          <span key={tab.id} className="os-sheet-mini-tab">
                            {tab.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="os-sheet-card-right">
                    <div className="os-sheet-card-count mono">
                      {rows.length.toLocaleString()} <span>rows</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => onOpenSheet(sheet)}
                      style={{ fontSize: "12px", padding: "6px 14px", fontWeight: 600 }}
                    >
                      Open Sheet →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

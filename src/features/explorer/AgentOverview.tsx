import React from "react";
import type { ExplorerAgent, WorkspaceConfig, FolderConfig, SheetConfig } from "./explorerData";
import type { OpportunityRecord } from "../../types/opportunity";
import { CompactMetricCard, type CompactMetricItem } from "./CompactMetricCard";
import { filterOpportunitiesForSheetTab } from "./explorerData";

interface AgentOverviewProps {
  agent: ExplorerAgent;
  workspace: WorkspaceConfig;
  opportunities: OpportunityRecord[];
  onOpenFolder: (folder: FolderConfig) => void;
  onOpenSheet: (sheet: SheetConfig) => void;
  lastSyncedAt: string;
}

export const AgentOverview: React.FC<AgentOverviewProps> = ({
  agent,
  workspace,
  opportunities,
  onOpenFolder,
  onOpenSheet,
  lastSyncedAt
}) => {
  // Aggregate opportunities for this agent's workspace
  const allWorkspaceSheets: SheetConfig[] = [
    ...workspace.sheets,
    ...workspace.folders.flatMap((f) => f.sheets),
    ...workspace.folders.flatMap((f) => f.subfolders ? f.subfolders.flatMap((s) => s.sheets) : [])
  ];

  const agentOpportunities = opportunities.filter((o) => {
    if (agent.id === "bago_muse") return o.category === "freelance_leads" || (o.source_url || "").includes("facebook");
    if (agent.id === "kattu_ai") return o.category === "remote_jobs";
    if (agent.id === "haya_satnam") return o.category === "visa_jobs";
    if (agent.id === "haya_arsh") return o.category === "masters_scholarships";
    return true;
  });

  const highFitCount = agentOpportunities.filter((o) => o.score_total >= 85).length;
  const inCrmCount = agentOpportunities.filter(
    (o) => (o.workflow?.status || o.user_status) !== "New" || o.workflow?.favorite
  ).length;

  const metrics: CompactMetricItem[] = [
    {
      id: "agent_leads",
      label: "Discovered Opportunities",
      value: agentOpportunities.length.toLocaleString(),
      badge: "Active Fleet",
      badgeTone: "success"
    },
    {
      id: "high_fit",
      label: "High Fit (85+ Score)",
      value: highFitCount,
      subValue: "Prime targets",
      badgeTone: "info"
    },
    {
      id: "in_crm",
      label: "Active In CRM",
      value: inCrmCount,
      subValue: "Saved / Applied / In Progress",
      badgeTone: "neutral"
    },
    {
      id: "folders_sheets",
      label: "Drive Folders & Sheets",
      value: `${workspace.folders.length} folders · ${allWorkspaceSheets.length} sheets`,
      subValue: lastSyncedAt ? "Synchronized" : "Google Drive",
      badgeTone: "neutral"
    }
  ];

  return (
    <div className="os-agent-overview" role="region" aria-label={`${agent.name} Workspace Summary`}>
      {/* Agent Banner */}
      <div className="os-agent-banner">
        <div className="os-agent-banner-left">
          <div
            className="os-agent-banner-avatar"
            style={{ backgroundColor: agent.themeColor, color: "#ffffff" }}
          >
            {agent.initials}
          </div>
          <div>
            <div className="os-agent-codename mono">{agent.codename}</div>
            <h1 className="os-agent-title">{agent.name}</h1>
            <div className="os-agent-role-title">{agent.role}</div>
          </div>
        </div>

        <div className="os-agent-banner-right">
          <span className="os-badge success mono" style={{ fontSize: "11px", padding: "4px 10px" }}>
            ● Operational &amp; Active
          </span>
        </div>
      </div>

      <p className="os-agent-description">{agent.description}</p>

      {/* 4 Compact Metric Cards */}
      <CompactMetricCard metrics={metrics} />

      {/* Folders in this Agent's Workspace */}
      <div className="os-folder-section">
        <h2 className="os-folder-section-title">Drive Folders in {workspace.name}</h2>
        <div className="os-folder-grid">
          {workspace.folders.map((folder) => {
            const rowsInFolder = folder.sheets.reduce(
              (acc, s) => acc + filterOpportunitiesForSheetTab(opportunities, s).length,
              0
            );

            return (
              <div
                key={folder.id}
                className="os-folder-card"
                onClick={() => onOpenFolder(folder)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenFolder(folder);
                  }
                }}
              >
                <div className="os-folder-card-header">
                  <span className="os-folder-card-icon" aria-hidden="true">
                    📁
                  </span>
                  <div>
                    <div className="os-folder-card-name">{folder.name}</div>
                    <div className="os-folder-card-meta">
                      {folder.sheets.length} sheets · {rowsInFolder.toLocaleString()} rows
                    </div>
                  </div>
                </div>
                <div className="os-folder-card-desc">{folder.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Sheets in this Agent's Workspace */}
      {allWorkspaceSheets.length > 0 && (
        <div className="os-folder-section">
          <h2 className="os-folder-section-title">Featured Spreadsheets &amp; Trackers</h2>
          <div className="os-sheet-list">
            {allWorkspaceSheets.slice(0, 4).map((sheet) => {
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
        </div>
      )}
    </div>
  );
};

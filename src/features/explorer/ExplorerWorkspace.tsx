import React, { useMemo, useCallback } from "react";
import type { OpportunityRecord } from "../../types/opportunity";
import {
  WORKSPACE_TREE,
  WORKSPACE_AGENTS,
  type WorkspaceConfig,
  type FolderConfig,
  type SheetConfig,
  type ExplorerSelection,
  type ExplorerAgent,
  getWorkspaceById,
  getFolderById,
  getSheetById,
  getDynamicSheetTabs
} from "./explorerData";
import { SheetWorkspace } from "./SheetWorkspace";
import { FolderOverview } from "./FolderOverview";
import { AgentOverview } from "./AgentOverview";

interface ExplorerWorkspaceProps {
  opportunities: OpportunityRecord[];
  selectedOpportunityId?: string | null;
  onSelectOpportunity: (opp: OpportunityRecord) => void;
  lastSyncedAt: string;
  selection: ExplorerSelection;
  onUpdateSelection: (newSelection: Partial<ExplorerSelection>) => void;
}

export const ExplorerWorkspace: React.FC<ExplorerWorkspaceProps> = ({
  opportunities,
  selectedOpportunityId,
  onSelectOpportunity,
  lastSyncedAt,
  selection,
  onUpdateSelection
}) => {
  // Resolve current active objects from tree
  const activeWorkspace = useMemo<WorkspaceConfig>(() => {
    return getWorkspaceById(selection.workspaceId) || WORKSPACE_TREE[0];
  }, [selection.workspaceId]);

  const activeFolder = useMemo<FolderConfig | undefined>(() => {
    if (!selection.folderId) return undefined;
    const res = getFolderById(selection.folderId);
    return res?.folder;
  }, [selection.folderId]);

  const activeSheet = useMemo<SheetConfig | undefined>(() => {
    if (!selection.sheetId) return undefined;
    const res = getSheetById(selection.sheetId);
    return res?.sheet;
  }, [selection.sheetId]);

  const activeAgent = useMemo<ExplorerAgent | undefined>(() => {
    if (!selection.agentId) return undefined;
    return WORKSPACE_AGENTS.find((a) => a.id === selection.agentId);
  }, [selection.agentId]);

  // Determine current active tab (including dynamically discovered tabs)
  const currentTabId = useMemo<string>(() => {
    const effectiveTabs = getDynamicSheetTabs(activeSheet, opportunities);
    if (!activeSheet || !effectiveTabs || effectiveTabs.length === 0) {
      return "";
    }
    if (selection.tabId && effectiveTabs.some((t) => t.id === selection.tabId)) {
      return selection.tabId;
    }
    return effectiveTabs[0].id;
  }, [activeSheet, selection.tabId, opportunities]);

  const handleOpenSheet = useCallback(
    (sheet: SheetConfig) => {
      onUpdateSelection({
        sheetId: sheet.id,
        tabId: sheet.tabs[0]?.id
      });
    },
    [onUpdateSelection]
  );

  const handleOpenFolder = useCallback(
    (folder: FolderConfig) => {
      onUpdateSelection({
        folderId: folder.id,
        sheetId: undefined,
        tabId: undefined
      });
    },
    [onUpdateSelection]
  );

  const handleSelectTab = useCallback(
    (tabId: string) => {
      onUpdateSelection({ tabId });
    },
    [onUpdateSelection]
  );

  return (
    <div className="os-explorer-container" style={{ width: "100%", display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Main Workspace Area (~90% Width) */}
      <main className="os-workspace-body">
        {activeSheet ? (
          /* When a Sheet is selected -> Large Spreadsheet Table view dominates */
          <SheetWorkspace
            sheet={activeSheet}
            folder={activeFolder}
            workspace={activeWorkspace}
            selectedTabId={currentTabId}
            onSelectTab={handleSelectTab}
            opportunities={opportunities}
            selectedOpportunityId={selectedOpportunityId}
            onSelectOpportunity={onSelectOpportunity}
            lastSyncedAt={lastSyncedAt}
          />
        ) : activeFolder ? (
          /* When a Folder is selected -> Clean Folder Overview */
          <FolderOverview
            folder={activeFolder}
            workspace={activeWorkspace}
            opportunities={opportunities}
            onOpenSheet={handleOpenSheet}
            onOpenSubfolder={handleOpenFolder}
            lastSyncedAt={lastSyncedAt}
          />
        ) : activeAgent ? (
          /* When an Agent is selected -> Agent Workspace Summary */
          <AgentOverview
            agent={activeAgent}
            workspace={activeWorkspace}
            opportunities={opportunities}
            onOpenFolder={handleOpenFolder}
            onOpenSheet={handleOpenSheet}
            lastSyncedAt={lastSyncedAt}
          />
        ) : (
          /* Fallback Folder Overview of Workspace Root */
          <div className="os-workspace-fallback">
            <h1 className="os-page-title">{activeWorkspace.name}</h1>
            <p className="os-page-subtitle">{activeWorkspace.description}</p>
          </div>
        )}
      </main>
    </div>
  );
};

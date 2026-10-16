import React, { useState } from "react";
import {
  WORKSPACE_TREE,
  type WorkspaceConfig,
  type FolderConfig,
  type SheetConfig,
  type ExplorerSelection
} from "./explorerData";

interface DriveExplorerProps {
  selection: ExplorerSelection;
  onSelectWorkspace: (workspace: WorkspaceConfig) => void;
  onSelectFolder: (folder: FolderConfig, workspace: WorkspaceConfig) => void;
  onSelectSheet: (sheet: SheetConfig, folder?: FolderConfig, workspace?: WorkspaceConfig) => void;
  onSelectTab: (tabId: string, sheet: SheetConfig, folder?: FolderConfig, workspace?: WorkspaceConfig) => void;
}

export const DriveExplorer: React.FC<DriveExplorerProps> = ({
  selection,
  onSelectWorkspace,
  onSelectFolder,
  onSelectSheet,
  onSelectTab
}) => {
  // Track open/collapsed state of workspaces and folders
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({
    ws_bagomuse: true,
    f_social_hunter: true,
    ws_musesatnam: true,
    f_cyprus_visa: true,
    ws_kattu: false,
    ws_haya_arsh: false,
    ws_job_apply: false,
    ws_job_cms_agents: true
  });

  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  return (
    <div className="os-drive-explorer" role="tree" aria-label="Drive Explorer File Tree">
      <div className="os-nav-group-label" style={{ padding: "10px 12px 6px", letterSpacing: "0.05em" }}>
        DRIVE EXPLORER
      </div>

      <div className="os-tree-root">
        {WORKSPACE_TREE.map((ws) => {
          const isWsOpen = Boolean(openNodes[ws.id]);
          const isWsSelected = selection.workspaceId === ws.id && !selection.folderId && !selection.sheetId;

          return (
            <div key={ws.id} className="os-tree-workspace" role="treeitem" aria-expanded={isWsOpen}>
              {/* Workspace Root Item */}
              <div
                className={`os-tree-item ws-level ${isWsSelected ? "selected" : ""}`}
                onClick={() => {
                  onSelectWorkspace(ws);
                  if (!isWsOpen) {
                    setOpenNodes((prev) => ({ ...prev, [ws.id]: true }));
                  }
                }}
              >
                <button
                  type="button"
                  className="os-tree-chevron-btn"
                  onClick={(e) => toggleNode(ws.id, e)}
                  aria-label={isWsOpen ? "Collapse folder" : "Expand folder"}
                >
                  <span className={`os-chevron-icon ${isWsOpen ? "open" : ""}`}>›</span>
                </button>
                <span className="os-folder-icon" aria-hidden="true">
                  📁
                </span>
                <span className="os-tree-label ws-label" title={ws.name}>
                  {ws.name}
                </span>
              </div>

              {/* Workspace Children (Folders & Sheets) */}
              {isWsOpen && (
                <div className="os-tree-children">
                  {/* Folders */}
                  {ws.folders.map((folder) => {
                    const isFolderOpen = Boolean(openNodes[folder.id]);
                    const isFolderSelected =
                      selection.folderId === folder.id && !selection.sheetId;

                    return (
                      <div key={folder.id} className="os-tree-folder" role="treeitem" aria-expanded={isFolderOpen}>
                        <div
                          className={`os-tree-item folder-level ${isFolderSelected ? "selected" : ""}`}
                          onClick={() => {
                            onSelectFolder(folder, ws);
                            if (!isFolderOpen) {
                              setOpenNodes((prev) => ({ ...prev, [folder.id]: true }));
                            }
                          }}
                        >
                          <button
                            type="button"
                            className="os-tree-chevron-btn"
                            onClick={(e) => toggleNode(folder.id, e)}
                            aria-label={isFolderOpen ? "Collapse folder" : "Expand folder"}
                          >
                            <span className={`os-chevron-icon ${isFolderOpen ? "open" : ""}`}>›</span>
                          </button>
                          <span className="os-folder-icon" aria-hidden="true">
                            {isFolderOpen ? "📂" : "📁"}
                          </span>
                          <span className="os-tree-label folder-label" title={folder.name}>
                            {folder.name}
                          </span>
                          {folder.sheets.length > 0 && (
                            <span className="os-tree-badge">{folder.sheets.length}</span>
                          )}
                        </div>

                        {/* Folder Sheets */}
                        {isFolderOpen && (
                          <div className="os-tree-children folder-children">
                            {folder.sheets.map((sheet) => {
                              const isSheetSelected = selection.sheetId === sheet.id;
                              const isSheetOpen = Boolean(openNodes[sheet.id]);

                              return (
                                <div key={sheet.id} className="os-tree-sheet-container">
                                  <div
                                    className={`os-tree-item sheet-level ${isSheetSelected ? "selected" : ""}`}
                                    onClick={() => onSelectSheet(sheet, folder, ws)}
                                  >
                                    {sheet.tabs && sheet.tabs.length > 0 ? (
                                      <button
                                        type="button"
                                        className="os-tree-chevron-btn"
                                        onClick={(e) => toggleNode(sheet.id, e)}
                                        aria-label={isSheetOpen ? "Collapse tabs" : "Expand tabs"}
                                      >
                                        <span className={`os-chevron-icon ${isSheetOpen ? "open" : ""}`}>›</span>
                                      </button>
                                    ) : (
                                      <span className="os-tree-chevron-spacer" />
                                    )}
                                    <span className="os-sheet-icon" title="Google Sheet" aria-hidden="true">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M3 9h18" />
                                        <path d="M3 15h18" />
                                        <path d="M9 3v18" />
                                      </svg>
                                    </span>
                                    <span className="os-tree-label sheet-label" title={sheet.name}>
                                      {sheet.name}
                                    </span>
                                  </div>

                                  {/* Sub-tabs inside sheet (if expanded) */}
                                  {isSheetOpen && sheet.tabs && (
                                    <div className="os-tree-children tab-children">
                                      {sheet.tabs.map((tab) => {
                                        const isTabSelected = isSheetSelected && selection.tabId === tab.id;
                                        return (
                                          <div
                                            key={tab.id}
                                            className={`os-tree-item tab-level ${isTabSelected ? "selected" : ""}`}
                                            onClick={() => onSelectTab(tab.id, sheet, folder, ws)}
                                          >
                                            <span className="os-tab-icon" aria-hidden="true">
                                              📄
                                            </span>
                                            <span className="os-tree-label tab-label" title={tab.label}>
                                              {tab.label}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Direct Workspace Sheets */}
                  {ws.sheets.map((sheet) => {
                    const isSheetSelected = selection.sheetId === sheet.id;
                    const isSheetOpen = Boolean(openNodes[sheet.id]);

                    return (
                      <div key={sheet.id} className="os-tree-sheet-container">
                        <div
                          className={`os-tree-item sheet-level ${isSheetSelected ? "selected" : ""}`}
                          onClick={() => onSelectSheet(sheet, undefined, ws)}
                        >
                          {sheet.tabs && sheet.tabs.length > 0 ? (
                            <button
                              type="button"
                              className="os-tree-chevron-btn"
                              onClick={(e) => toggleNode(sheet.id, e)}
                              aria-label={isSheetOpen ? "Collapse tabs" : "Expand tabs"}
                            >
                              <span className={`os-chevron-icon ${isSheetOpen ? "open" : ""}`}>›</span>
                            </button>
                          ) : (
                            <span className="os-tree-chevron-spacer" />
                          )}
                          <span className="os-sheet-icon" title="Google Sheet" aria-hidden="true">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M3 9h18" />
                              <path d="M3 15h18" />
                              <path d="M9 3v18" />
                            </svg>
                          </span>
                          <span className="os-tree-label sheet-label" title={sheet.name}>
                            {sheet.name}
                          </span>
                        </div>

                        {/* Sub-tabs if expanded */}
                        {isSheetOpen && sheet.tabs && (
                          <div className="os-tree-children tab-children">
                            {sheet.tabs.map((tab) => {
                              const isTabSelected = isSheetSelected && selection.tabId === tab.id;
                              return (
                                <div
                                  key={tab.id}
                                  className={`os-tree-item tab-level ${isTabSelected ? "selected" : ""}`}
                                  onClick={() => onSelectTab(tab.id, sheet, undefined, ws)}
                                >
                                  <span className="os-tab-icon" aria-hidden="true">
                                    📄
                                  </span>
                                  <span className="os-tree-label tab-label" title={tab.label}>
                                    {tab.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

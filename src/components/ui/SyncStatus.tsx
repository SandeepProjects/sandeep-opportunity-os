import React from "react";
import type { DataSourceMode } from "../../features/opportunities/api/opportunityRepository";

interface SyncStatusProps {
  mode: DataSourceMode;
  lastSyncedAt: string;
  onSyncNow: () => void;
  isSyncing?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  mode,
  lastSyncedAt,
  onSyncNow,
  isSyncing = false
}) => (
  <div className="os-sync-control">
    <span className="os-sync-pill" title={`Latest dataset verification: ${lastSyncedAt}`}>
      <span className="os-sync-dot" />
      <span className="mono">{mode === "SUPABASE_LIVE" ? "SUPABASE LIVE" : "VERIFIED SNAPSHOT (24)"}</span>
      <span className="sync-label-text">· Source verified</span>
    </span>
    <button
      type="button"
      className="btn-secondary"
      onClick={onSyncNow}
      disabled={isSyncing}
      aria-label="Refresh the configured opportunity data source"
    >
      {isSyncing ? "Syncing..." : "Sync Data"}
    </button>
  </div>
);

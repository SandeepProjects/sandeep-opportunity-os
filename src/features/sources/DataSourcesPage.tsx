import React, { useState } from "react";
import { DATA_SOURCE_REGISTRY, type DataSourceResource } from "../../config/dataSources";
import { getAgentById } from "../../config/agentRegistry";
import { Icon } from "../../components/ui/Icon";

interface DataSourcesPageProps {
  onSyncNow: () => void;
  isSyncing?: boolean;
  lastSyncedAt?: string;
  recordCount: number;
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({
  onSyncNow,
  isSyncing = false,
  lastSyncedAt,
  recordCount
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredSources = DATA_SOURCE_REGISTRY.filter((s) => {
    if (filterType === "ALL") return true;
    if (filterType === "GOOGLE") return s.type === "Native Google Sheet" || s.type === "Drive XLSX" || s.type === "Drive Folder";
    if (filterType === "LOCAL") return s.type === "Local File" || s.type === "Database";
    return true;
  });

  return (
    <div className="os-workspace-body">
      {/* Header */}
      <div className="os-page-header">
        <div>
          <div className="os-page-tagline">INGESTION & SOURCE ARCHITECTURE</div>
          <h1 className="os-page-title">Data Sources & Ingestion Hub</h1>
          <p className="os-page-subtitle">
            Autonomous multi-source ingestion layer. Google Sheets and Google Drive workbooks updated by Sandeep's 5 AI
            agents are fetched every 5 hours, parsed server-side, deduplicated, and unified into the Supabase PostgreSQL
            canonical database.
          </p>
        </div>
        <div className="os-page-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={onSyncNow}
            disabled={isSyncing}
          >
            <Icon name="sync" size={14} />
            <span>{isSyncing ? "Syncing All Sources..." : "Run Unified Ingestion"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="os-metric-strip">
        <div className="os-metric-card">
          <div className="os-metric-label">REGISTERED SOURCES</div>
          <div className="os-metric-val mono">{DATA_SOURCE_REGISTRY.length}</div>
          <div className="os-metric-delta good">3 Google Cloud + 3 Local Seeds</div>
        </div>
        <div className="os-metric-card">
          <div className="os-metric-label">CANONICAL DATABASE</div>
          <div className="os-metric-val mono">Supabase</div>
          <div className="os-metric-delta info">PostgreSQL · {recordCount} Records</div>
        </div>
        <div className="os-metric-card">
          <div className="os-metric-label">SYNC INTERVAL</div>
          <div className="os-metric-val mono">5h 00m</div>
          <div className="os-metric-delta info">00, 05, 10, 15, 20 UTC Schedule</div>
        </div>
        <div className="os-metric-card">
          <div className="os-metric-label">LAST REFRESH</div>
          <div className="os-metric-val mono" style={{ fontSize: 13 }}>
            {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
          </div>
          <div className="os-metric-delta good">CRM User Edits Protected</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="os-filter-bar" style={{ marginTop: 24, marginBottom: 16 }}>
        <div className="os-filter-group">
          <span className="os-filter-label">Source Type:</span>
          {["ALL", "GOOGLE", "LOCAL"].map((t) => (
            <button
              key={t}
              type="button"
              className={`btn-ghost ${filterType === t ? "active" : ""}`}
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                backgroundColor: filterType === t ? "var(--bg-elevated)" : "transparent",
                color: filterType === t ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => setFilterType(t)}
            >
              {t === "ALL" ? "All Sources" : t === "GOOGLE" ? "Google Drive / Sheets" : "Local Verified Seeds"}
            </button>
          ))}
        </div>
      </div>

      {/* Sources Table */}
      <div className="os-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="os-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Source Name & Resource</th>
              <th>Owning Agent</th>
              <th>Type & Format</th>
              <th>Target Tabs / Scope</th>
              <th>Cadence</th>
              <th>Metrics (Fetched / Accepted)</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSources.map((src: DataSourceResource, idx: number) => {
              const agent = src.owningAgentId ? getAgentById(src.owningAgentId) : undefined;
              const gId = src.driveId || src.spreadsheetId || src.folderId;

              return (
                <tr key={src.id}>
                  <td className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {src.name}
                    </div>
                    {gId && (
                      <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        ID: {gId.slice(0, 18)}...
                      </div>
                    )}
                  </td>
                  <td>
                    {agent ? (
                      <span
                        className="os-badge mono"
                        style={{
                          backgroundColor: agent.accentBg,
                          color: agent.themeColor,
                          border: `1px solid ${agent.themeColor}33`,
                          fontSize: 11
                        }}
                      >
                        {agent.name}
                      </span>
                    ) : (
                      <span className="os-badge neutral mono" style={{ fontSize: 11 }}>
                        System
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="os-badge neutral mono" style={{ fontSize: 11 }}>
                      {src.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {src.verifiedTabs?.join(", ") || src.purpose || "Full file"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {src.syncMode === "AUTOMATIC_6H" ? "Every 5h (00, 05, 10, 15, 20 UTC)" : src.syncMode}
                    </div>
                  </td>
                  <td>
                    <div className="mono" style={{ fontSize: 12, color: "var(--text-primary)" }}>
                      {src.recordsFetched ?? 0} fetched · {src.recordsAccepted ?? 0} accepted
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                      {src.canonicalRecords ?? 0} active in DB
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {src.url ? (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: "3px 8px", textDecoration: "none" }}
                      >
                        <span>Open Resource</span>
                        <Icon name="external" size={11} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Local File</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ingestion Architecture Card */}
      <div
        className="os-card"
        style={{
          marginTop: 24,
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          padding: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Icon name="sparkles" size={18} className="text-accent" />
          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>
            Canonical Ingestion & Strict CRM Preservation Architecture
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Opportunity OS features a single unified sync engine shared identically between the 5-hour scheduled GitHub Actions
          cron and the Supabase Edge Function manual sync trigger. When incoming sheets or XLSX files are fetched,
          all records are normalized, deduplicated by URL and fingerprint, and merged against existing database records.
          Sandeep's 7 user-owned CRM fields (<code>user_status</code>, <code>priority</code>, <code>favorite</code>,{" "}
          <code>follow_up_date</code>, <code>personal_notes</code>, <code>contacted_date</code>, and <code>applied_date</code>)
          are strictly preserved and can never be overwritten by automated agent updates.
        </p>
      </div>
    </div>
  );
};

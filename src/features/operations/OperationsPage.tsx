import React from "react";
import type { DataSourceMode } from "../opportunities/api/opportunityRepository";

interface OperationsPageProps {
  mode: DataSourceMode;
  nativeSheetId: string;
  uploadedXlsxId: string;
  lastSyncedAt: string;
  recordCount: number;
  lastPreservedCount?: number;
  onTriggerSync: () => void;
}

export const OperationsPage: React.FC<OperationsPageProps> = ({
  mode,
  nativeSheetId,
  uploadedXlsxId,
  lastSyncedAt,
  recordCount,
  lastPreservedCount,
  onTriggerSync
}) => {
  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">DATA PIPELINE, SUPABASE & GOOGLE SHEETS SYNC</p>
          <h1 id="topbar-title">Operations & Synchronization Health</h1>
          <p className="subtext">
            Architecture: Research → Validation → Normalization → Deduplication → Scoring → Supabase → Google Sheets Sync → Dashboard
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={onTriggerSync}>
          Sync Google Sheet / Refresh Research
        </button>
      </header>

      <div className="ops-grid">
        <div className="ops-card">
          <h3>Canonical Database Adapter</h3>
          <p className="mono">{mode}</p>
          <p>
            Loaded Records: <strong>{recordCount}</strong> verified real opportunities (21 active + 3 gated; 0 fake/demo records)
          </p>
          <p className="mono">Last Synced: {lastSyncedAt}</p>
          {typeof lastPreservedCount === "number" && (
            <p className="mono">
              Protected [USER] CRM fields preserved on last refresh: {lastPreservedCount}
            </p>
          )}
        </div>

        <div className="ops-card">
          <h3>Native Google Sheet (Human Review Layer)</h3>
          <p className="mono">Sheet ID: {nativeSheetId}</p>
          <p>
            Idempotent sync keyed by persistent Record ID (`OPP-FL-*`, `OPP-VJ-*`, `OPP-MS-*`, `OPP-RM-*`). Never overwrites `status`, `priority`, `favorite`, `follow_up_date`, `personal_notes`, `contacted_at`, or `applied_at`.
          </p>
          <p>
            <a
              href={`https://docs.google.com/spreadsheets/d/${nativeSheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Native Google Sheet ↗
            </a>
          </p>
        </div>

        <div className="ops-card">
          <h3>Uploaded 6-Tab Master Workbook (.xlsx)</h3>
          <p className="mono">Drive ID: {uploadedXlsxId}</p>
          <p>
            Contains Executive_Summary, Freelance_Leads, Visa_Relocation_Jobs, Masters_Scholarships, Remote_Jobs_Internships, and Ops_And_Profile_Config.
          </p>
          <p>
            <a
              href={`https://drive.google.com/file/d/${uploadedXlsxId}/view`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open 6-Tab Master .xlsx in Drive ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

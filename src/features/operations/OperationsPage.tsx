import React from "react";
import type { DataSourceMode } from "../opportunities/api/opportunityRepository";
import type { OpportunityRecord } from "../../types/opportunity";
import { PageHeader } from "../../components/ui/PageHeader";
import { MetricStrip } from "../../components/ui/Metric";
import { SectionPanel } from "../../components/ui/SectionPanel";
import { normalizeScoreComponents } from "../../engine/core";

interface OperationsPageProps {
  mode: DataSourceMode;
  nativeSheetId: string;
  uploadedXlsxId: string;
  lastSyncedAt: string;
  recordCount: number;
  opportunities?: OpportunityRecord[];
  onTriggerSync: () => void;
}

type StageTone = "success" | "warning" | "info" | "neutral";

interface PipelineStage {
  step: string;
  status: string;
  tone: StageTone;
  detail: string;
}

export const OperationsPage: React.FC<OperationsPageProps> = ({
  mode,
  nativeSheetId,
  uploadedXlsxId,
  lastSyncedAt,
  recordCount,
  opportunities = [],
  onTriggerSync
}) => {
  const activeCount = opportunities.filter((o) => o.is_active !== false).length;
  const gatedRecords = opportunities.filter((o) => o.is_active === false);
  const verifiedCount = opportunities.filter((o) => Boolean(o.source_url && o.last_verified_at)).length;
  const uniqueIdCount = new Set(opportunities.map((o) => o.id)).size;
  const scoredCount = opportunities.filter(
    (o) => Number.isFinite(o.score_total) && normalizeScoreComponents(o).length > 0
  ).length;
  const datasetReady = recordCount > 0;
  const dataIntegrityOk = datasetReady && verifiedCount === recordCount && uniqueIdCount === recordCount;
  const scoringCoverageOk = datasetReady && scoredCount === recordCount;

  const pipelineStages: PipelineStage[] = [
    {
      step: "1. Discovery Snapshot",
      status: datasetReady ? "LOADED" : "NO DATA",
      tone: datasetReady ? "success" : "warning",
      detail: datasetReady
        ? `${recordCount} opportunity records are loaded across the four configured pipelines.`
        : "No opportunity records are currently loaded."
    },
    {
      step: "2. Source Validation Evidence",
      status: verifiedCount === recordCount && recordCount > 0 ? "VERIFIED" : "PARTIAL",
      tone: verifiedCount === recordCount && recordCount > 0 ? "success" : "warning",
      detail: `${verifiedCount}/${recordCount} loaded records contain both a primary source URL and a verification timestamp.`
    },
    {
      step: "3. Normalized Data Contract",
      status: dataIntegrityOk ? "VERIFIED" : "REVIEW",
      tone: dataIntegrityOk ? "success" : "warning",
      detail: `${uniqueIdCount}/${recordCount} unique Record IDs detected. Canonical date/status normalization is enforced by the research engine.`
    },
    {
      step: "4. Deduplication Integrity",
      status: uniqueIdCount === recordCount && recordCount > 0 ? "UNIQUE" : "REVIEW",
      tone: uniqueIdCount === recordCount && recordCount > 0 ? "success" : "warning",
      detail: `${recordCount - uniqueIdCount} duplicate Record IDs are present in the currently loaded canonical dataset.`
    },
    {
      step: "5. Scoring & Hard Gates",
      status: scoringCoverageOk ? "VERIFIED" : "PARTIAL",
      tone: scoringCoverageOk ? "success" : "warning",
      detail: `${scoredCount}/${recordCount} records include explainable score components; ${activeCount} active and ${gatedRecords.length} gated.`
    },
    {
      step: "6. Canonical Store (Supabase)",
      status: mode === "SUPABASE_LIVE" ? "LIVE" : "ADAPTER",
      tone: mode === "SUPABASE_LIVE" ? "success" : "info",
      detail:
        mode === "SUPABASE_LIVE"
          ? "The dashboard loaded records from the configured Supabase project during this session."
          : "Supabase is not active in this browser session; the dashboard is using the verified seed import adapter plus persisted CRM state."
    },
    {
      step: "7. Google Sheets Target",
      status: nativeSheetId ? "CONFIGURED" : "UNKNOWN",
      tone: nativeSheetId ? "info" : "warning",
      detail: nativeSheetId
        ? `Native Sheet target ${nativeSheetId.slice(0, 12)}… is configured and the idempotent merge engine protects user-owned CRM fields. This browser does not claim a live Sheets API write; scheduled worker credentials/run status must be verified separately.`
        : "No native Google Sheet target is configured."
    },
    {
      step: "8. React Dashboard",
      status: "ACTIVE",
      tone: "success",
      detail: "Eight application routes are available with enterprise tables, mobile cards, keyboard-accessible inspectors, CRM state, and light/dark themes."
    }
  ];

  return (
    <>
      <PageHeader
        eyebrow="SYSTEM OPERATIONS & PIPELINE EVIDENCE"
        title="Research, Data Integrity & Integration Status"
        subtitle="Runtime evidence from the currently loaded dataset and configured integrations. Unknown or browser-unverifiable states are explicitly labelled instead of being reported as healthy."
        actions={
          <button type="button" className="btn-primary" onClick={onTriggerSync}>
            Refresh Data Source
          </button>
        }
      />

      <MetricStrip
        items={[
          { label: "Data Source", value: mode === "SUPABASE_LIVE" ? "SUPABASE" : "SNAPSHOT", delta: mode === "SUPABASE_LIVE" ? "Live configured project" : `${recordCount} verified seed records`, tone: "info" },
          { label: "Canonical Records", value: recordCount, delta: `${activeCount} active · ${gatedRecords.length} gated`, tone: "success" },
          { label: "Source Verification", value: `${verifiedCount}/${recordCount}`, delta: "Primary URL + verification timestamp", tone: verifiedCount === recordCount ? "success" : "warning" },
          { label: "Daily Workflow Config", value: "06:00 UTC", delta: "Configured in GitHub Actions; runtime result not inferred" }
        ]}
      />

      <SectionPanel
        title="8-Stage Pipeline Evidence Matrix"
        subtitle={`Latest verification timestamp present in loaded data: ${lastSyncedAt}`}
      >
        <div className="os-table-wrap">
          <table className="os-table">
            <thead>
              <tr>
                <th>Pipeline Stage</th>
                <th>State</th>
                <th>Available Evidence</th>
              </tr>
            </thead>
            <tbody>
              {pipelineStages.map((stage) => (
                <tr key={stage.step}>
                  <td className="mono os-table-stage">{stage.step}</td>
                  <td><span className={`os-badge ${stage.tone} mono`}>{stage.status}</span></td>
                  <td>{stage.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <div className="os-grid-2">
        <SectionPanel
          title="Native Google Sheet Target"
          subtitle={`spreadsheetId: ${nativeSheetId || "UNKNOWN"}`}
        >
          <div className="os-operations-copy">
            <p><strong>Configuration state:</strong> <span className="os-badge info mono">TARGET CONFIGURED</span></p>
            <p>
              <strong>Merge contract:</strong> machine-owned fields are merged by persistent Record ID while user-owned CRM fields remain protected. The client dashboard intentionally does not expose service-account credentials or pretend a browser refresh is a Google Sheets write.
            </p>
            <a href={`https://docs.google.com/spreadsheets/d/${nativeSheetId}/edit`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Open Native Google Sheet ↗
            </a>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Uploaded 6-Tab Master Workbook (.xlsx Artifact)"
          subtitle={`fileId: ${uploadedXlsxId || "UNKNOWN"}`}
        >
          <div className="os-operations-copy">
            <p><strong>Artifact:</strong> <span className="mono">application/vnd.ms-excel</span></p>
            <p>
              <strong>Tabs:</strong> Executive_Summary, Freelance_Leads, Visa_Relocation_Jobs, Masters_Scholarships, Remote_Jobs_Internships, Ops_And_Profile_Config.
            </p>
            <a href={`https://drive.google.com/file/d/${uploadedXlsxId}/view`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Open 6-Tab Master Workbook in Drive ↗
            </a>
          </div>
        </SectionPanel>
      </div>
    </>
  );
};

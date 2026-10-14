import React, { useState } from "react";
import { bucketFollowUps, normalizeWorkflowStatus } from "../../engine/core";
import { CANONICAL_WORKFLOW_STATUSES, type OpportunityRecord, type WorkflowStatus } from "../../types/opportunity";

interface SavedPageProps {
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (opp: OpportunityRecord) => void;
}

const ACTIVE_CRM_STATUSES = new Set<WorkflowStatus>([
  "Saved",
  "Reviewing",
  "High Priority",
  "Preparing",
  "Contacted",
  "Applied",
  "Interview",
  "Follow-up",
  "Offer",
  "Won"
]);

export const SavedFollowUpsPage: React.FC<SavedPageProps> = ({
  opportunities,
  onSelectOpportunity
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const savedOrActive = opportunities.filter((o) => {
    const st = normalizeWorkflowStatus(o.workflow?.status || o.user_status || o.status);
    if (statusFilter !== "ALL" && st !== statusFilter) return false;
    return Boolean(o.workflow?.favorite || o.favorite || ACTIVE_CRM_STATUSES.has(st));
  });

  const buckets = bucketFollowUps(savedOrActive, "2026-10-14");

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">PERSONAL CRM & FOLLOW-UP TRACKER</p>
          <h1 id="topbar-title">Saved Opportunities & Active Follow-Ups ({savedOrActive.length})</h1>
          <p className="subtext">
            Overdue: {buckets["Overdue"].length} · Due today: {buckets["Due today"].length} ·
            Tomorrow: {buckets["Tomorrow"].length} · This week: {buckets["This week"].length} ·
            Later: {buckets["Later"].length}
          </p>
        </div>
        <div className="workspace-controls">
          <select
            aria-label="Filter CRM by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All CRM Statuses</option>
            {CANONICAL_WORKFLOW_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Opportunity</th>
              <th>Status [USER]</th>
              <th>Priority [USER]</th>
              <th>Favorite [USER]</th>
              <th>Follow-Up [USER]</th>
              <th>Contacted / Applied</th>
              <th>Personal Notes [USER]</th>
            </tr>
          </thead>
          <tbody>
            {savedOrActive.map((opp) => {
              const st = normalizeWorkflowStatus(opp.workflow?.status || opp.user_status || opp.status);
              const fav = Boolean(opp.workflow?.favorite ?? opp.favorite);
              const contacted = opp.workflow?.contacted_date || opp.contacted_date || null;
              const applied = opp.workflow?.applied_date || opp.applied_date || null;
              return (
                <tr key={opp.id} className="opp-row" onClick={() => onSelectOpportunity(opp)}>
                  <td className="mono">{opp.id}</td>
                  <td>
                    <strong>{opp.organization}</strong>
                    <div className="subtext">{opp.title}</div>
                  </td>
                  <td>
                    <span className="status-pill">{st}</span>
                  </td>
                  <td className="mono">{opp.workflow?.priority || opp.priority}</td>
                  <td className="mono">{fav ? "★ Saved" : "—"}</td>
                  <td className="mono">{opp.workflow?.follow_up_date || opp.follow_up_date || "—"}</td>
                  <td className="mono">
                    {contacted ? `C: ${contacted}` : ""}
                    {contacted && applied ? " · " : ""}
                    {applied ? `A: ${applied}` : ""}
                    {!contacted && !applied ? "—" : ""}
                  </td>
                  <td>{opp.workflow?.personal_notes || opp.personal_notes || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

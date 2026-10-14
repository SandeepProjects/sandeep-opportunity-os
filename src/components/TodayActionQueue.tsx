import React from "react";
import type { OpportunityRecord } from "../types/opportunity";
import { normalizeWorkflowStatus, TERMINAL_WORKFLOW_STATUSES } from "../engine/core";

export interface TodayActionQueueProps {
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (id: string) => void;
}

export const TodayActionQueue: React.FC<TodayActionQueueProps> = ({
  opportunities,
  onSelectOpportunity
}) => {
  const active = opportunities.filter((o) => {
    const status = normalizeWorkflowStatus(o.workflow?.status || o.user_status || o.status);
    return o.is_active && !TERMINAL_WORKFLOW_STATUSES.has(status);
  });
  return (
    <section aria-label="Today Prioritized Action Queue" className="today-queue-grid">
      {active.slice(0, 8).map((opp) => (
        <article
          key={opp.id}
          onClick={() => onSelectOpportunity(opp.id)}
          className="action-card"
        >
          <header>
            <span className="mono">{opp.id}</span>
            <h3>{opp.title}</h3>
            <span className="score-badge mono">{opp.score_total}</span>
          </header>
          <p>{opp.organization} · {opp.location}</p>
        </article>
      ))}
    </section>
  );
};

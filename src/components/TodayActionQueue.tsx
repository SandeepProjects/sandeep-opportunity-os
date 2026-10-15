import React from "react";
import type { OpportunityRecord } from "../types/opportunity";

export interface TodayActionQueueProps {
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (id: string) => void;
}

export const TodayActionQueue: React.FC<TodayActionQueueProps> = ({
  opportunities,
  onSelectOpportunity
}) => {
  const active = opportunities.filter((o) => {
    const status = o.workflow?.status || o.user_status || o.status || "New";
    return o.is_active && !["Not Suitable", "Rejected", "Expired", "Archived", "Won"].includes(status);
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

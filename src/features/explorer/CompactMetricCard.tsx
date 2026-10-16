import React from "react";

export interface CompactMetricItem {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  badge?: string;
  badgeTone?: "success" | "warning" | "info" | "neutral";
}

interface CompactMetricCardProps {
  metrics: CompactMetricItem[];
}

export const CompactMetricCard: React.FC<CompactMetricCardProps> = ({ metrics }) => {
  return (
    <div className="os-compact-metric-strip" role="region" aria-label="Sheet Summary Metrics">
      {metrics.map((m) => (
        <div key={m.id} className="os-compact-metric-card">
          <div className="os-compact-metric-header">
            <span className="os-compact-metric-label">{m.label}</span>
            {m.badge && (
              <span className={`os-badge ${m.badgeTone || "neutral"} mono`} style={{ fontSize: "10px", padding: "1px 5px" }}>
                {m.badge}
              </span>
            )}
          </div>
          <div className="os-compact-metric-body">
            <span className="os-compact-metric-value mono">{m.value}</span>
            {m.subValue && <span className="os-compact-metric-sub">{m.subValue}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

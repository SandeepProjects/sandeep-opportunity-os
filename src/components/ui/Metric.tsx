import React from "react";

export interface MetricItem {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

export const Metric: React.FC<MetricItem> = ({ label, value, delta, tone = "default" }) => {
  const valColor =
    tone === "success"
      ? "var(--status-success-fg)"
      : tone === "warning"
      ? "var(--status-warning-fg)"
      : tone === "danger"
      ? "var(--status-danger-fg)"
      : tone === "info"
      ? "var(--status-info-fg)"
      : "var(--text-primary)";

  return (
    <div className="os-metric-card">
      <div className="os-metric-top">
        <span>{label}</span>
      </div>
      <div className="os-metric-value" style={{ color: valColor }}>
        {value}
      </div>
      {delta && <div className="os-metric-delta">{delta}</div>}
    </div>
  );
};

export const MetricStrip: React.FC<{ items: MetricItem[] }> = ({ items }) => (
  <div className="os-metric-strip" role="region" aria-label="Key Performance Metrics">
    {items.map((item, idx) => (
      <Metric key={idx} {...item} />
    ))}
  </div>
);

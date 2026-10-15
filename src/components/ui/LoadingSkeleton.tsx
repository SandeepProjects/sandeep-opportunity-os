import React from "react";

export const LoadingSkeleton: React.FC<{ label?: string }> = ({
  label = "Loading Sandeep Opportunity OS workspace..."
}) => (
  <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }} role="status">
    <span className="mono">{label}</span>
  </div>
);

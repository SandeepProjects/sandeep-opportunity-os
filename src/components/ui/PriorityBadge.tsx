import React from "react";
import type { PriorityLevel } from "../../types/opportunity";

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const isUrgent = priority === "High" || priority === "P0" || priority === "Critical";
  const isTarget = priority === "Medium" || priority === "P1";
  const isLow = priority === "Low" || priority === "P2" || priority === "P3";

  const toneClass = isUrgent ? "urgent" : isTarget ? "target" : isLow ? "low" : "neutral";
  const dotColor = isUrgent
    ? "var(--status-danger-fg)"
    : isTarget
    ? "var(--status-warning-fg)"
    : isLow
    ? "var(--status-info-fg)"
    : "var(--text-muted)";

  return (
    <span className={`os-priority-indicator ${toneClass} mono`} title={`Priority: ${priority}`}>
      <span
        className="os-priority-dot"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: dotColor,
          display: "inline-block",
          flexShrink: 0
        }}
        aria-hidden="true"
      />
      <span>{priority}</span>
    </span>
  );
};

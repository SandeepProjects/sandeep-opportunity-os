import React from "react";
import type { PriorityLevel } from "../../types/opportunity";

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  let variant = "neutral";
  if (priority === "High" || priority === "P0") {
    variant = "danger";
  } else if (priority === "Medium" || priority === "P1") {
    variant = "info";
  }
  return <span className={`os-badge ${variant} mono`}>{priority}</span>;
};

import React from "react";
import type { WorkflowStatus } from "../../types/opportunity";

interface StatusBadgeProps {
  status: WorkflowStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let variant = "neutral";
  if (status === "Applied" || status === "Contacted" || status === "Won") {
    variant = "success";
  } else if (status === "Preparing" || status === "Interviewing" || status === "Follow-Up") {
    variant = "warning";
  } else if (status === "Saved") {
    variant = "info";
  } else if (status === "Rejected" || status === "Archived") {
    variant = "danger";
  }
  return <span className={`os-status-pill status-${variant} os-badge ${variant}`}>{status}</span>;
};

import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction
}) => (
  <div style={{ padding: "36px 20px", textAlign: "center" }}>
    <strong style={{ display: "block", fontSize: "14px", marginBottom: "6px" }}>{title}</strong>
    <p style={{ color: "var(--text-secondary)", fontSize: "12.5px", margin: "0 0 14px" }}>
      {description}
    </p>
    {actionLabel && onAction && (
      <button type="button" className="btn-secondary" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

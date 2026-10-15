import React from "react";

interface ScoreProps {
  score: number;
  showBar?: boolean;
}

export const Score: React.FC<ScoreProps> = ({ score, showBar = true }) => {
  const color =
    score >= 88
      ? "var(--status-success-fg)"
      : score >= 78
      ? "var(--status-info-fg)"
      : score >= 60
      ? "var(--status-warning-fg)"
      : "var(--status-danger-fg)";

  return (
    <span className="os-score-widget" title={`Explainable Fit Score: ${score}/100`}>
      <span style={{ color }}>{score}</span>
      {showBar && (
        <span className="os-score-bar-track" aria-hidden="true">
          <span
            className="os-score-bar-fill"
            style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: color }}
          />
        </span>
      )}
    </span>
  );
};

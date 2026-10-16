import React from "react";

interface ScoreProps {
  score: number;
  showBar?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Score: React.FC<ScoreProps> = ({ score, showBar = true, size = "md" }) => {
  const bounded = Math.max(0, Math.min(100, Math.round(score || 0)));

  const color =
    bounded >= 88
      ? "var(--status-success-fg)"
      : bounded >= 78
      ? "var(--status-info-fg)"
      : bounded >= 60
      ? "var(--status-warning-fg)"
      : "var(--text-muted)";

  const barWidth = size === "lg" ? 64 : size === "sm" ? 36 : 46;
  const barHeight = size === "lg" ? 6 : size === "sm" ? 3.5 : 4.5;
  const fontSize = size === "lg" ? "14px" : size === "sm" ? "11.5px" : "12.5px";

  return (
    <div
      className={`os-score-widget os-score-${size}`}
      title={`Explainable Fit Score: ${bounded}/100`}
      style={{ display: "inline-flex", alignItems: "center", gap: size === "sm" ? "6px" : "8px" }}
    >
      <span
        className="mono"
        style={{
          color,
          fontSize,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          minWidth: size === "sm" ? "18px" : "22px",
          textAlign: "right"
        }}
      >
        {bounded}
      </span>
      {showBar && (
        <span
          className="os-score-bar-track"
          aria-hidden="true"
          style={{
            width: `${barWidth}px`,
            height: `${barHeight}px`,
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "999px",
            overflow: "hidden",
            display: "inline-block",
            verticalAlign: "middle"
          }}
        >
          <span
            className="os-score-bar-fill"
            style={{
              display: "block",
              width: `${bounded}%`,
              height: "100%",
              backgroundColor: color,
              borderRadius: "999px",
              transition: "width 0.25s ease-out"
            }}
          />
        </span>
      )}
    </div>
  );
};

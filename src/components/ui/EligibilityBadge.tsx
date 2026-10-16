import React from "react";
import type { OpportunityRecord } from "../../types/opportunity";

interface EligibilityBadgeProps {
  opportunity: OpportunityRecord;
}

export const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({ opportunity }) => {
  if (opportunity.is_active === false) {
    return (
      <span
        className="os-badge danger mono"
        style={{ fontSize: "11px" }}
        title="Excluded from active pipeline by hard eligibility gate (seniority or regional lock)"
      >
        Gated
      </span>
    );
  }

  const raw =
    opportunity.eligibility_status ||
    opportunity.details?.eligibility_confidence ||
    opportunity.details?.visa_status ||
    opportunity.details?.region_eligibility ||
    "UNKNOWN";

  if (raw === "CONFIRMED") {
    return (
      <span
        className="os-badge success mono"
        style={{ fontSize: "11px" }}
        title="Full work authorization / eligibility confirmed"
      >
        Confirmed
      </span>
    );
  }

  if (raw === "LIKELY") {
    return (
      <span
        className="os-badge info mono"
        style={{ fontSize: "11px" }}
        title="Alignment likely — verify specific employer requirement in drawer"
      >
        Likely
      </span>
    );
  }

  if (raw === "NO") {
    return (
      <span
        className="os-badge danger mono"
        style={{ fontSize: "11px" }}
        title="Hard eligibility gate triggered"
      >
        Gated
      </span>
    );
  }

  // Restrained, quiet secondary pill instead of loud amber warning
  return (
    <span
      className="os-badge neutral mono"
      style={{ fontSize: "11px", opacity: 0.85 }}
      title="Candidate profile legal state unconfirmed — details in drawer"
    >
      Unknown
    </span>
  );
};

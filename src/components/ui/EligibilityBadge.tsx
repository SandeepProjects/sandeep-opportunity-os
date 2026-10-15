import React from "react";
import type { OpportunityRecord } from "../../types/opportunity";

interface EligibilityBadgeProps {
  opportunity: OpportunityRecord;
}

export const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({ opportunity }) => {
  if (opportunity.is_active === false) {
    return <span className="os-badge danger">Excluded · Gated</span>;
  }
  const raw =
    opportunity.eligibility_status ||
    opportunity.details?.eligibility_confidence ||
    opportunity.details?.visa_status ||
    opportunity.details?.region_eligibility ||
    "UNKNOWN";

  if (raw === "CONFIRMED") {
    return <span className="os-badge success">CONFIRMED</span>;
  }
  if (raw === "LIKELY") {
    return <span className="os-badge info">LIKELY · Verify</span>;
  }
  if (raw === "NO") {
    return <span className="os-badge danger">EXCLUDED</span>;
  }
  return <span className="os-badge warning">UNKNOWN · Confirm Profile</span>;
};

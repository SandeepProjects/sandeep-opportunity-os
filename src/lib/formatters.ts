/**
 * Opportunity OS — Enterprise Display Formatters
 * Canonical formatters for category names, status labels, priorities, numbers, and currency.
 */

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  freelance_leads: "Freelance",
  visa_jobs: "Visa / Cyprus Jobs",
  remote_jobs: "Remote EMEA",
  masters_scholarships: "Master’s & Scholarships",
  all: "All Pipelines"
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  freelance_leads: "Cyprus & UK SME website redesigns, booking systems & commercial hooks",
  visa_jobs: "Nicosia, Limassol & EU visa-sponsoring junior/mid engineering roles",
  remote_jobs: "Distributed European/EMEA engineering roles (excluding US/Africa lockouts)",
  masters_scholarships: "UCLan Cyprus 40% alumni discount, MSc Computing & Erasmus Mundus",
  all: "Unified multi-agent cross-pipeline opportunity intelligence directory"
};

/**
 * Returns a human-friendly display title for a pipeline category.
 * Never exposes raw internal enum values like 'freelance_leads' or 'visa_jobs'.
 */
export function formatCategoryName(category: string | null | undefined): string {
  if (!category) return "Uncategorized";
  const normalized = String(category).toLowerCase().trim();
  if (CATEGORY_DISPLAY_NAMES[normalized]) {
    return CATEGORY_DISPLAY_NAMES[normalized];
  }
  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns human-readable description for a category.
 */
export function formatCategoryDescription(category: string | null | undefined): string {
  if (!category) return "";
  const normalized = String(category).toLowerCase().trim();
  return CATEGORY_DESCRIPTIONS[normalized] || "";
}

/**
 * Formats CRM Workflow Status values.
 */
export function formatStatusName(status: string | null | undefined): string {
  if (!status) return "New";
  switch (status) {
    case "New":
      return "New Lead";
    case "Saved":
      return "Saved";
    case "Preparing":
      return "Preparing Application";
    case "Contacted":
      return "Contacted";
    case "Applied":
      return "Applied";
    case "Interviewing":
      return "Interviewing";
    case "Follow-Up":
      return "Follow-Up";
    case "Won":
      return "Offer / Won";
    case "Rejected":
      return "Closed / Rejected";
    case "Archived":
      return "Archived";
    default:
      return status;
  }
}

/**
 * Formats Priority labels into clear enterprise tiers.
 */
export function formatPriorityLabel(priority: string | null | undefined): string {
  if (!priority) return "P1 · Target";
  switch (priority) {
    case "P0":
    case "High":
      return "P0 · Urgent";
    case "P1":
    case "Medium":
      return "P1 · Target";
    case "P2":
    case "Low":
      return "P2 · Normal";
    default:
      return priority;
  }
}

/**
 * Formats currency values cleanly.
 */
export function formatCurrency(
  amount: string | number | null | undefined,
  fallback = "Unspecified"
): string {
  if (amount === null || amount === undefined || amount === "") return fallback;
  if (typeof amount === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(amount);
  }
  return String(amount);
}

/**
 * Formats numbers with comma separators.
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

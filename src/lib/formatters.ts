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

/**
 * Decodes all HTML entities (decimal, hex, and named) from text strings.
 * Converts &#8364; / &euro; -> €, &#8212; / &mdash; -> —, &#8211; -> –, &#201; -> É, etc.
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return "";
  let decoded = String(text);

  const namedEntities: Record<string, string> = {
    "&euro;": "€",
    "&pound;": "£",
    "&yen;": "¥",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "…",
    "&bull;": "•",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&nbsp;": " ",
    "&lt;": "<",
    "&gt;": ">",
    "&Eacute;": "É",
    "&eacute;": "é",
    "&Agrave;": "À",
    "&agrave;": "à",
    "&Uuml;": "Ü",
    "&uuml;": "ü",
    "&Ouml;": "Ö",
    "&ouml;": "ö",
    "&Auml;": "Ä",
    "&auml;": "ä"
  };

  // 1. Decimal entities: &#8364; -> €
  decoded = decoded.replace(/&#(\d+);/g, (match, code) => {
    const num = parseInt(code, 10);
    return !isNaN(num) && num > 0 ? String.fromCharCode(num) : match;
  });

  // 2. Hex entities: &#x2014; -> —
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    const num = parseInt(hex, 16);
    return !isNaN(num) && num > 0 ? String.fromCharCode(num) : match;
  });

  // 3. Known named entities
  for (const [entity, char] of Object.entries(namedEntities)) {
    if (decoded.includes(entity)) {
      decoded = decoded.replaceAll(entity, char);
    }
  }

  // 4. Double-escaped entities: &amp;#8364; or &amp;euro; or &amp;
  if (decoded.includes("&amp;")) {
    decoded = decoded.replace(/&amp;#(\d+);/g, (match, code) => {
      const num = parseInt(code, 10);
      return !isNaN(num) && num > 0 ? String.fromCharCode(num) : match;
    });
    for (const [entity, char] of Object.entries(namedEntities)) {
      const doubleEntity = "&amp;" + entity.slice(1);
      if (decoded.includes(doubleEntity)) {
        decoded = decoded.replaceAll(doubleEntity, char);
      }
    }
    decoded = decoded.replaceAll("&amp;", "&");
  }

  return decoded;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};

/**
 * Parses diverse deadline strings into a numeric UTC timestamp ms for accurate chronological sorting.
 * Imminent / concrete dates sort earliest; vague/TBC/empty dates return Infinity to sit gracefully at bottom.
 */
export function parseDeadlineTimestamp(deadline: string | null | undefined): number {
  if (!deadline) return Infinity;
  const clean = decodeHtmlEntities(deadline).trim();
  if (!clean) return Infinity;

  // Pure vague / TBC strings with no year or future call
  if (/^(tbc|tba|next round|not yet confirmed|window opens)/i.test(clean) && !clean.match(/202[6-9]/)) {
    return Infinity;
  }

  // 1. European format: DD.MM.YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/(\d{1,2})[./](\d{1,2})[./](202\d)/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return Date.UTC(year, month, day);
  }

  // 2. Day Month Year: e.g. "15 Jan 2027", "5 Jan 2027", "14 Dec 2026", "1 Feb 2027"
  const dayMonthMatch = clean.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(202\d)/i);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const mStr = dayMonthMatch[2].toLowerCase().slice(0, 3);
    const year = parseInt(dayMonthMatch[3], 10);
    if (MONTH_INDEX[mStr] !== undefined) {
      return Date.UTC(year, MONTH_INDEX[mStr], day);
    }
  }

  // 3. Month Year: e.g. "~mid-Feb 2027", "July 2027", "Feb 2027"
  const monthYearMatch = clean.match(/([A-Za-z]{3,9})\s+(202\d)/i);
  if (monthYearMatch) {
    const mStr = monthYearMatch[1].toLowerCase().slice(0, 3);
    const year = parseInt(monthYearMatch[2], 10);
    if (MONTH_INDEX[mStr] !== undefined) {
      const day = clean.toLowerCase().includes("mid") ? 15 : clean.toLowerCase().includes("early") ? 7 : 28;
      return Date.UTC(year, MONTH_INDEX[mStr], day);
    }
  }

  // 4. Spring / Autumn / Summer: e.g. "Spring 2027 (est.)"
  if (/spring\s+(202\d)/i.test(clean)) {
    const year = parseInt(clean.match(/spring\s+(202\d)/i)![1], 10);
    return Date.UTC(year, 3, 30);
  }
  if (/summer\s+(202\d)/i.test(clean)) {
    const year = parseInt(clean.match(/summer\s+(202\d)/i)![1], 10);
    return Date.UTC(year, 6, 31);
  }
  if (/autumn|fall\s+(202\d)/i.test(clean)) {
    const year = parseInt(clean.match(/(?:autumn|fall)\s+(202\d)/i)![1], 10);
    return Date.UTC(year, 9, 31);
  }

  // 5. Year only fallback: e.g. "2027"
  const yearMatch = clean.match(/(202\d)/);
  if (yearMatch) {
    return Date.UTC(parseInt(yearMatch[1], 10), 11, 31);
  }

  return Infinity;
}

/**
 * Normalizes priority codes (P0/P1/P2/P3) and labels (Critical/High/Medium/Low)
 */
export function normalizePriority(priority: string | null | undefined): string {
  if (!priority) return "P1";
  const p = String(priority).trim();
  if (p === "P0" || p === "Critical" || p === "Urgent") return "P0";
  if (p === "P1" || p === "High" || p === "Target") return "P1";
  if (p === "P2" || p === "Medium" || p === "Normal") return "P2";
  if (p === "P3" || p === "Low") return "P3";
  return p;
}


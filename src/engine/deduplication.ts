import type { OpportunityRecord } from "../types/opportunity";

export function canonicalizeOpportunityUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  const parsed = new URL(rawUrl.trim());
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  const kept: string[] = [];
  parsed.searchParams.forEach((val, key) => {
    if (!/^(utm_|fbclid|gclid|ref$)/i.test(key)) {
      kept.push(`${key}=${val}`);
    }
  });
  kept.sort();
  return `${parsed.protocol.toLowerCase()}//${host}${path}${kept.length ? "?" + kept.join("&") : ""}`;
}

export function buildOpportunityFingerprint(rec: Pick<OpportunityRecord, "category" | "organization" | "title">): string {
  const org = rec.organization.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const titleCore = rec.title.split("—")[0].split("[")[0].toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `${rec.category}::${org}::${titleCore}`;
}

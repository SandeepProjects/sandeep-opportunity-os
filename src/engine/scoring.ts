import type { OpportunityRecord, CandidateProfile, ScoringWeightsMap } from "../types/opportunity";
import { normalizeScoreComponents } from "./core";

export function computeExplainableOpportunityScore(
  record: OpportunityRecord,
  profile: CandidateProfile,
  defaultWeights: ScoringWeightsMap
): number {
  const cat = record.category;
  const normalizedComps = normalizeScoreComponents(record);
  const userWeights = profile.scoring_weights?.[cat] || {};
  const baseMax = defaultWeights[cat] || {};

  const totalUserWeight =
    Object.values(userWeights).reduce<number>((sum, v) => sum + Number(v || 0), 0) || 100;

  let weightedAcc = 0;
  let eligibilityScore = 20;

  for (const comp of normalizedComps) {
    const key = comp.key || comp.label.toLowerCase();
    const rawScore = Number(comp.points || 0);
    if (key === "eligibility") {
      eligibilityScore = rawScore;
    }
    const maxPossible = baseMax[key] || comp.max_points || 20;
    const targetWeight = userWeights[key] ?? maxPossible;
    weightedAcc += (rawScore / maxPossible) * targetWeight;
  }

  let normalized = Math.round((weightedAcc / totalUserWeight) * 100);

  // Hard Gate 1: Remote regional restriction gate (e.g. Africa-only or US-only remote)
  if (cat === "remote_jobs" && eligibilityScore === 0) {
    normalized = Math.max(0, normalized - 20);
  }

  // Hard Gate 2: Seniority gate (5+ yr Senior/Principal roles filtered out of Today queue)
  if (cat === "visa_jobs" && eligibilityScore === 0) {
    normalized = Math.min(normalized, 28);
  }

  return Math.max(0, Math.min(100, normalized));
}

import type {
  OpportunityRecord,
  CandidateProfile,
  ScoreComponentMap,
  ScoringWeights
} from "../types/opportunity";

export function computeExplainableOpportunityScore(
  record: OpportunityRecord,
  profile: CandidateProfile,
  defaultWeights: ScoringWeights
): number {
  const cat = record.category;
  const comps: ScoreComponentMap = Array.isArray(record.score_components)
    ? Object.fromEntries(
        record.score_components.map((component) => [component.key || component.label, component.points])
      )
    : record.score_components;
  const userWeights = profile.scoring_weights?.[cat] || {};
  const baseMax = defaultWeights[cat] || {};

  const totalUserWeight =
    Object.values(userWeights).reduce((sum, v) => sum + Number(v || 0), 0) || 100;

  let weightedAcc = 0;
  for (const [key, rawScore] of Object.entries(comps)) {
    const maxPossible = baseMax[key] || 20;
    const targetWeight = userWeights[key] ?? maxPossible;
    weightedAcc += (Number(rawScore) / maxPossible) * targetWeight;
  }

  let normalized = Math.round((weightedAcc / totalUserWeight) * 100);

  // Hard Gate 1: Remote regional restriction gate (e.g. Africa-only or US-only remote)
  if (cat === "remote_jobs" && comps.eligibility === 0) {
    normalized = Math.max(0, normalized - 20);
  }

  // Hard Gate 2: Seniority gate (5+ yr Senior/Principal roles filtered out of Today queue)
  if (cat === "visa_jobs" && comps.eligibility === 0) {
    normalized = Math.min(normalized, 28);
  }

  return Math.max(0, Math.min(100, normalized));
}

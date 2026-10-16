import type { AgentProvenance, AgentId } from "./agent";

export type PipelineCategory =
  | "freelance_leads"
  | "visa_jobs"
  | "masters_scholarships"
  | "remote_jobs";

export type EligibilityStatus = "CONFIRMED" | "LIKELY" | "UNKNOWN" | "NO";

export type WorkflowStatus =
  | "New"
  | "Saved"
  | "Preparing"
  | "Contacted"
  | "Applied"
  | "Interviewing"
  | "Follow-Up"
  | "Won"
  | "Rejected"
  | "Archived";

export type PriorityLevel = "High" | "Medium" | "Low" | "P0" | "P1" | "P2";

export type FollowUpBucket =
  | "Overdue"
  | "Due today"
  | "Tomorrow"
  | "This week"
  | "Later"
  | "No follow-up";

export interface ScoreComponent {
  key?: string;
  label: string;
  points: number;
  max_points: number;
  rationale?: string;
}

export type ScoreComponentMap = Record<string, number>;
export type ScoringWeights = Partial<Record<PipelineCategory, Record<string, number>>>;

export interface WhyThisMatches {
  strong: string[];
  review: string[];
  gap: string[];
}

export interface ActivityEvent {
  at: string;
  label: string;
}

export interface WorkflowState {
  status: WorkflowStatus;
  priority: PriorityLevel;
  favorite: boolean;
  follow_up_date: string | null;
  contacted_date: string | null;
  applied_date: string | null;
  personal_notes: string;
}

export interface OpportunityDetails {
  sector?: string;
  website_findings?: string[];
  deterministic_findings?: string[];
  inferred_findings?: string[];
  recommended_solution?: string;
  public_contact?: string;
  outreach_hook?: string;
  case_study_proof?: string;
  work_mode?: string;
  visa_status?: EligibilityStatus;
  salary_range?: string;
  stack_match?: string[];
  years_required?: number;
  program_name?: string;
  tuition_and_coverage?: string;
  eligibility_confidence?: EligibilityStatus;
  required_documents?: string[];
  remote_boundary?: string;
  region_eligibility?: EligibilityStatus;
  compensation?: string;
  project_band?: string;
  suggested_service_angle?: string;
  visa_sponsorship_status?: string;
  remote_geography_class?: string;
  eligibility_status?: EligibilityStatus;
}

export interface OpportunityRecord {
  id: string;
  category: PipelineCategory;
  title: string;
  organization: string;
  location: string;
  source_url: string;
  provenance_urls?: string[];
  agent_provenance?: AgentProvenance[];
  discovered_by_agent?: AgentId;
  last_verified_at: string;
  deadline?: string | null;
  is_active: boolean;
  confidence: string;
  eligibility_status?: EligibilityStatus;
  score_total: number;
  score_components: ScoreComponent[] | ScoreComponentMap;
  why_this_matches: WhyThisMatches;
  deterministic_findings: string[];
  inferred_findings: string[];
  deterministic_evidence?: string[];
  why_matches?: WhyThisMatches;
  details: OpportunityDetails;
  user_status: WorkflowStatus;
  /** Legacy import alias; prefer workflow.status or user_status in application code. */
  status?: WorkflowStatus | "Review" | "High Priority" | "Interview" | "Follow-up" | "Not Suitable" | "Expired";
  priority: PriorityLevel;
  favorite: boolean;
  follow_up_date: string | null;
  contacted_date?: string | null;
  applied_date?: string | null;
  personal_notes: string;
  workflow: WorkflowState;
  activity_history: ActivityEvent[];
  /** Legacy import alias; prefer activity_history in application code. */
  history?: ActivityEvent[];
  action_badge?: string;
  action_reason?: string;
  follow_up_bucket?: FollowUpBucket;
  queue_priority_score?: number;
}

export interface CandidateProfile {
  full_name: string;
  location: string;
  degree: string;
  graduation: string;
  portfolio_url: string;
  github_url: string;
  citizenship: string;
  eu_eea_status: string;
  work_permit_status: string;
  target_tracks: string[];
  core_stack: string[];
  target_level?: string;
  scoring_weights?: ScoringWeights;
  scoring_preferences?: {
    fit_weight: number;
    evidence_weight: number;
    eligibility_weight: number;
  };
  portfolio_projects?: Array<{
    title: string;
    role: string;
    stack: string;
    impact: string;
    url: string;
  }>;
}

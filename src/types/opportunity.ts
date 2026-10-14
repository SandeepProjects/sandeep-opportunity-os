export type PipelineCategory =
  | "freelance_leads"
  | "visa_jobs"
  | "masters_scholarships"
  | "remote_jobs";

export type EligibilityStatus = "CONFIRMED" | "LIKELY" | "UNKNOWN" | "NO";

export const CANONICAL_WORKFLOW_STATUSES = [
  "New",
  "Reviewing",
  "High Priority",
  "Saved",
  "Contacted",
  "Preparing",
  "Applied",
  "Interview",
  "Follow-up",
  "Won",
  "Offer",
  "Rejected",
  "Not Suitable",
  "Expired",
  "Archived"
] as const;

export type WorkflowStatus = (typeof CANONICAL_WORKFLOW_STATUSES)[number];

export const CANONICAL_PRIORITIES = ["High", "Medium", "Low", "P0", "P1", "P2", "P3"] as const;
export type PriorityLevel = (typeof CANONICAL_PRIORITIES)[number];

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

export type ScoreComponentsMap = Record<string, number>;

export interface WhyThisMatches {
  strong: string[];
  review: string[];
  gap: string[];
}

export interface ActivityEvent {
  at: string;
  label: string;
  ts?: string;
  event?: string;
  actor?: string;
}

export interface WorkflowState {
  status: WorkflowStatus;
  priority: PriorityLevel;
  favorite: boolean;
  follow_up_date: string | null;
  contacted_date: string | null;
  applied_date: string | null;
  contacted_at?: string | null;
  applied_at?: string | null;
  personal_notes: string;
}

export interface OpportunityDetails {
  niche?: string;
  sector?: string;
  website_findings?: string[];
  observable_issues?: string[];
  deterministic_findings?: string[];
  inferred_findings?: string[];
  recommended_solution?: string;
  suggested_service_angle?: string;
  public_contact?: string;
  detected_stack?: string;
  outreach_hook?: string;
  project_band?: string;
  case_study_proof?: string;
  work_mode?: string;
  work_model?: string;
  work_type?: string;
  arrangement?: string;
  experience_required?: string;
  core_stack?: string[];
  matching_skills?: string[];
  missing_requirements?: string[];
  language_req?: string;
  visa_status?: EligibilityStatus;
  visa_sponsorship_status?: EligibilityStatus;
  visa_evidence?: string;
  direct_apply_url?: string;
  salary_range?: string;
  stack_match?: string[];
  years_required?: number;
  program_name?: string;
  programme_name?: string;
  programme_url?: string;
  scholarship_name?: string;
  scholarship_url?: string;
  tuition_fee?: string;
  funding_coverage?: string;
  tuition_and_coverage?: string;
  academic_requirements?: string;
  english_requirements?: string;
  citizenship_rules?: string;
  eligibility_status?: EligibilityStatus;
  eligibility_confidence?: EligibilityStatus;
  application_deadline?: string;
  programme_deadline?: string;
  funding_deadline?: string;
  start_date?: string;
  required_documents?: string[];
  remote_boundary?: string;
  remote_region_restrictions?: string;
  remote_geography_class?: string;
  timezone_constraint?: string;
  cyprus_eligibility?: EligibilityStatus;
  region_eligibility?: EligibilityStatus;
  region_restricted_out_of_cyprus?: boolean;
  requires_eu_citizenship?: boolean;
  compensation?: string;
  published_date?: string;
  why_this_matches?: WhyThisMatches;
  why_matches?: WhyThisMatches;
}

export interface OpportunityRecord {
  id: string;
  record_id?: string;
  category: PipelineCategory;
  title: string;
  organization: string;
  domain?: string;
  location: string;
  country?: string;
  source_url: string;
  canonical_url?: string;
  fingerprint?: string;
  secondary_sources?: string[];
  provenance_urls?: string[];
  source_type?: string;
  retrieved_at?: string;
  last_verified_at: string;
  published_date?: string;
  deadline?: string | null;
  is_active: boolean;
  confidence: string;
  eligibility_status?: EligibilityStatus;
  score_total: number;
  score_components: ScoreComponent[] | ScoreComponentsMap;
  score_explanation?: string[];
  why_this_matches: WhyThisMatches;
  why_matches?: WhyThisMatches;
  deterministic_findings: string[];
  deterministic_evidence?: string[];
  inferred_findings: string[];
  inferred_observations?: string[];
  details: OpportunityDetails;
  status: WorkflowStatus;
  user_status: WorkflowStatus;
  priority: PriorityLevel;
  favorite: boolean;
  follow_up_date: string | null;
  contacted_date?: string | null;
  applied_date?: string | null;
  contacted_at?: string | null;
  applied_at?: string | null;
  personal_notes: string;
  workflow: WorkflowState;
  activity_history: ActivityEvent[];
  history?: ActivityEvent[];
  action_badge?: string;
  follow_up_bucket?: FollowUpBucket;
  queue_priority_score?: number;
}

export interface EducationEntry {
  degree: string;
  classification: string;
  institution: string;
  location: string;
  graduation_date: string;
  verified_source?: string;
}

export interface FlagshipProject {
  name: string;
  url: string;
  stack: string[];
  outcome: string;
}

export type ScoringWeightsMap = Record<PipelineCategory, Record<string, number>>;

export interface CandidateProfile {
  id: string;
  full_name: string;
  headline?: string;
  base_location?: string;
  location?: string;
  degree?: string;
  graduation?: string;
  portfolio_url: string;
  about_url?: string;
  github_url: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  education?: EducationEntry[];
  experience_years?: number;
  career_level_target?: string;
  core_skills?: string[];
  core_stack?: string[];
  target_tracks?: string[];
  flagship_projects?: FlagshipProject[];
  citizenship: string;
  eu_citizenship?: string;
  eu_eea_status?: string;
  cyprus_residency_permit_type?: string;
  cyprus_full_time_work_rights?: string;
  work_permit_status?: string;
  uk_work_rights?: string;
  relocation_readiness?: string;
  remote_timezone_preference?: string;
  scoring_weights?: ScoringWeightsMap;
}

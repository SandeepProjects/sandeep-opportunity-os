import React, { useEffect, useState } from "react";
import type { CandidateProfile } from "../../types/opportunity";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionPanel } from "../../components/ui/SectionPanel";

interface ProfilePageProps {
  profile: CandidateProfile;
  onUpdateProfile: (profile: CandidateProfile) => void;
}

const DEFAULT_SCORING = {
  fit_weight: 35,
  evidence_weight: 20,
  eligibility_weight: 20
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onUpdateProfile }) => {
  const [draft, setDraft] = useState<CandidateProfile>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const scoring = draft.scoring_preferences || DEFAULT_SCORING;
  const targetLevel =
    draft.target_level || "Junior / Graduate / Early-Career, normally 0–2 years experience";

  const projects = draft.portfolio_projects || [
    {
      title: "Orama Design & Build — Architectural Showcase",
      role: "Lead Web Designer & Frontend Developer",
      stack: "React · TypeScript · Technical SEO",
      impact: "High-conversion commercial showcase for a Cyprus design-build firm.",
      url: "https://www.sandeep-gautam.com/work/orama-design-build"
    },
    {
      title: "Nikolas Leontides — Legal Consultation Booking Portal",
      role: "Full-Stack Web Developer",
      stack: "React · Booking Workflow · LegalService Schema",
      impact: "Interactive consultation booking and practice-area triage portal for a Nicosia advocate.",
      url: "https://www.sandeep-gautam.com/work/nikolas-lawyer-booking"
    },
    {
      title: "Clipboard Sync — Cross-Device Workspace Utility",
      role: "Creator & Frontend Architect",
      stack: "React · TypeScript · Supabase Realtime · Hostinger",
      impact: "Low-latency clipboard synchronization web application deployed via GitHub & Hostinger.",
      url: "https://www.sandeep-gautam.com/work/clipboard-sync"
    }
  ];

  const updateProfile = (patch: Partial<CandidateProfile>): void => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onUpdateProfile(next);
  };

  const updateScoring = (patch: Partial<NonNullable<CandidateProfile["scoring_preferences"]>>): void => {
    updateProfile({ scoring_preferences: { ...scoring, ...patch } });
  };

  return (
    <>
      <PageHeader
        eyebrow="CANDIDATE PROFILE, LEGAL GOVERNANCE & SCORING PREFERENCES"
        title={`${draft.full_name} — Candidate & Scoring Configuration`}
        subtitle="Strict non-assumption policy: Citizenship, EU/EEA fee status, and Cyprus work authorization remain UNKNOWN unless explicitly verified. Changes are persisted locally and survive data refreshes."
      />

      <div className="os-grid-2">
        <SectionPanel
          title="1. Candidate Profile & Career Targets"
          subtitle="Verified academic and commercial profile from sandeep-gautam.com"
        >
          <div className="os-profile-stack">
            <div><strong>Education:</strong> {draft.degree}</div>
            <div><strong>Base Location:</strong> {draft.location}</div>
            <div>
              <strong>Target Career Level:</strong>{" "}
              <span className="os-badge info">{targetLevel}</span>
            </div>
            <div>
              <strong>Seniority Gate Rule:</strong> Automatically gates out Senior/Lead/Principal roles requiring{" "}
              <span className="mono">5+ years</span> experience from the active Today queue.
            </div>
            <div className="os-inline-actions">
              <a href={draft.portfolio_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                sandeep-gautam.com ↗
              </a>
              <a href={draft.github_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                GitHub (SandeepProjects) ↗
              </a>
            </div>
          </div>
        </SectionPanel>

        <SectionPanel
          title="2. Legal & Eligibility State (Non-Assumed Defaults)"
          subtitle="Never inferred from Cyprus university location; defaults to UNKNOWN"
        >
          <div className="os-profile-form">
            <label className="os-field-label">
              <span>Citizenship Status</span>
              <select
                className="os-select"
                value={draft.citizenship || "UNKNOWN"}
                onChange={(e) => updateProfile({ citizenship: e.target.value })}
              >
                <option value="UNKNOWN">UNKNOWN (Require manual confirmation)</option>
                <option value="NON_EU">Non-EU / Third-Country National</option>
                <option value="EU_EEA">EU / EEA Citizen</option>
              </select>
            </label>

            <label className="os-field-label">
              <span>University Tuition Fee Classification</span>
              <select
                className="os-select"
                value={draft.eu_eea_status || "UNKNOWN"}
                onChange={(e) => updateProfile({ eu_eea_status: e.target.value })}
              >
                <option value="UNKNOWN">UNKNOWN (Flag fee-dependent scholarships)</option>
                <option value="INTERNATIONAL_FEE">International / Non-EU Fee Payer</option>
                <option value="EU_HOME_FEE">EU / EEA Home Tuition Fee Status</option>
              </select>
            </label>

            <label className="os-field-label">
              <span>Cyprus Full-Time Work Authorization</span>
              <select
                className="os-select"
                value={draft.work_permit_status || "UNKNOWN"}
                onChange={(e) => updateProfile({ work_permit_status: e.target.value })}
              >
                <option value="UNKNOWN">UNKNOWN (Verify employer sponsorship / permit)</option>
                <option value="STUDENT_GRADUATE_PERMIT">Graduate / Requires Employer Sponsorship</option>
                <option value="UNRESTRICTED">Unrestricted Right to Work in Cyprus</option>
              </select>
            </label>
            <p className="os-setting-note">Saved in this browser as user-owned profile state. Research refreshes do not overwrite it.</p>
          </div>
        </SectionPanel>
      </div>

      <div className="os-grid-2">
        <SectionPanel
          title="3. Technical Stack & Core Capabilities"
          subtitle="Verified capabilities used as evidence by the scoring engine"
        >
          <div className="os-tag-cloud">
            {(draft.core_stack || []).map((tech) => (
              <span key={tech} className="os-badge neutral mono">{tech}</span>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel
          title="4. Scoring Preferences"
          subtitle="Persisted preference profile for future scoring runs; existing verified scores are not silently recomputed in the browser"
        >
          <div className="os-profile-form">
            <label className="os-field-label">
              <span>Stack, Academic & Case-Study Fit Weight ({scoring.fit_weight} pts)</span>
              <input
                type="range"
                min={20}
                max={45}
                value={scoring.fit_weight}
                onChange={(e) => updateScoring({ fit_weight: Number(e.target.value) })}
              />
            </label>
            <label className="os-field-label">
              <span>Deterministic Audit & Primary Source Evidence ({scoring.evidence_weight} pts)</span>
              <input
                type="range"
                min={10}
                max={35}
                value={scoring.evidence_weight}
                onChange={(e) => updateScoring({ evidence_weight: Number(e.target.value) })}
              />
            </label>
            <label className="os-field-label">
              <span>Visa, Region & Scholarship Eligibility Weight ({scoring.eligibility_weight} pts)</span>
              <input
                type="range"
                min={10}
                max={35}
                value={scoring.eligibility_weight}
                onChange={(e) => updateScoring({ eligibility_weight: Number(e.target.value) })}
              />
            </label>
            <p className="os-setting-note">Preferences are saved immediately. Canonical opportunity scores remain the verified research values until the scoring pipeline runs again.</p>
          </div>
        </SectionPanel>
      </div>

      <SectionPanel
        title="5. Verified Commercial Portfolio Case Studies"
        subtitle="Referenced in freelance outreach hooks and job-fit evidence"
      >
        <div className="os-grid-2 os-profile-project-grid">
          {projects.map((proj) => (
            <article key={proj.title} className="os-portfolio-card">
              <div className="os-portfolio-card-head">
                <strong>{proj.title}</strong>
                <a href={proj.url} target="_blank" rel="noopener noreferrer" className="mono">Live Case Study ↗</a>
              </div>
              <div className="os-portfolio-meta mono">{proj.role} · {proj.stack}</div>
              <p>{proj.impact}</p>
            </article>
          ))}
        </div>
      </SectionPanel>
    </>
  );
};

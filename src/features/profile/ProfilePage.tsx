import React from "react";
import type { CandidateProfile } from "../../types/opportunity";

interface ProfilePageProps {
  profile: CandidateProfile;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile }) => {
  const skills = profile.core_skills || profile.core_stack || [];
  const projects = profile.flagship_projects || [];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">CANDIDATE ELIGIBILITY & SCORING WEIGHTS</p>
          <h1 id="topbar-title">{profile.full_name} — Profile & Legal State</h1>
          <p className="subtext">
            {profile.headline || "Front-End Engineer, Web Developer & UI Specialist"} ·{" "}
            {profile.location || profile.base_location || "Nicosia, Cyprus"}
          </p>
        </div>
      </header>

      <div className="ops-grid">
        <div className="ops-card">
          <h3>Verified Education & Links</h3>
          <p>
            <strong>Degree:</strong> {profile.degree}
          </p>
          <p>
            <strong>Location:</strong> {profile.location || profile.base_location}
          </p>
          <p>
            <strong>Target Level:</strong> {profile.career_level_target || "Junior to Mid-Level (0–3 years)"}
          </p>
          <p>
            <strong>Portfolio:</strong>{" "}
            <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
              {profile.portfolio_url}
            </a>
          </p>
          <p>
            <strong>GitHub:</strong>{" "}
            <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
              {profile.github_url}
            </a>
          </p>
        </div>

        <div className="ops-card">
          <h3>Explicit Non-Assumed Legal State (Default: UNKNOWN)</h3>
          <p className="mono">Citizenship: {profile.citizenship || "UNKNOWN"}</p>
          <p className="mono">
            EU/EEA Fee Status: {profile.eu_eea_status || profile.eu_citizenship || "UNKNOWN"}
          </p>
          <p className="mono">
            Cyprus Work Permit:{" "}
            {profile.work_permit_status || profile.cyprus_full_time_work_rights || "UNKNOWN"}
          </p>
          <p className="mono">UK Work Rights: {profile.uk_work_rights || "UNKNOWN"}</p>
          <p className="subtext">
            Scoring engine never fabricates citizenship or visa eligibility unless explicitly confirmed.
          </p>
        </div>

        <div className="ops-card">
          <h3>Core Technical Stack ({skills.length})</h3>
          <div className="skill-tag-wrap">
            {skills.map((sk) => (
              <span key={sk} className="badge-mono">
                {sk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {projects.length > 0 && (
        <section className="panel-section">
          <h2>Verified Flagship Case Studies (Used for Freelance & Job Fit Matching)</h2>
          <div className="ops-grid">
            {projects.map((proj) => (
              <div key={proj.name} className="ops-card">
                <h3>
                  <a href={proj.url} target="_blank" rel="noopener noreferrer">
                    {proj.name} ↗
                  </a>
                </h3>
                <p>{proj.outcome}</p>
                <p className="mono-small">{proj.stack.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

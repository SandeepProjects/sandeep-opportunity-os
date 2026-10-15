import React, { useState, useRef, useEffect } from "react";
import type { AppRoutePath } from "../../app/router/router";
import type { OpportunityRecord } from "../../types/opportunity";
import type { DataSourceMode } from "../../features/opportunities/api/opportunityRepository";
import { Sidebar } from "./Sidebar";
import { SyncStatus } from "./SyncStatus";
import { Icon } from "./Icon";

interface AppShellProps {
  currentPath: AppRoutePath;
  onNavigate: (path: AppRoutePath) => void;
  opportunities: OpportunityRecord[];
  onSelectOpportunity: (opp: OpportunityRecord) => void;
  mode: DataSourceMode;
  lastSyncedAt: string;
  onSyncNow: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  children: React.ReactNode;
}

const ROUTE_TITLES: Record<AppRoutePath, { title: string; context: string }> = {
  "/today": { title: "Today Command Center", context: "Ranked Priority Queue & Follow-Up Schedule" },
  "/freelance": { title: "Freelance Client Leads", context: "Cyprus & UK High-Conversion Website & Portal Audits" },
  "/jobs": { title: "Visa & Cyprus Jobs", context: "Nicosia, Limassol & EU Visa-Sponsoring Engineering Roles" },
  "/masters": { title: "Master's & Scholarships", context: "Funded MSc Computing, HCI & Erasmus Mundus Programmes" },
  "/remote": { title: "Remote & Internships", context: "Cyprus / EMEA-Eligible Remote Engineering & Paid Internships" },
  "/saved": { title: "Saved & CRM Follow-ups", context: "Active Outreach, Applications & Scheduled Follow-Up Buckets" },
  "/operations": { title: "System Operations & Evidence", context: "Pipeline Integrity, Supabase State & Configured Sheets Target" },
  "/profile": { title: "Candidate Profile & Governance", context: "Junior / Graduate (0–2 yr) Targets, Legal State & Weights" }
};

export const AppShell: React.FC<AppShellProps> = ({
  currentPath,
  onNavigate,
  opportunities,
  onSelectOpportunity,
  mode,
  lastSyncedAt,
  onSyncNow,
  theme,
  onToggleTheme,
  children
}) => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [globalQuery, setGlobalQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "SELECT"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const counts: Record<AppRoutePath, number | undefined> = {
    "/today": opportunities.filter((o) => o.is_active !== false).length,
    "/freelance": opportunities.filter((o) => o.category === "freelance_leads" && o.is_active !== false).length,
    "/jobs": opportunities.filter((o) => o.category === "visa_jobs" && o.is_active !== false).length,
    "/masters": opportunities.filter((o) => o.category === "masters_scholarships" && o.is_active !== false).length,
    "/remote": opportunities.filter((o) => o.category === "remote_jobs" && o.is_active !== false).length,
    "/saved": opportunities.filter(
      (o) =>
        o.workflow?.favorite ||
        o.favorite ||
        ["Saved", "Preparing", "Contacted", "Applied", "Interviewing", "Follow-Up"].includes(
          o.workflow?.status || o.user_status
        )
    ).length,
    "/operations": 8,
    "/profile": undefined
  };

  const quickHits = globalQuery.trim()
    ? opportunities
        .filter((o) => {
          const q = globalQuery.toLowerCase();
          return (
            o.title.toLowerCase().includes(q) ||
            o.organization.toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q) ||
            o.location.toLowerCase().includes(q)
          );
        })
        .slice(0, 8)
    : [];

  const meta = ROUTE_TITLES[currentPath];

  return (
    <div className="os-shell" data-theme={theme}>
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        counts={counts}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onSyncNow={onSyncNow}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="os-main-column">
        <header className="os-topbar">
          <div className="os-topbar-left">
            <button
              type="button"
              className="os-mobile-menu-btn"
              aria-label="Toggle navigation drawer"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <Icon name="menu" size={16} />
            </button>
            <div className="os-breadcrumbs">
              <span className="os-breadcrumb-root">Opportunity OS</span>
              <span className="os-breadcrumb-sep">/</span>
              <span className="os-breadcrumb-current">{meta.title}</span>
            </div>
          </div>

          <div className="os-topbar-right">
            <div className="os-global-search-wrap">
              <span className="os-search-icon">
                <Icon name="search" size={13} />
              </span>
              <input
                ref={searchInputRef}
                type="search"
                className="os-global-search-input"
                placeholder="Jump to record or org..."
                aria-label="Global opportunity search (Press / to focus)"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
              />
              <kbd className="os-search-kbd">/</kbd>
              {quickHits.length > 0 && (
                <div className="os-search-dropdown" role="listbox" aria-label="Search results">
                  {quickHits.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      className="os-search-hit"
                      onClick={() => {
                        onSelectOpportunity(hit);
                        setGlobalQuery("");
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "12.5px" }}>{hit.title}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {hit.id} · {hit.organization}
                        </div>
                      </div>
                      <span className="mono" style={{ fontWeight: 700 }}>
                        {hit.score_total}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <SyncStatus mode={mode} lastSyncedAt={lastSyncedAt} onSyncNow={onSyncNow} />
          </div>
        </header>

        <main className="os-workspace-body">{children}</main>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useCallback } from "react";
import { AppRouterProvider, useAppRouter, type AppRoutePath } from "./app/router/router";
import {
  fetchOpportunityState,
  persistWorkflowMutation,
  simulateIdempotentResearchRefresh,
  type RepositoryState
} from "./features/opportunities/api/opportunityRepository";
import { TodayPage } from "./features/today/TodayPage";
import { WorkspacePage } from "./features/workspaces/WorkspacePage";
import { SavedFollowUpsPage } from "./features/crm/SavedFollowUpsPage";
import { OperationsPage } from "./features/operations/OperationsPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { OpportunityDetailDrawer } from "./components/OpportunityDetailDrawer";
import type { OpportunityRecord, WorkflowState } from "./types/opportunity";

const NAV_ITEMS: { path: AppRoutePath; label: string; routeKey: string }[] = [
  { path: "/today", label: "Today", routeKey: "today" },
  { path: "/freelance", label: "Freelance Leads", routeKey: "freelance_leads" },
  { path: "/jobs", label: "Visa / Cyprus Jobs", routeKey: "visa_jobs" },
  { path: "/masters", label: "Master's & Scholarships", routeKey: "masters_scholarships" },
  { path: "/remote", label: "Remote / Internships", routeKey: "remote_jobs" },
  { path: "/saved", label: "Saved / Follow-ups", routeKey: "saved" },
  { path: "/operations", label: "Operations", routeKey: "operations" },
  { path: "/profile", label: "Profile", routeKey: "profile" }
];

const AppShell: React.FC = () => {
  const { currentPath, navigate } = useAppRouter();
  const [repoState, setRepoState] = useState<RepositoryState | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityRecord | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  useEffect(() => {
    void fetchOpportunityState().then((state) => {
      setRepoState(state);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  }, [theme]);

  const handleUpdateWorkflow = useCallback(
    async (record: OpportunityRecord, patch: Partial<WorkflowState>) => {
      const updated = await persistWorkflowMutation(record, patch);
      setRepoState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          opportunities: prev.opportunities.map((o) => (o.id === updated.id ? updated : o))
        };
      });
      setSelectedOpportunity((prev) => (prev && prev.id === updated.id ? updated : prev));
    },
    []
  );

  const handleTriggerSync = useCallback(() => {
    setRepoState((prev) => {
      if (!prev) return prev;
      const refreshed = simulateIdempotentResearchRefresh(prev.opportunities);
      return {
        ...prev,
        opportunities: refreshed.records,
        lastSyncedAt: new Date().toISOString(),
        lastPreservedCount: refreshed.preservedCount
      };
    });
  }, []);

  if (!repoState) {
    return <div className="loading-state">Loading Sandeep Opportunity OS...</div>;
  }

  const {
    opportunities,
    profile,
    mode,
    nativeSheetId,
    uploadedXlsxId,
    lastSyncedAt,
    lastPreservedCount
  } = repoState;

  return (
    <div className="app-layout" data-theme={theme}>
      <nav
        className={`sidebar-nav ${mobileNavOpen ? "mobile-open" : ""}`}
        aria-label="Primary Navigation"
      >
        <div className="brand-header">
          <span className="brand-mark">SO</span>
          <div>
            <strong>Opportunity OS</strong>
            <div className="mono-small">{mode}</div>
          </div>
        </div>

        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <button
                type="button"
                data-route={item.routeKey}
                className={`nav-item ${currentPath === item.path ? "active" : ""}`}
                onClick={() => {
                  navigate(item.path);
                  setMobileNavOpen(false);
                }}
              >
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <button
            type="button"
            className="btn-secondary"
            aria-label="Toggle color theme"
            onClick={toggleTheme}
          >
            Theme: {theme === "dark" ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleTriggerSync}
          >
            Sync Google Sheet
          </button>
        </div>
      </nav>

      <div className="main-workspace">
        <div className="mobile-topbar">
          <button
            type="button"
            className="btn-secondary mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? "Close Menu" : "Menu"}
          </button>
          <strong className="mobile-brand-title">Sandeep Opportunity OS</strong>
          <button type="button" className="btn-secondary" onClick={toggleTheme}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>

        <main className="workspace-content">
          {currentPath === "/today" && (
            <TodayPage
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpportunity}
            />
          )}
          {currentPath === "/freelance" && (
            <WorkspacePage
              category="freelance_leads"
              title="Freelance Website & Web-App Client Leads"
              subtitle="Deterministic DOM/UX findings paired with commercial outreach hooks"
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpportunity}
              onUpdateWorkflow={handleUpdateWorkflow}
            />
          )}
          {currentPath === "/jobs" && (
            <WorkspacePage
              category="visa_jobs"
              title="Cyprus On-Site & EU Visa-Sponsoring Roles"
              subtitle="Frontend & Full-Stack roles with Seniority Gate enforcement"
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpportunity}
              onUpdateWorkflow={handleUpdateWorkflow}
            />
          )}
          {currentPath === "/masters" && (
            <WorkspacePage
              category="masters_scholarships"
              title="Master's Degrees & Funded Scholarships"
              subtitle="Honest fee/citizenship eligibility confidence (UNKNOWN until confirmed)"
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpportunity}
              onUpdateWorkflow={handleUpdateWorkflow}
            />
          )}
          {currentPath === "/remote" && (
            <WorkspacePage
              category="remote_jobs"
              title="Remote Jobs & Paid Internships (Cyprus / EMEA)"
              subtitle="Regional Restriction Gate penalizes US-only and Africa-only remote listings"
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpportunity}
              onUpdateWorkflow={handleUpdateWorkflow}
            />
          )}
          {currentPath === "/saved" && (
            <SavedFollowUpsPage
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpportunity}
            />
          )}
          {currentPath === "/operations" && (
            <OperationsPage
              mode={mode}
              nativeSheetId={nativeSheetId}
              uploadedXlsxId={uploadedXlsxId}
              lastSyncedAt={lastSyncedAt}
              recordCount={opportunities.length}
              lastPreservedCount={lastPreservedCount}
              onTriggerSync={handleTriggerSync}
            />
          )}
          {currentPath === "/profile" && <ProfilePage profile={profile} />}
        </main>
      </div>

      <OpportunityDetailDrawer
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onUpdateWorkflow={handleUpdateWorkflow}
      />
    </div>
  );
};

export const App: React.FC = () => (
  <AppRouterProvider>
    <AppShell />
  </AppRouterProvider>
);

export default App;

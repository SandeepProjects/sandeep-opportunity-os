import React, { useEffect, useState, useCallback } from "react";
import { AppRouterProvider, useAppRouter } from "./app/router/router";
import {
  fetchOpportunityState,
  getFastCachedState,
  performOpportunitySync,
  persistWorkflowMutation,
  persistCandidateProfile,
  type RepositoryState
} from "./features/opportunities/api/opportunityRepository";
import { AppShell } from "./components/ui/AppShell";
import { OpportunityDrawer } from "./components/ui/OpportunityDrawer";
import { LoadingSkeleton } from "./components/ui/LoadingSkeleton";
import { TodayPage } from "./features/today/TodayPage";
import { WorkspacePage } from "./features/workspaces/WorkspacePage";
import { SavedFollowUpsPage } from "./features/crm/SavedFollowUpsPage";
import { OperationsPage } from "./features/operations/OperationsPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import type { CandidateProfile, OpportunityRecord, WorkflowState } from "./types/opportunity";

const MainContent: React.FC = () => {
  const { currentPath, navigate } = useAppRouter();
  const [repoState, setRepoState] = useState<RepositoryState | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityRecord | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    // 1. Immediately hydrate from persistent cache if available for instant zero-latency render
    void getFastCachedState().then((cachedState) => {
      if (active && cachedState) {
        setRepoState((prev) => prev || cachedState);
      }
    });

    // 2. Fetch fresh live state from Supabase / server
    void fetchOpportunityState().then((state) => {
      if (active) {
        setRepoState(state);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", next);
      }
      return next;
    });
  }, []);

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
      setSelectedOpportunity(updated);
    },
    []
  );

  const handleTriggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      if (repoState) {
        const { state } = await performOpportunitySync(repoState.opportunities, repoState.profile);
        setRepoState(state);
        setSelectedOpportunity((current) =>
          current ? state.opportunities.find((item) => item.id === current.id) || null : null
        );
      } else {
        const refreshed = await fetchOpportunityState();
        setRepoState(refreshed);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [repoState]);

  const handleUpdateProfile = useCallback((nextProfile: CandidateProfile) => {
    const persisted = persistCandidateProfile(nextProfile);
    setRepoState((prev) => (prev ? { ...prev, profile: persisted } : prev));
  }, []);

  if (!repoState) {
    return <LoadingSkeleton />;
  }

  const { opportunities, profile, mode, nativeSheetId, uploadedXlsxId, lastSyncedAt } = repoState;

  return (
    <AppShell
      currentPath={currentPath}
      onNavigate={navigate}
      opportunities={opportunities}
      onSelectOpportunity={setSelectedOpportunity}
      mode={mode}
      lastSyncedAt={lastSyncedAt}
      onSyncNow={handleTriggerSync}
      isSyncing={isSyncing}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {currentPath === "/today" && (
        <TodayPage
          opportunities={opportunities}
          onSelectOpportunity={setSelectedOpportunity}
          onNavigate={navigate}
          lastSyncedAt={lastSyncedAt}
          onSyncNow={handleTriggerSync}
          isSyncing={isSyncing}
        />
      )}
      {currentPath === "/freelance" && (
        <WorkspacePage
          category="freelance_leads"
          title="Freelance Website & Web-App Client Leads"
          subtitle="High-conversion Cyprus & UK SME targets with deterministic DOM findings and commercial outreach hooks."
          opportunities={opportunities}
          selectedId={selectedOpportunity?.id}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}
      {currentPath === "/jobs" && (
        <WorkspacePage
          category="visa_jobs"
          title="Cyprus On-Site & EU Visa-Sponsoring Engineering Jobs"
          subtitle="Junior / Graduate & Early-Career (0–2 yr) frontend and full-stack roles with Seniority Gate enforcement."
          opportunities={opportunities}
          selectedId={selectedOpportunity?.id}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}
      {currentPath === "/masters" && (
        <WorkspacePage
          category="masters_scholarships"
          title="Master's Degrees & Funded Scholarships (2026/2027)"
          subtitle="UCLan Cyprus 40% Alumni Scholarship, Erasmus Mundus Joint Masters & EU MSc programmes."
          opportunities={opportunities}
          selectedId={selectedOpportunity?.id}
          onSelectOpportunity={setSelectedOpportunity}
        />
      )}
      {currentPath === "/remote" && (
        <WorkspacePage
          category="remote_jobs"
          title="Remote Engineering Jobs & Paid Internships (Cyprus / EMEA)"
          subtitle="Cyprus-compatible remote roles with Regional Restriction Gate excluding US-only & Africa-only listings."
          opportunities={opportunities}
          selectedId={selectedOpportunity?.id}
          onSelectOpportunity={setSelectedOpportunity}
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
          opportunities={opportunities}
          onTriggerSync={handleTriggerSync}
          isSyncing={isSyncing}
          telemetry={repoState.syncTelemetry}
        />
      )}
      {currentPath === "/profile" && (
        <ProfilePage profile={profile} onUpdateProfile={handleUpdateProfile} />
      )}

      <OpportunityDrawer
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onUpdateWorkflow={handleUpdateWorkflow}
      />
    </AppShell>
  );
};

export const App: React.FC = () => (
  <AppRouterProvider>
    <MainContent />
  </AppRouterProvider>
);

export default App;

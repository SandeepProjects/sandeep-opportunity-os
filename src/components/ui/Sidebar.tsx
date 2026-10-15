import React from "react";
import type { AppRoutePath } from "../../app/router/router";
import { Icon, type IconName } from "./Icon";

export interface NavItemConfig {
  path: AppRoutePath;
  label: string;
  icon: IconName;
  count?: number;
  group: "COMMAND CENTER" | "OPPORTUNITY PIPELINES" | "SYSTEM & GOVERNANCE";
}

interface SidebarProps {
  currentPath: AppRoutePath;
  onNavigate: (path: AppRoutePath) => void;
  counts: Record<AppRoutePath, number | undefined>;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSyncNow: () => void;
  isSyncing?: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_GROUPS: ("COMMAND CENTER" | "OPPORTUNITY PIPELINES" | "SYSTEM & GOVERNANCE")[] = [
  "COMMAND CENTER",
  "OPPORTUNITY PIPELINES",
  "SYSTEM & GOVERNANCE"
];

const NAV_ITEMS: Omit<NavItemConfig, "count">[] = [
  { path: "/today", label: "Today Command", icon: "today", group: "COMMAND CENTER" },
  { path: "/saved", label: "Saved & Follow-ups", icon: "saved", group: "COMMAND CENTER" },
  { path: "/freelance", label: "Freelance Leads", icon: "freelance", group: "OPPORTUNITY PIPELINES" },
  { path: "/jobs", label: "Visa / Cyprus Jobs", icon: "jobs", group: "OPPORTUNITY PIPELINES" },
  { path: "/masters", label: "Master's & Scholarships", icon: "masters", group: "OPPORTUNITY PIPELINES" },
  { path: "/remote", label: "Remote / Internships", icon: "remote", group: "OPPORTUNITY PIPELINES" },
  { path: "/operations", label: "Operations & Health", icon: "operations", group: "SYSTEM & GOVERNANCE" },
  { path: "/profile", label: "Candidate Profile", icon: "profile", group: "SYSTEM & GOVERNANCE" }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  counts,
  theme,
  onToggleTheme,
  onSyncNow,
  isSyncing = false,
  mobileOpen,
  onCloseMobile
}) => {
  return (
    <aside
      className={`os-sidebar ${mobileOpen ? "mobile-open" : ""}`}
      aria-label="Primary Workspace Navigation"
    >
      <div className="os-sidebar-brand">
        <div className="os-brand-identity">
          <span className="os-brand-badge">SO</span>
          <div>
            <div className="os-brand-title">Opportunity OS</div>
            <div className="os-brand-sub">v2.4 · Nicosia, CY</div>
          </div>
        </div>
      </div>

      <div className="os-sidebar-scroll">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            <div className="os-nav-group-label">{group}</div>
            <ul className="os-nav-list">
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
                const isActive = currentPath === item.path;
                const badgeCount = counts[item.path];
                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      className={`os-nav-btn ${isActive ? "active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        onNavigate(item.path);
                        onCloseMobile();
                      }}
                    >
                      <span className="os-nav-btn-left">
                        <Icon name={item.icon} size={15} />
                        <span>{item.label}</span>
                      </span>
                      {badgeCount !== undefined && (
                        <span className="os-nav-count">{badgeCount}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="os-sidebar-footer">
        <div className="os-profile-mini">
          <div>
            <div className="os-profile-mini-name">Sandeep Gautam</div>
            <div className="os-profile-mini-meta">BSc First-Class · 0–2 yr</div>
          </div>
          <span className="os-badge warning mono" title="Legal status unassumed">
            UNKNOWN
          </span>
        </div>

        <div className="os-sidebar-controls">
          <button
            type="button"
            className="btn-secondary"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onSyncNow}
            disabled={isSyncing}
            aria-label="Synchronize opportunity data sources"
          >
            <Icon name="sync" size={14} />
            <span>{isSyncing ? "Syncing..." : "Sync Data"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

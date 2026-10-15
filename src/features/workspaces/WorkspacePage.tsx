import React, { useMemo, useState } from "react";
import type { OpportunityRecord, PipelineCategory } from "../../types/opportunity";
import { PageHeader } from "../../components/ui/PageHeader";
import { MetricStrip } from "../../components/ui/Metric";
import { FilterBar, type SavedViewOption } from "../../components/ui/FilterBar";
import { DataTable } from "../../components/ui/DataTable";
import { SectionPanel } from "../../components/ui/SectionPanel";

interface WorkspacePageProps {
  category: PipelineCategory;
  title: string;
  subtitle: string;
  opportunities: OpportunityRecord[];
  selectedId?: string | null;
  onSelectOpportunity: (opp: OpportunityRecord) => void;
}

const PRIORITY_RANK: Record<string, number> = {
  P0: 1,
  High: 1,
  P1: 2,
  Medium: 2,
  P2: 3,
  Low: 3
};

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  category,
  title,
  subtitle,
  opportunities,
  selectedId,
  onSelectOpportunity
}) => {
  const [activeView, setActiveView] = useState<string>("all_active");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("score");

  const categoryRecords = useMemo(
    () => opportunities.filter((o) => o.category === category),
    [opportunities, category]
  );

  const activeRecords = useMemo(
    () => categoryRecords.filter((o) => o.is_active !== false),
    [categoryRecords]
  );

  const gatedRecords = useMemo(
    () => categoryRecords.filter((o) => o.is_active === false),
    [categoryRecords]
  );

  const views: SavedViewOption[] = useMemo(
    () => [
      { id: "all_active", label: "Active Eligible", count: activeRecords.length },
      {
        id: "high_fit",
        label: "High Fit (85+)",
        count: activeRecords.filter((o) => o.score_total >= 85).length
      },
      {
        id: "saved_crm",
        label: "Saved / In Progress",
        count: categoryRecords.filter(
          (o) =>
            o.workflow?.favorite ||
            o.favorite ||
            (o.workflow?.status || o.user_status) !== "New"
        ).length
      },
      { id: "all_including_gated", label: "All (Incl. Gated)", count: categoryRecords.length }
    ],
    [activeRecords, categoryRecords]
  );

  const filtered = useMemo(() => {
    return categoryRecords
      .filter((o) => {
        if (activeView === "all_active") return o.is_active !== false;
        if (activeView === "high_fit") return o.is_active !== false && o.score_total >= 85;
        if (activeView === "saved_crm") {
          return (
            o.workflow?.favorite ||
            o.favorite ||
            (o.workflow?.status || o.user_status) !== "New"
          );
        }
        return true;
      })
      .filter((o) => {
        if (statusFilter === "ALL") return true;
        return (o.workflow?.status || o.user_status) === statusFilter;
      })
      .filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          o.title.toLowerCase().includes(q) ||
          o.organization.toLowerCase().includes(q) ||
          o.location.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.score_total - a.score_total;
        if (sortBy === "priority") {
          const pa = PRIORITY_RANK[a.workflow?.priority || a.priority || "P1"] || 9;
          const pb = PRIORITY_RANK[b.workflow?.priority || b.priority || "P1"] || 9;
          return pa - pb || b.score_total - a.score_total;
        }
        if (sortBy === "deadline") {
          return String(a.deadline || "9999").localeCompare(String(b.deadline || "9999"));
        }
        return a.organization.localeCompare(b.organization);
      });
  }, [categoryRecords, activeView, statusFilter, searchQuery, sortBy]);

  const avgScore =
    activeRecords.length > 0
      ? Math.round(
          activeRecords.reduce((acc, r) => acc + r.score_total, 0) / activeRecords.length
        )
      : 0;

  const contextColLabel =
    category === "freelance_leads"
      ? "Project Band & Deterministic Audit"
      : category === "visa_jobs"
      ? "Work Model & Stack Match"
      : category === "masters_scholarships"
      ? "Funding Coverage & Intake"
      : "Remote Boundary & Compensation";

  return (
    <>
      <PageHeader
        eyebrow={`ENTERPRISE WORKSPACE · ${category.toUpperCase()}`}
        title={title}
        subtitle={subtitle}
      />

      <MetricStrip
        items={[
          { label: "Total Verified in Track", value: categoryRecords.length, delta: "Primary source verified" },
          { label: "Active Eligible", value: activeRecords.length, delta: "Passed all hard gates", tone: "success" },
          { label: "Average Active Score", value: `${avgScore}/100`, delta: "5-component weighted sum", tone: "info" },
          { label: "Excluded by Gates", value: gatedRecords.length, delta: gatedRecords.length > 0 ? "Seniority / Regional gate" : "0 gated in this track", tone: gatedRecords.length > 0 ? "danger" : "default" }
        ]}
      />

      <FilterBar
        views={views}
        activeView={activeView}
        onSelectView={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={() => {
          setActiveView("all_active");
          setSearchQuery("");
          setStatusFilter("ALL");
          setSortBy("score");
        }}
      />

      <SectionPanel
        title={`${title} (${filtered.length})`}
        subtitle="Click any row or press Enter to open the 580px Enterprise Provenance & CRM Inspector"
      >
        <DataTable
          records={filtered}
          selectedId={selectedId}
          onSelect={onSelectOpportunity}
          contextColumnLabel={contextColLabel}
          onResetFilters={() => {
            setActiveView("all_active");
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
        />
      </SectionPanel>
    </>
  );
};

import React from "react";
import {
  Activity,
  Bookmark,
  Bot,
  BriefcaseBusiness,
  Check,
  CircleX,
  Clock3,
  Database,
  ExternalLink,
  Globe2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  TriangleAlert,
  UserRound,
  X,
  type LucideIcon
} from "lucide-react";

export type IconName =
  | "today"
  | "opportunities"
  | "freelance"
  | "jobs"
  | "masters"
  | "remote"
  | "agents"
  | "sources"
  | "crm"
  | "saved"
  | "operations"
  | "profile"
  | "search"
  | "sun"
  | "moon"
  | "sync"
  | "external"
  | "check"
  | "warning"
  | "danger"
  | "clock"
  | "filter"
  | "close"
  | "menu"
  | "star"
  | "sparkles";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const ICONS: Record<IconName, LucideIcon> = {
  today: LayoutDashboard,
  opportunities: Layers,
  freelance: Globe2,
  jobs: BriefcaseBusiness,
  masters: GraduationCap,
  remote: Monitor,
  agents: Bot,
  sources: Database,
  crm: Bookmark,
  saved: Bookmark,
  operations: Activity,
  profile: UserRound,
  search: Search,
  sun: Sun,
  moon: Moon,
  sync: RefreshCw,
  external: ExternalLink,
  check: Check,
  warning: TriangleAlert,
  danger: CircleX,
  clock: Clock3,
  filter: SlidersHorizontal,
  close: X,
  menu: Menu,
  star: Star,
  sparkles: Sparkles
};

export const Icon: React.FC<IconProps> = ({ name, size = 15, className = "" }) => {
  const LucideComponent = ICONS[name];
  return (
    <LucideComponent
      size={size}
      strokeWidth={1.85}
      className={className}
      aria-hidden="true"
      focusable="false"
    />
  );
};

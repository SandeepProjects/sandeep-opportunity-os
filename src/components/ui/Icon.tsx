import React from "react";
import {
  Activity,
  Bookmark,
  BriefcaseBusiness,
  Check,
  CircleX,
  Clock3,
  ExternalLink,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Sun,
  TriangleAlert,
  UserRound,
  X,
  type LucideIcon
} from "lucide-react";

export type IconName =
  | "today"
  | "freelance"
  | "jobs"
  | "masters"
  | "remote"
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
  | "star";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const ICONS: Record<IconName, LucideIcon> = {
  today: LayoutDashboard,
  freelance: Globe2,
  jobs: BriefcaseBusiness,
  masters: GraduationCap,
  remote: Monitor,
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
  star: Star
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

import {
  Calculator,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  Settings,
  Users,
  Users2,
} from "lucide-react";

import type { DashboardTab, TypeVariant } from "./types";

export const defaultTypeVariants: Record<string, TypeVariant> = {
  mathematiques: {
    label: "Mathématiques",
    icon: Calculator,
    badgeClasses: "bg-sky-100 text-sky-800",
    iconColor: "text-sky-600",
    cardBorder: "border-sky-200",
    cardBackground: "bg-white",
    textColor: "text-sky-900",
  },
  support: {
    label: "Renfort",
    icon: Users2,
    badgeClasses: "bg-amber-100 text-amber-800",
    iconColor: "text-amber-600",
    cardBorder: "border-amber-200",
    cardBackground: "bg-amber-50",
    textColor: "text-amber-800",
  },
  default: {
    label: "Épreuve",
    icon: CalendarDays,
    badgeClasses: "bg-slate-100 text-slate-700",
    iconColor: "text-slate-600",
    cardBorder: "border-slate-200",
    cardBackground: "bg-white",
    textColor: "text-slate-700",
  },
};

export const defaultDashboardTabs: DashboardTab[] = [
  { id: "setup", label: "Paramétrage des salles", Icon: Settings },
  { id: "teacher", label: "Vue par enseignant", Icon: Users },
  { id: "convocation", label: "Convocations", Icon: ClipboardList },
  { id: "room", label: "Vue par salle", Icon: LayoutGrid },
  { id: "day", label: "Vue par jour", Icon: CalendarDays },
];

import { createContext, useContext } from "react";

import type { DashboardView } from "../utils";

export interface DashboardContextValue {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  container: HTMLDivElement | null;
  setContainer: (node: HTMLDivElement | null) => void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboardContext = (): DashboardContextValue => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("Dashboard components must be used within ExamDashboard");
  }
  return context;
};

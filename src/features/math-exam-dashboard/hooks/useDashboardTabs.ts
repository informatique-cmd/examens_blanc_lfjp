import { useMemo } from "react";

import type { MathExamDashboardData } from "../data";
import { useMathExamData } from "../context";
import type { DashboardView } from "../utils";

export default function useDashboardTabs(): {
  tabs: MathExamDashboardData["dashboardTabs"];
  tabIds: DashboardView[];
} {
  const { dashboardTabs } = useMathExamData();
  const tabs = useMemo(() => dashboardTabs, [dashboardTabs]);
  const tabIds = useMemo(() => tabs.map(({ id }) => id), [tabs]);
  return { tabs, tabIds };
}

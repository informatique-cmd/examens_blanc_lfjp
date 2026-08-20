import { useMemo } from "react";

import { dashboardTabs } from "../data";
import type { DashboardView } from "../utils";

export default function useDashboardTabs(): {
  tabs: typeof dashboardTabs;
  tabIds: DashboardView[];
} {
  const tabs = useMemo(() => dashboardTabs, []);
  const tabIds = useMemo(() => tabs.map(({ id }) => id), [tabs]);
  return { tabs, tabIds };
}

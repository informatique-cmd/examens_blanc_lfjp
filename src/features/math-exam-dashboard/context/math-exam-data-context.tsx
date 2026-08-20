import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { MathExamDashboardData } from "../data";

const MathExamDataContext = createContext<MathExamDashboardData | null>(null);

export function MathExamDataProvider({
  value,
  children,
}: {
  value: MathExamDashboardData;
  children: ReactNode;
}) {
  return <MathExamDataContext.Provider value={value}>{children}</MathExamDataContext.Provider>;
}

export function useMathExamData(): MathExamDashboardData {
  const context = useContext(MathExamDataContext);

  if (!context) {
    throw new Error("Math exam data must be used within a MathExamDataProvider");
  }

  return context;
}

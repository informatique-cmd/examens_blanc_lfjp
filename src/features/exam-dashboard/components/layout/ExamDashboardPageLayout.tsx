import type { PropsWithChildren, ReactNode } from "react";

interface ExamDashboardPageLayoutProps extends PropsWithChildren {
  action?: ReactNode;
}

export default function ExamDashboardPageLayout({
  children,
  action,
}: ExamDashboardPageLayoutProps) {
  return (
    <div className="bg-slate-50 text-slate-800">
      <div className="container mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
        {action ? <div className="flex justify-end">{action}</div> : null}
        {children}
      </div>
    </div>
  );
}

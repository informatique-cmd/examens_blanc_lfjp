import { Suspense, lazy, Component, type ReactNode } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

// Primary core pages loaded directly to avoid any Vite dynamic import fetch issues
import HomePage from "../features/home/pages/HomePage";
import AdminPage from "../features/admin/pages/AdminPage";
import ConvocationsPage from "../features/convocations/pages/ConvocationsPage";
import OrgaDnbPage from "../features/orga-dnb/pages/OrgaDnbPage";

// Other specialized exam dashboards loaded via code-splitting
const ExamDashboardPage = lazy(
  () => import("../features/exam-dashboard/pages/ExamDashboardPage"),
);
const MathematicsExam20260213Page = lazy(
  () => import("../features/math-exam-dashboard/pages/MathematicsExam20260213Page"),
);
const MathematicsExam20260523Page = lazy(
  () => import("../features/math-exam-dashboard/pages/MathematicsExam20260523Page"),
);
const BacBlancEAF20260407Page = lazy(
  () => import("../features/math-exam-dashboard/pages/BacBlancEAF20260407Page"),
);
const OralEafExam202605Page = lazy(
  () => import("../features/french-oral-exam-202605/pages/OralEafExam202605Page"),
);
const OralEafExam202604Page = lazy(
  () => import("../features/french-oral-exam-202604/pages/OralEafExam202604Page"),
);
const DnbZaoExam202602Page = lazy(
  () => import("../features/math-exam-dashboard/pages/DnbZaoExam202602Page"),
);
const GrandOralExam20260417Page = lazy(
  () => import("../features/grand-oral-exam-202604/pages/GrandOralExam20260417Page"),
);
const BacDnbSurveillancePage = lazy(
  () => import("../features/bac-dnb-surveillance/pages/BacDnbSurveillancePage"),
);
const DnbOralExam20260520Page = lazy(
  () => import("../features/dnb-oral-202605/pages/DnbOralExam20260520Page"),
);
const OralEafExam202606Page = lazy(
  () => import("../features/french-oral-exam-202606/pages/OralEafExam202606Page"),
);

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Erreur capturée par l'application :", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              LFJP
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Mise à jour de l'application disponible
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Une nouvelle version ou ressource a été synchronisée. Veuillez recharger la page pour afficher la dernière configuration.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-medium">Chargement des données LFJP…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/annees/*" element={<Navigate to="/" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/convocations" element={<ConvocationsPage />} />
          <Route path="/orga-dnb" element={<OrgaDnbPage />} />
          <Route path="/orga-dnb-blanc" element={<OrgaDnbPage />} />
          <Route path="/examens-blancs" element={<ExamDashboardPage />} />
          <Route
            path="/examens-blancs/mathematiques-2026-02-13"
            element={<MathematicsExam20260213Page />}
          />
          <Route
            path="/examens-blancs/mathematiques-2026-05-23"
            element={<MathematicsExam20260523Page />}
          />
          <Route
            path="/examens-blancs/eaf-2026-04-07"
            element={<BacBlancEAF20260407Page />}
          />
          <Route
            path="/examens-blancs/oraux-eaf-2026-04"
            element={<OralEafExam202604Page />}
          />
          <Route
            path="/examens-blancs/oraux-eaf-2026-05"
            element={<OralEafExam202605Page />}
          />
          <Route
            path="/examens-blancs/dnb-blanc-zao-2026-02-03"
            element={<DnbZaoExam202602Page />}
          />
          <Route
            path="/examens-blancs/grand-oral-2026-04-17"
            element={<GrandOralExam20260417Page />}
          />
          <Route
            path="/examens-blancs/oraux-dnb-2026-05-20"
            element={<DnbOralExam20260520Page />}
          />
          <Route
            path="/examens-blancs/oraux-eaf-2026-06"
            element={<OralEafExam202606Page />}
          />
          <Route
            path="/surveillances-bac-dnb"
            element={<BacDnbSurveillancePage />}
          />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}

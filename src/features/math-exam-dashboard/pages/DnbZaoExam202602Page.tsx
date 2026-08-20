import MathExamDashboardPageContent from "./MathExamDashboardPageContent";
import { MathExamDataProvider } from "../context";
import { dnbZaoDashboardData202602 } from "../data";

export default function DnbZaoExam202602Page() {
  return (
    <MathExamDataProvider value={dnbZaoDashboardData202602}>
      <MathExamDashboardPageContent />
    </MathExamDataProvider>
  );
}


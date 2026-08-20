import MathExamDashboardPageContent from "./MathExamDashboardPageContent";
import { MathExamDataProvider } from "../context";
import { mathExamDashboardData20260213 } from "../data";

export default function MathematicsExam20260213Page() {
  return (
    <MathExamDataProvider value={mathExamDashboardData20260213}>
      <MathExamDashboardPageContent />
    </MathExamDataProvider>
  );
}

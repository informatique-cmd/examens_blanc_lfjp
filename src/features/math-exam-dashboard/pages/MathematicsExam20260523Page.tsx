import MathExamDashboardPageContent from "./MathExamDashboardPageContent";
import { MathExamDataProvider } from "../context";
import { mathExamDashboardData20260523 } from "../data";

export default function MathematicsExam20260523Page() {
  return (
    <MathExamDataProvider value={mathExamDashboardData20260523}>
      <MathExamDashboardPageContent />
    </MathExamDataProvider>
  );
}

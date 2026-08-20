import MathExamDashboardPageContent from "./MathExamDashboardPageContent";
import { MathExamDataProvider } from "../context";
import { bacBlancEAFDashboardData20260407 } from "../data";

export default function BacBlancEAF20260407Page() {
  return (
    <MathExamDataProvider value={bacBlancEAFDashboardData20260407}>
      <MathExamDashboardPageContent />
    </MathExamDataProvider>
  );
}

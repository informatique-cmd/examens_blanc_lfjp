import {
  Announcements,
  BackToHomeButton,
  ConvocationGenerator,
  DnbStudents,
  ExamDashboard,
  ExamDashboardPageLayout,
  Header,
  Hero,
  RoomSetup,
  RoomsStatus,
  SurveillanceTable,
} from "../components";

export default function MathExamDashboardPageContent() {
  return (
    <ExamDashboardPageLayout action={<BackToHomeButton />}>
      <Header />
      <Hero />
      <ExamDashboard>
        <RoomSetup />
        <SurveillanceTable />
        <ConvocationGenerator />
        <DnbStudents />
        <RoomsStatus />
        <Announcements />
      </ExamDashboard>
    </ExamDashboardPageLayout>
  );
}

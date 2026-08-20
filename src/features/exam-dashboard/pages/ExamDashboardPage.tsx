import {
  Announcements,
  BackToHomeButton,
  BacBlancStudents,
  ConvocationGenerator,
  ExamDashboard,
  ExamDashboardPageLayout,
  Header,
  Hero,
  RoomSetup,
  RoomsStatus,
  SurveillanceTable,
} from "../components";

export default function ExamDashboardPage() {
  return (
    <ExamDashboardPageLayout action={<BackToHomeButton />}>
      <Header />
      <Hero />
      <ExamDashboard>
        <RoomSetup />
        <BacBlancStudents />
        <SurveillanceTable />
        <ConvocationGenerator />
        <RoomsStatus />
        <Announcements />
      </ExamDashboard>
    </ExamDashboardPageLayout>
  );
}

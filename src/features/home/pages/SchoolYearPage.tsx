import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Clock3, DoorOpen, GraduationCap, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { BackToHomeButton } from "../../exam-dashboard/components";
import ExamDashboardPageLayout from "../../exam-dashboard/components/layout/ExamDashboardPageLayout";
import { supabase } from "../../../shared/lib/supabase";

interface SchoolYear { id: string; label: string; starts_on: string | null; ends_on: string | null; is_published: boolean; }
interface Exam { id: string; title: string; exam_type: string; starts_at: string | null; ends_at: string | null; is_published: boolean; }
interface Student { id: string; first_name: string; last_name: string; class_name: string; }
interface Teacher { id: string; civility: string; first_name: string; last_name: string; }
interface Room { id: string; name: string; capacity: number; }
interface Assignment { id: string; exam_id: string; teacher_id: string; room_id: string | null; mission: string; starts_at: string | null; ends_at: string | null; }

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

function formatDate(value: string | null): string {
  if (!value) return "Date non définie";
  return dateFormatter.format(new Date(value));
}

function MetricCard({ icon: Icon, value, label }: { icon: typeof ClipboardList; value: string; label: string }) {
  return (
    <article className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-slate-50 p-6 shadow-lg">
      <div className="flex items-center gap-3"><Icon className="h-6 w-6 text-blue-600" /><p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</p></div>
      <p className="mt-5 text-2xl font-bold text-blue-700">{value}</p>
    </article>
  );
}

export default function SchoolYearPage() {
  const { yearId } = useParams<{ yearId: string }>();
  const [year, setYear] = useState<SchoolYear | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "planning">("overview");

  useEffect(() => {
    if (!supabase || !yearId) { setIsLoading(false); return; }
    const client = supabase;

    async function loadPublishedYear() {
      const [yearResult, examsResult, studentsResult, teachersResult, roomsResult] = await Promise.all([
        client.from("school_years").select("id, label, starts_on, ends_on, is_published").eq("id", yearId).eq("is_published", true).maybeSingle(),
        client.from("exams").select("id, title, exam_type, starts_at, ends_at, is_published").eq("school_year_id", yearId).eq("is_published", true).order("starts_at", { ascending: true }),
        client.from("students").select("id, first_name, last_name, class_name").eq("school_year_id", yearId).order("last_name"),
        client.from("teachers").select("id, civility, first_name, last_name").eq("school_year_id", yearId).order("last_name"),
        client.from("rooms").select("id, name, capacity").eq("school_year_id", yearId).order("name"),
      ]);
      const examIds = (examsResult.data ?? []).map((exam) => exam.id);
      const assignmentsResult = examIds.length
        ? await client.from("surveillance_assignments").select("id, exam_id, teacher_id, room_id, mission, starts_at, ends_at").in("exam_id", examIds).order("starts_at")
        : { data: [], error: null };

      const error = yearResult.error ?? examsResult.error ?? studentsResult.error ?? teachersResult.error ?? roomsResult.error ?? assignmentsResult.error;
      if (error) {
        setMessage(error.message);
      } else {
        setYear(yearResult.data);
        setExams(examsResult.data ?? []);
        setStudents(studentsResult.data ?? []);
        setTeachers(teachersResult.data ?? []);
        setRooms(roomsResult.data ?? []);
        setAssignments(assignmentsResult.data ?? []);
      }
      setIsLoading(false);
    }

    void loadPublishedYear();
  }, [yearId]);

  if (isLoading) return <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Chargement...</main>;
  if (!year || message) return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-800"><div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm"><Link className="font-semibold text-blue-700" to="/">Retour à l’accueil</Link><h1 className="mt-6 text-2xl font-bold text-slate-900">Année indisponible</h1><p className="mt-3 text-slate-600">{message || "Cette année n’est pas publiée ou n’existe plus."}</p></div></main>;

  const lastExamDate = [...exams].reverse().find((exam) => exam.ends_at)?.ends_at;
  const examById = new Map(exams.map((exam) => [exam.id, exam]));
  const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const metrics = [
    { icon: ClipboardList, value: String(exams.length), label: "Examens publiés" },
    { icon: Users, value: String(students.length), label: "Élèves" },
    { icon: GraduationCap, value: String(teachers.length), label: "Enseignants" },
    { icon: DoorOpen, value: String(rooms.length), label: "Salles" },
    { icon: CalendarDays, value: year.starts_on ?? "-", label: "Début de session" },
    { icon: Clock3, value: lastExamDate ? formatDate(lastExamDate) : "-", label: "Fin du dernier examen" },
  ];

  return (
    <ExamDashboardPageLayout action={<BackToHomeButton />}>
      <header className="space-y-4">
        <div className="flex items-center gap-4"><img alt="Logo du Lycée Français Jacques Prévert de Saly" className="h-16 rounded-lg border border-slate-200 bg-white object-contain shadow-sm" src="https://i.imgur.com/0YmGlXO.png" /><div><p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Lycée Français Jacques Prévert de Saly</p><h1 className="text-3xl font-bold text-slate-900">Examens blancs LFJP {year.label}</h1></div></div>
        <p className="text-lg text-slate-600">{year.starts_on ?? "Date de début non définie"} · {year.ends_on ?? "Date de fin non définie"}</p>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4" role="tablist" aria-label="Vues de l’année">
          <button className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "overview" ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={() => setActiveTab("overview")} role="tab" aria-selected={activeTab === "overview"}>Vue générale</button>
          <button className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "planning" ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} onClick={() => setActiveTab("planning")} role="tab" aria-selected={activeTab === "planning"}>Planning</button>
        </div>
        <div className="mt-6 space-y-4"><h2 className="text-2xl font-bold text-slate-900">{activeTab === "overview" ? "Organisation des examens" : "Planning des surveillances"}</h2><p className="text-slate-600">Données publiées par l’administration pour l’année {year.label}.</p>
          {activeTab === "overview" ? <div className="space-y-4">
            {exams.length ? exams.map((exam) => <Link className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50" key={exam.id} to={`/annees/${year.id}/examens/${exam.id}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{exam.exam_type}</p><h3 className="mt-1 text-xl font-bold text-slate-900">{exam.title}</h3></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Publié</span></div><div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><p><strong className="text-slate-900">Début :</strong> {formatDate(exam.starts_at)}</p><p><strong className="text-slate-900">Fin :</strong> {formatDate(exam.ends_at)}</p></div><p className="mt-4 text-sm font-semibold text-blue-700">Ouvrir le planning →</p></Link>) : <p className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Aucun examen n’est encore publié pour cette année.</p>}
            <div className="grid gap-6 pt-3 lg:grid-cols-3"><div><h3 className="font-bold text-slate-900">Élèves</h3><div className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-slate-600">{students.map((student) => <p key={student.id}>{student.last_name} {student.first_name} <span className="text-slate-400">· {student.class_name}</span></p>)}{!students.length ? <p>Aucun élève publié.</p> : null}</div></div><div><h3 className="font-bold text-slate-900">Enseignants</h3><div className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-slate-600">{teachers.map((teacher) => <p key={teacher.id}>{teacher.civility} {teacher.last_name} {teacher.first_name}</p>)}{!teachers.length ? <p>Aucun enseignant publié.</p> : null}</div></div><div><h3 className="font-bold text-slate-900">Salles</h3><div className="mt-2 space-y-1 text-sm text-slate-600">{rooms.map((room) => <p key={room.id}>{room.name} <span className="text-slate-400">· {room.capacity} places</span></p>)}{!rooms.length ? <p>Aucune salle publiée.</p> : null}</div></div></div>
          </div> : assignments.length ? assignments.map((assignment) => <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5" key={assignment.id}><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{examById.get(assignment.exam_id)?.title ?? "Examen"}</p><h3 className="mt-1 text-xl font-bold text-slate-900">{assignment.mission}</h3><div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3"><p><strong className="text-slate-900">Enseignant :</strong> {teacherById.get(assignment.teacher_id)?.last_name ?? "-"}</p><p><strong className="text-slate-900">Salle :</strong> {roomById.get(assignment.room_id ?? "")?.name ?? "-"}</p><p><strong className="text-slate-900">Horaire :</strong> {formatDate(assignment.starts_at)}</p></div></article>) : <p className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Aucune surveillance publiée pour cette année.</p>}
        </div>
      </section>
    </ExamDashboardPageLayout>
  );
}

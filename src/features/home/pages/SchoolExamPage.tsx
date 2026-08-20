import { useEffect, useState } from "react";
import { CalendarDays, Clock3, DoorOpen, GraduationCap } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { BackToHomeButton } from "../../exam-dashboard/components";
import ExamDashboardPageLayout from "../../exam-dashboard/components/layout/ExamDashboardPageLayout";
import { supabase } from "../../../shared/lib/supabase";

interface Exam { id: string; school_year_id: string; title: string; exam_type: string; starts_at: string | null; ends_at: string | null; is_published: boolean; }
interface SchoolYear { id: string; label: string; is_published: boolean; }
interface Assignment { id: string; mission: string; room_id: string | null; teacher_id: string; starts_at: string | null; ends_at: string | null; }
interface Teacher { id: string; civility: string; first_name: string; last_name: string; }
interface Room { id: string; name: string; capacity: number; }

const formatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" });
function formatDate(value: string | null): string { return value ? formatter.format(new Date(value)) : "Non défini"; }

export default function SchoolExamPage() {
  const { yearId, examId } = useParams<{ yearId: string; examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [year, setYear] = useState<SchoolYear | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || !yearId || !examId) return;
    const client = supabase;
    async function load() {
      const [yearResult, examResult, assignmentResult, teacherResult, roomResult] = await Promise.all([
        client.from("school_years").select("id, label, is_published").eq("id", yearId).eq("is_published", true).maybeSingle(),
        client.from("exams").select("id, school_year_id, title, exam_type, starts_at, ends_at, is_published").eq("id", examId).eq("school_year_id", yearId).eq("is_published", true).maybeSingle(),
        client.from("surveillance_assignments").select("id, mission, room_id, teacher_id, starts_at, ends_at").eq("exam_id", examId).order("starts_at"),
        client.from("teachers").select("id, civility, first_name, last_name").eq("school_year_id", yearId).order("last_name"),
        client.from("rooms").select("id, name, capacity").eq("school_year_id", yearId).order("name"),
      ]);
      const loadError = yearResult.error ?? examResult.error ?? assignmentResult.error ?? teacherResult.error ?? roomResult.error;
      if (loadError) setError(loadError.message);
      else { setYear(yearResult.data); setExam(examResult.data); setAssignments(assignmentResult.data ?? []); setTeachers(teacherResult.data ?? []); setRooms(roomResult.data ?? []); }
    }
    void load();
  }, [yearId, examId]);

  if (error || !exam || !year) return <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-600">{error || "Examen indisponible."}<br /><Link className="font-semibold text-blue-700" to="/">Retour à l’accueil</Link></main>;
  const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const roomById = new Map(rooms.map((room) => [room.id, room]));

  return <ExamDashboardPageLayout action={<BackToHomeButton />}>
    <header className="space-y-4"><p><Link className="font-semibold text-blue-700" to={`/annees/${year.id}`}>← Année {year.label}</Link></p><div className="flex items-center gap-4"><img alt="Logo du Lycée Français Jacques Prévert de Saly" className="h-16 rounded-lg border border-slate-200 bg-white object-contain shadow-sm" src="https://i.imgur.com/0YmGlXO.png" /><div><p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{exam.exam_type} · LFJP</p><h1 className="text-3xl font-bold text-slate-900">{exam.title}</h1></div></div><p className="text-lg text-slate-600">Session {year.label}</p></header>
    <section className="grid gap-6 md:grid-cols-3"><article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg"><CalendarDays className="h-6 w-6 text-blue-600" /><p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Début</p><p className="mt-2 font-bold text-slate-900">{formatDate(exam.starts_at)}</p></article><article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg"><Clock3 className="h-6 w-6 text-blue-600" /><p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Fin</p><p className="mt-2 font-bold text-slate-900">{formatDate(exam.ends_at)}</p></article><article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg"><GraduationCap className="h-6 w-6 text-blue-600" /><p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Surveillances</p><p className="mt-2 font-bold text-slate-900">{assignments.length}</p></article></section>
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md"><div className="flex items-center gap-3"><DoorOpen className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-900">Planning de l’épreuve</h2></div>{assignments.length ? <div className="mt-6 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="px-4 py-3">Mission</th><th className="px-4 py-3">Enseignant</th><th className="px-4 py-3">Salle</th><th className="px-4 py-3">Horaire</th></tr></thead><tbody className="divide-y divide-slate-200">{assignments.map((assignment) => <tr key={assignment.id}><td className="px-4 py-3 font-semibold">{assignment.mission}</td><td className="px-4 py-3">{teacherById.get(assignment.teacher_id)?.civility} {teacherById.get(assignment.teacher_id)?.last_name} {teacherById.get(assignment.teacher_id)?.first_name}</td><td className="px-4 py-3">{roomById.get(assignment.room_id ?? "")?.name ?? "Non définie"}</td><td className="px-4 py-3">{formatDate(assignment.starts_at)}</td></tr>)}</tbody></table></div> : <p className="mt-5 rounded-xl bg-slate-50 p-5 text-slate-600">Aucune surveillance publiée pour cette épreuve.</p>}</section>
  </ExamDashboardPageLayout>;
}

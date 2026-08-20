import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Clock3 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { BackToHomeButton } from "../../exam-dashboard/components";
import ExamDashboardPageLayout from "../../exam-dashboard/components/layout/ExamDashboardPageLayout";
import { supabase } from "../../../shared/lib/supabase";

interface SchoolYear {
  id: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  is_published: boolean;
}

interface Exam {
  id: string;
  title: string;
  exam_type: string;
  starts_at: string | null;
  ends_at: string | null;
  is_published: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});

function formatDate(value: string | null): string {
  if (!value) return "Date non définie";
  return dateFormatter.format(new Date(value));
}

export default function SchoolYearPage() {
  const { yearId } = useParams<{ yearId: string }>();
  const [year, setYear] = useState<SchoolYear | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "planning">("overview");

  useEffect(() => {
    if (!supabase || !yearId) {
      setIsLoading(false);
      return;
    }

    const client = supabase;

    async function loadPublishedYear() {
      const [{ data: yearData, error: yearError }, { data: examData, error: examError }] = await Promise.all([
        client.from("school_years").select("id, label, starts_on, ends_on, is_published").eq("id", yearId).eq("is_published", true).maybeSingle(),
        client.from("exams").select("id, title, exam_type, starts_at, ends_at, is_published").eq("school_year_id", yearId).eq("is_published", true).order("starts_at", { ascending: true }),
      ]);

      if (yearError || examError) {
        setMessage(yearError?.message ?? examError?.message ?? "Impossible de charger cette année.");
      } else {
        setYear(yearData);
        setExams(examData ?? []);
      }
      setIsLoading(false);
    }

    void loadPublishedYear();
  }, [yearId]);

  if (isLoading) {
    return <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Chargement...</main>;
  }

  if (!year || message) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-800">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
          <Link className="font-semibold text-blue-700" to="/">Retour à l’accueil</Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Année indisponible</h1>
          <p className="mt-3 text-slate-600">{message || "Cette année n’est pas publiée ou n’existe plus."}</p>
        </div>
      </main>
    );
  }

  const lastExamDate = [...exams].reverse().find((exam) => exam.ends_at)?.ends_at;
  const keyFigures = [
    { icon: ClipboardList, value: String(exams.length), label: "Examens publiés" },
    { icon: CalendarDays, value: year.starts_on ?? "-", label: "Début de session" },
    { icon: Clock3, value: lastExamDate ? formatDate(lastExamDate) : "-", label: "Fin du dernier examen" },
  ];

  return (
    <ExamDashboardPageLayout action={<BackToHomeButton />}>
      <header className="space-y-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <img alt="Logo du Lycée Français Jacques Prévert de Saly" className="h-16 rounded-lg border border-slate-200 bg-white object-contain shadow-sm" src="https://i.imgur.com/0YmGlXO.png" />
            <div><p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Lycée Français Jacques Prévert de Saly</p><h1 className="text-3xl font-bold text-slate-900">Examens blancs LFJP {year.label}</h1></div>
          </div>
        </div>
        <p className="text-lg text-slate-600">{year.starts_on ?? "Date de début non définie"} · {year.ends_on ?? "Date de fin non définie"}</p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {keyFigures.map(({ icon: FigureIcon, value, label }) => <article className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-slate-50 p-6 shadow-lg" key={label}><div className="flex items-center gap-3"><FigureIcon className="h-6 w-6 text-blue-600" /><p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</p></div><p className="mt-5 text-2xl font-bold text-blue-700">{value}</p></article>)}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4" role="tablist" aria-label="Vues de l’année">
          {[['overview', 'Vue générale'], ['planning', 'Planning']].map(([id, label]) => <button className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === id ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} key={id} onClick={() => setActiveTab(id as "overview" | "planning")} role="tab" aria-selected={activeTab === id}>{label}</button>)}
        </div>
        <div className="mt-6 space-y-4">
          <div><h2 className="text-2xl font-bold text-slate-900">{activeTab === "overview" ? "Organisation des examens" : "Planning détaillé"}</h2><p className="mt-1 text-slate-600">Données publiées par l’administration pour l’année {year.label}.</p></div>
          {exams.length ? exams.map((exam) => <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5" key={exam.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{exam.exam_type}</p><h3 className="mt-1 text-xl font-bold text-slate-900">{exam.title}</h3></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Publié</span></div><div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><p><strong className="text-slate-900">Début :</strong> {formatDate(exam.starts_at)}</p><p><strong className="text-slate-900">Fin :</strong> {formatDate(exam.ends_at)}</p></div></article>) : <p className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Aucun examen n’est encore publié pour cette année.</p>}
        </div>
      </section>
    </ExamDashboardPageLayout>
  );
}

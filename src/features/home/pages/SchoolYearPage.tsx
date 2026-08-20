import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link className="font-semibold text-blue-700" to="/">Retour à l’accueil</Link>
        <header className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Année scolaire publiée</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Examens {year.label}</h1>
          <p className="mt-3 text-slate-600">
            {year.starts_on ?? "Date de début non définie"} · {year.ends_on ?? "Date de fin non définie"}
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Examens publiés</h2>
          {exams.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {exams.map((exam) => (
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={exam.id}>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{exam.exam_type}</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">{exam.title}</h3>
                  <dl className="mt-5 space-y-2 text-sm text-slate-600">
                    <div><dt className="inline font-semibold text-slate-900">Début : </dt><dd className="inline">{formatDate(exam.starts_at)}</dd></div>
                    <div><dt className="inline font-semibold text-slate-900">Fin : </dt><dd className="inline">{formatDate(exam.ends_at)}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Aucun examen n’est encore publié pour cette année.</p>
          )}
        </section>
      </div>
    </main>
  );
}

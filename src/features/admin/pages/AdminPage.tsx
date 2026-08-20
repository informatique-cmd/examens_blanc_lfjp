import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { isSupabaseConfigured, supabase } from "../../../shared/lib/supabase";

interface SchoolYear {
  id: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  is_published: boolean;
}

interface Exam {
  id: string;
  school_year_id: string;
  title: string;
  exam_type: string;
  starts_at: string | null;
  ends_at: string | null;
  is_published: boolean;
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [newYear, setNewYear] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [yearDates, setYearDates] = useState({ startsOn: "", endsOn: "" });
  const [exams, setExams] = useState<Exam[]>([]);
  const [examForm, setExamForm] = useState({ title: "", type: "Bac blanc", startsAt: "", endsAt: "" });

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userEmail) void loadYears();
  }, [userEmail]);

  useEffect(() => {
    const year = years.find((item) => item.id === selectedYearId);
    if (!year) return;
    setYearDates({ startsOn: year.starts_on ?? "", endsOn: year.ends_on ?? "" });
    void loadExams(year.id);
  }, [selectedYearId, years]);

  async function loadYears() {
    if (!supabase) return;
    setIsLoading(true);
    setMessage("");
    const { data, error } = await supabase
      .from("school_years")
      .select("id, label, starts_on, ends_on, is_published")
      .order("label", { ascending: false });
    setIsLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setYears(data ?? []);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    setMessage(error ? error.message : "Connexion réussie.");
  }

  async function handleCreateYear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !newYear.trim()) return;
    setIsLoading(true);
    const { error } = await supabase.from("school_years").insert({ label: newYear.trim() });
    setIsLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setNewYear("");
    setMessage("Année créée.");
    await loadYears();
  }

  async function updateYearDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedYearId) return;
    setIsLoading(true);
    const { error } = await supabase.from("school_years").update({
      starts_on: yearDates.startsOn || null,
      ends_on: yearDates.endsOn || null,
    }).eq("id", selectedYearId);
    setIsLoading(false);
    setMessage(error ? error.message : "Dates de l’année enregistrées.");
    if (!error) await loadYears();
  }

  async function loadExams(yearId: string) {
    if (!supabase) return;
    const { data, error } = await supabase.from("exams").select("id, school_year_id, title, exam_type, starts_at, ends_at, is_published").eq("school_year_id", yearId).order("starts_at", { ascending: true });
    if (error) {
      setMessage(error.message);
      return;
    }
    setExams(data ?? []);
  }

  async function createExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedYearId || !examForm.title.trim()) return;
    setIsLoading(true);
    const { error } = await supabase.from("exams").insert({
      school_year_id: selectedYearId,
      title: examForm.title.trim(),
      exam_type: examForm.type.trim(),
      starts_at: examForm.startsAt ? new Date(examForm.startsAt).toISOString() : null,
      ends_at: examForm.endsAt ? new Date(examForm.endsAt).toISOString() : null,
    });
    setIsLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setExamForm({ title: "", type: "Bac blanc", startsAt: "", endsAt: "" });
    setMessage("Examen créé.");
    await loadExams(selectedYearId);
  }

  async function updateExam(exam: Exam, changes: Partial<Exam>) {
    if (!supabase || !selectedYearId) return;
    const { error } = await supabase.from("exams").update(changes).eq("id", exam.id);
    setMessage(error ? error.message : "Examen mis à jour.");
    if (!error) await loadExams(selectedYearId);
  }

  async function deleteExam(exam: Exam) {
    if (!supabase || !selectedYearId || !window.confirm(`Supprimer l’examen « ${exam.title} » ?`)) return;
    const { error } = await supabase.from("exams").delete().eq("id", exam.id);
    setMessage(error ? error.message : "Examen supprimé.");
    if (!error) await loadExams(selectedYearId);
  }

  async function togglePublication(year: SchoolYear) {
    if (!supabase) return;
    setIsLoading(true);
    const { error } = await supabase
      .from("school_years")
      .update({ is_published: !year.is_published })
      .eq("id", year.id);
    setIsLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadYears();
  }

  async function deleteYear(year: SchoolYear) {
    if (!supabase || confirmation !== `SUPPRIMER ${year.label}`) return;
    setIsLoading(true);
    const { error } = await supabase.rpc("delete_school_year", { target_id: year.id });
    setIsLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setConfirmation("");
    setMessage(`Année ${year.label} supprimée.`);
    await loadYears();
  }

  async function handleLogout() {
    await supabase?.auth.signOut();
    setYears([]);
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-800">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
          <Link className="text-sm font-semibold text-blue-700" to="/">Retour à l’accueil</Link>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Administration</h1>
          <p className="mt-3 text-slate-600">Supabase n’est pas encore configuré pour cette instance.</p>
          <p className="mt-6 text-sm text-slate-600">Ajoute les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local puis redémarre le serveur.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link className="text-sm font-semibold text-blue-700" to="/">Retour à l’accueil</Link>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Administration des examens</h1>
          </div>
          {userEmail ? <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={handleLogout}>Se déconnecter</button> : null}
        </header>

        {message ? <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{message}</p> : null}

        {!userEmail ? (
          <form className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleLogin}>
            <h2 className="text-xl font-bold text-slate-900">Connexion administrateur</h2>
            <label className="block text-sm font-semibold">Email<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label className="block text-sm font-semibold">Mot de passe<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50" disabled={isLoading} type="submit">Se connecter</button>
          </form>
        ) : (
          <section className="space-y-6">
            <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleCreateYear}>
              <label className="min-w-64 flex-1 text-sm font-semibold">Nouvelle année scolaire<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="2026-2027" value={newYear} onChange={(event) => setNewYear(event.target.value)} required /></label>
              <button className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50" disabled={isLoading} type="submit">Créer l’année</button>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100"><tr><th className="px-4 py-3">Année</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">État</th><th className="px-4 py-3">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {years.map((year) => <tr key={year.id}>
                    <td className="px-4 py-3 font-semibold">{year.label}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{year.starts_on ?? "Non définie"} → {year.ends_on ?? "Non définie"}</td>
                    <td className="px-4 py-3">{year.is_published ? "Publiée" : "Brouillon"}</td>
                    <td className="space-y-2 px-4 py-3">
                      <button className="mr-3 rounded-lg border border-blue-200 px-3 py-1.5 font-semibold text-blue-700" onClick={() => setSelectedYearId(year.id)}>Gérer le contenu</button>
                      <button className="mr-3 rounded-lg border border-slate-300 px-3 py-1.5 font-semibold" onClick={() => void togglePublication(year)}>{year.is_published ? "Dépublier" : "Publier"}</button>
                      <div className="mt-2 flex flex-wrap items-center gap-2"><input className="rounded-lg border border-red-200 px-3 py-1.5 text-xs" placeholder={`SUPPRIMER ${year.label}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /><button className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={confirmation !== `SUPPRIMER ${year.label}`} onClick={() => void deleteYear(year)}>Supprimer</button></div>
                    </td>
                  </tr>)}
                  {!years.length && !isLoading ? <tr><td className="px-4 py-6 text-slate-500" colSpan={4}>Aucune année enregistrée.</td></tr> : null}
                </tbody>
              </table>
            </div>

            {selectedYearId ? (
              <section className="space-y-6 rounded-2xl border border-blue-200 bg-blue-50/40 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">Contenu de l’année {years.find((year) => year.id === selectedYearId)?.label}</h2>
                  <button className="text-sm font-semibold text-slate-600" onClick={() => setSelectedYearId(null)}>Fermer</button>
                </div>

                <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3" onSubmit={updateYearDates}>
                  <label className="text-sm font-semibold">Date de début<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" type="date" value={yearDates.startsOn} onChange={(event) => setYearDates((current) => ({ ...current, startsOn: event.target.value }))} /></label>
                  <label className="text-sm font-semibold">Date de fin<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" type="date" value={yearDates.endsOn} onChange={(event) => setYearDates((current) => ({ ...current, endsOn: event.target.value }))} /></label>
                  <button className="self-end rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50" disabled={isLoading} type="submit">Enregistrer les dates</button>
                </form>

                <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2" onSubmit={createExam}>
                  <h3 className="sm:col-span-2 text-lg font-bold text-slate-900">Ajouter un examen</h3>
                  <label className="text-sm font-semibold">Titre<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Bac blanc de mathématiques" value={examForm.title} onChange={(event) => setExamForm((current) => ({ ...current, title: event.target.value }))} required /></label>
                  <label className="text-sm font-semibold">Type<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Mathématiques, EAF, DNB..." value={examForm.type} onChange={(event) => setExamForm((current) => ({ ...current, type: event.target.value }))} required /></label>
                  <label className="text-sm font-semibold">Début<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" type="datetime-local" value={examForm.startsAt} onChange={(event) => setExamForm((current) => ({ ...current, startsAt: event.target.value }))} /></label>
                  <label className="text-sm font-semibold">Fin<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" type="datetime-local" value={examForm.endsAt} onChange={(event) => setExamForm((current) => ({ ...current, endsAt: event.target.value }))} /></label>
                  <button className="sm:col-span-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50" disabled={isLoading} type="submit">Ajouter l’examen</button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900">Examens de cette année</h3>
                  {exams.map((exam) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4" key={exam.id}>
                    <div><h4 className="font-bold text-slate-900">{exam.title}</h4><p className="text-sm text-slate-500">{exam.exam_type} · {exam.starts_at ? new Date(exam.starts_at).toLocaleString("fr-FR") : "Date non définie"}</p></div>
                    <div className="flex flex-wrap gap-2"><button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold" onClick={() => void updateExam(exam, { is_published: !exam.is_published })}>{exam.is_published ? "Dépublier" : "Publier"}</button><button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700" onClick={() => void deleteExam(exam)}>Supprimer</button></div>
                  </article>)}
                  {!exams.length ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Aucun examen pour cette année.</p> : null}
                </div>
              </section>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}

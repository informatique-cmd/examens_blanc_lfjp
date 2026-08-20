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

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [newYear, setNewYear] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
                <thead className="bg-slate-100"><tr><th className="px-4 py-3">Année</th><th className="px-4 py-3">État</th><th className="px-4 py-3">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {years.map((year) => <tr key={year.id}>
                    <td className="px-4 py-3 font-semibold">{year.label}</td>
                    <td className="px-4 py-3">{year.is_published ? "Publiée" : "Brouillon"}</td>
                    <td className="space-y-2 px-4 py-3">
                      <button className="mr-3 rounded-lg border border-slate-300 px-3 py-1.5 font-semibold" onClick={() => void togglePublication(year)}>{year.is_published ? "Dépublier" : "Publier"}</button>
                      <div className="mt-2 flex flex-wrap items-center gap-2"><input className="rounded-lg border border-red-200 px-3 py-1.5 text-xs" placeholder={`SUPPRIMER ${year.label}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /><button className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={confirmation !== `SUPPRIMER ${year.label}`} onClick={() => void deleteYear(year)}>Supprimer</button></div>
                    </td>
                  </tr>)}
                  {!years.length && !isLoading ? <tr><td className="px-4 py-6 text-slate-500" colSpan={3}>Aucune année enregistrée.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

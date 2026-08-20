import { FormEvent, useCallback, useEffect, useState } from "react";
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

interface Teacher { id: string; school_year_id: string; civility: "Madame" | "Monsieur"; first_name: string; last_name: string; email: string | null; }
interface Student { id: string; school_year_id: string; first_name: string; last_name: string; class_name: string; }
interface Room { id: string; school_year_id: string; name: string; capacity: number; }
interface Assignment { id: string; exam_id: string; teacher_id: string; room_id: string | null; mission: string; starts_at: string | null; ends_at: string | null; }
type ImportKind = "students" | "teachers" | "exams" | "rooms" | "assignments";
interface ImportPreview { kind: ImportKind; fileName: string; rows: Record<string, string>[]; invalidRows: Array<{ line: number; reason: string }>; }

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const separator = lines[0].includes(";") ? ";" : ",";
  const splitLine = (line: string) => {
    const values: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"') { value += '"'; index += 1; continue; }
      if (character === '"') { quoted = !quoted; continue; }
      if (character === separator && !quoted) { values.push(value.trim()); value = ""; continue; }
      value += character;
    }
    values.push(value.trim());
    return values;
  };
  const headerAliases: Record<string, string> = {
    "prénom": "first_name",
    prenom: "first_name",
    "nom": "last_name",
    "classe": "class_name",
    "civilité": "civility",
    civilite: "civility",
    courriel: "email",
    intitulé: "title",
    intitule: "title",
    type: "exam_type",
    "date_début": "starts_at",
    date_debut: "starts_at",
    date_fin: "ends_at",
    publié: "is_published",
    publie: "is_published",
    capacité: "capacity",
    capacite: "capacity",
    examen: "exam_title",
    salle: "room_name",
    "nom_enseignant": "teacher_last_name",
    "prénom_enseignant": "teacher_first_name",
    prenom_enseignant: "teacher_first_name",
    "adresse email": "email",
  };
  const headers = splitLine(lines[0]).map((header) => {
    const normalized = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return headerAliases[header.toLowerCase()] ?? headerAliases[normalized] ?? normalized;
  });
  return lines.slice(1).map((line) => {
    const values = splitLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teacherForm, setTeacherForm] = useState({ civility: "Madame" as "Madame" | "Monsieur", firstName: "", lastName: "", email: "" });
  const [studentForm, setStudentForm] = useState({ firstName: "", lastName: "", className: "" });
  const [roomForm, setRoomForm] = useState({ name: "", capacity: "" });
  const [assignmentForm, setAssignmentForm] = useState({ examId: "", teacherId: "", roomId: "", mission: "Surveillance", startsAt: "", endsAt: "" });
  const [studentCsv, setStudentCsv] = useState<File | null>(null);
  const [teacherCsv, setTeacherCsv] = useState<File | null>(null);
  const [examCsv, setExamCsv] = useState<File | null>(null);
  const [roomCsv, setRoomCsv] = useState<File | null>(null);
  const [assignmentCsv, setAssignmentCsv] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);

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

  const loadYearContent = useCallback(async (yearId: string) => {
    if (!supabase) return;
    const [teachersResult, studentsResult, roomsResult, examsResult] = await Promise.all([
      supabase.from("teachers").select("id, school_year_id, civility, first_name, last_name, email").eq("school_year_id", yearId).order("last_name"),
      supabase.from("students").select("id, school_year_id, first_name, last_name, class_name").eq("school_year_id", yearId).order("last_name"),
      supabase.from("rooms").select("id, school_year_id, name, capacity").eq("school_year_id", yearId).order("name"),
      supabase.from("exams").select("id").eq("school_year_id", yearId),
    ]);
    const examIds = (examsResult.data ?? []).map((exam) => exam.id);
    const assignmentsResult = examIds.length
      ? await supabase.from("surveillance_assignments").select("id, exam_id, teacher_id, room_id, mission, starts_at, ends_at").in("exam_id", examIds).order("starts_at")
      : { data: [], error: null };
    if (teachersResult.error || studentsResult.error || roomsResult.error || examsResult.error || assignmentsResult.error) {
      setMessage(teachersResult.error?.message ?? studentsResult.error?.message ?? roomsResult.error?.message ?? examsResult.error?.message ?? assignmentsResult.error?.message ?? "Erreur de chargement.");
      return;
    }
    setTeachers(teachersResult.data ?? []);
    setStudents(studentsResult.data ?? []);
    setRooms(roomsResult.data ?? []);
    setAssignments(assignmentsResult.data ?? []);
  }, []);

  useEffect(() => {
    const year = years.find((item) => item.id === selectedYearId);
    if (!year) return;
    setYearDates({ startsOn: year.starts_on ?? "", endsOn: year.ends_on ?? "" });
    void loadExams(year.id);
    void loadYearContent(year.id);
  }, [loadYearContent, selectedYearId, years]);

  async function addTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedYearId || !teacherForm.firstName.trim() || !teacherForm.lastName.trim()) return;
    const { error } = await supabase.from("teachers").insert({ school_year_id: selectedYearId, civility: teacherForm.civility, first_name: teacherForm.firstName.trim(), last_name: teacherForm.lastName.trim(), email: teacherForm.email.trim() || null });
    setMessage(error ? error.message : "Enseignant ajouté.");
    if (!error) { setTeacherForm({ civility: "Madame", firstName: "", lastName: "", email: "" }); await loadYearContent(selectedYearId); }
  }

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedYearId || !studentForm.firstName.trim() || !studentForm.lastName.trim() || !studentForm.className.trim()) return;
    const { error } = await supabase.from("students").insert({ school_year_id: selectedYearId, first_name: studentForm.firstName.trim(), last_name: studentForm.lastName.trim(), class_name: studentForm.className.trim() });
    setMessage(error ? error.message : "Élève ajouté.");
    if (!error) { setStudentForm({ firstName: "", lastName: "", className: "" }); await loadYearContent(selectedYearId); }
  }

  async function addRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedYearId || !roomForm.name.trim()) return;
    const { error } = await supabase.from("rooms").insert({ school_year_id: selectedYearId, name: roomForm.name.trim(), capacity: Number(roomForm.capacity) || 0 });
    setMessage(error ? error.message : "Salle ajoutée.");
    if (!error) { setRoomForm({ name: "", capacity: "" }); await loadYearContent(selectedYearId); }
  }

  async function addAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !assignmentForm.examId || !assignmentForm.teacherId || !assignmentForm.mission.trim()) return;
    const { error } = await supabase.from("surveillance_assignments").insert({ exam_id: assignmentForm.examId, teacher_id: assignmentForm.teacherId, room_id: assignmentForm.roomId || null, mission: assignmentForm.mission.trim(), starts_at: assignmentForm.startsAt ? new Date(assignmentForm.startsAt).toISOString() : null, ends_at: assignmentForm.endsAt ? new Date(assignmentForm.endsAt).toISOString() : null });
    setMessage(error ? error.message : "Surveillance ajoutée.");
    if (!error && selectedYearId) { setAssignmentForm({ examId: "", teacherId: "", roomId: "", mission: "Surveillance", startsAt: "", endsAt: "" }); await loadYearContent(selectedYearId); }
  }

  async function prepareCsvImport(file: File | null, kind: ImportKind) {
    if (!supabase || !selectedYearId || !file) return;
    const parsedRows = parseCsv(await file.text());
    const rows = kind === "rooms"
      ? parsedRows.map((row) => ({ ...row, room_name: row.room_name || row.last_name }))
      : parsedRows;
    if (!rows.length) {
      setMessage("Le fichier CSV doit contenir une ligne d’en-têtes et au moins une ligne de données.");
      return;
    }
    const requiredFields: Record<ImportKind, string[]> = {
      students: ["first_name", "last_name", "class_name"],
      teachers: ["first_name", "last_name"],
      exams: ["title", "exam_type", "starts_at", "ends_at"],
      rooms: ["room_name", "capacity"],
      assignments: ["exam_title", "teacher_last_name", "teacher_first_name", "room_name", "mission", "starts_at", "ends_at"],
    };
    const seen = new Set<string>();
    const invalidRows: Array<{ line: number; reason: string }> = [];
    const validRows = rows.filter((row, index) => {
      const fields = requiredFields[kind];
      const key = fields.map((field) => row[field]).join("|").toLowerCase();
      if (fields.some((field) => !row[field])) { invalidRows.push({ line: index + 2, reason: "Champ obligatoire manquant" }); return false; }
      if (seen.has(key)) { invalidRows.push({ line: index + 2, reason: "Doublon dans le fichier" }); return false; }
      seen.add(key);
      return true;
    });
    setImportPreview({ kind, fileName: file.name, rows: validRows, invalidRows });
    setMessage(`${validRows.length} ligne(s) prête(s) à importer${invalidRows.length ? `, ${invalidRows.length} ligne(s) à corriger` : ""}.`);
  }

  async function confirmCsvImport() {
    if (!supabase || !selectedYearId || !importPreview || !importPreview.rows.length) return;
    const { kind, rows } = importPreview;
    const studentRecords = rows.map((row) => ({ school_year_id: selectedYearId, first_name: row.first_name, last_name: row.last_name, class_name: row.class_name }));
    const teacherRecords = rows.map((row) => ({ school_year_id: selectedYearId, civility: row.civility === "Monsieur" ? "Monsieur" : "Madame", first_name: row.first_name, last_name: row.last_name, email: row.email || null }));
    const examRecords = rows.map((row) => ({ school_year_id: selectedYearId, title: row.title, exam_type: row.exam_type, starts_at: new Date(row.starts_at).toISOString(), ends_at: new Date(row.ends_at).toISOString(), is_published: row.is_published === "true" }));
    const roomRecords = rows.map((row) => ({ school_year_id: selectedYearId, name: row.room_name, capacity: Number(row.capacity) }));
    const examByTitle = new Map(exams.map((exam) => [exam.title.toLowerCase(), exam]));
    const teacherByName = new Map(teachers.map((teacher) => [`${teacher.last_name}|${teacher.first_name}`.toLowerCase(), teacher]));
    const roomByName = new Map(rooms.map((room) => [room.name.toLowerCase(), room]));
    const assignmentRecords = rows.flatMap((row) => {
      const exam = examByTitle.get(row.exam_title.toLowerCase());
      const teacher = teacherByName.get(`${row.teacher_last_name}|${row.teacher_first_name}`.toLowerCase());
      const room = roomByName.get(row.room_name.toLowerCase());
      if (!exam || !teacher || !room) return [];
      return [{ exam_id: exam.id, teacher_id: teacher.id, room_id: room.id, mission: row.mission, starts_at: new Date(row.starts_at).toISOString(), ends_at: new Date(row.ends_at).toISOString() }];
    });
    if (kind === "assignments" && assignmentRecords.length !== rows.length) {
      setMessage("Certaines surveillances font référence à un examen, un enseignant ou une salle inexistante. Corrige le fichier puis relance l’analyse.");
      return;
    }
    setIsLoading(true);
    const result = kind === "students"
      ? await supabase.from("students").insert(studentRecords)
      : kind === "teachers"
        ? await supabase.from("teachers").insert(teacherRecords)
        : kind === "exams"
          ? await supabase.from("exams").insert(examRecords)
          : kind === "rooms"
            ? await supabase.from("rooms").insert(roomRecords)
            : await supabase.from("surveillance_assignments").insert(assignmentRecords);
    setIsLoading(false);
    setMessage(result.error ? result.error.message : `${rows.length} ${kind === "students" ? "élève(s)" : "enseignant(s)"} importé(s).`);
    if (!result.error) {
      setImportPreview(null);
      setStudentCsv(null);
      setTeacherCsv(null);
      setExamCsv(null);
      setRoomCsv(null);
      setAssignmentCsv(null);
      await loadYearContent(selectedYearId);
    }
  }

  async function deleteContent(table: "teachers" | "students" | "rooms" | "surveillance_assignments", id: string) {
    if (!supabase || !selectedYearId || !window.confirm("Supprimer cet élément ?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    setMessage(error ? error.message : "Élément supprimé.");
    if (!error) await loadYearContent(selectedYearId);
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

                {importPreview ? (
                  <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">Vérification avant import</h3><p className="text-sm text-slate-600">{importPreview.fileName} · {importPreview.rows.length} ligne(s) valide(s) · {importPreview.invalidRows.length} erreur(s)</p></div><button className="text-sm font-semibold text-slate-600" onClick={() => setImportPreview(null)}>Annuler</button></div>
                    {importPreview.invalidRows.length ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-semibold">Lignes ignorées</p>{importPreview.invalidRows.slice(0, 8).map((row) => <p key={row.line}>Ligne {row.line} : {row.reason}</p>)}{importPreview.invalidRows.length > 8 ? <p>... et {importPreview.invalidRows.length - 8} autre(s).</p> : null}</div> : null}
                    <div className="mt-4 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white"><table className="min-w-full text-left text-xs"><thead className="bg-slate-100"><tr>{Object.keys(importPreview.rows[0] ?? {}).map((key) => <th className="px-3 py-2" key={key}>{key}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{importPreview.rows.slice(0, 10).map((row, index) => <tr key={`${row.last_name}-${row.first_name}-${index}`}>{Object.keys(importPreview.rows[0] ?? {}).map((key) => <td className="px-3 py-2" key={key}>{row[key]}</td>)}</tr>)}</tbody></table></div>
                    <button className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50" disabled={!importPreview.rows.length || isLoading} onClick={() => void confirmCsvImport()}>Confirmer l’import de {importPreview.rows.length} ligne(s)</button>
                  </section>
                ) : null}

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
                <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4"><p className="text-sm font-semibold text-slate-800">Importer plusieurs examens</p><p className="mt-1 text-xs text-slate-600">Colonnes : <code>intitulé,type,date_début,date_fin,publié</code></p><div className="mt-2 flex flex-wrap gap-2"><input accept=".csv,text/csv" type="file" onChange={(event) => setExamCsv(event.target.files?.[0] ?? null)} /><button className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={!examCsv || isLoading} onClick={() => void prepareCsvImport(examCsv, "exams")}>Analyser les examens</button></div></div>

                <div className="space-y-3">
                  <nav className="sticky top-4 z-10 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur" aria-label="Sections de gestion">
                    {[['examens', 'Examens'], ['enseignants', 'Enseignants'], ['eleves', 'Élèves'], ['salles', 'Salles'], ['surveillances', 'Surveillances']].map(([id, label]) => <a className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-100 hover:text-blue-700" href={`#${id}`} key={id}>{label}</a>)}
                  </nav>
                  <section id="examens" className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900">Examens de cette année</h3>
                  {exams.map((exam) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4" key={exam.id}>
                    <div><h4 className="font-bold text-slate-900">{exam.title}</h4><p className="text-sm text-slate-500">{exam.exam_type} · {exam.starts_at ? new Date(exam.starts_at).toLocaleString("fr-FR") : "Date non définie"}</p></div>
                    <div className="flex flex-wrap gap-2"><button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold" onClick={() => void updateExam(exam, { is_published: !exam.is_published })}>{exam.is_published ? "Dépublier" : "Publier"}</button><button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700" onClick={() => void deleteExam(exam)}>Supprimer</button></div>
                  </article>)}
                  {!exams.length ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Aucun examen pour cette année.</p> : null}
                  </section>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <section id="enseignants" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                    <div><h3 className="text-lg font-bold text-slate-900">Enseignants</h3><p className="text-sm text-slate-500">Ajoute les personnes qui pourront être affectées aux surveillances.</p></div>
                    <form className="grid gap-2 sm:grid-cols-2" onSubmit={addTeacher}>
                      <select className="rounded-lg border border-slate-300 px-3 py-2" value={teacherForm.civility} onChange={(event) => setTeacherForm((current) => ({ ...current, civility: event.target.value as "Madame" | "Monsieur" }))}><option>Madame</option><option>Monsieur</option></select>
                      <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Prénom" value={teacherForm.firstName} onChange={(event) => setTeacherForm((current) => ({ ...current, firstName: event.target.value }))} required />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Nom" value={teacherForm.lastName} onChange={(event) => setTeacherForm((current) => ({ ...current, lastName: event.target.value }))} required />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Email (facultatif)" type="email" value={teacherForm.email} onChange={(event) => setTeacherForm((current) => ({ ...current, email: event.target.value }))} />
                      <button className="rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white sm:col-span-2" type="submit">Ajouter l’enseignant</button>
                    </form>
                    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3">
                      <p className="text-xs text-slate-600">Colonnes : <code>civilité,prénom,nom,email</code></p>
                      <div className="mt-2 flex flex-wrap items-center gap-2"><input accept=".csv,text/csv" type="file" onChange={(event) => setTeacherCsv(event.target.files?.[0] ?? null)} /><button className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={!teacherCsv || isLoading} onClick={() => void prepareCsvImport(teacherCsv, "teachers")}>Analyser le fichier</button></div>
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto">{teachers.map((teacher) => <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm" key={teacher.id}><span>{teacher.civility} {teacher.first_name} {teacher.last_name}</span><button className="text-xs font-semibold text-red-700" onClick={() => void deleteContent("teachers", teacher.id)}>Supprimer</button></div>)}{!teachers.length ? <p className="text-sm text-slate-500">Aucun enseignant.</p> : null}</div>
                  </section>

                  <section id="eleves" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                    <div><h3 className="text-lg font-bold text-slate-900">Élèves</h3><p className="text-sm text-slate-500">Les élèves sont rattachés à cette année et à leur classe.</p></div>
                    <form className="grid gap-2 sm:grid-cols-3" onSubmit={addStudent}>
                      <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Prénom" value={studentForm.firstName} onChange={(event) => setStudentForm((current) => ({ ...current, firstName: event.target.value }))} required />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Nom" value={studentForm.lastName} onChange={(event) => setStudentForm((current) => ({ ...current, lastName: event.target.value }))} required />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Classe" value={studentForm.className} onChange={(event) => setStudentForm((current) => ({ ...current, className: event.target.value }))} required />
                      <button className="rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white sm:col-span-3" type="submit">Ajouter l’élève</button>
                    </form>
                    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3">
                      <p className="text-xs text-slate-600">Colonnes : <code>prénom,nom,classe</code></p>
                      <div className="mt-2 flex flex-wrap items-center gap-2"><input accept=".csv,text/csv" type="file" onChange={(event) => setStudentCsv(event.target.files?.[0] ?? null)} /><button className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={!studentCsv || isLoading} onClick={() => void prepareCsvImport(studentCsv, "students")}>Analyser le fichier</button></div>
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto">{students.map((student) => <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm" key={student.id}><span>{student.last_name} {student.first_name} <small className="text-slate-500">({student.class_name})</small></span><button className="text-xs font-semibold text-red-700" onClick={() => void deleteContent("students", student.id)}>Supprimer</button></div>)}{!students.length ? <p className="text-sm text-slate-500">Aucun élève.</p> : null}</div>
                  </section>

                  <section id="salles" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                    <div><h3 className="text-lg font-bold text-slate-900">Salles</h3><p className="text-sm text-slate-500">Définis les salles et leur capacité.</p></div>
                    <form className="grid gap-2 sm:grid-cols-3" onSubmit={addRoom}><input className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2" placeholder="Salle S12" value={roomForm.name} onChange={(event) => setRoomForm((current) => ({ ...current, name: event.target.value }))} required /><input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Capacité" type="number" min="0" value={roomForm.capacity} onChange={(event) => setRoomForm((current) => ({ ...current, capacity: event.target.value }))} /><button className="rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white sm:col-span-3" type="submit">Ajouter la salle</button></form>
                    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3"><p className="text-xs text-slate-600">Colonnes : <code>nom,capacité</code></p><div className="mt-2 flex flex-wrap gap-2"><input accept=".csv,text/csv" type="file" onChange={(event) => setRoomCsv(event.target.files?.[0] ?? null)} /><button className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={!roomCsv || isLoading} onClick={() => void prepareCsvImport(roomCsv, "rooms")}>Analyser les salles</button></div></div>
                    <div className="max-h-48 space-y-2 overflow-y-auto">{rooms.map((room) => <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm" key={room.id}><span>{room.name} <small className="text-slate-500">({room.capacity} places)</small></span><button className="text-xs font-semibold text-red-700" onClick={() => void deleteContent("rooms", room.id)}>Supprimer</button></div>)}{!rooms.length ? <p className="text-sm text-slate-500">Aucune salle.</p> : null}</div>
                  </section>

                  <section id="surveillances" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                    <div><h3 className="text-lg font-bold text-slate-900">Surveillances</h3><p className="text-sm text-slate-500">Affecte un enseignant et une salle à un examen.</p></div>
                    <form className="grid gap-2 sm:grid-cols-2" onSubmit={addAssignment}>
                      <select className="rounded-lg border border-slate-300 px-3 py-2" value={assignmentForm.examId} onChange={(event) => setAssignmentForm((current) => ({ ...current, examId: event.target.value }))} required><option value="">Examen</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select>
                      <select className="rounded-lg border border-slate-300 px-3 py-2" value={assignmentForm.teacherId} onChange={(event) => setAssignmentForm((current) => ({ ...current, teacherId: event.target.value }))} required><option value="">Enseignant</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.last_name} {teacher.first_name}</option>)}</select>
                      <select className="rounded-lg border border-slate-300 px-3 py-2" value={assignmentForm.roomId} onChange={(event) => setAssignmentForm((current) => ({ ...current, roomId: event.target.value }))}><option value="">Salle facultative</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select>
                      <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Mission" value={assignmentForm.mission} onChange={(event) => setAssignmentForm((current) => ({ ...current, mission: event.target.value }))} required />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" type="datetime-local" value={assignmentForm.startsAt} onChange={(event) => setAssignmentForm((current) => ({ ...current, startsAt: event.target.value }))} />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" type="datetime-local" value={assignmentForm.endsAt} onChange={(event) => setAssignmentForm((current) => ({ ...current, endsAt: event.target.value }))} />
                      <button className="rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white sm:col-span-2" type="submit">Ajouter la surveillance</button>
                    </form>
                    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3"><p className="text-xs text-slate-600">Colonnes : <code>examen,nom_enseignant,prénom_enseignant,salle,mission,date_début,date_fin</code></p><div className="mt-2 flex flex-wrap gap-2"><input accept=".csv,text/csv" type="file" onChange={(event) => setAssignmentCsv(event.target.files?.[0] ?? null)} /><button className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={!assignmentCsv || isLoading} onClick={() => void prepareCsvImport(assignmentCsv, "assignments")}>Analyser les surveillances</button></div></div>
                    <div className="max-h-48 space-y-2 overflow-y-auto">{assignments.map((assignment) => <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm" key={assignment.id}><span>{assignment.mission}</span><button className="text-xs font-semibold text-red-700" onClick={() => void deleteContent("surveillance_assignments", assignment.id)}>Supprimer</button></div>)}{!assignments.length ? <p className="text-sm text-slate-500">Aucune surveillance.</p> : null}</div>
                  </section>
                </div>
              </section>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}

import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  X,
  Mail,
  BookOpen,
  UserCheck,
} from "lucide-react";
import type { CmsTeacher } from "../../../shared/services/cms-store";
import {
  downloadCsvTemplate,
  parsePronoteProfsCsv,
} from "../../../shared/services/pronote-csv-service";

interface DataProfsSectionProps {
  teachers: CmsTeacher[];
  onSetTeachers: (teachers: CmsTeacher[]) => void;
  onAddTeacher: (teacher: Omit<CmsTeacher, "id">) => void;
  onUpdateTeacher: (id: string, updates: Partial<CmsTeacher>) => void;
  onDeleteTeacher: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function DataProfsSection({
  teachers,
  onSetTeachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onShowNotification,
}: DataProfsSectionProps) {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<CmsTeacher | null>(null);

  // Import state
  const [pasteText, setPasteText] = useState("");
  const [importMode, setImportMode] = useState<"replace" | "append">("append");
  const [importError, setImportError] = useState<string | null>(null);

  // Manual Form State
  const [formCivility, setFormCivility] = useState<"Madame" | "Monsieur">("Monsieur");
  const [formLastName, setFormLastName] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const distinctSubjects = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.subject && t.subject.trim()) {
        set.add(t.subject.trim());
      }
    });
    return Array.from(set).sort();
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.lastName.toLowerCase().includes(q) ||
        t.firstName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.email && t.email.toLowerCase().includes(q));

      const matchSubject =
        selectedSubject === "ALL" ||
        t.subject.toLowerCase() === selectedSubject.toLowerCase();

      return matchSearch && matchSubject;
    });
  }, [teachers, search, selectedSubject]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCsvData(content);
    };
    reader.readAsText(file, "UTF-8");
  };

  const processCsvData = (rawText: string) => {
    setImportError(null);
    const res = parsePronoteProfsCsv(rawText);

    if (!res.success || res.data.length === 0) {
      setImportError(res.error || "Impossible de lire la liste des enseignants. Vérifiez les colonnes.");
      return;
    }

    if (importMode === "replace") {
      onSetTeachers(res.data);
      onShowNotification(`🎉 ${res.count} enseignants importés avec succès depuis Pronote !`);
    } else {
      const existingKey = new Set(
        teachers.map((t) => `${t.lastName.toUpperCase()}_${t.firstName.toUpperCase()}`)
      );
      const newItems = res.data.filter(
        (t) => !existingKey.has(`${t.lastName.toUpperCase()}_${t.firstName.toUpperCase()}`)
      );
      onSetTeachers([...teachers, ...newItems]);
      onShowNotification(
        `🎉 ${newItems.length} nouveaux enseignants ajoutés (${res.count - newItems.length} doublons ignorés) !`
      );
    }

    setPasteText("");
    setShowImportModal(false);
  };

  const openEditModal = (t: CmsTeacher) => {
    setEditingTeacher(t);
    setFormCivility(t.civility);
    setFormLastName(t.lastName);
    setFormFirstName(t.firstName);
    setFormSubject(t.subject);
    setFormEmail(t.email || "");
    setShowManualModal(true);
  };

  const openCreateModal = () => {
    setEditingTeacher(null);
    setFormCivility("Madame");
    setFormLastName("");
    setFormFirstName("");
    setFormSubject("Mathématiques");
    setFormEmail("");
    setShowManualModal(true);
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLastName.trim()) {
      alert("Le nom de famille est obligatoire.");
      return;
    }

    const emailAuto =
      formEmail.trim() ||
      `${formFirstName.trim().charAt(0).toLowerCase()}.${formLastName.trim().toLowerCase()}@lfjpsaly.org`;

    if (editingTeacher) {
      onUpdateTeacher(editingTeacher.id, {
        civility: formCivility,
        lastName: formLastName.trim().toUpperCase(),
        firstName: formFirstName.trim(),
        subject: formSubject.trim() || "Enseignement Général",
        email: emailAuto,
      });
      onShowNotification("Enseignant mis à jour.");
    } else {
      onAddTeacher({
        civility: formCivility,
        lastName: formLastName.trim().toUpperCase(),
        firstName: formFirstName.trim(),
        subject: formSubject.trim() || "Enseignement Général",
        email: emailAuto,
      });
      onShowNotification("Nouvel enseignant enregistré.");
    }

    setShowManualModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Équipe Pédagogique & Professeurs (Pronote / EDT)
            </h2>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
            Importez ou gérez la liste officielle des professeurs pour les convocations et surveillances d'examen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadCsvTemplate("profs")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            title="Télécharger le modèle CSV officiel prêt pour Pronote"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Modèle Pronote Profs</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-100 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            <span>Importer Pronote / CSV</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter manuellement</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Enseignants</p>
            <p className="text-2xl font-black text-slate-900">{teachers.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Disciplines</p>
            <p className="text-2xl font-black text-slate-900">{distinctSubjects.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avec Courriel</p>
            <p className="text-2xl font-black text-slate-900">
              {teachers.filter((t) => Boolean(t.email)).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, discipline, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {distinctSubjects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Discipline :</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Toutes ({teachers.length})</option>
              {distinctSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Teachers Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Enseignant</th>
                <th className="px-5 py-3.5">Discipline</th>
                <th className="px-5 py-3.5">Courriel Institutionnel</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <GraduationCap className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold">Aucun enseignant trouvé</p>
                    <p className="text-[11px] mt-0.5">
                      {search || selectedSubject !== "ALL"
                        ? "Modifiez vos filtres de recherche."
                        : "Cliquez sur 'Importer Pronote / CSV' ou 'Ajouter manuellement'."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/60 text-xs font-black text-blue-800">
                          {t.civility === "Madame" ? "Mme" : "M."}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {t.lastName} {t.firstName}
                          </p>
                          <p className="text-[11px] text-slate-400">{t.civility}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        <BookOpen className="h-3 w-3 text-slate-500" />
                        {t.subject}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {t.email ? (
                        <a
                          href={`mailto:${t.email}`}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 hover:underline"
                        >
                          <Mail className="h-3 w-3 text-blue-500" />
                          {t.email}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(t)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="Modifier"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer ${t.civility} ${t.lastName} ${t.firstName} ?`)) {
                              onDeleteTeacher(t.id);
                              onShowNotification("Enseignant supprimé.");
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Importer les Enseignants depuis Pronote / EDT
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-blue-50/70 p-3.5 border border-blue-100">
                <div className="text-xs text-blue-900">
                  <p className="font-bold">Vous avez besoin du modèle Pronote ?</p>
                  <p className="text-blue-700 mt-0.5">
                    Téléchargez le fichier CSV pré-formaté avec les colonnes Pronote officielles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCsvTemplate("profs")}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-50 border border-blue-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Télécharger</span>
                </button>
              </div>

              {/* Mode choice */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mode d'importation :</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("append")}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      importMode === "append"
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block font-bold">Fusionner (Recommandé)</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Conserve les professeurs existants et ajoute les nouveaux
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      importMode === "replace"
                        ? "border-amber-600 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block font-bold">Remplacer tout</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Écrase la liste actuelle par le nouveau fichier
                    </span>
                  </button>
                </div>
              </div>

              {/* File input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Option 1 : Choisir un fichier CSV / TXT</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700"
                  />
                </div>
              </div>

              {/* Textarea paste */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Option 2 : Ou collez directement le texte copié de Pronote / Excel (Ctrl+V)
                </label>
                <textarea
                  rows={5}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Civilité;Nom;Prénom;Discipline;Courriel\nMonsieur;NDIAYE;Babacar;Mathématiques;b.ndiaye@lfjpsaly.org\nMadame;DUPONT;Claire;Lettres Modernes;c.dupont@lfjpsaly.org`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 font-mono text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              {importError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => processCsvData(pasteText)}
                disabled={!pasteText.trim()}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                Traiter le contenu collé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingTeacher ? "Modifier l'enseignant" : "Ajouter un enseignant"}
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Civilité *</label>
                  <select
                    value={formCivility}
                    onChange={(e) => setFormCivility(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Monsieur">Monsieur</option>
                    <option value="Madame">Madame</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    placeholder="NDIAYE"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold uppercase text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Prénom</label>
                  <input
                    type="text"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    placeholder="Babacar"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Discipline / Matière *</label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Mathématiques, Lettres modernes, SVT..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Courriel Institutionnel (optionnel, auto-généré si vide)
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="b.ndiaye@lfjpsaly.org"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

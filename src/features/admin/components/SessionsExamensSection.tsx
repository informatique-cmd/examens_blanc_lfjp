import React, { useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  ArrowRight,
  School,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";
import type { CmsExam, CmsExamSlot, SiteInfo } from "../../../shared/services/cms-store";
import {
  DEFAULT_SCHOOL_LEVELS,
  getExamTargetLevels,
  formatTargetLevelsSummary,
  getShortLevelBadge,
} from "../../../shared/services/cms-store";

interface SessionsExamensSectionProps {
  exams: CmsExam[];
  examSlots: CmsExamSlot[];
  siteInfo?: SiteInfo;
  onAddExam: (exam: Omit<CmsExam, "id">) => void;
  onUpdateExam: (id: string, updates: Partial<CmsExam>) => void;
  onDeleteExam: (id: string) => void;
  onNavigateToSlots: (examTitle: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function SessionsExamensSection({
  exams,
  examSlots,
  siteInfo,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onNavigateToSlots,
  onShowNotification,
}: SessionsExamensSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  const availableLevels =
    siteInfo?.schoolLevels && siteInfo.schoolLevels.length > 0
      ? siteInfo.schoolLevels
      : DEFAULT_SCHOOL_LEVELS;

  const selectableLevels = availableLevels.filter(
    (l) => !l.toLowerCase().includes("tous")
  );

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formExamType, setFormExamType] = useState("Examen Blanc");
  const [formTargetLevels, setFormTargetLevels] = useState<string[]>([
    selectableLevels[0] || "3ème (DNB Collège)",
  ]);
  const [formPeriod, setFormPeriod] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"Prévu" | "En cours" | "Terminé" | "Archivé">("Prévu");
  const [formIsPublished, setFormIsPublished] = useState(true);

  const toggleTargetLevel = (lvl: string) => {
    setFormTargetLevels((prev) => {
      if (prev.includes(lvl)) {
        const next = prev.filter((item) => item !== lvl);
        return next;
      }
      return [...prev, lvl];
    });
  };

  const handleSelectAllLevels = () => {
    if (formTargetLevels.length === selectableLevels.length) {
      setFormTargetLevels([selectableLevels[0] || "Terminale (Baccalauréat)"]);
    } else {
      setFormTargetLevels([...selectableLevels]);
    }
  };

  const handleOpenNewModal = () => {
    setEditingExamId(null);
    setFormTitle("");
    setFormExamType("Examen Blanc");
    setFormTargetLevels([selectableLevels[0] || "3ème (DNB Collège)"]);
    setFormPeriod("Avril 2026");
    setFormStartsAt(new Date().toISOString().split("T")[0]);
    setFormEndsAt(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormStatus("Prévu");
    setFormIsPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exam: CmsExam) => {
    setEditingExamId(exam.id);
    setFormTitle(exam.title);
    setFormExamType(exam.examType || "Examen Blanc");
    const existingLevels = getExamTargetLevels(exam);
    if (existingLevels.some((l) => l.toLowerCase().includes("tous"))) {
      setFormTargetLevels([...selectableLevels]);
    } else {
      setFormTargetLevels(existingLevels);
    }
    setFormPeriod(exam.period || "");
    setFormStartsAt(exam.startsAt || "");
    setFormEndsAt(exam.endsAt || "");
    setFormDescription(exam.description || "");
    setFormStatus(exam.status || "Prévu");
    setFormIsPublished(exam.isPublished !== false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Veuillez saisir un intitulé pour l'examen.");
      return;
    }

    const effectiveLevels =
      formTargetLevels.length > 0 ? formTargetLevels : ["Tous niveaux"];
    const summaryLabel = formatTargetLevelsSummary(effectiveLevels);

    const payload: Omit<CmsExam, "id"> = {
      title: formTitle.trim(),
      examType: formExamType,
      targetLevel: summaryLabel,
      targetLevels: effectiveLevels,
      period: formPeriod.trim() || "Période à définir",
      startsAt: formStartsAt,
      endsAt: formEndsAt,
      description: formDescription.trim(),
      status: formStatus,
      isPublished: formIsPublished,
    };

    if (editingExamId) {
      onUpdateExam(editingExamId, payload);
      onShowNotification(`Session "${formTitle}" mise à jour avec succès !`);
    } else {
      onAddExam(payload);
      onShowNotification(`Nouvelle session "${formTitle}" créée ! Vous pouvez maintenant y rattacher des épreuves.`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900">
              Étape 3 du Workflow • Cadre Général
            </span>
            <span className="text-xs text-slate-500">
              Définition des sessions d'examens
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-700" />
            <span>📋 Sessions d'Examens & Périodes</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Créez d'abord la session d'examen (ex: DNB blanc, Baccalauréat blanc 1ère & Terminale) avant de programmer les épreuves et créneaux associés.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une Session d'Examen</span>
        </button>
      </div>

      {/* Workflow Explanatory Stepper Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-blue-700 shrink-0" />
            <span>Workflow Recommandé :</span>
          </p>
          <p className="text-blue-800/90 text-[11px]">
            1. Créez la session ci-dessous (1 ou plusieurs niveaux) ➔ 2. Cliquez sur "Programmer les épreuves" ➔ 3. Lancez la répartition des candidats & surveillants ➔ 4. Diffusez sur la vitrine.
          </p>
        </div>
      </div>

      {/* List of Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 space-y-2">
            <Calendar className="h-10 w-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm">Aucune session d'examen n'a encore été créée.</p>
            <p className="text-xs text-slate-500">
              Cliquez sur "Créer une Session d'Examen" pour démarrer l'organisation.
            </p>
          </div>
        ) : (
          exams.map((exam) => {
            const tiedSlots = examSlots.filter(
              (s) => s.examId === exam.id || s.examTitle.toLowerCase() === exam.title.toLowerCase()
            );
            const examLevels = getExamTargetLevels(exam);

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {examLevels.map((lvl) => (
                        <span
                          key={lvl}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200"
                        >
                          {getShortLevelBadge(lvl) || lvl}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                      Statut : <strong className="text-slate-800">{exam.status || "Prévu"}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Période : {exam.period}</span>
                  </p>

                  {exam.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {exam.description}
                    </p>
                  )}

                  {/* Tied slots count */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Épreuves rattachées :
                    </span>
                    <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {tiedSlots.length} créneau(x) défini(s)
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(exam)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                      title="Modifier les informations de la session"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Supprimer définitivement la session "${exam.title}" ?`)) {
                          onDeleteExam(exam.id);
                          onShowNotification(`Session "${exam.title}" supprimée.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Supprimer cette session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Next Step CTA */}
                  <button
                    type="button"
                    onClick={() => onNavigateToSlots(exam.title)}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Programmer les épreuves</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create or Edit Exam Session */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingExamId ? "Modifier la Session d'Examen" : "Créer une Nouvelle Session d'Examen"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intitulé officiel de la session *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: DNB blanc 2026, Baccalauréat blanc 1ère & Terminale..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700">
                    Niveaux scolaires ciblés (sélection multiple : 1, 2, 3...) *
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllLevels}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    {formTargetLevels.length === selectableLevels.length
                      ? "Restreindre"
                      : "Tout sélectionner"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 max-h-44 overflow-y-auto">
                  {selectableLevels.map((lvl) => {
                    const checked = formTargetLevels.includes(lvl);
                    return (
                      <label
                        key={lvl}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-[11px] font-semibold ${
                          checked
                            ? "bg-blue-50 border-blue-400 text-blue-900"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTargetLevel(lvl)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{lvl}</span>
                      </label>
                    );
                  })}
                </div>
                {formTargetLevels.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Aucun niveau spécifique coché : la session s'appliquera à « Tous niveaux ».
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Période d'organisation *
                </label>
                <input
                  type="text"
                  required
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  placeholder="Ex: 24 et 25 Mars 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description succincte
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Modalités de l'examen, publics concernés, consignes générales..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Statut de la session
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as CmsExam["status"])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Prévu">Prévu</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Archivé">Archivé</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Diffuser sur la vitrine</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-xs"
                >
                  {editingExamId ? "Enregistrer" : "Créer la session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

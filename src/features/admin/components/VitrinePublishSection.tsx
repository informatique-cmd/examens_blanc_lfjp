import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ExternalLink,
  Users,
  GraduationCap,
  Award,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Tag,
  CheckCircle2,
  AlertCircle,
  School,
  Layers,
} from "lucide-react";
import type {
  CmsExam,
  CmsAnnouncement,
  CmsSurveillance,
  CmsExamSlot,
  CmsCallout,
  SiteInfo,
} from "../../../shared/services/cms-store";

interface VitrinePublishSectionProps {
  siteInfo: SiteInfo;
  exams: CmsExam[];
  announcements: CmsAnnouncement[];
  surveillances: CmsSurveillance[];
  examSlots?: CmsExamSlot[];
  callouts?: CmsCallout[];
  onTogglePublishExam: (id: string, isPublished: boolean) => void;
  onTogglePublishAnnouncement: (id: string, isPublished: boolean) => void;
  onAddAnnouncement?: (item: Omit<CmsAnnouncement, "id">) => void;
  onUpdateAnnouncement?: (id: string, updates: Partial<CmsAnnouncement>) => void;
  onDeleteAnnouncement?: (id: string) => void;
  onAddExam?: (item: Omit<CmsExam, "id">) => void;
  onUpdateExam?: (id: string, updates: Partial<CmsExam>) => void;
  onDeleteExam?: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function VitrinePublishSection({
  siteInfo,
  exams,
  announcements,
  surveillances,
  examSlots = [],
  callouts = [],
  onTogglePublishExam,
  onTogglePublishAnnouncement,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onShowNotification,
}: VitrinePublishSectionProps) {
  const publishedExamsCount = exams.filter((e) => e.isPublished !== false).length;
  const publishedAnnouncementsCount = announcements.filter((a) => a.isPublished).length;

  // Active sub-tab in publication: "exams" | "announcements" | "callouts"
  const [activeTab, setActiveTab] = useState<"exams" | "announcements">("exams");

  // Announcement Modal State
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annTarget, setAnnTarget] = useState<"all" | "bac" | "dnb" | "teachers">("all");
  const [annPriority, setAnnPriority] = useState<"information" | "important" | "urgent">("information");
  const [annIsPublished, setAnnIsPublished] = useState(true);

  // Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [examType, setExamType] = useState("Examen Blanc");
  const [examTargetLevel, setExamTargetLevel] = useState("3ème");
  const [examPeriod, setExamPeriod] = useState("");
  const [examStartsAt, setExamStartsAt] = useState("");
  const [examEndsAt, setExamEndsAt] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examStatus, setExamStatus] = useState<"Prévu" | "En cours" | "Terminé" | "Archivé">("Prévu");
  const [examIsPublished, setExamIsPublished] = useState(true);

  // Handlers for Announcements
  const handleOpenNewAnnouncement = () => {
    setEditingAnnId(null);
    setAnnTitle("");
    setAnnContent("");
    setAnnTarget("all");
    setAnnPriority("information");
    setAnnIsPublished(true);
    setIsAnnModalOpen(true);
  };

  const handleOpenEditAnnouncement = (ann: CmsAnnouncement) => {
    setEditingAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnTarget(ann.target);
    setAnnPriority(ann.priority);
    setAnnIsPublished(ann.isPublished);
    setIsAnnModalOpen(true);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      alert("Veuillez renseigner un titre et un contenu.");
      return;
    }

    const payload: Omit<CmsAnnouncement, "id"> = {
      title: annTitle.trim(),
      content: annContent.trim(),
      target: annTarget,
      priority: annPriority,
      isPublished: annIsPublished,
      date: new Date().toLocaleDateString("fr-FR"),
    };

    if (editingAnnId) {
      if (onUpdateAnnouncement) {
        onUpdateAnnouncement(editingAnnId, payload);
        onShowNotification("Consigne / Communiqué mis à jour avec succès !");
      }
    } else {
      if (onAddAnnouncement) {
        onAddAnnouncement(payload);
        onShowNotification("Nouvelle consigne publiée avec succès sur la vitrine !");
      }
    }

    setIsAnnModalOpen(false);
  };

  // Handlers for Exams
  const handleOpenNewExam = () => {
    setEditingExamId(null);
    setExamTitle("");
    setExamType("Examen Blanc");
    setExamTargetLevel("3ème");
    setExamPeriod("Avril 2026");
    setExamStartsAt(new Date().toISOString().split("T")[0]);
    setExamEndsAt(new Date().toISOString().split("T")[0]);
    setExamDescription("");
    setExamStatus("Prévu");
    setExamIsPublished(true);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam: CmsExam) => {
    setEditingExamId(exam.id);
    setExamTitle(exam.title);
    setExamType(exam.examType || "Examen Blanc");
    setExamTargetLevel(exam.targetLevel || "3ème");
    setExamPeriod(exam.period || "");
    setExamStartsAt(exam.startsAt || "");
    setExamEndsAt(exam.endsAt || "");
    setExamDescription(exam.description || "");
    setExamStatus(exam.status || "Prévu");
    setExamIsPublished(exam.isPublished !== false);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      alert("Veuillez saisir le titre de la session d'examen.");
      return;
    }

    const payload: Omit<CmsExam, "id"> = {
      title: examTitle.trim(),
      examType,
      targetLevel: examTargetLevel,
      period: examPeriod.trim(),
      startsAt: examStartsAt,
      endsAt: examEndsAt,
      description: examDescription.trim(),
      status: examStatus,
      isPublished: examIsPublished,
    };

    if (editingExamId) {
      if (onUpdateExam) {
        onUpdateExam(editingExamId, payload);
        onShowNotification(`Session "${examTitle}" modifiée avec succès !`);
      }
    } else {
      if (onAddExam) {
        onAddExam(payload);
        onShowNotification(`Nouvelle session "${examTitle}" créée avec succès !`);
      }
    }

    setIsExamModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Live Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Diffusion Publique • Tous les Acteurs
            </span>
            <span className="text-xs text-slate-500">
              Contrôle du site vitrine pour les familles, élèves et professeurs
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span>📢 Vitrine & Publications Officielles</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Ajoutez, modifiez, supprimez et contrôlez en temps réel la publication des sessions, des horaires d'épreuves et des consignes.
          </p>
        </div>

        <Link
          to="/"
          target="_blank"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Accéder à la Vitrine Publique</span>
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Sessions en Ligne
            </p>
            <p className="text-base font-bold text-slate-900">
              {publishedExamsCount} / {exams.length} publiée(s)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Créneaux d'Épreuves
            </p>
            <p className="text-base font-bold text-slate-900">
              {examSlots.length} épreuve(s) programmée(s)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Consignes & Communiqués
            </p>
            <p className="text-base font-bold text-slate-900">
              {publishedAnnouncementsCount} / {announcements.length} diffusé(s)
            </p>
          </div>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("exams")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "exams"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Sessions d'Examens ({exams.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "announcements"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Consignes & Annonces Direction ({announcements.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SESSIONS D'EXAMENS                                 */}
      {/* ======================================================== */}
      {activeTab === "exams" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#3498db]" />
                <span>Sessions d'Examens — Statut & Publication des Horaires</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Les sessions publiées s'affichent sur la vitrine avec leurs créneaux d'épreuves, horaires standard et tiers-temps.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewExam}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une Session d'Examen</span>
            </button>
          </div>

          <div className="space-y-4">
            {exams.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                Aucune session d'examen configurée. Cliquez sur "Ajouter une Session d'Examen".
              </div>
            ) : (
              exams.map((exam) => {
                const isPub = exam.isPublished !== false;
                // Find slots tied to this exam
                const tiedSlots = examSlots.filter(
                  (s) => s.examTitle === exam.title || s.examId === exam.id
                );

                return (
                  <div
                    key={exam.id}
                    className={`p-4 rounded-xl border transition space-y-3 ${
                      isPub
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200 bg-slate-50 opacity-80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{exam.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-indigo-700 border border-slate-200">
                            Niveau {exam.targetLevel}
                          </span>
                          <span className="text-xs text-slate-500">• {exam.status}</span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Période : {exam.period}</span>
                        </p>
                        {exam.description && (
                          <p className="text-xs text-slate-500">{exam.description}</p>
                        )}
                      </div>

                      {/* Action buttons: Publish toggle, Edit, Delete */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onTogglePublishExam(exam.id, !isPub);
                            onShowNotification(
                              isPub
                                ? `Session "${exam.title}" retirée de la vitrine.`
                                : `Session "${exam.title}" publiée avec succès sur la vitrine !`
                            );
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                            isPub
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                              : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                          }`}
                        >
                          {isPub ? (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Publiée sur Vitrine</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>Dépubliée (Brouillon)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditExam(exam)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                          title="Modifier cette session"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer définitivement la session "${exam.title}" ?`)) {
                              if (onDeleteExam) {
                                onDeleteExam(exam.id);
                                onShowNotification(`Session "${exam.title}" supprimée.`);
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Supprimer cette session"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Associated Exam Slots preview on Vitrine */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-indigo-500" />
                          <span>Créneaux d'épreuves associés ({tiedSlots.length}) :</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {tiedSlots.length > 0 ? "Affichage conforme sur la vitrine" : "Aucun créneau programmé"}
                        </span>
                      </div>

                      {tiedSlots.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {tiedSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span className="truncate">{slot.subject}</span>
                                <span className="text-[10px] font-mono text-slate-500">{slot.date}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono text-slate-700">
                                  {slot.startTime} ➔ {slot.endTime}
                                </span>
                                {slot.tiersTempsEndTime && (
                                  <span className="font-mono text-purple-700 font-bold text-[10px]">
                                    TT: {slot.tiersTempsEndTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          Pour ajouter des épreuves à cette session, rendez-vous dans l'Étape 3 : "Créneaux des Épreuves".
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ANNONCES & CONSIGNES OFFICIELLES                  */}
      {/* ======================================================== */}
      {activeTab === "announcements" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Consignes Officielles & Communiqués de Direction</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ces messages s'affichent instantanément sur le bandeau d'accueil de la vitrine selon la cible sélectionnée.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewAnnouncement}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle Consigne / Annonce</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                Aucune consigne configurée. Cliquez sur "Nouvelle Consigne / Annonce".
              </div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition gap-3 ${
                    ann.isPublished
                      ? "border-sky-200 bg-sky-50/40"
                      : "border-slate-200 bg-slate-50 opacity-75"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{ann.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white text-slate-600 border border-slate-200">
                        Cible : {ann.target === "all" ? "Tous" : ann.target === "teachers" ? "Professeurs" : "Élèves"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        ann.priority === "urgent"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : ann.priority === "important"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                    <p className="text-[10px] text-slate-400">Date : {ann.date}</p>
                  </div>

                  {/* Action buttons: Publish, Edit, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onTogglePublishAnnouncement(ann.id, !ann.isPublished);
                        onShowNotification(
                          ann.isPublished
                            ? `Consigne masquée de la vitrine.`
                            : `Consigne publiée sur la vitrine pour les acteurs !`
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                        ann.isPublished
                          ? "bg-sky-600 hover:bg-sky-500 text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      {ann.isPublished ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Publiée</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Masquée</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditAnnouncement(ann)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                      title="Modifier cette annonce"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Supprimer l'annonce "${ann.title}" ?`)) {
                          if (onDeleteAnnouncement) {
                            onDeleteAnnouncement(ann.id);
                            onShowNotification("Consigne supprimée.");
                          }
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Supprimer cette annonce"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Announcement */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingAnnId ? "Modifier l'Annonce / Consigne" : "Nouvelle Consigne pour la Vitrine"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titre de l'annonce *
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Ex: Arrivée des candidats 15 min avant les épreuves"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message / Contenu détaillé *
                </label>
                <textarea
                  required
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Détaillez les consignes matérielles, documents à apporter, interdictions..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Public ciblé
                  </label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="all">Tous les acteurs</option>
                    <option value="dnb">Candidats DNB (3ème)</option>
                    <option value="bac">Candidats Bac (1ère / Tale)</option>
                    <option value="teachers">Professeurs surveillants</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Niveau d'importance
                  </label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="information">Information générale</option>
                    <option value="important">Important (Orange)</option>
                    <option value="urgent">Urgent / Impératif (Rouge)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={annIsPublished}
                  onChange={(e) => setAnnIsPublished(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Rendre visible immédiatement sur la vitrine publique</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-xs"
                >
                  {editingAnnId ? "Enregistrer les modifications" : "Publier l'annonce"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Exam Session */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingExamId ? "Modifier la Session d'Examen" : "Nouvelle Session d'Examen"}
              </h3>
              <button
                type="button"
                onClick={() => setIsExamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Intitulé officiel de la session *
                </label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Ex: DNB blanc 2026, Baccalauréat blanc 1ère..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Niveau scolaire ciblé
                  </label>
                  <select
                    value={examTargetLevel}
                    onChange={(e) => setExamTargetLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="3ème">3ème (DNB Collège)</option>
                    <option value="1ère">1ère (Bac Français)</option>
                    <option value="Terminale">Terminale (Baccalauréat)</option>
                    <option value="Tous niveaux">Tous niveaux</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Période d'organisation
                  </label>
                  <input
                    type="text"
                    required
                    value={examPeriod}
                    onChange={(e) => setExamPeriod(e.target.value)}
                    placeholder="Ex: 7 au 9 Avril 2026"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description succincte pour la vitrine
                </label>
                <textarea
                  rows={3}
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  placeholder="Présentez les modalités générales de la session aux familles et aux candidats..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statut de la session
                  </label>
                  <select
                    value={examStatus}
                    onChange={(e) => setExamStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Prévu">Prévu</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Archivé">Archivé</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={examIsPublished}
                      onChange={(e) => setExamIsPublished(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Visible sur la vitrine</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
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

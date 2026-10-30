import React from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle,
  ExternalLink,
  Users,
  GraduationCap,
  Award,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { CmsExam, CmsAnnouncement, CmsSurveillance, SiteInfo } from "../../../shared/services/cms-store";

interface VitrinePublishSectionProps {
  siteInfo: SiteInfo;
  exams: CmsExam[];
  announcements: CmsAnnouncement[];
  surveillances: CmsSurveillance[];
  onTogglePublishExam: (id: string, isPublished: boolean) => void;
  onTogglePublishAnnouncement: (id: string, isPublished: boolean) => void;
  onShowNotification: (msg: string) => void;
}

export default function VitrinePublishSection({
  siteInfo,
  exams,
  announcements,
  surveillances,
  onTogglePublishExam,
  onTogglePublishAnnouncement,
  onShowNotification,
}: VitrinePublishSectionProps) {
  const publishedExamsCount = exams.filter((e) => e.isPublished !== false).length;
  const publishedAnnouncementsCount = announcements.filter((a) => a.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header with Live Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Diffusion Publique
            </span>
            <span className="text-xs text-slate-500">
              Gestion des publications pour l'ensemble des acteurs
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            📢 Vitrine & Publications Officielles
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Pilotez en temps réel ce qui s'affiche sur le site vitrine pour les élèves, les familles et les professeurs.
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

      {/* Overview Stat Cards for Stakeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tous les acteurs
            </p>
            <p className="text-base font-bold text-slate-900">
              {publishedExamsCount} session(s) publiée(s)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Élèves & Familles
            </p>
            <p className="text-base font-bold text-slate-900">
              Horaires & +1/3 temps actifs
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Professeurs & Personnels
            </p>
            <p className="text-base font-bold text-slate-900">
              {surveillances.length} créneau(x) planifié(s)
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Sessions d'Examens à Publier */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#3498db]" />
              <span>Programmations d'Examens — Statut de Publication</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seules les sessions cochées comme "Publiée" sont visibles sur la vitrine publique d'accueil.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {publishedExamsCount} / {exams.length} visibles
          </span>
        </div>

        <div className="space-y-3">
          {exams.map((exam) => {
            const isPub = exam.isPublished !== false;
            return (
              <div
                key={exam.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition gap-3 ${
                  isPub
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-slate-200 bg-slate-50 opacity-80"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{exam.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-indigo-700 border border-slate-200">
                      {exam.targetLevel}
                    </span>
                    <span className="text-xs text-slate-500">• {exam.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{exam.period}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{exam.description}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      onTogglePublishExam(exam.id, !isPub);
                      onShowNotification(
                        isPub
                          ? `Examen "${exam.title}" retiré de la vitrine.`
                          : `Examen "${exam.title}" publié avec succès sur la vitrine !`
                      );
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                      isPub
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    }`}
                  >
                    {isPub ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Visible sur la Vitrine</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Masqué (Brouillon)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Communiqués & Annonces Direction */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Consignes Officielles & Communiqués de Direction</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ces annonces sont diffusées sur la vitrine selon le profil de l'acteur (Élèves, Enseignants, Tous).
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {publishedAnnouncementsCount} / {announcements.length} publiés
          </span>
        </div>

        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition gap-3 ${
                ann.isPublished
                  ? "border-sky-200 bg-sky-50/40"
                  : "border-slate-200 bg-slate-50 opacity-75"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{ann.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white text-slate-600 border border-slate-200">
                    Cible : {ann.target === "all" ? "Tous" : ann.target === "teachers" ? "Professeurs" : "Élèves"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{ann.content}</p>
              </div>

              <button
                onClick={() => {
                  onTogglePublishAnnouncement(ann.id, !ann.isPublished);
                  onShowNotification(
                    ann.isPublished
                      ? `Consigne masquée de la vitrine.`
                      : `Consigne publiée sur la vitrine pour les acteurs !`
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto ${
                  ann.isPublished
                    ? "bg-sky-600 hover:bg-sky-500 text-white"
                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
              >
                {ann.isPublished ? (
                  <>
                    <Eye className="h-3 w-3" />
                    <span>Publié</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span>Masqué</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

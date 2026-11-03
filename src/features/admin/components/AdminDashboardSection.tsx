import React from "react";
import {
  Users,
  School,
  GraduationCap,
  Calendar,
  Clock,
  Shield,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Printer,
  Layers,
  ChevronRight,
  Bell,
  Eye,
  Loader2,
} from "lucide-react";
import type {
  CmsCandidate,
  CmsRoom,
  CmsTeacher,
  CmsExam,
  CmsExamSlot,
  CmsSurveillance,
  SiteInfo,
  CmsAnnouncement,
} from "../../../shared/services/cms-store";
import type { AdminSection } from "./AdminSidebar";

interface AdminDashboardSectionProps {
  siteInfo: SiteInfo;
  candidates: CmsCandidate[];
  rooms: CmsRoom[];
  teachers: CmsTeacher[];
  exams: CmsExam[];
  examSlots: CmsExamSlot[];
  surveillances: CmsSurveillance[];
  announcements?: CmsAnnouncement[];
  onNavigateSection: (section: AdminSection) => void;
  onDeployNow: () => void;
  isDeploying?: boolean;
  deployStatus?: string;
}

export default function AdminDashboardSection({
  siteInfo,
  candidates,
  rooms,
  teachers,
  exams,
  examSlots,
  surveillances,
  announcements = [],
  onNavigateSection,
  onDeployNow,
  isDeploying = false,
  deployStatus = "",
}: AdminDashboardSectionProps) {
  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);
  const ttCandidatesCount = candidates.filter(
    (c) =>
      c.accommodation &&
      c.accommodation !== "Aucun" &&
      (c.accommodation.toLowerCase().includes("tiers") ||
        c.accommodation.toLowerCase().includes("1/3") ||
        c.accommodation.toLowerCase().includes("pap") ||
        c.accommodation.toLowerCase().includes("pps"))
  ).length;

  const publishedAnnouncements = announcements.filter((a) => a.isPublished);

  const workflowSteps: Array<{
    id: AdminSection;
    title: string;
    description: string;
    icon: string;
    count?: string | number;
    badge?: string;
  }> = [
    {
      id: "config",
      title: "1. Paramètres & Logos",
      description: "Identité de l'école, horaires officiels (+1/3), disciplines et logos officiels",
      icon: "⚙️",
      badge: "Configuré",
    },
    {
      id: "data-eleves",
      title: "2. Données Pronote (Élèves)",
      description: "Gestion des cohortes de candidats, divisions et régimes d'aménagement",
      icon: "👤",
      count: `${candidates.length} élèves`,
    },
    {
      id: "data-salles",
      title: "3. Salles d'Examens",
      description: "Capacités d'accueil, mobilisation des locaux et salles dédiées tiers-temps",
      icon: "🏫",
      count: `${rooms.length} salles`,
    },
    {
      id: "data-profs",
      title: "4. Professeurs & Surveillants",
      description: "Répertoire du personnel enseignant et suivi de la charge de surveillance",
      icon: "🎓",
      count: `${teachers.length} profs`,
    },
    {
      id: "sessions-examens",
      title: "5. Sessions d'Examens",
      description: "Programmation des sessions DNB Blanc, Baccalauréat et oraux",
      icon: "📋",
      count: `${exams.length} sessions`,
    },
    {
      id: "creneaux-epreuves",
      title: "6. Créneaux des Épreuves",
      description: "Horaires des disciplines, durée standard et heure de fin +1/3 temps",
      icon: "🕒",
      count: `${examSlots.length} créneaux`,
    },
    {
      id: "organization",
      title: "7. Répartition & Brassage",
      description: "Brassage inter-classes anti-fraude, affectation aux tables et numéros d'anonymat",
      icon: "🧩",
      badge: "Mobilisation ciblée",
    },
    {
      id: "planning-rooms",
      title: "8. Plannings Salles & Surveillances",
      description: "Occupation des salles et affectation équitable des professeurs aux épreuves",
      icon: "📅",
      count: `${surveillances.length} postes`,
    },
    {
      id: "view-edt",
      title: "9. Vers EDT & Déplacement de cours",
      description: "Visualisation des cours réguliers impactés et neutralisation des salles",
      icon: "➡️",
      badge: "Export EDT",
    },
    {
      id: "convoc-eleves",
      title: "10. Convocations & Ordres de Mission",
      description: "Impression officielle A4 (nominative élève avec signature Proviseur(e))",
      icon: "📨",
      badge: "Format officiel",
    },
    {
      id: "vitrine-publish",
      title: "11. Vitrine & Publications",
      description: "Bannière d'alerte, consignes officielles de direction et affichage public",
      icon: "📢",
      count: `${publishedAnnouncements.length} consigne(s)`,
    },
    {
      id: "deployment",
      title: "12. Déploiement Vercel & Git",
      description: "Synchronisation automatique sans frais vers GitHub et redéploiement mondial",
      icon: "🚀",
      badge: "En direct",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Welcome Banner */}
      <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-r from-[#002060] via-[#002d80] to-[#0b3c96] p-7 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[11px] uppercase tracking-wider backdrop-blur-xs">
                Espace Direction & Organisation
              </span>
              <span className="text-blue-200 text-xs font-semibold">
                Session Officielle {siteInfo.schoolYear || "2026-2027"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tableau de Bord — Examens Blancs LFJP
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Supervisez l'intégralité du déroulement des épreuves : de l'import Pronote au brassage des tables, jusqu'à l'impression des convocations certifiées et la publication sur la vitrine officielle.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onDeployNow}
              disabled={isDeploying}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-[#002060] shadow-md transition hover:bg-blue-50 active:scale-[0.98] disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
                  <span>Déploiement en cours...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 text-blue-700" />
                  <span>Mettre à jour GitHub & Vercel</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isDeploying && deployStatus && (
          <div className="mt-4 pt-3 border-t border-white/20 text-xs text-blue-200 flex items-center gap-2 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{deployStatus}</span>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigateSection("data-eleves")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-blue-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500 group-hover:text-blue-600 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider">Candidats</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 group-hover:text-blue-700 transition">
            {candidates.length}
          </p>
          <p className="mt-0.5 text-[10px] text-purple-700 font-semibold truncate">
            {ttCandidatesCount} en tiers-temps (+1/3)
          </p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigateSection("data-salles")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-600 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider">Salles</span>
            <School className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition">
            {rooms.length}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 truncate">
            {totalCapacity} places assises
          </p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateSection("data-profs")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500 group-hover:text-indigo-600 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider">Professeurs</span>
            <GraduationCap className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 group-hover:text-indigo-700 transition">
            {teachers.length}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 truncate">
            Corps enseignant LFJP
          </p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateSection("sessions-examens")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500 group-hover:text-amber-600 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sessions</span>
            <Calendar className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 group-hover:text-amber-700 transition">
            {exams.length}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 truncate">
            DNB, Bac & Oraux
          </p>
        </div>

        {/* Metric 5 */}
        <div
          onClick={() => onNavigateSection("creneaux-epreuves")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-purple-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500 group-hover:text-purple-600 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider">Créneaux</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 group-hover:text-purple-700 transition">
            {examSlots.length}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 truncate">
            Épreuves programmées
          </p>
        </div>

        {/* Metric 6 */}
        <div
          onClick={() => onNavigateSection("planning-rooms")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-rose-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500 group-hover:text-rose-600 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider">Surveillances</span>
            <Shield className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 group-hover:text-rose-700 transition">
            {surveillances.length}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 truncate">
            Missions affectées
          </p>
        </div>
      </div>

      {/* Main Two-Column Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Workflow chronologique complet */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-700" />
              <span>Parcours d'Organisation Chronologique (1 à 12)</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Accès direct aux modules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workflowSteps.map((step) => (
              <div
                key={step.id}
                onClick={() => onNavigateSection(step.id)}
                className="group cursor-pointer p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{step.icon}</span>
                      <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition">
                        {step.title}
                      </h3>
                    </div>

                    {step.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                        {step.badge}
                      </span>
                    )}
                    {step.count && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 shrink-0">
                        {step.count}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-2">
                    {step.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:text-blue-800">
                  <span>Accéder à l'étape</span>
                  <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quick Status, Sessions & Instructions */}
        <div className="space-y-6">
          {/* Active Sessions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Sessions d'Examens Actives</span>
              </h3>
              <button
                onClick={() => onNavigateSection("sessions-examens")}
                className="text-[11px] text-blue-600 font-bold hover:underline"
              >
                Gérer →
              </button>
            </div>

            <div className="space-y-2">
              {exams.slice(0, 4).map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => onNavigateSection("sessions-examens")}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 truncate">{ex.title}</p>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {ex.targetLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{ex.period}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Published Announcements Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-emerald-600" />
                <span>Consignes Officielles Vitrine</span>
              </h3>
              <button
                onClick={() => onNavigateSection("config")}
                className="text-[11px] text-emerald-600 font-bold hover:underline"
              >
                Éditer →
              </button>
            </div>

            {publishedAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aucune consigne publiée pour l'instant.
              </p>
            ) : (
              <div className="space-y-2">
                {publishedAnnouncements.slice(0, 3).map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 truncate">{ann.title}</p>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                        ✓ Publié
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Convocations Quick Print Shortcut */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 rounded-2xl border border-indigo-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-900">
              <Printer className="h-5 w-5 text-indigo-700" />
              <h3 className="font-bold text-sm">Impression des Convocations</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Imprimez ou téléchargez les convocations individuelles officielles signées <strong>« Le / La Proviseur(e) »</strong> avec nommage automatique des fichiers PDF par candidat.
            </p>
            <button
              onClick={() => onNavigateSection("convoc-eleves")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#002060] hover:bg-[#001746] text-white font-bold text-xs transition shadow-xs"
            >
              <span>Accéder aux Convocations & Étiquettes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

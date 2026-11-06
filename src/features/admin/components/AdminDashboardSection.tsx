import React from "react";
import {
  Users,
  School,
  GraduationCap,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  ArrowRight,
  FileText,
  Printer,
  Layers,
  ChevronRight,
  Bell,
  Eye,
  ExternalLink,
  Sparkles,
  ClipboardList,
  Compass,
  FileSpreadsheet,
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
  role?: "proviseur" | "superadmin";
  onNavigateSection: (section: AdminSection) => void;
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
  role = "superadmin",
  onNavigateSection,
}: AdminDashboardSectionProps) {
  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);
  const ttCandidatesCount = candidates.filter(
    (c) =>
      c.accommodation &&
      c.accommodation !== "Aucun" &&
      (c.accommodation.toLowerCase().includes("tiers") ||
        c.accommodation.toLowerCase().includes("1/3") ||
        c.accommodation.toLowerCase().includes("pap") ||
        c.accommodation.toLowerCase().includes("pps") ||
        c.accommodation.toLowerCase().includes("aménag"))
  ).length;

  const publishedAnnouncements = announcements.filter((a) => a.isPublished);

  const workflowSteps: Array<{
    id: AdminSection;
    number: string;
    title: string;
    description: string;
    icon: string;
    badge: string;
    count?: string | number;
    color: string;
  }> = [
    {
      id: "config",
      number: "01",
      title: "Paramètres & Logos",
      description: "Identité établissement, année scolaire, horaires officiels et logos officiels AEFE.",
      icon: "⚙️",
      badge: "Configuré",
      color: "border-blue-200 bg-blue-50/40 text-blue-800",
    },
    {
      id: "data-eleves",
      number: "02",
      title: "Données Pronote (Élèves)",
      description: "Cohortes de candidats, divisions de classe, numéros et aménagements.",
      icon: "👤",
      badge: `${candidates.length} élèves`,
      count: candidates.length,
      color: "border-indigo-200 bg-indigo-50/40 text-indigo-800",
    },
    {
      id: "data-salles",
      number: "03",
      title: "Salles d'Examens",
      description: "Capacités d'accueil, bâtiments et configuration des salles dédiées tiers-temps.",
      icon: "🏫",
      badge: `${rooms.length} salles`,
      count: rooms.length,
      color: "border-emerald-200 bg-emerald-50/40 text-emerald-800",
    },
    {
      id: "data-profs",
      number: "04",
      title: "Professeurs & Surveillants",
      description: "Répertoire des enseignants, disciplines et suivi des disponibilités.",
      icon: "🎓",
      badge: `${teachers.length} enseignants`,
      count: teachers.length,
      color: "border-sky-200 bg-sky-50/40 text-sky-800",
    },
    {
      id: "sessions-examens",
      number: "05",
      title: "Sessions d'Examens",
      description: "Planification des sessions DNB blanc, Baccalauréat et épreuves orales.",
      icon: "📋",
      badge: `${exams.length} sessions`,
      count: exams.length,
      color: "border-violet-200 bg-violet-50/40 text-violet-800",
    },
    {
      id: "creneaux-epreuves",
      number: "06",
      title: "Créneaux des Épreuves",
      description: "Disciplines, dates, horaires standard et majoration +1/3 temps calculée.",
      icon: "🕒",
      badge: `${examSlots.length} créneaux`,
      count: examSlots.length,
      color: "border-amber-200 bg-amber-50/40 text-amber-800",
    },
    {
      id: "organization",
      number: "07",
      title: "Répartition & Brassage",
      description: "Brassage inter-classes anti-fraude, affectation aux tables et numéros d'anonymat.",
      icon: "🧩",
      badge: "Actif",
      color: "border-teal-200 bg-teal-50/40 text-teal-800",
    },
    {
      id: "planning-rooms",
      number: "08",
      title: "Plannings & Surveillances",
      description: "Affectation nominative des enseignants par salle et équilibrage des charges.",
      icon: "📅",
      badge: `${surveillances.length} postes`,
      count: surveillances.length,
      color: "border-rose-200 bg-rose-50/40 text-rose-800",
    },
    {
      id: "view-edt",
      number: "09",
      title: "Vers EDT & Cours Impactés",
      description: "Visualisation des cours réguliers à déplacer et neutralisation des salles.",
      icon: "➡️",
      badge: "Export EDT",
      color: "border-orange-200 bg-orange-50/40 text-orange-800",
    },
    {
      id: "convoc-eleves",
      number: "10",
      title: "Convocations & Ordres de Mission",
      description: "Impression officielle A4 (nominative élève avec signature Proviseur(e)).",
      icon: "📨",
      badge: "Certifié A4",
      color: "border-cyan-200 bg-cyan-50/40 text-cyan-800",
    },
    {
      id: "vitrine-publish",
      number: "11",
      title: "Vitrine & Communication",
      description: "Consignes officielles de direction, affichage des épreuves et alertes.",
      icon: "📢",
      badge: `${publishedAnnouncements.length} publiée(s)`,
      color: "border-fuchsia-200 bg-fuchsia-50/40 text-fuchsia-800",
    },
    {
      id: "deployment",
      number: "12",
      title: "Déploiement Vercel & Git",
      description: "Centre de synchronisation GitHub et redéploiement mondial sans frais.",
      icon: "🚀",
      badge: "Vercel en ligne",
      color: "border-blue-300 bg-blue-100/50 text-blue-900 font-bold",
    },
  ];

  // For Proviseur role: exclude "config" (Paramètres & Logos) as requested by user
  const displayedWorkflowSteps = role === "proviseur"
    ? workflowSteps.filter((s) => s.id !== "config")
    : workflowSteps;

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      {/* 1. TOP EXECUTIVE WELCOME BANNER (LUMINOUS & REFINED FRENCH INSTITUTIONAL STYLE) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Institutional Tricolor Micro-Hairline Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#002060] via-[#002060] to-[#c92a2a]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#002060] font-bold text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#002060]" />
                {role === "proviseur" ? "Espace Proviseur & Organisation" : "Espace Direction & Organisation"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-xs">
                Session Officielle {siteInfo.schoolYear || "2026-2027"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tableau de Bord — Examens Blancs LFJP
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Supervisez l'intégralité du déroulement des épreuves : de l'import Pronote au brassage des tables, jusqu'à l'impression des convocations certifiées et la publication sur la vitrine officielle.
            </p>
          </div>

          {/* Quick Institutional Action Links */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => onNavigateSection("convoc-eleves")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Printer className="h-4 w-4 text-amber-300" />
              <span>Imprimer Convocations</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateSection("organization")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#002060] border border-blue-200 text-xs font-bold transition cursor-pointer active:scale-[0.98]"
            >
              <Compass className="h-4 w-4 text-blue-700" />
              <span>Répartition & Brassage</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Ouvrir le site vitrine dans un nouvel onglet"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Voir la Vitrine</span>
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. KEY METRICS ROW (4 BRIGHT, HIGH-CONTRAST PROFESSIONAL CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Candidates */}
        <div
          onClick={() => onNavigateSection("data-eleves")}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Candidats Inscrits
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 group-hover:scale-110 transition">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 font-mono">
            {candidates.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-bold text-[10px] border border-purple-200">
              ♿ {ttCandidatesCount} Tiers-Temps
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">Cohorte active</span>
          </div>
        </div>

        {/* Rooms */}
        <div
          onClick={() => onNavigateSection("data-salles")}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Salles d'Examens
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition">
              <School className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 font-mono">
            {rooms.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
              {totalCapacity} places
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">Capacité totale</span>
          </div>
        </div>

        {/* Exams & Slots */}
        <div
          onClick={() => onNavigateSection("sessions-examens")}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sessions d'Examens
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 font-mono">
            {exams.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold text-[10px] border border-amber-200">
              {examSlots.length} épreuves
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">Créneaux définis</span>
          </div>
        </div>

        {/* Surveillances */}
        <div
          onClick={() => onNavigateSection("planning-rooms")}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Surveillances Assignées
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 group-hover:scale-110 transition">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 font-mono">
            {surveillances.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 font-bold text-[10px] border border-rose-200">
              {teachers.length} enseignants
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">Corps professoral</span>
          </div>
        </div>
      </div>

      {/* 3. WORKFLOW CHRONOLOGIQUE COMPLET (12 ÉTAPES PROPRES & CLAIRES) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#002060]" />
              <span>Workflow Opérationnel des Examens (12 Étapes)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accédez directement à chaque étape pour configurer, répartir et publier les épreuves.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Navigation guidée pas-à-pas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedWorkflowSteps.map((step) => (
            <div
              key={step.id}
              onClick={() => onNavigateSection(step.id)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-blue-400 transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl group-hover:scale-110 transition shrink-0">
                      {step.icon}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Étape {step.number}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${step.color}`}>
                    {step.badge}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {step.description}
                </p>
              </div>

              <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-blue-700 transition">
                <span>Accéder à l'étape</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SUMMARY PANELS: SESSIONS D'EXAMENS & CONSIGNES OFFICIELLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Active Exam Sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-700" />
              <span>Sessions d'Examens Programmées ({exams.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection("sessions-examens")}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Gérer ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {exams.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Aucune session d'examen enregistrée.
              </p>
            ) : (
              exams.slice(0, 4).map((ex) => (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{ex.title}</span>
                    <span className="text-[11px] text-slate-500">
                      {ex.period} • Niveau : <strong className="text-slate-700">{ex.targetLevel}</strong>
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {ex.status || "Prévu"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Published Announcements & Official Communications */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              <span>Consignes Officielles & Direction ({publishedAnnouncements.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection("config")}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Modifier ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {publishedAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Aucune consigne officielle publiée actuellement.
              </p>
            ) : (
              publishedAnnouncements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ann.title}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{ann.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{ann.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

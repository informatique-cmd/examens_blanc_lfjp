import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  AlertCircle,
  Info,
  CheckCircle2,
  Lock,
  Search,
  Clock,
  BookOpen,
  Layers,
  Users,
  GraduationCap,
  Award,
  School,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FileText,
} from "lucide-react";

import HomeHero from "../components/HomeHero";
import HomeLayout from "../components/HomeLayout";
import { useCmsData, type CmsExam } from "../../../shared/services/cms-store";

export default function HomePage() {
  const { data: cmsData } = useCmsData();

  // Actor filter: all, students (élèves & familles), teachers (professeurs & personnels)
  const [selectedActor, setSelectedActor] = useState<"all" | "students" | "teachers">("all");

  // Level filter
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Expanded exam ID for viewing full schedule
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  // Only display published exams on the public showcase
  const publishedExams = useMemo(() => {
    return cmsData.exams.filter((exam) => exam.isPublished !== false);
  }, [cmsData.exams]);

  // Filtered exams according to level and search
  const filteredExams = useMemo(() => {
    return publishedExams.filter((exam) => {
      const matchLevel =
        selectedLevel === "all" ||
        exam.targetLevel.toLowerCase().includes(selectedLevel.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        exam.description.toLowerCase().includes(q) ||
        exam.period.toLowerCase().includes(q);

      return matchLevel && matchQuery;
    });
  }, [publishedExams, selectedLevel, searchQuery]);

  // Filtered announcements by actor target
  const publishedAnnouncements = useMemo(() => {
    return cmsData.announcements.filter((ann) => {
      if (!ann.isPublished) return false;
      if (selectedActor === "all") return true;
      if (selectedActor === "students") return ann.target === "all" || ann.target === "bac" || ann.target === "dnb";
      if (selectedActor === "teachers") return ann.target === "all" || ann.target === "teachers";
      return true;
    });
  }, [cmsData.announcements, selectedActor]);

  // Compute countdown or human date
  const getExamCountdown = (exam: CmsExam) => {
    if (!exam.startsAt) return null;
    const examDate = new Date(exam.startsAt);
    if (isNaN(examDate.getTime())) return null;

    const now = new Date();
    const diffMs = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Épreuve passée", isPast: true };
    }
    if (diffDays === 0) {
      return { label: "Aujourd'hui !", isToday: true };
    }
    if (diffDays === 1) {
      return { label: "Demain !", isSoon: true };
    }
    return { label: `Dans ${diffDays} jours`, isUpcoming: true };
  };

  const alertBannerConfig = {
    info: {
      bg: "bg-sky-50 border-sky-200 text-sky-900",
      icon: <Info className="h-5 w-5 text-sky-600 shrink-0" />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />,
    },
    urgent: {
      bg: "bg-rose-50 border-rose-200 text-rose-900",
      icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    },
  };

  return (
    <HomeLayout>
      {/* Hero Header with LFJP identity */}
      <HomeHero
        logos={cmsData.siteInfo.logos}
        subtitle={cmsData.siteInfo.subtitle}
        title={cmsData.siteInfo.title}
        description={cmsData.siteInfo.description}
      />

      {/* Direction Alert Banner if enabled */}
      {cmsData.siteInfo.bannerAlert?.enabled ? (
        <div
          className={`flex w-full max-w-5xl items-center gap-3 rounded-2xl border p-4 text-left shadow-xs ${
            alertBannerConfig[cmsData.siteInfo.bannerAlert.type || "info"].bg
          }`}
        >
          {alertBannerConfig[cmsData.siteInfo.bannerAlert.type || "info"].icon}
          <div>
            <p className="font-semibold">{cmsData.siteInfo.bannerAlert.title}</p>
            <p className="text-sm opacity-90">{cmsData.siteInfo.bannerAlert.message}</p>
          </div>
        </div>
      ) : null}

      {/* SÉLECTEUR D'ACTEURS (Pour l'ensemble des acteurs) */}
      <div className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 self-start sm:self-auto px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#3498db]" />
              <span>Espace Public Dédié :</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedActor("all")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedActor === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🌐 Tous les acteurs</span>
            </button>

            <button
              onClick={() => setSelectedActor("students")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedActor === "students"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Élèves & Familles</span>
            </button>

            <button
              onClick={() => setSelectedActor("teachers")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedActor === "teachers"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Professeurs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Publications / Direction Announcements for Selected Actors */}
      {publishedAnnouncements.length > 0 && (
        <section className="w-full max-w-5xl space-y-3 text-left">
          <div className="flex items-center gap-2 px-1">
            <FileText className="h-4 w-4 text-sky-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Publications Officielles de Direction
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {publishedAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl border border-sky-100 bg-sky-50/60 shadow-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-950">{ann.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-200/70 text-sky-900">
                    {ann.target === "all" ? "Général" : ann.target === "teachers" ? "Enseignants" : "Candidats"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-slate-400 pt-1">Publié le {ann.date}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Showcase Section: Published Exam Sessions */}
      <section className="w-full max-w-5xl space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800">
                Vitrine Officielle
              </span>
              <span className="text-xs text-slate-400">
                Année scolaire {cmsData.siteInfo.schoolYear}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Programmations des Examens Blancs & Épreuves
            </h2>
          </div>

          {/* Level Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { id: "all", label: "Tous" },
              { id: "3ème", label: "3ème (Brevet)" },
              { id: "1ère", label: "1ère (Bac Français)" },
              { id: "Terminale", label: "Terminale (Bac)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedLevel(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedLevel === tab.id
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar inside showcase */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une épreuve par mot-clé (ex: DNB, Mathématiques, Oral, Français)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        {/* Exams Grid */}
        {filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExams.map((exam) => {
              const countdown = getExamCountdown(exam);
              const isExpanded = expandedExamId === exam.id;

              return (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top: Level & Countdown */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {exam.targetLevel || "Tous niveaux"}
                      </span>

                      {countdown && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            countdown.isToday
                              ? "bg-rose-100 text-rose-800 animate-pulse"
                              : countdown.isSoon
                              ? "bg-amber-100 text-amber-800"
                              : countdown.isPast
                              ? "bg-slate-100 text-slate-500"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{countdown.label}</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {exam.title}
                    </h3>

                    {/* Period & Date */}
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-3">
                      <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{exam.period}</span>
                    </p>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {exam.description || "Consultez les horaires officiels et la répartition des épreuves pour cette session."}
                    </p>

                    {/* Interactive Accordion for detailed schedule */}
                    {isExpanded && (
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <p className="font-bold text-slate-800">
                          Horaires Officiels & Aménagements Tiers-Temps :
                        </p>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between border-b pb-1">
                            <span className="font-medium text-slate-700">Matin (Épreuve 1) :</span>
                            <span className="font-mono text-slate-900">08h00 - 09h30 • <span className="text-purple-700 font-bold">TT : 10h00</span></span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="font-medium text-slate-700">Matin (Épreuve 2) :</span>
                            <span className="font-mono text-slate-900">09h45 - 11h15 • <span className="text-purple-700 font-bold">TT : 11h45</span></span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-700">Après-midi :</span>
                            <span className="font-mono text-slate-900">13h30 - 15h30 • <span className="text-purple-700 font-bold">TT : 16h10</span></span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic pt-1">
                          Les salles d'examen sont affichées sur les panneaux officiels de l'établissement.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Session Status & Expand Button */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Statut : <span className="font-bold text-indigo-700">{exam.status || "Prévu"}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition inline-flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Masquer détails" : "Détail des horaires"}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Aucune programmation publiée pour cette sélection
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Les sessions d'examen sont gérées depuis l'administration. Dès qu'un examen est publié, il apparaîtra ici automatiquement pour l'ensemble des acteurs.
            </p>
          </div>
        )}
      </section>

      {/* Surveillance Overview for Teachers & Stakeholders */}
      {(selectedActor === "teachers" || selectedActor === "all") && cmsData.surveillances.length > 0 && (
        <section className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 p-5 text-left shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Dispositif Officiel de Surveillance des Épreuves
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Espace Professeurs & Personnels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cmsData.surveillances.slice(0, 6).map((surv) => (
              <div
                key={surv.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{surv.teacherName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white text-indigo-700 font-bold text-[10px] border">
                    {surv.roomName}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>{surv.timeSlot} • {surv.date}</span>
                </p>
                <p className="text-[10px] text-slate-600 italic">{surv.mission || "Surveillant titulaire"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Official Guidelines & Instructions */}
      <section className="w-full max-w-5xl rounded-2xl bg-slate-50 border border-slate-200 p-5 text-slate-700 text-left">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          Règles & Consignes Officielles pour les Épreuves au LFJP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900 mb-1">Ponctualité & Appel</p>
            <p className="text-slate-600">
              Présentez-vous obligatoirement 15 minutes avant le début de l'épreuve muni de votre convocation imprimée et d'une pièce d'identité valide.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900 mb-1">Calculatrices en Mode Examen</p>
            <p className="text-slate-600">
              Lorsque la calculatrice est autorisée, le voyant clignotant du mode examen est strictement obligatoire. Téléphones et montres connectées éteints dans le sac.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900 mb-1">Aménagements (Tiers-Temps)</p>
            <p className="text-slate-600">
              Les élèves bénéficiant d'aménagements (PAP/PPS) sont accueillis dans des salles spécifiques avec horaires adaptés (+1/3 temps).
            </p>
          </div>
        </div>
      </section>

      {/* Footer with Discreet Administration Access */}
      <footer className="mt-12 flex w-full max-w-5xl flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-xs text-slate-400 sm:flex-row">
        <p>Lycée Français Jacques Prévert — Saly, Sénégal • Réseau AEFE</p>
        <div>
          <Link
            to="/admin"
            title="Espace réservé à l'administration et à la direction"
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition font-medium"
          >
            <Lock className="h-3 w-3 opacity-60" />
            <span>Espace Direction & Organisation des Examens</span>
          </Link>
        </div>
      </footer>
    </HomeLayout>
  );
}

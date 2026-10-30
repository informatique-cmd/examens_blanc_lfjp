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
} from "lucide-react";

import HomeHero from "../components/HomeHero";
import HomeLayout from "../components/HomeLayout";
import { useCmsData, type CmsExam } from "../../../shared/services/cms-store";

export default function HomePage() {
  const { data: cmsData } = useCmsData();

  // Filter state for the public showcase
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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


      {/* Showcase Section: Published Exam Sessions */}
      <section className="w-full max-w-5xl space-y-4">
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
              Programmations des Examens Blancs
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
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                      {exam.description || "Consultez les horaires et la répartition des candidats pour cette session."}
                    </p>
                  </div>

                  {/* Card Bottom: Session Status & Details */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Statut : <span className="font-bold text-indigo-700">{exam.status || "Prévu"}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{exam.period}</span>
                    </span>
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
              Les sessions d'examen sont gérées depuis l'administration. Dès qu'un examen est publié, il apparaîtra ici automatiquement.
            </p>
          </div>
        )}
      </section>

      {/* Official Guidelines & Instructions */}
      <section className="w-full max-w-5xl rounded-2xl bg-slate-50 border border-slate-200 p-5 text-slate-700">
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
            title="Espace réservé à l'administration PERDIR"
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition font-medium"
          >
            <Lock className="h-3 w-3 opacity-60" />
            <span>Accès administration (Méthode PERDIR)</span>
          </Link>
        </div>
      </footer>
    </HomeLayout>
  );
}

import React, { useState, useMemo } from "react";
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
  Users,
  GraduationCap,
  Award,
  ChevronDown,
  ChevronUp,
  School,
  UserCheck,
  Tag,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Check,
} from "lucide-react";

import HomeHero from "../components/HomeHero";
import HomeLayout from "../components/HomeLayout";
import { useCmsData, type CmsExam, type CmsExamSlot, type CmsRoom } from "../../../shared/services/cms-store";

export default function HomePage() {
  const { data: cmsData } = useCmsData();

  // Actor filter: all, students (élèves & familles), teachers (professeurs & personnels)
  const [selectedActor, setSelectedActor] = useState<"all" | "students" | "teachers">("all");

  // Level filter for exams
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Student quick room locator search query
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");

  // Expanded exam ID for viewing full schedule details
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  // Published exams only
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
      if (selectedActor === "students")
        return ann.target === "all" || ann.target === "bac" || ann.target === "dnb";
      if (selectedActor === "teachers")
        return ann.target === "all" || ann.target === "teachers";
      return true;
    });
  }, [cmsData.announcements, selectedActor]);

  // Student search results for the quick room locator
  const searchedStudents = useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return cmsData.candidates.filter(
      (c) =>
        c.lastName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.className.toLowerCase().includes(q) ||
        c.roomName.toLowerCase().includes(q)
    );
  }, [cmsData.candidates, studentSearchQuery]);

  // Helper to compute countdown
  const getExamCountdown = (exam: CmsExam) => {
    if (!exam.startsAt) return null;
    const examDate = new Date(exam.startsAt);
    if (isNaN(examDate.getTime())) return null;

    const now = new Date();
    const diffMs = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Session passée", isPast: true };
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
      bg: "bg-blue-50 border-blue-200 text-blue-900",
      icon: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
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

  /**
   * For a given exam slot and exam, returns ONLY the rooms where:
   * - Candidates have been assigned, AND/OR
   * - A surveillant has been assigned for that slot/date/time.
   * This strictly addresses: "seulement les salles ou on a affecter des eleves et les surveillants pour les epreuves"
   */
  const getActiveRoomsForSlot = (slot: CmsExamSlot, exam: CmsExam) => {
    // Determine the pool of rooms to inspect:
    // If the slot explicitly specifies roomNames, inspect those; otherwise inspect all school rooms
    const candidateRooms = slot.roomNames && slot.roomNames.length > 0
      ? cmsData.rooms.filter((r) => slot.roomNames!.includes(r.name))
      : cmsData.rooms;

    const activeList = candidateRooms.map((room) => {
      // 1. Find candidates assigned to this room for this exam
      const assignedCandidates = cmsData.candidates.filter((c) => {
        if (c.roomName !== room.name) return false;
        // Check if candidate matches exam title or level
        if (c.examName && exam.title) {
          const cEx = c.examName.toLowerCase();
          const eTit = exam.title.toLowerCase();
          if (cEx.includes(eTit) || eTit.includes(cEx)) return true;
        }
        if (exam.targetLevel && c.className && c.className.includes(exam.targetLevel)) {
          return true;
        }
        return false;
      });

      // 2. Find supervisor assigned for this room on this slot/time
      const assignedSurv = cmsData.surveillances.find((s) => {
        if (s.roomName !== room.name) return false;
        if (s.slotId && slot.id && s.slotId === slot.id) return true;
        if (s.date === slot.date) {
          const matchTime =
            s.timeSlot.includes(slot.startTime) ||
            s.timeSlot.includes(slot.endTime) ||
            slot.startTime.includes(s.timeSlot.split(" - ")[0] || "---");
          if (matchTime) return true;
        }
        return false;
      });

      const ttCandidatesCount = assignedCandidates.filter(
        (c) =>
          c.accommodation?.includes("1/3") ||
          c.accommodation?.toLowerCase().includes("tiers") ||
          c.className.toLowerCase().includes("tt")
      ).length;

      const isTTRoom =
        room.name.toLowerCase().includes("tt") ||
        room.name.toLowerCase().includes("tiers") ||
        room.notes?.toLowerCase().includes("tt");

      return {
        room,
        candidateCount: assignedCandidates.length,
        ttCandidatesCount,
        surveillant: assignedSurv?.teacherName || null,
        mission: assignedSurv?.mission || null,
        isTTRoom,
      };
    });

    // FILTER CRITERION: Keep ONLY rooms that have candidates assigned OR a supervisor assigned!
    return activeList.filter(
      (item) => item.candidateCount > 0 || item.surveillant !== null
    );
  };

  return (
    <HomeLayout>
      {/* 1. Hero Header */}
      <HomeHero
        logos={cmsData.siteInfo.logos}
        subtitle={cmsData.siteInfo.subtitle}
        title={cmsData.siteInfo.title}
        description={cmsData.siteInfo.description}
        schoolYear={cmsData.siteInfo.schoolYear}
        examsCount={publishedExams.length}
        slotsCount={cmsData.examSlots.length}
      />

      {/* 2. Direction Alert Banner if enabled */}
      {cmsData.siteInfo.bannerAlert?.enabled && (
        <div
          className={`flex w-full max-w-5xl items-center gap-3 rounded-2xl border p-4 text-left shadow-2xs ${
            alertBannerConfig[cmsData.siteInfo.bannerAlert.type || "info"].bg
          }`}
        >
          {alertBannerConfig[cmsData.siteInfo.bannerAlert.type || "info"].icon}
          <div>
            <p className="font-bold text-sm">{cmsData.siteInfo.bannerAlert.title}</p>
            <p className="text-xs opacity-90 mt-0.5">{cmsData.siteInfo.bannerAlert.message}</p>
          </div>
        </div>
      )}

      {/* 3. Official Announcements / Communiqués */}
      {publishedAnnouncements.length > 0 && (
        <section className="w-full max-w-5xl space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Consignes Officielles & Communiqués de la Direction
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">
              {publishedAnnouncements.length} annonce(s) en ligne
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {publishedAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl border border-sky-100 bg-sky-50/50 shadow-2xs space-y-2 hover:bg-sky-50/80 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-sky-950">{ann.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white text-sky-900 border border-sky-200 shrink-0">
                    {ann.target === "all"
                      ? "Tous"
                      : ann.target === "teachers"
                      ? "Professeurs"
                      : "Candidats"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ann.content}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-sky-100">
                  <span>Publié par la Direction</span>
                  <span>{ann.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SÉLECTEUR D'ESPACES / ACTEURS */}
      <div className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 self-start sm:self-auto px-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-700" />
              <span>Affichage par profil :</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedActor("all")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedActor === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🌐 Général</span>
            </button>

            <button
              onClick={() => setSelectedActor("students")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedActor === "students"
                  ? "bg-white text-blue-700 shadow-2xs"
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
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Professeurs</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. QUICK CANDIDATE ROOM LOCATOR (Rechercher ma salle d'examen) */}
      {(selectedActor === "all" || selectedActor === "students") && (
        <section className="w-full max-w-5xl rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 p-5 sm:p-6 text-white text-left shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Accès Direct Candidat
                </span>
                <span className="text-xs text-blue-200">Recherche nominative</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                🔍 Trouver ma salle d'examen & mon numéro de table
              </h3>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Tapez votre nom de famille ou votre classe pour afficher immédiatement votre salle et vos horaires.
              </p>
            </div>

            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Ex: Diop, Cissé, 3ème A..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:bg-white focus:text-slate-900 focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Search Results Display */}
          {studentSearchQuery.trim().length >= 2 && (
            <div className="pt-4 space-y-2">
              {searchedStudents.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-blue-200 text-center">
                  Aucun candidat trouvé pour "{studentSearchQuery}". Vérifiez l'orthographe du nom ou de la classe.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {searchedStudents.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-3.5 rounded-xl bg-white text-slate-800 shadow-md space-y-2 border border-blue-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">
                          {cand.lastName.toUpperCase()} {cand.firstName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {cand.className}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-600 font-medium">Salle Assignée :</span>
                          <span className="font-bold text-blue-900 font-mono">
                            {cand.roomName || "Non définie"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-600 font-medium">Table & Anonymat :</span>
                          <span className="font-bold text-slate-800 font-mono text-[11px]">
                            Table {cand.tableNumber || "1"} • {cand.anonymatNumber || "DNB"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-600 font-medium">Appel :</span>
                          <span className="font-mono text-emerald-700 font-bold">
                            {cand.convocationTime || "07h45"}
                          </span>
                        </div>
                      </div>

                      {cand.accommodation && cand.accommodation !== "Aucun" && (
                        <div className="px-2 py-1 rounded bg-purple-100 text-purple-900 text-[10px] font-bold text-center">
                          ♿ {cand.accommodation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 6. MAIN SESSIONS D'EXAMEN & CALENDRIER DES ÉPREUVES */}
      <section className="w-full max-w-5xl space-y-5 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-800">
                Programme Officiel
              </span>
              <span className="text-xs text-slate-500">
                Sessions homologuées AEFE
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              Sessions d'Examens & Déroulement des Épreuves
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pour chaque épreuve : horaires standard, majoration tiers-temps (+1/3), salles mobilisées avec effectif et surveillants titulaires.
            </p>
          </div>

          {/* Level Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            {[
              { id: "all", label: "Tous" },
              { id: "3ème", label: "3ème (DNB)" },
              { id: "1ère", label: "1ère (Bac)" },
              { id: "Terminale", label: "Terminale" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedLevel(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedLevel === tab.id
                    ? "bg-white text-blue-700 shadow-2xs font-bold"
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
            placeholder="Rechercher une épreuve par intitulé (ex: Français, Mathématiques, Sciences, Dictée)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 shadow-2xs"
          />
        </div>

        {/* Exams List */}
        {filteredExams.length > 0 ? (
          <div className="space-y-6">
            {filteredExams.map((exam) => {
              const countdown = getExamCountdown(exam);
              const isExpanded = expandedExamId === exam.id || filteredExams.length === 1;

              // Find slots attached to this exam
              const examSlots = (cmsData.examSlots || [])
                .filter((s) => {
                  if (s.examId && exam.id && s.examId === exam.id) return true;
                  if (s.examTitle && exam.title) {
                    const sTit = s.examTitle.toLowerCase();
                    const eTit = exam.title.toLowerCase();
                    if (sTit.includes(eTit) || eTit.includes(sTit)) return true;
                  }
                  if (exam.targetLevel && s.targetLevel === exam.targetLevel) return true;
                  return false;
                })
                .sort((a, b) => {
                  const d = (a.date || "").localeCompare(b.date || "");
                  if (d !== 0) return d;
                  return (a.startTime || "").localeCompare(b.startTime || "");
                });

              return (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden hover:border-slate-300 transition"
                >
                  {/* Exam Card Header */}
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
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
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>{countdown.label}</span>
                          </span>
                        )}

                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600">
                          Statut : <strong className="text-slate-900">{exam.status || "Prévu"}</strong>
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {exam.title}
                      </h3>

                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                        <span>Période : {exam.period}</span>
                      </p>

                      {exam.description && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {exam.description}
                        </p>
                      )}
                    </div>

                    {/* Toggle Button */}
                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <span className="text-xs text-slate-500 font-semibold">
                        <strong>{examSlots.length}</strong> épreuve(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <span>{isExpanded ? "Replier" : "Consulter les épreuves"}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Exam Épreuves & Créneaux (Displayed when expanded) */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-slate-50/60 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-700" />
                          <span>Programme des Épreuves par Créneau ({examSlots.length})</span>
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Horaires d'appel : 15 min avant le début
                        </span>
                      </div>

                      {examSlots.length === 0 ? (
                        <div className="p-6 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-400 space-y-1">
                          <p className="font-semibold">Aucun créneau programmé pour cette session pour l'instant.</p>
                          <p className="text-[11px] text-slate-500">La direction des examens publiera les dates et horaires prochainement.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {examSlots.map((slot, sIdx) => {
                            // Retrieve ONLY active rooms where candidates or surveillants are allocated
                            const activeRooms = getActiveRoomsForSlot(slot, exam);

                            return (
                              <div
                                key={slot.id || sIdx}
                                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
                              >
                                {/* Top Slot Bar: Discipline + Date */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                                    <h5 className="font-black text-sm sm:text-base text-slate-900">
                                      {slot.subject}
                                    </h5>
                                  </div>
                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 text-xs font-mono font-bold border border-blue-200">
                                      {slot.date}
                                    </span>
                                  </div>
                                </div>

                                {/* Schedules Grid: Standard vs Tiers-Temps */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Horaires Standard ({slot.durationMinutes} min)
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-400">Tous candidats</span>
                                    </div>
                                    <p className="font-mono font-black text-slate-900 text-sm">
                                      {slot.startTime} ➔ {slot.endTime}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      Appel obligatoire en salle à{" "}
                                      <strong className="font-mono text-slate-700">
                                        {(() => {
                                          const [h, m] = slot.startTime.split(":").map(Number);
                                          const total = (h || 8) * 60 + (m || 0) - 15;
                                          const appH = Math.floor(total / 60);
                                          const appM = total % 60;
                                          return `${String(appH).padStart(2, "0")}h${String(appM).padStart(2, "0")}`;
                                        })()}
                                      </strong>
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                                        Aménagement Tiers-Temps (+1/3 réglementaire)
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded bg-purple-200/60 text-purple-900 text-[10px] font-bold">
                                        PAI / PAP
                                      </span>
                                    </div>
                                    <p className="font-mono font-black text-purple-900 text-sm">
                                      {slot.startTime} ➔ {slot.tiersTempsEndTime || slot.endTime}
                                    </p>
                                    <p className="text-[11px] text-purple-800">
                                      Durée majorée :{" "}
                                      <strong>
                                        {slot.tiersTempsDurationMinutes || Math.round(slot.durationMinutes * 4 / 3)} minutes
                                      </strong>
                                    </p>
                                  </div>
                                </div>

                                {/* CRITICAL SECTION: ONLY ROOMS WITH CANDIDATES & SURVEILLANTS */}
                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                      <School className="h-3.5 w-3.5 text-blue-700" />
                                      <span>Salles mobilisées avec élèves convoqués & surveillants :</span>
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      {activeRooms.length} salle(s) active(s)
                                    </span>
                                  </div>

                                  {activeRooms.length === 0 ? (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                                      <Info className="h-4 w-4 text-slate-400 shrink-0" />
                                      <span>
                                        Affectation des salles et des surveillants en cours de confirmation par le secrétariat des examens.
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                      {activeRooms.map((activeItem) => (
                                        <div
                                          key={activeItem.room.id}
                                          className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                            activeItem.isTTRoom
                                              ? "border-purple-300 bg-purple-50/40"
                                              : "border-slate-200 bg-slate-50/60 hover:bg-slate-50"
                                          }`}
                                        >
                                          {/* Room Name & Badge */}
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">
                                              {activeItem.room.name}
                                            </span>
                                            {activeItem.isTTRoom ? (
                                              <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 font-bold text-[9px]">
                                                ♿ Salle TT
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 font-mono">
                                                {activeItem.room.capacity} pl. max
                                              </span>
                                            )}
                                          </div>

                                          {/* Candidates Count */}
                                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                                            <span>Élèves convoqués :</span>
                                            <span className="font-bold text-slate-900 font-mono">
                                              {activeItem.candidateCount > 0
                                                ? `${activeItem.candidateCount} candidat(s)`
                                                : "En cours"}
                                            </span>
                                          </div>

                                          {/* Assigned Surveillant */}
                                          <div className="pt-1 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px]">
                                            <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                            <div>
                                              <span className="text-slate-500 block text-[10px]">Surveillant(e) :</span>
                                              <span className="font-bold text-slate-900">
                                                {activeItem.surveillant || "Affectation en cours"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Notes if provided */}
                                {slot.notes && (
                                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    Consigne particulière : {slot.notes}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
            <School className="h-10 w-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm">Aucune session d'examen ne correspond à vos critères de recherche.</p>
            <p className="text-xs text-slate-500">Essayez un autre mot-clé ou réinitialisez le filtre de niveau.</p>
          </div>
        )}
      </section>

      {/* 7. TEACHER SURVEILLANCE MATRIX (Visible for teachers or all) */}
      {(selectedActor === "teachers" || selectedActor === "all") && cmsData.surveillances.length > 0 && (
        <section className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 text-left shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                  Espace Personnels
                </span>
                <span className="text-xs text-slate-500">Surveillance officielle</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                👔 Planning Officiel de Surveillance des Épreuves
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {cmsData.surveillances.length} affectation(s) validée(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cmsData.surveillances.map((surv) => (
              <div
                key={surv.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1.5 hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{surv.teacherName}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                    {surv.roomName}
                  </span>
                </div>
                <p className="text-slate-600 text-xs flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="font-mono font-medium">{surv.timeSlot} • {surv.date}</span>
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  <span className="font-medium text-slate-700">{surv.examTitle}</span>
                  <span className="text-emerald-700 font-semibold">{surv.mission || "Titulaire"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. RÈGLES & CONSIGNES OFFICIELLES (Lycée Français Jacques Prévert) */}
      <section className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 p-6 text-slate-700 text-left shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-700" />
            <span>Réglementation Officielle des Épreuves au LFJP</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Arrêtés ministériels et directives de la direction pour le bon déroulement des examens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-700" />
              <span>Ponctualité & Pièce d'Identité</span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              Présentez-vous impérativement <strong>15 minutes avant le début</strong> de chaque épreuve avec votre convocation imprimée et une pièce d'identité avec photo en cours de validité.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>Calculatrices & Téléphones</span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              Le mode examen avec voyant lumineux clignotant est obligatoire si la calculatrice est autorisée. Tout smartphone ou montre connectée doit être totalement éteint dans le sac.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-purple-600" />
              <span>Aménagements Tiers-Temps</span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              Les élèves bénéficiant d'aménagements (PAP / PPS / PAI) disposent d'horaires majorés (+1/3 de temps) et sont accueillis dans des salles spécifiques avec encadrement adapté.
            </p>
          </div>
        </div>
      </section>
    </HomeLayout>
  );
}

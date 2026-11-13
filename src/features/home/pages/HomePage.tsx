import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarDays,
  AlertCircle,
  Info,
  CheckCircle2,
  Search,
  Clock,
  BookOpen,
  School,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Award,
  Printer,
  X,
  FileText,
} from "lucide-react";

import HomeHero from "../components/HomeHero";
import HomeLayout from "../components/HomeLayout";
import {
  useCmsData,
  DEFAULT_OFFICIAL_RULES,
  type CmsExam,
  type CmsExamSlot,
  type CmsCandidate,
  getExamTargetLevels,
  getShortLevelBadge,
  isLevelFilterMatch,
  isCandidateMatchingLevel,
  isCandidateTiersTemps,
  getCandidateAssignmentForExam,
  getCandidateMatchingSlots,
} from "../../../shared/services/cms-store";

// Helper to normalize search strings (removes accents, lowercase, trim)
const normalizeSearchStr = (s?: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// Correlates whether a candidate belongs to an exam session (multi-level & per-exam aware)
const isCandidateInExam = (cand: CmsCandidate, exam: CmsExam): boolean => {
  if (!exam) return true;
  if (cand.assignmentsByExam?.[exam.id]) return true;
  const cExam = normalizeSearchStr(cand.examName);
  const eTitle = normalizeSearchStr(exam.title);
  if (cExam && eTitle && (eTitle.includes(cExam) || cExam.includes(eTitle))) return true;
  return isCandidateMatchingLevel(cand.className, getExamTargetLevels(exam));
};

export default function HomePage() {
  const { data: cmsData } = useCmsData();

  // Search and filter state
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedDateByExam, setSelectedDateByExam] = useState<Record<string, string>>({});

  // Floating "Trouver ma Salle" modal state
  const [findRoomModalExam, setFindRoomModalExam] = useState<CmsExam | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>("");

  // Selected student & exam for full downloadable convocation modal
  const [selectedStudentForConvocation, setSelectedStudentForConvocation] =
    useState<CmsCandidate | null>(null);
  const [selectedExamForConvocation, setSelectedExamForConvocation] =
    useState<CmsExam | null>(null);

  // Expanded exam IDs (dict for independent toggling)
  const [expandedExamIds, setExpandedExamIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!findRoomModalExam) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFindRoomModalExam(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [findRoomModalExam]);

  const toggleExamExpanded = (examId: string, defaultExpanded: boolean = true) => {
    setExpandedExamIds((prev) => {
      const isCurrentlyExpanded = prev[examId] !== undefined ? prev[examId] : defaultExpanded;
      return {
        ...prev,
        [examId]: !isCurrentlyExpanded,
      };
    });
  };

  // Published exams only
  const publishedExams = useMemo(() => {
    return cmsData.exams.filter((exam) => exam.isPublished !== false);
  }, [cmsData.exams]);

  // Filtered exams according to selected level (multi-level aware)
  const filteredExams = useMemo(() => {
    if (selectedLevel === "all") return publishedExams;
    return publishedExams.filter((exam) =>
      isLevelFilterMatch(getExamTargetLevels(exam), selectedLevel)
    );
  }, [publishedExams, selectedLevel]);

  // Published announcements
  const publishedAnnouncements = useMemo(() => {
    return cmsData.announcements.filter((ann) => ann.isPublished);
  }, [cmsData.announcements]);

  // Published official rules & regulations
  const publishedOfficialRules = useMemo(() => {
    const list =
      cmsData.officialRules && cmsData.officialRules.length > 0
        ? cmsData.officialRules
        : DEFAULT_OFFICIAL_RULES;
    return list.filter((r) => r.isPublished !== false);
  }, [cmsData.officialRules]);

  // Exam Countdown helper
  const getExamCountdown = (exam: CmsExam) => {
    if (!exam.startsAt) return null;
    const examDate = new Date(exam.startsAt);
    if (isNaN(examDate.getTime())) return null;

    const now = new Date();
    const diffMs = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Session passée", isPast: true };
    if (diffDays === 0) return { label: "Aujourd'hui !", isToday: true };
    if (diffDays === 1) return { label: "Demain !", isSoon: true };
    return { label: `Dans ${diffDays} jours`, isUpcoming: true };
  };

  // Helper to calculate time offset (e.g. 15 min before)
  const computeTimeOffset = (timeStr: string, minutesOffset: number): string => {
    try {
      const clean = timeStr.replace("h", ":").trim();
      const [h, m] = clean.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return "07h45";
      const totalMinutes = h * 60 + m + minutesOffset;
      const rh = Math.floor(totalMinutes / 60) % 24;
      const rm = totalMinutes % 60;
      return `${String(rh).padStart(2, "0")}h${String(rm).padStart(2, "0")}`;
    } catch {
      return "07h45";
    }
  };

  // Helper to generate personalized exam schedule for a candidate (strictly per exam, level, and specialty)
  const getCandidateSchedule = (cand: CmsCandidate, specificExam?: CmsExam | null) => {
    const isTT = isCandidateTiersTemps(cand);
    const resolvedExam =
      specificExam ||
      cmsData.exams.find(
        (e) =>
          (cand.examName && e.title.trim().toLowerCase() === cand.examName.trim().toLowerCase()) ||
          isCandidateMatchingLevel(cand.className, getExamTargetLevels(e))
      ) ||
      null;

    const assign = getCandidateAssignmentForExam(
      cand,
      resolvedExam,
      cmsData.examSlots || [],
      cmsData.rooms
    );
    const matchedSlots = getCandidateMatchingSlots(
      cand,
      resolvedExam,
      cmsData.examSlots || []
    );

    return matchedSlots.map((slot) => {
      const ttEnd =
        slot.tiersTempsEndTime ||
        computeTimeOffset(slot.startTime, Math.round((slot.durationMinutes || 60) * (4 / 3)));
      return {
        discipline: slot.targetSpecialty ? `${slot.subject} (${slot.targetSpecialty})` : slot.subject,
        date: slot.date,
        appel: slot.startTime ? computeTimeOffset(slot.startTime, -15) : (cand.convocationTime || "07h45"),
        debut: slot.startTime,
        fin: isTT ? `${ttEnd} (+1/3)` : slot.endTime,
        salle: assign.roomName || (slot.roomNames?.[0] ?? "Salle principale"),
        table: assign.tableNumber ? `Table N° ${assign.tableNumber}` : "Libre",
        materiel: slot.notes || "Matériel réglementaire",
      };
    });
  };

  /**
   * For a given exam slot and exam, returns ONLY the rooms where:
   * - Candidates have been assigned FOR THAT EXAM, AND/OR
   * - A surveillant has been assigned for that slot/date/time.
   */
  const getActiveRoomsForSlot = (slot: CmsExamSlot, exam: CmsExam) => {
    const slotRooms =
      slot.roomNames && slot.roomNames.length > 0
        ? cmsData.rooms.filter((r) => slot.roomNames!.includes(r.name))
        : exam.mobilizedRoomIds && exam.mobilizedRoomIds.length > 0
        ? cmsData.rooms.filter((r) => exam.mobilizedRoomIds!.includes(r.id))
        : cmsData.rooms;

    const activeList = slotRooms.map((room) => {
      // 1. Candidates assigned strictly to this room for this exam
      const assignedCandidates = cmsData.candidates.filter((c) => {
        if (!isCandidateInExam(c, exam)) return false;
        const assign = getCandidateAssignmentForExam(c, exam, cmsData.examSlots || [], cmsData.rooms);
        return assign.roomName === room.name;
      });

      const count = assignedCandidates.length;

      // 2. Supervisor assigned for this room on this slot/time
      const assignedSurv = cmsData.surveillances.find((s) => {
        if (s.roomName !== room.name) return false;
        if (s.slotId && slot.id && s.slotId === slot.id) return true;
        if (s.date === slot.date && (!s.examTitle || s.examTitle.trim().toLowerCase() === exam.title.trim().toLowerCase())) {
          const matchTime =
            s.timeSlot.includes(slot.startTime) ||
            s.timeSlot.includes(slot.endTime) ||
            slot.startTime.includes(s.timeSlot.split(" - ")[0] || "---");
          if (matchTime) return true;
        }
        return false;
      });

      const isTTRoom =
        Boolean(exam.ttRoomIds?.includes(room.id)) ||
        room.name.toLowerCase().includes("tt") ||
        room.name.toLowerCase().includes("tiers") ||
        room.notes?.toLowerCase().includes("tt");

      return {
        room,
        candidateCount: count,
        surveillant: assignedSurv?.teacherName || null,
        isTTRoom,
      };
    });

    // Keep ONLY rooms with assigned candidates OR assigned supervisor!
    return activeList.filter(
      (item) => item.candidateCount > 0 || item.surveillant !== null
    );
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

  return (
    <HomeLayout
      schoolYear={cmsData.siteInfo.schoolYear}
      schoolName={cmsData.siteInfo.schoolName || cmsData.siteInfo.title}
      schoolCity={cmsData.siteInfo.schoolCity}
      hideChromeOnPrint={Boolean(selectedStudentForConvocation)}
    >
      <div className={selectedStudentForConvocation ? "print:hidden w-full flex flex-col items-center gap-8" : "w-full flex flex-col items-center gap-8"}>
      {/* 1. Hero Header Centered */}
      <HomeHero
        subtitle={cmsData.siteInfo.subtitle}
        title={cmsData.siteInfo.title}
        description={cmsData.siteInfo.description}
        schoolYear={cmsData.siteInfo.schoolYear}
        schoolName={cmsData.siteInfo.schoolName || cmsData.siteInfo.title}
        schoolCity={cmsData.siteInfo.schoolCity}
      />

      {/* 2. Direction Alert Banner if enabled */}
      {cmsData.siteInfo.bannerAlert?.enabled && (
        <div
          className={`flex w-full max-w-4xl items-center gap-3 rounded-2xl border p-4 text-left shadow-2xs ${
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

      {/* 3. CONSIGNES & RÈGLEMENTS OFFICIELS + COMMUNIQUÉS DE LA DIRECTION */}
      <section className="w-full max-w-4xl space-y-4 text-left">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F2A56] via-[#1D4ED8] to-[#c92a2a]" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#0F2A56] font-bold text-[10px] uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#1D4ED8]" />
                  Règlement Officiel &amp; Discipline LFJP
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-red-50 border border-red-200 text-[#c92a2a] font-bold text-[10px] uppercase tracking-wider">
                  Directives Direction
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0F2A56] tracking-tight pt-0.5">
                Consignes Officielles &amp; Règlements des Examens
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Directives institutionnelles impératives pour les candidats, familles et équipes pédagogiques afin de garantir la régularité et l&apos;équité des épreuves.
              </p>
            </div>
          </div>

          {/* Dynamic Official Rule Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {publishedOfficialRules.map((rule) => {
              const renderRuleIcon = (iconName?: string) => {
                switch (iconName) {
                  case "BookOpen":
                    return <BookOpen className="h-4 w-4 text-amber-700 shrink-0" />;
                  case "ShieldCheck":
                    return <ShieldCheck className="h-4 w-4 text-[#0F2A56] shrink-0" />;
                  case "FileText":
                    return <FileText className="h-4 w-4 text-emerald-700 shrink-0" />;
                  case "AlertCircle":
                    return <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />;
                  case "CheckCircle2":
                    return <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />;
                  case "Clock":
                  default:
                    return <Clock className="h-4 w-4 text-[#1D4ED8] shrink-0" />;
                }
              };

              return (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1.5 hover:border-blue-300 hover:bg-white transition"
                >
                  <div className="flex items-center gap-2">
                    {renderRuleIcon(rule.icon)}
                    <span className="font-bold text-xs text-[#0F2A56] leading-tight">
                      {rule.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {rule.content}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Published Announcements Feed (4 Color-Coded Categories) */}
          {publishedAnnouncements.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Communiqués &amp; Annonces de la Direction ({publishedAnnouncements.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {publishedAnnouncements.map((ann) => {
                  const priority = ann.priority || "information";
                  const styleMap = {
                    information: {
                      card: "bg-blue-50/75 border-blue-200 text-blue-950",
                      badge: "bg-blue-100 text-blue-800 border-blue-200",
                      label: "Information",
                      icon: <Info className="h-4 w-4 text-blue-700 shrink-0" />,
                    },
                    important: {
                      card: "bg-amber-50/80 border-amber-200 text-amber-950",
                      badge: "bg-amber-100 text-amber-800 border-amber-200",
                      label: "Important",
                      icon: <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />,
                    },
                    urgent: {
                      card: "bg-rose-50/85 border-rose-200 text-rose-950",
                      badge: "bg-rose-100 text-rose-800 border-rose-200",
                      label: "Urgent",
                      icon: <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />,
                    },
                    resultats: {
                      card: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
                      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
                      label: "Résultats",
                      icon: <Award className="h-4 w-4 text-emerald-700 shrink-0" />,
                    },
                  } as const;
                  const cfg = styleMap[priority] || styleMap.information;

                  return (
                    <div
                      key={ann.id}
                      className={`p-3.5 rounded-xl border shadow-2xs space-y-1.5 ${cfg.card}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {cfg.icon}
                          <span className="font-bold text-xs truncate">{ann.title}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/80 text-slate-700 border border-slate-200/80">
                            {ann.target === "all" ? "Tous" : ann.target === "teachers" ? "Professeurs" : "Élèves"}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">{ann.content}</p>
                      <p className="text-[10px] opacity-70 pt-1 border-t border-black/10 tabular-nums">
                        Publié le {ann.date}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. SESSIONS D'EXAMENS & CALENDRIER COMPACT DES ÉPREUVES */}
      <section className="w-full max-w-4xl space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#0F2A56] tracking-tight">
              Sessions d&apos;Examens &amp; Calendrier des Épreuves
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Consultez les créneaux par jour, les salles affectées ou cliquez sur &quot;Trouver ma Salle&quot;.
            </p>
          </div>

          {/* Level Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-200/60 p-1 rounded-xl self-start sm:self-auto">
            {[
              { id: "all", label: "Tous" },
              { id: "3ème", label: "3ème" },
              { id: "2nde", label: "2nde" },
              { id: "1ère", label: "1ère" },
              { id: "Terminale", label: "Terminale" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedLevel(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedLevel === tab.id
                    ? "bg-white text-[#0F2A56] shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exams List */}
        {filteredExams.length > 0 ? (
          <div className="space-y-5">
            {filteredExams.map((exam) => {
              const countdown = getExamCountdown(exam);
              const isExpanded = expandedExamIds[exam.id] !== undefined ? expandedExamIds[exam.id] : true;
              const examLevels = getExamTargetLevels(exam);

              // Find slots strictly attached to THIS exam, then filtered by selected level tab
              const examSlots = (cmsData.examSlots || [])
                .filter((s) => {
                  const belongsToExam =
                    (s.examId && exam.id && s.examId === exam.id) ||
                    (s.examTitle &&
                      exam.title &&
                      s.examTitle.trim().toLowerCase() === exam.title.trim().toLowerCase());
                  if (!belongsToExam) return false;
                  if (selectedLevel === "all") return true;
                  return isLevelFilterMatch(s.targetLevel || examLevels, selectedLevel);
                })
                .sort((a, b) => {
                  const d = (a.date || "").localeCompare(b.date || "");
                  if (d !== 0) return d;
                  return (a.startTime || "").localeCompare(b.startTime || "");
                });

              const examDates = Array.from(
                new Set(examSlots.map((s) => s.date).filter(Boolean))
              ).sort();

              const activeDateFilter =
                selectedDateByExam[exam.id] &&
                (selectedDateByExam[exam.id] === "all" ||
                  examDates.includes(selectedDateByExam[exam.id]))
                  ? selectedDateByExam[exam.id]
                  : "all";

              const visibleSlots =
                activeDateFilter === "all"
                  ? examSlots
                  : examSlots.filter((s) => s.date === activeDateFilter);

              return (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow overflow-hidden relative"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-[#0F2A56] via-[#1D4ED8] to-[#c92a2a]" />

                  {/* Exam Card Header */}
                  <div className="p-5 bg-slate-50/60 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {examLevels.map((lvl) => (
                          <span
                            key={lvl}
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#0F2A56] border border-blue-200"
                          >
                            {getShortLevelBadge(lvl)}
                          </span>
                        ))}

                        {countdown && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 border ${
                              countdown.isToday
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : countdown.isSoon
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : countdown.isPast
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>{countdown.label}</span>
                          </span>
                        )}

                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-600">
                          Statut : <strong className="text-slate-900">{exam.status || "Prévu"}</strong>
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-[#0F2A56] tracking-tight">
                        {exam.title}
                      </h3>

                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[#1D4ED8]" />
                        <span>Période officielle : {exam.period}</span>
                      </p>

                      {exam.description && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-0.5 max-w-2xl">
                          {exam.description}
                        </p>
                      )}
                    </div>

                    {/* Dual Action Buttons: "Trouver ma Salle" (Modal) & "Consulter le planning" */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setModalSearchQuery("");
                          setFindRoomModalExam(exam);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      >
                        <Search className="h-3.5 w-3.5 text-slate-950" />
                        <span>Trouver ma Salle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExamExpanded(exam.id, true)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                          isExpanded
                            ? "bg-[#0F2A56] text-white shadow-2xs"
                            : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
                        }`}
                      >
                        <span>
                          {isExpanded
                            ? "Replier le planning"
                            : `Voir le planning (${examSlots.length} épreuves)`}
                        </span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Compact Schedule Table + Date Tabs (when expanded) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-white space-y-4">
                      {examSlots.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">
                          Aucune épreuve n&apos;est encore programmée pour cette session.
                        </p>
                      ) : (
                        <>
                          {/* Date Filter Tabs */}
                          {examDates.length > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedDateByExam((prev) => ({
                                      ...prev,
                                      [exam.id]: "all",
                                    }))
                                  }
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                    activeDateFilter === "all"
                                      ? "bg-[#0F2A56] text-white border-[#0F2A56]"
                                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  Tous les jours ({examSlots.length})
                                </button>
                                {examDates.map((d) => {
                                  const countOnDay = examSlots.filter((s) => s.date === d).length;
                                  return (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() =>
                                        setSelectedDateByExam((prev) => ({
                                          ...prev,
                                          [exam.id]: d,
                                        }))
                                      }
                                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition cursor-pointer tabular-nums ${
                                        activeDateFilter === d
                                          ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                      }`}
                                    >
                                      {d} ({countOnDay})
                                    </button>
                                  );
                                })}
                              </div>

                              <span className="text-[11px] text-slate-500 font-medium tabular-nums">
                                {visibleSlots.length} épreuve(s) affichée(s)
                              </span>
                            </div>
                          )}

                          {/* Compact Responsive Schedule Table */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600">
                                  <tr>
                                    <th className="py-2.5 px-3.5 font-bold whitespace-nowrap">Date &amp; Horaires</th>
                                    <th className="py-2.5 px-3.5 font-bold">Épreuve &amp; Niveau</th>
                                    <th className="py-2.5 px-3.5 font-bold">Salles &amp; Surveillants Affectés</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/80 bg-white">
                                  {visibleSlots.map((slot, sIdx) => {
                                    const activeRooms = getActiveRoomsForSlot(slot, exam);

                                    return (
                                      <tr key={slot.id || sIdx} className="hover:bg-slate-50/70 align-top">
                                        {/* Date & Horaires */}
                                        <td className="py-3 px-3.5 whitespace-nowrap">
                                          <div className="font-mono font-bold text-[#0F2A56] text-xs tabular-nums">
                                            {slot.date}
                                          </div>
                                          <div className="font-mono font-semibold text-slate-800 text-xs mt-0.5 tabular-nums">
                                            {slot.startTime} – {slot.endTime}
                                          </div>
                                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold tabular-nums">
                                            {slot.durationMinutes} min
                                          </span>
                                        </td>

                                        {/* Épreuve & Niveau */}
                                        <td className="py-3 px-3.5 min-w-[200px]">
                                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                            {slot.subject}
                                          </div>
                                          <div className="flex flex-wrap items-center gap-1 mt-1">
                                            {slot.targetLevel && (
                                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                {getShortLevelBadge(slot.targetLevel)}
                                              </span>
                                            )}
                                            {slot.targetSpecialty && (
                                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                {slot.targetSpecialty}
                                              </span>
                                            )}
                                          </div>
                                          {slot.notes && (
                                            <p className="text-[11px] text-slate-500 italic mt-1.5 leading-snug">
                                              {slot.notes}
                                            </p>
                                          )}
                                        </td>

                                        {/* Salles & Surveillants */}
                                        <td className="py-3 px-3.5 min-w-[260px]">
                                          {activeRooms.length === 0 ? (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 px-2.5 py-1 rounded-lg">
                                              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                              <span>Affectation en cours de confirmation</span>
                                            </span>
                                          ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                              {activeRooms.map((activeItem) => (
                                                <div
                                                  key={activeItem.room.id}
                                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] leading-tight ${
                                                    activeItem.isTTRoom
                                                      ? "border-purple-200 bg-purple-50/50"
                                                      : "border-slate-200 bg-slate-50/70"
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-1.5 font-bold text-[#0F2A56]">
                                                    <School className="h-3 w-3 text-[#1D4ED8] shrink-0" />
                                                    <span>{activeItem.room.name}</span>
                                                    {activeItem.isTTRoom && (
                                                      <span className="px-1 rounded bg-purple-200 text-purple-900 font-bold text-[9px]">
                                                        TT
                                                      </span>
                                                    )}
                                                    <span className="text-slate-500 font-mono font-semibold tabular-nums">
                                                      ({activeItem.candidateCount})
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-0.5">
                                                    <UserCheck className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                                                    <span className="truncate max-w-[150px]">
                                                      {activeItem.surveillant || "Surveillant à confirmer"}
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Sleek Candidate CTA Row opening the Floating Modal */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="text-xs text-slate-700">
                              <strong className="text-[#0F2A56]">Espace Candidat • {exam.title}</strong>
                              <span className="text-slate-500 block sm:inline sm:ml-2">
                                Vérifiez votre salle, numéro de table et téléchargez votre convocation officielle.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setModalSearchQuery("");
                                setFindRoomModalExam(exam);
                              }}
                              className="px-3.5 py-2 rounded-lg bg-[#0F2A56] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              <Search className="h-3.5 w-3.5 text-amber-300" />
                              <span>Trouver ma Salle &amp; Convocation</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Aucune session d&apos;examen trouvée pour ce niveau.
          </div>
        )}
      </section>
      </div>

      {/* 7. MODAL DE CONVOCATION OFFICIELLE TÉLÉCHARGEABLE / IMPRIMABLE */}
      {selectedStudentForConvocation && (() => {
        const modalAssign = getCandidateAssignmentForExam(
          selectedStudentForConvocation,
          selectedExamForConvocation,
          cmsData.examSlots || [],
          cmsData.rooms
        );
        const modalIsTT = isCandidateTiersTemps(selectedStudentForConvocation);
        const modalSchedule = getCandidateSchedule(selectedStudentForConvocation, selectedExamForConvocation);

        return (
          <div
            id="convocation-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:static print:bg-white print:p-0 print:block print:overflow-visible"
          >
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 print:max-w-none print:shadow-none print:border-none print:rounded-none print:m-0">
              {/* Modal Top Control Bar (Hidden on print) */}
              <div className="print:hidden bg-[#002060] text-white px-5 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-300" />
                  <span className="text-xs font-bold tracking-wide">
                    Convocation Officielle • {selectedStudentForConvocation.lastName.toUpperCase()}{" "}
                    {selectedStudentForConvocation.firstName} ({selectedStudentForConvocation.className})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prevTitle = document.title;
                      if (selectedStudentForConvocation) {
                        document.title = `Convocation_${selectedStudentForConvocation.lastName.toUpperCase()}_${selectedStudentForConvocation.firstName}_${selectedStudentForConvocation.className}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
                      }
                      window.print();
                      setTimeout(() => {
                        document.title = prevTitle;
                      }, 2000);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Imprimer / Télécharger en PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudentForConvocation(null)}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Official Printable Sheet */}
              <div
                id="printable-convocation-sheet"
                className="p-6 sm:p-8 bg-white text-slate-900 space-y-4 text-left print:p-0"
              >
                {/* Institutional Header with Logo */}
                <div className="flex items-center justify-between border-b-2 border-[#002060] pb-3 gap-4 print-avoid-break">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/logo-lfjp_62451311.png"
                      alt="Lycée Français Jacques Prévert"
                      className="h-11 sm:h-12 w-auto object-contain shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                      }}
                    />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-red-600">
                        RÉPUBLIQUE FRANÇAISE • RÉSEAU AEFE
                      </p>
                      <h2 className="text-sm sm:text-base font-black text-[#002060] leading-tight">
                        LYCÉE FRANÇAIS JACQUES PRÉVERT
                      </h2>
                      <p className="text-[11px] text-slate-600">
                        Saly Portudal • Sénégal • Code RNE 9930032S
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#002060] font-bold text-xs">
                      Session {cmsData.siteInfo.schoolYear || "2026-2027"}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Convocation Officielle
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-1 print-avoid-break">
                  <h1 className="text-base sm:text-lg font-black text-[#002060] uppercase tracking-wide">
                    CONVOCATION INDIVIDUELLE DU CANDIDAT
                  </h1>
                  {selectedExamForConvocation ? (
                    <p className="text-xs font-black text-red-600 uppercase tracking-wider">
                      {selectedExamForConvocation.title} • {selectedExamForConvocation.period}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Délivrée par la Direction et le Secrétariat des Examens du Lycée Français Jacques Prévert
                    </p>
                  )}
                </div>

                {/* Candidate Info Box */}
                <div className="rounded-xl border border-slate-300 p-4 bg-slate-50/70 space-y-3 print-avoid-break">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Nom &amp; Prénom
                      </span>
                      <strong className="text-sm font-black text-[#002060]">
                        {selectedStudentForConvocation.lastName.toUpperCase()}{" "}
                        {selectedStudentForConvocation.firstName}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Classe &amp; Division
                      </span>
                      <strong className="text-sm font-bold text-slate-900">
                        {selectedStudentForConvocation.className}
                      </strong>
                      {selectedStudentForConvocation.specialty && (
                        <span className="block text-[10px] text-indigo-700 font-semibold">
                          {selectedStudentForConvocation.specialty}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        N° Anonymat / Candidat
                      </span>
                      <strong className="text-sm font-mono text-slate-900">
                        {modalAssign.anonymatNumber ||
                          `LFJP-${selectedStudentForConvocation.id.slice(-4)}`}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Salle d&apos;examen assignée
                      </span>
                      <strong className="text-sm font-black text-[#002060]">
                        {modalAssign.roomName || "En cours d'attribution"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Numéro de Table
                      </span>
                      <strong className="text-sm font-bold text-slate-900 font-mono">
                        Table N° {modalAssign.tableNumber || "1"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Régime d&apos;Aménagement
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          modalIsTT ? "text-purple-700 font-black" : "text-slate-700"
                        }`}
                      >
                        {modalIsTT
                          ? `♿ ${selectedStudentForConvocation.accommodation || "Tiers-Temps"} (+1/3 temps)`
                          : "Régime standard"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timetable Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Calendrier et Horaires des Épreuves du Candidat :
                  </h3>
                  <div className="print-table-wrap border border-slate-300 rounded-xl overflow-hidden">
                    <table className="print-a4-table w-full text-xs text-left">
                      <thead className="bg-[#002060] text-white text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-2.5 font-bold">Date</th>
                          <th className="py-2 px-2.5 font-bold">Appel</th>
                          <th className="py-2 px-2.5 font-bold">Épreuve / Discipline</th>
                          <th className="py-2 px-2.5 font-bold">Horaires</th>
                          <th className="py-2 px-2.5 font-bold">Salle</th>
                          <th className="py-2 px-2.5 font-bold">Matériel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {modalSchedule.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                              Aucune épreuve programmée pour votre niveau ({selectedStudentForConvocation.className}) dans cette session.
                            </td>
                          </tr>
                        ) : (
                          modalSchedule.map((slot, sIdx) => (
                            <tr key={sIdx} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 font-semibold text-slate-900 whitespace-nowrap">
                                {slot.date}
                              </td>
                              <td className="py-2 px-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                                {slot.appel}
                              </td>
                              <td className="py-2 px-2.5 font-bold text-slate-800">
                                {slot.discipline}
                              </td>
                              <td className="py-2 px-2.5 font-mono font-bold text-[#002060] whitespace-nowrap">
                                {slot.debut} - {slot.fin}
                              </td>
                              <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                                {slot.salle}
                              </td>
                              <td className="py-2 px-2.5 text-[11px] text-slate-600">
                                {slot.materiel}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Instructions and Rules */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1 leading-relaxed print-avoid-break">
                  <p className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">
                    Consignes Impératives aux Candidats :
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>
                      Le candidat doit obligatoirement se présenter muni de la <strong>présente convocation</strong> et d&apos;une <strong>pièce d&apos;identité officielle avec photographie</strong>.
                    </li>
                    <li>
                      L&apos;accès en salle est ouvert <strong>15 minutes avant le début</strong> de chaque épreuve. Tout retardataire ne pourra être admis après l&apos;ouverture des enveloppes de sujets.
                    </li>
                    <li>
                      Pour les épreuves où la calculatrice est autorisée, seul le <strong>mode examen</strong> avec signal lumineux actif est strictement obligatoire.
                    </li>
                    <li>
                      Les téléphones portables et montres connectées doivent être <strong>éteints et rangés dans les sacs</strong> déposés à l&apos;entrée de la salle.
                    </li>
                  </ul>
                </div>

                {/* Signature Box */}
                <div className="flex justify-between items-end pt-3 border-t border-slate-200 text-xs print-avoid-break">
                  <div className="text-[11px] text-slate-400">
                    <p className="font-semibold text-slate-600">Lycée Français Jacques Prévert de Saly</p>
                    <p>Document officiel certifié • Session {cmsData.siteInfo.schoolYear || "2026-2027"}</p>
                  </div>

                  <div className="text-right space-y-3">
                    <p className="text-slate-600 text-xs">
                      Fait à Saly Portudal, le {new Date().toLocaleDateString("fr-FR")}
                    </p>
                    <div>
                      <p className="font-bold text-[#002060]">Le / La Proviseur(e)</p>
                      <p className="text-[10px] text-slate-500 italic">Direction du Lycée Français Jacques Prévert</p>
                      <p className="text-[9px] text-slate-400">Signature et cachet officiel du LFJP</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* 6. MODAL FLOTTANTE CENTRÉE : TROUVER MA SALLE & CONVOCATION */}
      {findRoomModalExam && (() => {
        const query = normalizeSearchStr(modalSearchQuery);
        const candidatesFound =
          query.length >= 1
            ? cmsData.candidates.filter((cand) => {
                if (!isCandidateInExam(cand, findRoomModalExam)) return false;
                if (
                  selectedLevel !== "all" &&
                  !isCandidateMatchingLevel(cand.className, selectedLevel)
                ) {
                  return false;
                }
                const lastName = normalizeSearchStr(cand.lastName);
                const firstName = normalizeSearchStr(cand.firstName);
                const fullName = `${lastName} ${firstName}`;
                const reverseName = `${firstName} ${lastName}`;
                const assign = getCandidateAssignmentForExam(
                  cand,
                  findRoomModalExam,
                  cmsData.examSlots || [],
                  cmsData.rooms
                );
                const anonymat = normalizeSearchStr(assign.anonymatNumber || cand.anonymatNumber);
                const id = normalizeSearchStr(cand.id);
                const className = normalizeSearchStr(cand.className);

                return (
                  lastName.includes(query) ||
                  firstName.includes(query) ||
                  fullName.includes(query) ||
                  reverseName.includes(query) ||
                  anonymat.includes(query) ||
                  id.includes(query) ||
                  className.includes(query)
                );
              })
            : [];

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setFindRoomModalExam(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="bg-[#0F2A56] text-white px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Portail Candidat • {findRoomModalExam.title}
                  </p>
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2 truncate">
                    <Search className="h-4 w-4 text-amber-300 shrink-0" />
                    <span>Trouver ma Salle &amp; Ma Convocation</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFindRoomModalExam(null)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
                  title="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder="Tapez votre nom, prénom, classe ou N° d'anonymat..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-100 focus:outline-hidden font-medium"
                  />
                  {modalSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setModalSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Effacer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Période : <strong className="text-slate-700">{findRoomModalExam.period}</strong> • Saisissez au moins 1 caractère pour afficher votre affectation.
                </p>
              </div>

              {/* Results Body */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-white">
                {query.length < 1 ? (
                  <div className="py-10 text-center space-y-2 text-slate-500">
                    <Search className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      Recherche instantanée par nom, classe ou numéro d&apos;anonymat
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Vous verrez immédiatement votre salle assignée, votre numéro de table, vos horaires personnalisés (incluant +1/3 temps le cas échéant) et le bouton de convocation PDF.
                    </p>
                  </div>
                ) : candidatesFound.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-xs text-slate-600">
                      Aucun élève trouvé pour &quot;<strong>{modalSearchQuery}</strong>&quot; sur cette session. Vérifiez l&apos;orthographe ou le filtre de niveau.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {candidatesFound.length} candidat(s) trouvé(s)
                    </p>
                    {candidatesFound.map((cand) => {
                      const assign = getCandidateAssignmentForExam(
                        cand,
                        findRoomModalExam,
                        cmsData.examSlots || [],
                        cmsData.rooms
                      );
                      const candSlots = getCandidateMatchingSlots(
                        cand,
                        findRoomModalExam,
                        cmsData.examSlots || []
                      );
                      const isTT = isCandidateTiersTemps(cand);

                      return (
                        <div
                          key={cand.id}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2.5">
                            <div>
                              <span className="font-extrabold text-sm text-[#0F2A56] block">
                                {cand.lastName.toUpperCase()} {cand.firstName}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                N° Anonymat : {assign.anonymatNumber || `LFJP-${cand.id.slice(-4)}`}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-[#0F2A56]">
                              {cand.className}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Salle assignée
                              </span>
                              <strong className="text-sm font-extrabold text-[#0F2A56]">
                                {assign.roomName || "En cours d'attribution"}
                              </strong>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Table d&apos;examen
                              </span>
                              <strong className="text-sm font-bold text-slate-800 font-mono tabular-nums">
                                Table N° {assign.tableNumber || "1"}
                              </strong>
                            </div>
                          </div>

                          {/* Épreuves du candidat */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-600 block">
                              Épreuves du candidat ({candSlots.length}) :
                            </span>
                            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                              {candSlots.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">
                                  Aucune épreuve programmée pour ce niveau.
                                </p>
                              ) : (
                                candSlots.map((slot, idx) => {
                                  const ttEnd =
                                    slot.tiersTempsEndTime ||
                                    computeTimeOffset(
                                      slot.startTime,
                                      Math.round((slot.durationMinutes || 60) * (4 / 3))
                                    );
                                  return (
                                    <div
                                      key={slot.id || idx}
                                      className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                                    >
                                      <span className="font-semibold text-slate-800 truncate mr-2">
                                        {slot.subject}
                                      </span>
                                      <span className="font-mono text-slate-600 text-[10px] shrink-0 tabular-nums">
                                        {slot.date} • {slot.startTime} – {isTT ? `${ttEnd} (+1/3)` : slot.endTime}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {isTT && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold">
                              Aménagement : {cand.accommodation || "Tiers-Temps"} (+1/3 temps appliqué)
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const examRef = findRoomModalExam;
                              setFindRoomModalExam(null);
                              setSelectedExamForConvocation(examRef);
                              setSelectedStudentForConvocation(cand);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#0F2A56] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5 text-amber-300" />
                            <span>Télécharger / Imprimer ma convocation ({findRoomModalExam.title})</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </HomeLayout>
  );
}

import React, { useState, useMemo } from "react";
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
  Download,
} from "lucide-react";

import HomeHero from "../components/HomeHero";
import HomeLayout from "../components/HomeLayout";
import {
  useCmsData,
  type CmsExam,
  type CmsExamSlot,
  type CmsCandidate,
} from "../../../shared/services/cms-store";

export default function HomePage() {
  const { data: cmsData } = useCmsData();

  // Search and filter state
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");

  // Exam-specific search queries (one per exam session)
  const [examSearchQueries, setExamSearchQueries] = useState<Record<string, string>>({});

  // Selected student & exam for full downloadable convocation modal
  const [selectedStudentForConvocation, setSelectedStudentForConvocation] =
    useState<CmsCandidate | null>(null);
  const [selectedExamForConvocation, setSelectedExamForConvocation] =
    useState<CmsExam | null>(null);

  // Expanded exam ID
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

  // Published announcements
  const publishedAnnouncements = useMemo(() => {
    return cmsData.announcements.filter((ann) => ann.isPublished);
  }, [cmsData.announcements]);

  // Candidate quick room locator - STRICT individual candidate search
  const searchedStudents = useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return cmsData.candidates.filter((c) => {
      const lastName = (c.lastName || "").toLowerCase();
      const firstName = (c.firstName || "").toLowerCase();
      const fullName = `${lastName} ${firstName}`;
      const reverseName = `${firstName} ${lastName}`;
      const anonymat = (c.anonymatNumber || "").toLowerCase();
      const id = (c.id || "").toLowerCase();

      return (
        lastName.includes(q) ||
        firstName.includes(q) ||
        fullName.includes(q) ||
        reverseName.includes(q) ||
        anonymat.includes(q) ||
        id.includes(q)
      );
    });
  }, [cmsData.candidates, studentSearchQuery]);

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

  // Helper to generate personalized exam schedule for a candidate (optionally filtered by specific exam session)
  const getCandidateSchedule = (cand: CmsCandidate, specificExam?: CmsExam | null) => {
    const isTiersTemps = Boolean(
      cand.accommodation &&
        cand.accommodation !== "Aucun" &&
        (cand.accommodation.toLowerCase().includes("tiers") ||
          cand.accommodation.toLowerCase().includes("aménag") ||
          cand.accommodation.toLowerCase().includes("pap") ||
          cand.accommodation.toLowerCase().includes("pps") ||
          cand.accommodation.toLowerCase().includes("1/3"))
    );

    // 1. Try to find real configured slots matching candidate's exam session or class level
    const matchedSlots = (cmsData.examSlots || []).filter((slot) => {
      if (specificExam) {
        if (slot.examId && specificExam.id && slot.examId === specificExam.id) return true;
        if (slot.examTitle && specificExam.title) {
          const sTit = slot.examTitle.toLowerCase();
          const eTit = specificExam.title.toLowerCase();
          if (sTit.includes(eTit) || eTit.includes(sTit)) return true;
        }
        if (specificExam.targetLevel && slot.targetLevel && specificExam.targetLevel === slot.targetLevel) return true;
      }
      if (cand.examName && slot.examTitle && cand.examName.toLowerCase().includes(slot.examTitle.toLowerCase())) return true;
      if (cand.className && slot.targetLevel && cand.className.toLowerCase().includes(slot.targetLevel.toLowerCase())) return true;
      if (cand.className.includes("3ème") && (slot.targetLevel?.includes("3ème") || slot.examTitle?.toLowerCase().includes("dnb"))) return true;
      if ((cand.className.includes("1ère") || cand.className.includes("Terminale")) && (slot.targetLevel?.includes("Bac") || slot.examTitle?.toLowerCase().includes("bac"))) return true;
      return false;
    });

    if (matchedSlots.length > 0) {
      return matchedSlots.map((slot) => ({
        discipline: slot.subject,
        date: slot.date,
        appel: slot.startTime ? computeTimeOffset(slot.startTime, -15) : (cand.convocationTime || "07h45"),
        debut: slot.startTime,
        fin: isTiersTemps && slot.tiersTempsEndTime ? `${slot.tiersTempsEndTime} (+1/3)` : slot.endTime,
        salle: cand.roomName || (slot.roomNames?.[0] ?? "Salle principale"),
        table: `Table N° ${cand.tableNumber || "1"}`,
        materiel: slot.notes || "Matériel usuel autorisé",
      }));
    }

    // 2. Fallback standard slots based on class if no slots entered yet
    const is3eme = cand.className.includes("3ème") || cand.examName?.toLowerCase().includes("dnb");
    if (is3eme) {
      return [
        {
          discipline: "Français 1ère partie (Grammaire, Dictée & Compréhension)",
          date: "Mardi 03 Février 2026",
          appel: isTiersTemps ? "07h30" : "07h45",
          debut: "08h00",
          fin: isTiersTemps ? "10h00 (+1/3)" : "09h30",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${cand.tableNumber || "01"}`,
          materiel: "Dictionnaire interdit pour la dictée",
        },
        {
          discipline: "Français 2ème partie (Rédaction / Expression écrite)",
          date: "Mardi 03 Février 2026",
          appel: "09h45",
          debut: "10h00",
          fin: isTiersTemps ? "12h00 (+1/3)" : "11h30",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${cand.tableNumber || "01"}`,
          materiel: "Dictionnaire unilingue français autorisé",
        },
        {
          discipline: "Mathématiques",
          date: "Mardi 03 Février 2026",
          appel: "13h45",
          debut: "14h00",
          fin: isTiersTemps ? "16h40 (+1/3)" : "16h00",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${cand.tableNumber || "01"}`,
          materiel: "Calculatrice mode examen & instruments de géométrie",
        },
        {
          discipline: "Histoire-Géographie & Enseignement Moral et Civique (EMC)",
          date: "Mercredi 04 Février 2026",
          appel: isTiersTemps ? "07h30" : "07h45",
          debut: "08h00",
          fin: isTiersTemps ? "10h40 (+1/3)" : "10h00",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${cand.tableNumber || "01"}`,
          materiel: "Crayons de couleur pour croquis de géographie",
        },
        {
          discipline: "Sciences (Physique-Chimie & SVT)",
          date: "Mercredi 04 Février 2026",
          appel: "10h15",
          debut: "10h30",
          fin: isTiersTemps ? "11h50 (+1/3)" : "11h30",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${cand.tableNumber || "01"}`,
          materiel: "Calculatrice mode examen autorisée",
        },
      ];
    }

    // Default Lycée / Bac
    return [
      {
        discipline: "Épreuve écrite de Spécialité 1 / Français EAF",
        date: "Mercredi 08 Avril 2026",
        appel: isTiersTemps ? "07h30" : "07h45",
        debut: "08h00",
        fin: isTiersTemps ? "13h20 (+1/3)" : "12h00",
        salle: cand.roomName || "Salle S12",
        table: `Table N° ${cand.tableNumber || "12"}`,
        materiel: "Calculatrice mode examen autorisée",
      },
      {
        discipline: "Épreuve écrite de Spécialité 2 / Philosophie",
        date: "Jeudi 09 Avril 2026",
        appel: isTiersTemps ? "07h30" : "07h45",
        debut: "08h00",
        fin: isTiersTemps ? "13h20 (+1/3)" : "12h00",
        salle: cand.roomName || "Salle S12",
        table: `Table N° ${cand.tableNumber || "12"}`,
        materiel: "Matériel d'écriture usuel, calculatrice interdite",
      },
      {
        discipline: "Histoire-Géographie & Langues Vivantes",
        date: "Vendredi 10 Avril 2026",
        appel: "13h30",
        debut: "13h45",
        fin: isTiersTemps ? "17h00 (+1/3)" : "16h00",
        salle: cand.roomName || "Salle S12",
        table: `Table N° ${cand.tableNumber || "12"}`,
        materiel: "Crayons de couleur pour croquis de géographie",
      },
    ];
  };

  /**
   * For a given exam slot and exam, returns ONLY the rooms where:
   * - Candidates have been assigned, AND/OR
   * - A surveillant has been assigned for that slot/date/time.
   * This strictly addresses: "seulement les salles ou on a affecter des eleves et les surveillants pour les epreuves"
   */
  const getActiveRoomsForSlot = (slot: CmsExamSlot, exam: CmsExam) => {
    const candidateRooms = slot.roomNames && slot.roomNames.length > 0
      ? cmsData.rooms.filter((r) => slot.roomNames!.includes(r.name))
      : cmsData.rooms;

    const activeList = candidateRooms.map((room) => {
      // 1. Candidates assigned to this room for this exam
      const assignedCandidates = cmsData.candidates.filter((c) => {
        if (c.roomName !== room.name) return false;
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

      // 2. Supervisor assigned for this room on this slot/time
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

      const isTTRoom =
        room.name.toLowerCase().includes("tt") ||
        room.name.toLowerCase().includes("tiers") ||
        room.notes?.toLowerCase().includes("tt");

      return {
        room,
        candidateCount: assignedCandidates.length,
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
    <HomeLayout schoolYear={cmsData.siteInfo.schoolYear}>
      {/* 1. Hero Header Centered */}
      <HomeHero
        logos={cmsData.siteInfo.logos}
        subtitle={cmsData.siteInfo.subtitle}
        title={cmsData.siteInfo.title}
        description={cmsData.siteInfo.description}
        schoolYear={cmsData.siteInfo.schoolYear}
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

      {/* 3. Official Announcements / Communiqués */}
      {publishedAnnouncements.length > 0 && (
        <section className="w-full max-w-4xl space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Consignes Officielles de Direction</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              {publishedAnnouncements.length} annonce(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {publishedAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl border border-sky-100 bg-white shadow-2xs space-y-2 hover:border-sky-300 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900">{ann.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 shrink-0">
                    {ann.target === "all" ? "Tous" : ann.target === "teachers" ? "Professeurs" : "Élèves"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  Publié le {ann.date}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. GUIDE CONVOCATIONS & SESSIONS */}
      <div className="w-full max-w-4xl rounded-2xl bg-gradient-to-r from-[#002060] to-[#001746] text-white p-5 sm:p-6 text-left shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Espace Candidats & Familles
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            Trouver ma salle & Télécharger ma convocation officielle par session
          </h3>
          <p className="text-xs text-slate-200">
            Consultez votre session d'examen ci-dessous (DNB, Baccalauréat...). Dans chaque session, utilisez l'espace recherche pour voir vos matières, horaires (+1/3 temps) et imprimer votre convocation individuelle officielle.
          </p>
        </div>
      </div>

      {/* 5. SESSIONS D'EXAMENS & CRÉNEAUX DES ÉPREUVES */}
      <section className="w-full max-w-4xl space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Sessions d'Examens & Horaires des Épreuves
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Consultez le déroulement complet des épreuves et les salles d'examen affectées.
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
                  className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                >
                  {/* Exam Card Header */}
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {exam.targetLevel || "Tous niveaux"}
                        </span>

                        {countdown && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              countdown.isToday
                                ? "bg-rose-100 text-rose-800"
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

                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-blue-700" />
                        <span>Période : {exam.period}</span>
                      </p>

                      {exam.description && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                          {exam.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 self-start md:self-center shrink-0"
                    >
                      <span>{isExpanded ? "Replier" : `Voir les épreuves (${examSlots.length})`}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Exam Épreuves & Créneaux (when expanded) */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-slate-50/60 space-y-4">
                      {examSlots.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">
                          Aucune épreuve n'est encore programmée pour cette session.
                        </p>
                      ) : (
                        examSlots.map((slot, sIdx) => {
                          // Retrieve ONLY rooms where candidates or surveillants are allocated
                          const activeRooms = getActiveRoomsForSlot(slot, exam);

                          return (
                            <div
                              key={slot.id || sIdx}
                              className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3"
                            >
                              {/* Épreuve Title & Date */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <span className="font-black text-sm sm:text-base text-slate-900">
                                  {slot.subject}
                                </span>
                                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200 self-start sm:self-auto">
                                  {slot.date}
                                </span>
                              </div>

                              {/* Schedules */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Horaires Standard ({slot.durationMinutes} min)
                                  </span>
                                  <p className="font-mono font-black text-slate-900 text-sm">
                                    {slot.startTime} ➔ {slot.endTime}
                                  </p>
                                </div>

                                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                                    Tiers-Temps (+1/3)
                                  </span>
                                  <p className="font-mono font-black text-purple-900 text-sm">
                                    {slot.startTime} ➔ {slot.tiersTempsEndTime || slot.endTime}
                                  </p>
                                </div>
                              </div>

                              {/* ACTIVE ROOMS WITH CANDIDATES & SURVEILLANTS ONLY */}
                              <div className="pt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <School className="h-3.5 w-3.5 text-blue-700" />
                                    <span>Salles d'examen avec élèves & surveillants affectés :</span>
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {activeRooms.length} salle(s) mobilisée(s)
                                  </span>
                                </div>

                                {activeRooms.length === 0 ? (
                                  <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                                    <Info className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span>
                                      Affectation des élèves et des surveillants en cours de confirmation par la direction.
                                    </span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {activeRooms.map((activeItem) => (
                                      <div
                                        key={activeItem.room.id}
                                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                                          activeItem.isTTRoom
                                            ? "border-purple-300 bg-purple-50/30"
                                            : "border-slate-200 bg-slate-50/50"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-slate-900">
                                            {activeItem.room.name}
                                          </span>
                                          {activeItem.isTTRoom && (
                                            <span className="px-1.5 py-0.2 rounded bg-purple-200 text-purple-900 font-bold text-[9px]">
                                              ♿ TT
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-[11px] text-slate-600">
                                          Élèves convoqués :{" "}
                                          <strong className="text-slate-900 font-mono">
                                            {activeItem.candidateCount} élève(s)
                                          </strong>
                                        </p>

                                        <div className="pt-1 border-t border-slate-200/60 flex items-center gap-1 text-[11px]">
                                          <UserCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                                          <span className="text-slate-500 text-[10px]">Surveillant :</span>
                                          <span className="font-bold text-slate-800 truncate">
                                            {activeItem.surveillant || "En cours"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {slot.notes && (
                                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                                  Consigne : {slot.notes}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}

                      {/* ESPACE CANDIDAT INTÉGRÉ : TROUVER MA SALLE & TÉLÉCHARGER MA CONVOCATION POUR CET EXAMEN */}
                      <div className="pt-4 border-t-2 border-slate-200/80 space-y-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-blue-900/15 shadow-2xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                                  Convocation Officielle • {exam.title}
                                </span>
                              </div>
                              <h4 className="text-sm sm:text-base font-black text-[#002060] flex items-center gap-1.5 mt-0.5">
                                <Search className="h-4 w-4 text-[#002060]" />
                                <span>Trouver ma salle & Télécharger ma convocation pour cette session</span>
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Saisissez votre nom ou N° d'anonymat pour consulter vos matières, horaires (+1/3 temps) et imprimer votre convocation nominative.
                              </p>
                            </div>

                            <div className="relative w-full sm:w-64 shrink-0">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                type="text"
                                value={examSearchQueries[exam.id] || ""}
                                onChange={(e) =>
                                  setExamSearchQueries((prev) => ({
                                    ...prev,
                                    [exam.id]: e.target.value,
                                  }))
                                }
                                placeholder="Votre nom ou N°..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#002060] focus:ring-2 focus:ring-blue-100 focus:outline-hidden font-medium"
                              />
                            </div>
                          </div>

                          {/* Candidate search results for this exam session */}
                          {(() => {
                            const query = (examSearchQueries[exam.id] || "").trim().toLowerCase();
                            if (query.length < 2) return null;

                            const matchedCandidates = cmsData.candidates.filter((cand) => {
                              const lastName = (cand.lastName || "").toLowerCase();
                              const firstName = (cand.firstName || "").toLowerCase();
                              const fullName = `${lastName} ${firstName}`;
                              const reverseName = `${firstName} ${lastName}`;
                              const anonymat = (cand.anonymatNumber || "").toLowerCase();
                              const id = (cand.id || "").toLowerCase();

                              const nameMatches =
                                lastName.includes(query) ||
                                firstName.includes(query) ||
                                fullName.includes(query) ||
                                reverseName.includes(query) ||
                                anonymat.includes(query) ||
                                id.includes(query);

                              if (!nameMatches) return false;

                              // Must match this exam or level
                              if (cand.examName && exam.title) {
                                const cEx = cand.examName.toLowerCase();
                                const eTit = exam.title.toLowerCase();
                                if (cEx.includes(eTit) || eTit.includes(cEx)) return true;
                              }
                              if (exam.targetLevel && cand.className && cand.className.includes(exam.targetLevel)) return true;
                              if (exam.title?.toLowerCase().includes("dnb") && cand.className?.includes("3ème")) return true;
                              if (exam.title?.toLowerCase().includes("bac") && (cand.className?.includes("1ère") || cand.className?.includes("Terminale"))) return true;

                              return false;
                            });

                            if (matchedCandidates.length === 0) {
                              return (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                  <p className="text-xs text-slate-500">
                                    Aucun élève trouvé pour "<strong>{examSearchQueries[exam.id]}</strong>" dans cette session d'examen. Vérifiez l'orthographe ou le numéro d'anonymat.
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {matchedCandidates.map((cand) => (
                                  <div
                                    key={cand.id}
                                    className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3"
                                  >
                                    <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                                      <div>
                                        <span className="font-black text-sm text-[#002060] block">
                                          {cand.lastName.toUpperCase()} {cand.firstName}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-mono">
                                          N° Anonymat : {cand.anonymatNumber || `LFJP-${cand.id.slice(-4)}`}
                                        </span>
                                      </div>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#002060]">
                                        {cand.className}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                          Salle assignée
                                        </span>
                                        <strong className="text-xs font-black text-[#002060]">
                                          {cand.roomName || "Salle principale"}
                                        </strong>
                                      </div>
                                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                          Table d'examen
                                        </span>
                                        <strong className="text-xs font-bold text-slate-800 font-mono">
                                          Table N° {cand.tableNumber || "1"}
                                        </strong>
                                      </div>
                                    </div>

                                    {/* Matières programmées pour cette session */}
                                    <div className="space-y-1">
                                      <span className="text-[10px] uppercase font-bold text-slate-600 block">
                                        Matières programmées pour cet examen ({examSlots.length}) :
                                      </span>
                                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                                        {examSlots.map((slot, idx) => (
                                          <div
                                            key={slot.id || idx}
                                            className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-slate-200"
                                          >
                                            <span className="font-semibold text-slate-800 truncate mr-2">
                                              {slot.subject}
                                            </span>
                                            <span className="font-mono text-slate-500 text-[10px] shrink-0">
                                              {slot.date} ({slot.startTime} - {cand.accommodation && cand.accommodation !== "Aucun" && slot.tiersTempsEndTime ? `${slot.tiersTempsEndTime} +1/3` : slot.endTime})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {cand.accommodation && cand.accommodation !== "Aucun" && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold">
                                        <span>♿ {cand.accommodation} (+1/3 temps)</span>
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedExamForConvocation(exam);
                                        setSelectedStudentForConvocation(cand);
                                      }}
                                      className="w-full py-2 px-3 rounded-lg bg-[#002060] hover:bg-[#001746] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs group"
                                    >
                                      <Printer className="h-3.5 w-3.5 text-amber-300 group-hover:scale-110 transition" />
                                      <span>Télécharger ma convocation ({exam.title})</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Aucune session d'examen trouvée.
          </div>
        )}
      </section>

      {/* 6. RÈGLES & CONSIGNES OFFICIELLES */}
      <section className="w-full max-w-4xl rounded-2xl bg-white border border-slate-200 p-6 text-slate-700 text-left shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-700" />
            <span>Réglementation Officielle des Épreuves au LFJP</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-700" />
              <span>Ponctualité & Pièce d'Identité</span>
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Présentez-vous impérativement <strong>15 minutes avant le début</strong> de chaque épreuve avec votre convocation et votre pièce d'identité avec photo.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>Calculatrices & Téléphones</span>
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Le mode examen avec voyant lumineux clignotant est obligatoire si la calculatrice est autorisée. Tout smartphone ou montre connectée doit être totalement éteint dans le sac.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-purple-600" />
              <span>Aménagements Tiers-Temps</span>
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Les élèves bénéficiant d'aménagements (PAP / PPS / PAI) disposent d'horaires majorés (+1/3 de temps) et sont accueillis dans des salles spécifiques avec encadrement adapté.
            </p>
          </div>
        </div>
      </section>

      {/* 7. MODAL DE CONVOCATION OFFICIELLE TÉLÉCHARGEABLE / IMPRIMABLE */}
      {selectedStudentForConvocation && (
        <div
          id="convocation-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Modal Top Control Bar (Hidden on print) */}
            <div className="no-print bg-[#002060] text-white px-5 py-3 flex items-center justify-between border-b border-white/10">
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
                  onClick={() => window.print()}
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
              className="p-6 sm:p-8 bg-white text-slate-900 space-y-5 text-left"
            >
              {/* Institutional Header with Logo */}
              <div className="flex items-center justify-between border-b-2 border-[#002060] pb-3 gap-4">
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
                    Session {cmsData.siteInfo.schoolYear || "2025-2026"}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Convocation Officielle
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
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
              <div className="rounded-xl border border-slate-300 p-4 bg-slate-50/70 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Nom & Prénom
                    </span>
                    <strong className="text-sm font-black text-[#002060]">
                      {selectedStudentForConvocation.lastName.toUpperCase()}{" "}
                      {selectedStudentForConvocation.firstName}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Classe & Division
                    </span>
                    <strong className="text-sm font-bold text-slate-900">
                      {selectedStudentForConvocation.className}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      N° Anonymat / Candidat
                    </span>
                    <strong className="text-sm font-mono text-slate-900">
                      {selectedStudentForConvocation.anonymatNumber ||
                        `LFJP-${selectedStudentForConvocation.id.slice(-4)}`}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Salle d'examen assignée
                    </span>
                    <strong className="text-sm font-black text-[#002060]">
                      {selectedStudentForConvocation.roomName || "Salle principale"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Numéro de Table
                    </span>
                    <strong className="text-sm font-bold text-slate-900 font-mono">
                      Table N° {selectedStudentForConvocation.tableNumber || "1"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Régime d'Aménagement
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        selectedStudentForConvocation.accommodation &&
                        selectedStudentForConvocation.accommodation !== "Aucun"
                          ? "text-purple-700 font-black"
                          : "text-slate-700"
                      }`}
                    >
                      {selectedStudentForConvocation.accommodation &&
                      selectedStudentForConvocation.accommodation !== "Aucun"
                        ? `♿ ${selectedStudentForConvocation.accommodation} (+1/3 temps)`
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
                <div className="overflow-x-auto border border-slate-300 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#002060] text-white text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Date</th>
                        <th className="py-2.5 px-3 font-bold">Heure d'Appel</th>
                        <th className="py-2.5 px-3 font-bold">Épreuve / Discipline</th>
                        <th className="py-2.5 px-3 font-bold">Horaires (Début - Fin)</th>
                        <th className="py-2.5 px-3 font-bold">Salle</th>
                        <th className="py-2.5 px-3 font-bold">Matériel autorisé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {getCandidateSchedule(selectedStudentForConvocation, selectedExamForConvocation).map((slot, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {slot.date}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {slot.appel}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {slot.discipline}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-[#002060] whitespace-nowrap">
                            {slot.debut} - {slot.fin}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                            {slot.salle}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-600">
                            {slot.materiel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions and Rules */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1 leading-relaxed">
                <p className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">
                  Consignes Impératives aux Candidats :
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    Le candidat doit obligatoirement se présenter muni de la <strong>présente convocation</strong> et d'une <strong>pièce d'identité officielle avec photographie</strong>.
                  </li>
                  <li>
                    L'accès en salle est ouvert <strong>15 minutes avant le début</strong> de chaque épreuve. Tout retardataire ne pourra être admis après l'ouverture des enveloppes de sujets.
                  </li>
                  <li>
                    Pour les épreuves où la calculatrice est autorisée, seul le <strong>mode examen</strong> avec signal lumineux actif est strictement obligatoire.
                  </li>
                  <li>
                    Les téléphones portables et montres connectées doivent être <strong>éteints et rangés dans les sacs</strong> déposés à l'entrée de la salle.
                  </li>
                </ul>
              </div>

              {/* Signature Box */}
              <div className="flex justify-between items-end pt-3 border-t border-slate-200 text-xs">
                <div className="text-[11px] text-slate-400">
                  <p className="font-semibold text-slate-600">Lycée Français Jacques Prévert de Saly</p>
                  <p>Document officiel certifié • Session {cmsData.siteInfo.schoolYear || "2025-2026"}</p>
                </div>

                <div className="text-right space-y-4">
                  <p className="text-slate-600 text-xs">
                    Fait à Saly Portudal, le {new Date().toLocaleDateString("fr-FR")}
                  </p>
                  <div>
                    <p className="font-bold text-[#002060]">Le Chef d'Établissement / Proviseur</p>
                    <p className="text-[10px] text-slate-400 italic">Signature et cachet officiel du LFJP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print-specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #convocation-modal-backdrop,
          #convocation-modal-backdrop *,
          #printable-convocation-sheet,
          #printable-convocation-sheet * {
            visibility: visible !important;
          }
          #convocation-modal-backdrop {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          #printable-convocation-sheet {
            width: 100% !important;
            max-width: 100% !important;
            padding: 15mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </HomeLayout>
  );
}

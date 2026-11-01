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
} from "lucide-react";

import HomeHero from "../components/HomeHero";
import HomeLayout from "../components/HomeLayout";
import { useCmsData, type CmsExam, type CmsExamSlot } from "../../../shared/services/cms-store";

export default function HomePage() {
  const { data: cmsData } = useCmsData();

  // Search and filter state
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");

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

  // Candidate quick room locator
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
    <HomeLayout>
      {/* 1. Hero Header Centered */}
      <HomeHero
        logos={cmsData.siteInfo.logos}
        subtitle={cmsData.siteInfo.subtitle}
        title={cmsData.siteInfo.title}
        description={cmsData.siteInfo.description}
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

      {/* 4. RECHERCHE RAPIDE CANDIDAT (Trouver ma salle & ma table) */}
      <section className="w-full max-w-4xl rounded-2xl bg-slate-900 p-5 sm:p-6 text-white text-left shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-400" />
              <span>Trouver ma salle d'examen & mon numéro de table</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Saisissez votre nom ou votre classe pour afficher immédiatement votre salle et votre convocation.
            </p>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="Ex: Diop, Faye, 3ème A..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:outline-hidden transition"
            />
          </div>
        </div>

        {/* Results */}
        {studentSearchQuery.trim().length >= 2 && (
          <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
            {searchedStudents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                Aucun élève trouvé pour "{studentSearchQuery}".
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {searchedStudents.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3.5 rounded-xl bg-white text-slate-900 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">
                        {cand.lastName.toUpperCase()} {cand.firstName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {cand.className}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[11px] text-slate-600">Salle :</span>
                        <span className="font-bold text-blue-900 font-mono">
                          {cand.roomName || "Non définie"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-slate-600">Table & Anonymat :</span>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">
                          Table {cand.tableNumber || "1"} • {cand.anonymatNumber || "DNB"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-slate-600">Appel :</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {cand.convocationTime || "07h45"}
                        </span>
                      </div>
                    </div>

                    {cand.accommodation && cand.accommodation !== "Aucun" && (
                      <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold">
                        ♿ {cand.accommodation}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

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
    </HomeLayout>
  );
}

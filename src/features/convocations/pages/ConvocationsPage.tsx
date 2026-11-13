import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Printer,
  Search,
  GraduationCap,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  Info,
} from "lucide-react";
import {
  useCmsData,
  type CmsCandidate,
  type CmsExam,
  getExamTargetLevels,
  isCandidateMatchingLevel,
  isCandidateTiersTemps,
  getCandidateAssignmentForExam,
  getCandidateMatchingSlots,
  getCandidateSlotRoom,
} from "../../../shared/services/cms-store";

function computeCallTime15(startTime: string): string {
  if (!startTime || !startTime.includes(":")) return startTime || "07h45";
  const [hStr, mStr] = startTime.split(":");
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return startTime;
  m -= 15;
  if (m < 0) {
    m += 60;
    h -= 1;
  }
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}

function computeTTEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime || !startTime.includes(":")) return "";
  const [hStr, mStr] = startTime.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return "";
  const dur = durationMinutes > 0 ? durationMinutes : 60;
  const ttTotal = h * 60 + m + Math.round(dur * (4 / 3));
  return `${String(Math.floor(ttTotal / 60) % 24).padStart(2, "0")}h${String(ttTotal % 60).padStart(2, "0")}`;
}

type ViewMode = "candidat" | "classe_lot" | "enseignant" | "emargement";

export default function ConvocationsPage() {
  const { data: cmsData } = useCmsData();

  const [viewMode, setViewMode] = useState<ViewMode>("candidat");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>("all");
  const [selectedRoomName, setSelectedRoomName] = useState<string>("all");



  // Distinct classes
  const classesList = useMemo(() => {
    const set = new Set<string>();
    cmsData.candidates.forEach((c) => {
      if (c.className) set.add(c.className);
    });
    // Add common LFJP classes if empty
    if (set.size === 0) {
      return ["3ème A", "3ème B", "1ère G1", "1ère G2", "Terminale G1", "Terminale G2"];
    }
    return Array.from(set).sort();
  }, [cmsData.candidates]);

  // Distinct exams
  const examsList = useMemo(() => {
    const list = cmsData.exams.map((e) => e.title);
    return Array.from(new Set(list));
  }, [cmsData.exams]);

  // Distinct rooms
  const roomsList = useMemo(() => {
    const list = cmsData.rooms.map((r) => r.name);
    return Array.from(new Set(list));
  }, [cmsData.rooms]);

  const activeExamObj = useMemo<CmsExam | null>(() => {
    if (selectedExam === "all") return null;
    return (
      cmsData.exams.find((e) => e.title.trim().toLowerCase() === selectedExam.trim().toLowerCase()) ||
      null
    );
  }, [cmsData.exams, selectedExam]);

  const resolveExamForCandidate = useCallback(
    (cand: CmsCandidate): CmsExam | null => {
      if (activeExamObj) return activeExamObj;
      if (cand.examName) {
        const byName = cmsData.exams.find(
          (e) => e.title.trim().toLowerCase() === cand.examName?.trim().toLowerCase()
        );
        if (byName) return byName;
      }
      const byClass = cmsData.exams.find((e) =>
        isCandidateMatchingLevel(cand.className, getExamTargetLevels(e))
      );
      return byClass || cmsData.exams[0] || null;
    },
    [activeExamObj, cmsData.exams]
  );

  // Filtered candidates (respects exam, class, room when emargement, and search query)
  const filteredCandidates = useMemo(() => {
    return cmsData.candidates.filter((cand) => {
      const matchClass = selectedClass === "all" || cand.className === selectedClass;
      let matchExam = true;
      if (activeExamObj) {
        matchExam =
          Boolean(cand.assignmentsByExam?.[activeExamObj.id]) ||
          cand.examName?.trim().toLowerCase() === activeExamObj.title.trim().toLowerCase() ||
          isCandidateMatchingLevel(cand.className, getExamTargetLevels(activeExamObj));
      } else if (selectedExam !== "all") {
        matchExam =
          cand.examName?.toLowerCase().includes(selectedExam.toLowerCase()) ||
          cand.examName === selectedExam;
      }

      const resolvedExam = resolveExamForCandidate(cand);
      const assignment = getCandidateAssignmentForExam(
        cand,
        resolvedExam,
        cmsData.examSlots || [],
        cmsData.rooms
      );

      const matchRoom =
        viewMode !== "emargement" ||
        selectedRoomName === "all" ||
        assignment.roomName === selectedRoomName;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        cand.firstName.toLowerCase().includes(q) ||
        cand.lastName.toLowerCase().includes(q) ||
        assignment.roomName.toLowerCase().includes(q) ||
        cand.className.toLowerCase().includes(q);

      return matchClass && matchExam && matchRoom && matchQuery;
    });
  }, [cmsData.candidates, cmsData.examSlots, cmsData.rooms, selectedClass, selectedExam, activeExamObj, resolveExamForCandidate, selectedRoomName, viewMode, searchQuery]);

  // Selected candidate object (default to first matching)
  const currentCandidate = useMemo(() => {
    if (selectedCandidateId) {
      const found = filteredCandidates.find((c) => c.id === selectedCandidateId);
      if (found) return found;
    }
    return filteredCandidates[0] || null;
  }, [selectedCandidateId, filteredCandidates]);

  // Teacher surveillances (filtered by teacher and exam when selected)
  const teacherSurveillances = useMemo(() => {
    return cmsData.surveillances
      .filter((s) => {
        const matchTeacher =
          selectedTeacherName === "all" ||
          s.teacherName.toLowerCase().includes(selectedTeacherName.toLowerCase());
        const matchExam =
          selectedExam === "all" ||
          (s.examTitle || "").trim().toLowerCase() === selectedExam.trim().toLowerCase();
        return matchTeacher && matchExam;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
  }, [cmsData.surveillances, selectedTeacherName, selectedExam]);

  // Print triggered with personalized file naming for PDF download
  const handlePrint = () => {
    const prevTitle = document.title;
    if (viewMode === "candidat" && currentCandidate) {
      document.title = `Convocation_${currentCandidate.lastName.toUpperCase()}_${currentCandidate.firstName}_${currentCandidate.className}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    } else if (viewMode === "classe_lot") {
      document.title = `Convocations_Classe_${selectedClass}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    } else if (viewMode === "enseignant") {
      document.title = `Ordre_Mission_Surveillances_${selectedTeacherName}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    } else {
      document.title = `Emargement_LFJP_${selectedRoomName}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    }
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
  };

  // Real exam timetable strictly matching candidate's session, school level and optional specialty
  const getExamScheduleForCandidate = (cand: CmsCandidate) => {
    const isTT = isCandidateTiersTemps(cand);
    const resolvedExam = resolveExamForCandidate(cand);
    const assignment = getCandidateAssignmentForExam(
      cand,
      resolvedExam,
      cmsData.examSlots || [],
      cmsData.rooms
    );
    const matchingSlots = getCandidateMatchingSlots(
      cand,
      resolvedExam,
      cmsData.examSlots || []
    );

    return matchingSlots.map((slot) => {
      const endTimeDisplay = isTT
        ? slot.tiersTempsEndTime || computeTTEndTime(slot.startTime, slot.durationMinutes)
        : slot.endTime;
      const slotRoom = getCandidateSlotRoom(
        cand,
        resolvedExam,
        slot,
        cmsData.examSlots || [],
        cmsData.rooms
      );
      return {
        discipline: slot.targetSpecialty ? `${slot.subject} (${slot.targetSpecialty})` : slot.subject,
        date: slot.date,
        appel: computeCallTime15(slot.startTime),
        debut: slot.startTime,
        fin: isTT ? `${endTimeDisplay} (+1/3)` : endTimeDisplay,
        salle: slotRoom || "À attribuer",
        table: assignment.tableNumber ? `Table N° ${assignment.tableNumber}` : "Selon salle",
        materiel: slot.notes || "Matériel réglementaire",
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Top Bar for Navigation - Hidden on Print */}
      <header className="print:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="text-sm md:text-base font-bold text-slate-900">
                Portail Officiel des Convocations & Émargements
              </h1>
              <p className="text-[11px] text-slate-500">
                Lycée Français Jacques Prévert — Saly • Réseau AEFE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Administration CMS</span>
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer (A4)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mode Selector Tabs - Hidden on Print */}
      <div className="print:hidden bg-slate-50 border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setViewMode("candidat")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
              viewMode === "candidat"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Convocation Individuelle Élève</span>
          </button>

          <button
            onClick={() => setViewMode("classe_lot")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
              viewMode === "classe_lot"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tirage Groupé par Classe (Lot A4)</span>
          </button>

          <button
            onClick={() => setViewMode("enseignant")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
              viewMode === "enseignant"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ordres de Mission & Plannings Professeurs</span>
          </button>

          <button
            onClick={() => setViewMode("emargement")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
              viewMode === "emargement"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Feuilles d'Émargement par Salle</span>
          </button>
        </div>
      </div>

      {/* Filter Bar for Active Mode - Hidden on Print */}
      <div className="print:hidden max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center gap-3">
          {/* Session filter available across all views */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Session :</span>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[240px]"
            >
              <option value="all">Toutes les sessions</option>
              {examsList.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>

          {viewMode === "candidat" || viewMode === "classe_lot" ? (
            <>
              <div className="flex-1 min-w-[180px]">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, prénom, classe, salle…"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Classe :</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes ({cmsData.candidates.length} élèves)</option>
                  {classesList.map((cl) => (
                    <option key={cl} value={cl}>
                      {cl}
                    </option>
                  ))}
                </select>
              </div>

              {viewMode === "candidat" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Élève :</span>
                  <select
                    value={currentCandidate?.id || ""}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[220px]"
                  >
                    {filteredCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.lastName.toUpperCase()} {c.firstName} ({c.className})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : viewMode === "enseignant" ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Enseignant :</span>
                <select
                  value={selectedTeacherName}
                  onChange={(e) => setSelectedTeacherName(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tous les professeurs ({cmsData.teachers.length})</option>
                  {cmsData.teachers.map((t) => (
                    <option key={t.id} value={`${t.lastName}`}>
                      {t.civility === "Madame" ? "Mme" : "M."} {t.firstName} {t.lastName} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Salle :</span>
                <select
                  value={selectedRoomName}
                  onChange={(e) => setSelectedRoomName(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes les salles</option>
                  {roomsList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="ml-auto text-xs text-slate-400">
            {viewMode === "classe_lot"
              ? `${filteredCandidates.length} convocation(s) prête(s) à imprimer`
              : viewMode === "candidat"
              ? `Candidat sélectionné : ${currentCandidate?.lastName || ""} ${currentCandidate?.firstName || ""}`
              : viewMode === "enseignant"
              ? `${teacherSurveillances.length} créneau(x) assigné(s)`
              : `Émargement pour ${filteredCandidates.length} élève(s)`}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pb-16 print:p-0 print:max-w-none print:w-full">
        {/* VIEW MODE 1: SINGLE CANDIDATE OFFICIAL CONVOCATION */}
        {viewMode === "candidat" && (
          <div>
            {currentCandidate ? (() => {
              const resolvedExam = resolveExamForCandidate(currentCandidate);
              const candAssign = getCandidateAssignmentForExam(
                currentCandidate,
                resolvedExam,
                cmsData.examSlots || [],
                cmsData.rooms
              );
              return (
                <CandidateConvocationSheet
                  candidate={currentCandidate}
                  resolvedExam={resolvedExam}
                  assignment={candAssign}
                  schedule={getExamScheduleForCandidate(currentCandidate)}
                  schoolYear={cmsData.siteInfo.schoolYear || "2026-2027"}
                />
              );
            })() : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700">Aucun candidat correspondant</p>
                <p className="text-xs text-slate-400 mt-1">
                  Vérifiez vos critères de recherche ou ajoutez des candidats depuis le panneau administration.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: BATCH PRINT ALL CANDIDATES IN CLASS */}
        {viewMode === "classe_lot" && (
          <div className="space-y-8">
            <div className="print:hidden bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Mode Impression par Lot (Format A4)</p>
                <p className="mt-0.5">
                  Chaque convocation est automatiquement mise en page pour remplir exactement une page A4 avec saut de page automatique lors de l&apos;impression. Cliquez sur le bouton &quot;Imprimer (A4)&quot; en haut pour lancer l&apos;impression de tout le paquet.
                </p>
              </div>
            </div>

            {filteredCandidates.map((cand, idx) => {
              const resolvedExam = resolveExamForCandidate(cand);
              const candAssign = getCandidateAssignmentForExam(
                cand,
                resolvedExam,
                cmsData.examSlots || [],
                cmsData.rooms
              );
              return (
                <div key={cand.id} className="print:break-after-page mb-8 print:mb-0">
                  <CandidateConvocationSheet
                    candidate={cand}
                    resolvedExam={resolvedExam}
                    assignment={candAssign}
                    schedule={getExamScheduleForCandidate(cand)}
                    schoolYear={cmsData.siteInfo.schoolYear || "2026-2027"}
                    batchIndex={idx + 1}
                    batchTotal={filteredCandidates.length}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW MODE 3: TEACHER SURVEILLANCES & MISSION ORDERS */}
        {viewMode === "enseignant" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs print:shadow-none print:border-none print:p-0 print:w-full">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between gap-3 print-avoid-break">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  RÉPUBLIQUE FRANÇAISE • MINISTÈRE DE L&apos;ÉDUCATION NATIONALE
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  LYCÉE FRANÇAIS JACQUES PRÉVERT — SALY (SÉNÉGAL)
                </p>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  ORDRE DE MISSION &amp; PLANNING DE SURVEILLANCE
                </h2>
                <p className="text-xs text-slate-500">
                  Année scolaire {cmsData.siteInfo.schoolYear || "2026-2027"}
                  {selectedExam !== "all" ? ` • Session : ${selectedExam}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300">
                  DOCUMENT OFFICIEL
                </span>
              </div>
            </div>

            {/* Teacher Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 flex flex-wrap items-center justify-between gap-4 text-xs print-avoid-break">
              <div>
                <p className="text-slate-500 uppercase font-semibold text-[10px]">Enseignant concerné</p>
                <p className="text-sm font-bold text-slate-900">
                  {selectedTeacherName === "all" ? "Tous les enseignants" : selectedTeacherName}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold text-[10px]">Nombre de créneaux</p>
                <p className="text-sm font-bold text-indigo-600">{teacherSurveillances.length} surveillance(s)</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold text-[10px]">Session</p>
                <p className="text-sm font-bold text-slate-800">
                  {selectedExam === "all" ? `Année ${cmsData.siteInfo.schoolYear || "2026-2027"}` : selectedExam}
                </p>
              </div>
            </div>

            {/* Surveillances Table */}
            <div className="print-table-wrap">
              <table className="print-a4-table w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Date</th>
                    <th className="p-2 border-r border-slate-300">Horaire</th>
                    <th className="p-2 border-r border-slate-300">Examen &amp; Épreuve</th>
                    <th className="p-2 border-r border-slate-300">Professeur</th>
                    <th className="p-2 border-r border-slate-300">Salle</th>
                    <th className="p-2">Rôle / Mission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {teacherSurveillances.map((s) => {
                    const matchingSlot = (cmsData.examSlots || []).find(
                      (sl) =>
                        sl.id === s.slotId ||
                        (sl.date === s.date &&
                          sl.examTitle.trim().toLowerCase() === s.examTitle.trim().toLowerCase())
                    );
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-2 font-medium border-r border-slate-200 whitespace-nowrap">{s.date}</td>
                        <td className="p-2 font-semibold text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                          {s.timeSlot}
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-semibold text-slate-900">{matchingSlot?.subject || "Épreuve écrite"}</div>
                          <div className="text-[10px] text-slate-500">{s.examTitle}</div>
                        </td>
                        <td className="p-2 font-medium border-r border-slate-200">{s.teacherName}</td>
                        <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">{s.roomName}</td>
                        <td className="p-2 text-slate-600">{s.mission || "Surveillance principale"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Instructions */}
            <div className="mt-8 border-t border-slate-200 pt-4 text-[11px] text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-900">Consignes importantes aux surveillants :</p>
              <p>• Veuillez vous présenter au secrétariat des examens 15 minutes avant le début de l'épreuve pour récupérer l'enveloppe des sujets et les listes d'émargement.</p>
              <p>• Procédez au contrôle scrupuleux de l'identité des candidats et vérifiez qu'aucun téléphone ou montre connectée n'est conservé par un élève.</p>
              <p>• En cas d'absence d'un candidat, mentionnez "ABSENT" en rouge sur la feuille d'émargement.</p>
              <p>• À la fin de l'épreuve, recomptez les copies avant d'autoriser les élèves à quitter la salle, puis rapportez l'enveloppe scellée au secrétariat.</p>
            </div>

            {/* Signatures */}
            <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-300 pt-3">
                <p className="font-semibold text-slate-700">L'Enseignant(e)</p>
                <p className="text-[10px] text-slate-400 mt-1">Date et signature</p>
                <div className="h-16" />
              </div>
              <div className="border-t border-slate-300 pt-3">
                <p className="font-semibold text-slate-700">Pour le Chef d'Établissement</p>
                <p className="text-[10px] text-slate-400 mt-1">Le Proviseur du LFJP</p>
                <div className="h-16" />
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 4: ROOM ATTENDANCE / ÉMARGEMENT SHEET */}
        {viewMode === "emargement" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs print:shadow-none print:border-none print:p-0 print:w-full">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between gap-3 print-avoid-break">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  RÉPUBLIQUE FRANÇAISE • AEFE • LYCÉE FRANÇAIS JACQUES PRÉVERT
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  FEUILLE D&apos;ÉMARGEMENT ET DE PRÉSENCE DES CANDIDATS
                </h2>
                <p className="text-xs text-slate-500">
                  Examen : {selectedExam === "all" ? "Toutes épreuves" : selectedExam} • Salle :{" "}
                  <span className="font-bold text-slate-900">{selectedRoomName === "all" ? "Toutes" : selectedRoomName}</span>
                </p>
              </div>
              <div className="text-right text-xs shrink-0">
                <p className="font-bold text-slate-900">Total inscrits : {filteredCandidates.length}</p>
                <p className="text-slate-500">Session {cmsData.siteInfo.schoolYear || "2026-2027"}</p>
              </div>
            </div>

            {/* Candidates attendance table */}
            <div className="print-table-wrap">
              <table className="print-a4-table w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-12 text-center">Place</th>
                    <th className="p-2 border-r border-slate-300">Nom du Candidat</th>
                    <th className="p-2 border-r border-slate-300">Prénom</th>
                    <th className="p-2 border-r border-slate-300 w-24">Classe</th>
                    <th className="p-2 border-r border-slate-300 w-24">Aménag.</th>
                    <th className="p-2 border-r border-slate-300 w-16 text-center">Identité</th>
                    <th className="p-2 w-36 text-center">Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCandidates.map((cand, idx) => {
                    const resolvedExam = resolveExamForCandidate(cand);
                    const assign = getCandidateAssignmentForExam(
                      cand,
                      resolvedExam,
                      cmsData.examSlots || [],
                      cmsData.rooms
                    );
                    return (
                      <tr key={cand.id} className="h-10">
                        <td className="p-2 text-center font-bold text-slate-700 border-r border-slate-200">
                          {assign.tableNumber || String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-200 uppercase">
                          {cand.lastName}
                        </td>
                        <td className="p-2 font-medium text-slate-700 border-r border-slate-200">
                          {cand.firstName}
                        </td>
                        <td className="p-2 font-semibold text-indigo-700 border-r border-slate-200">
                          {cand.className}
                        </td>
                        <td className="p-2 text-[10px] text-slate-600 border-r border-slate-200">
                          {cand.accommodation || "Standard"}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          <div className="w-4 h-4 border border-slate-400 mx-auto rounded-xs" />
                        </td>
                        <td className="p-2 text-center border-slate-200">
                          <div className="h-6" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Box */}
            <div className="mt-8 grid grid-cols-3 gap-4 border border-slate-300 rounded-lg p-3 text-xs bg-slate-50">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Nombre d'inscrits</p>
                <p className="text-base font-bold text-slate-900">{filteredCandidates.length}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Nombre de présents</p>
                <p className="text-base font-bold text-emerald-600">__________</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Nombre d'absents</p>
                <p className="text-base font-bold text-rose-600">__________</p>
              </div>
            </div>

            {/* Surveillance validation */}
            <div className="mt-8 border-t border-slate-300 pt-4 flex items-start justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-800">Nom & Signature du surveillant principal :</p>
                <div className="h-16 w-64 border-b border-dashed border-slate-300 mt-2" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Nom & Signature du second surveillant :</p>
                <div className="h-16 w-64 border-b border-dashed border-slate-300 mt-2" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Subcomponent: Individual Official Candidate Convocation Sheet (A4 layout)
interface CandidateConvocationSheetProps {
  candidate: CmsCandidate;
  resolvedExam?: CmsExam | null;
  assignment: { roomName: string; tableNumber: string; anonymatNumber: string };
  schedule: Array<{
    discipline: string;
    date: string;
    appel: string;
    debut: string;
    fin: string;
    salle: string;
    table: string;
    materiel: string;
  }>;
  schoolYear: string;
  batchIndex?: number;
  batchTotal?: number;
}

function CandidateConvocationSheet({
  candidate,
  resolvedExam,
  assignment,
  schedule,
  schoolYear,
  batchIndex,
  batchTotal,
}: CandidateConvocationSheetProps) {
  const isTiersTemps = isCandidateTiersTemps(candidate);
  const uniqueScheduleRooms = Array.from(
    new Set(schedule.map((s) => s.salle).filter((r) => r && r !== "À attribuer"))
  );
  const primaryRoom =
    assignment.roomName || (uniqueScheduleRooms.length === 1 ? uniqueScheduleRooms[0] : "");

  return (
    <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-xs print:shadow-none print:border-none print:p-0 print:m-0 print:w-full text-slate-900 text-xs font-sans">
      {/* Official Header */}
      <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-3 print-avoid-break">
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-600">
            RÉPUBLIQUE FRANÇAISE
          </p>
          <p className="text-[10px] font-semibold tracking-wide text-slate-500">
            MINISTÈRE DE L&apos;ÉDUCATION NATIONALE
          </p>
          <p className="text-[10px] font-semibold text-indigo-900">
            AGENCE POUR L&apos;ENSEIGNEMENT FRANÇAIS À L&apos;ÉTRANGER (AEFE)
          </p>
          <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
            LYCÉE FRANÇAIS JACQUES PRÉVERT — SALY (SÉNÉGAL)
          </h2>
          <p className="text-[10px] text-slate-500">Code Établissement AEFE : 332001A</p>
        </div>

        <div className="text-right flex flex-col items-end shrink-0">
          <div className="border border-slate-800 px-3 py-1 rounded bg-slate-50 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-500">Document Officiel</p>
            <p className="text-xs font-black text-slate-900">CONVOCATION AUX ÉPREUVES</p>
            <p className="text-[10px] font-semibold text-slate-600">Session {schoolYear}</p>
          </div>
          {batchIndex && batchTotal && (
            <p className="text-[10px] text-slate-400 mt-1 print:hidden">
              Page {batchIndex} sur {batchTotal}
            </p>
          )}
        </div>
      </div>

      {/* Candidate Identification Box */}
      <div className="my-4 border border-slate-300 rounded-xl p-4 bg-slate-50/60 print-avoid-break">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Nom &amp; Prénom</p>
            <p className="text-sm font-extrabold text-slate-900 uppercase">
              {candidate.lastName} {candidate.firstName}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Classe</p>
            <p className="text-sm font-bold text-indigo-700">{candidate.className}</p>
            {candidate.specialty && (
              <p className="text-[10px] text-slate-600 font-medium">{candidate.specialty}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">N° Candidat / Anonymat</p>
            <p className="text-sm font-mono font-bold text-slate-900">
              {assignment.anonymatNumber || `LFJP-${(candidate.id.replace(/\D/g, "") || "101").padStart(4, "0")}`}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Régime / Aménagement</p>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                isTiersTemps
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
              }`}
            >
              {candidate.accommodation || "Régime Standard"}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div>
            <span className="font-semibold">Examen : </span>
            <span className="font-bold text-slate-900">
              {resolvedExam?.title || candidate.examName || "Examen Blanc"}
            </span>
            {resolvedExam?.period ? ` (${resolvedExam.period})` : ""}
          </div>
          {(primaryRoom || assignment.tableNumber) && (
            <div>
              <span className="font-semibold">
                {primaryRoom ? "Salle & Place : " : "Place attribuée : "}
              </span>
              <span className="font-bold text-[#002060]">
                {primaryRoom}
                {assignment.tableNumber
                  ? primaryRoom
                    ? ` (Table ${assignment.tableNumber})`
                    : `Table N° ${assignment.tableNumber}`
                  : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timetable Table */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>Calendrier et Horaires des Épreuves</span>
        </p>
        <div className="print-table-wrap">
          <table className="print-a4-table w-full text-left border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                <th className="p-2 border-r border-slate-300">Date</th>
                <th className="p-2 border-r border-slate-300 text-center">Appel</th>
                <th className="p-2 border-r border-slate-300 text-center">Épreuve</th>
                <th className="p-2 border-r border-slate-300">Matière / Discipline</th>
                <th className="p-2 border-r border-slate-300">Salle</th>
                <th className="p-2 border-r border-slate-300">Place</th>
                <th className="p-2">Matériel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {schedule.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-3 text-center text-slate-500 italic">
                    Aucune épreuve programmée pour votre niveau ({candidate.className}) sur cette session.
                  </td>
                </tr>
              ) : (
                schedule.map((slot, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2 font-semibold border-r border-slate-200 whitespace-nowrap">{slot.date}</td>
                    <td className="p-2 text-center font-bold text-rose-700 border-r border-slate-200 whitespace-nowrap">
                      {slot.appel}
                    </td>
                    <td className="p-2 text-center font-mono font-medium border-r border-slate-200 whitespace-nowrap">
                      {slot.debut} - {slot.fin}
                    </td>
                    <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{slot.discipline}</td>
                    <td className="p-2 font-semibold text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                      {slot.salle}
                    </td>
                    <td className="p-2 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                      {slot.table}
                    </td>
                    <td className="p-2 text-[10px] text-slate-500">{slot.materiel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Instructions */}
      <div className="border border-slate-300 rounded-xl p-3 bg-amber-50/50 mb-4 text-[10px] text-slate-700 space-y-1 leading-relaxed print-avoid-break">
        <p className="font-bold text-amber-950 uppercase flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          <span>Consignes Réglementaires Impératives aux Candidats</span>
        </p>
        <p>
          <strong>1. Présentation obligatoire :</strong> Vous devez impérativement vous présenter à l&apos;heure d&apos;appel indiquée (15 minutes avant le début des épreuves), muni(e) de la présente convocation et d&apos;une pièce d&apos;identité officielle avec photographie récente (carte d&apos;identité, passeport ou carnet de correspondance).
        </p>
        <p>
          <strong>2. Appareils électroniques strictement interdits :</strong> Les téléphones portables, montres connectées, écouteurs et tout dispositif connecté doivent être éteints dès l&apos;entrée dans le centre et rangés au fond du sac. Toute possession d&apos;un appareil connecté en cours d&apos;épreuve est assimilée à une tentative de fraude.
        </p>
        <p>
          <strong>3. Retards :</strong> Aucun candidat ne sera admis en salle après l&apos;ouverture des enveloppes de sujets au-delà d&apos;un délai d&apos;une heure. Aucun temps supplémentaire ne sera accordé pour compenser un retard.
        </p>
        <p>
          <strong>4. Aménagements 1/3 Temps :</strong> Pour les élèves bénéficiant d&apos;un aménagement horaire validé par la commission médicale, les horaires de fin d&apos;épreuve tiennent compte de la majoration d&apos;un tiers temps (+33%).
        </p>
      </div>

      {/* Official Signature and Stamp Box */}
      <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-300 text-xs print-avoid-break">
        <div>
          <p className="text-[10px] text-slate-500">Fait à Saly, le {new Date().toLocaleDateString("fr-FR")}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Signature de l&apos;élève ou du responsable légal :</p>
          <div className="h-14" />
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900">Le Proviseur du LFJP Saly</p>
          <p className="text-[10px] text-slate-500">Cachet de l&apos;établissement</p>
          <div className="h-14 flex items-center justify-end">
            <div className="w-24 h-12 border-2 border-indigo-900/30 rounded-lg flex items-center justify-center text-[9px] font-bold text-indigo-900/40 uppercase tracking-widest rotate-[-6deg]">
              SCEAU LFJP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

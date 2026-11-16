import React, { useState, useMemo, useCallback } from "react";
import {
  Printer,
  Mail,
  GraduationCap,
  Award,
  Clock,
  School,
  CheckCircle,
  Tag,
  Search,
  Filter,
  Calendar,
  Layers,
} from "lucide-react";
import type {
  CmsCandidate,
  CmsTeacher,
  CmsSurveillance,
  CmsExam,
  CmsExamSlot,
  CmsRoom,
  SiteInfo,
} from "../../../shared/services/cms-store";
import {
  isCandidateMatchingLevel,
  getExamTargetLevels,
  formatTargetLevelsSummary,
  isCandidateTiersTemps,
  getCandidateAssignmentForExam,
  getCandidateMatchingSlots,
  getCandidateAssignmentForSlot,
  summarizeCandidateConvocationLocation,
  formatConvocationRoomAndTable,
  formatConvocationTableNumber,
  consolidateTeacherSurveillances,
  isRenfortSurveillance,
  cleanSupervisorName,
  formatSupervisorMissionLabel,
  isRoomMarkedTiersTemps,
  computeTiersTempsEndTimeColon,
} from "../../../shared/services/cms-store";

// Helper to compute Tiers-Temps end time (+1/3 time)
function calcTTEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime || !startTime.includes(":")) return "";
  const [hStr, mStr] = startTime.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return "";
  const duration = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;
  const ttDuration = Math.round(duration * (4 / 3));
  const totalMin = h * 60 + m + ttDuration;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, "0")}h${String(endM).padStart(2, "0")}`;
}

interface ConvocElevesSectionProps {
  candidates: CmsCandidate[];
  siteInfo: SiteInfo;
  exams?: CmsExam[];
  examSlots?: CmsExamSlot[];
  rooms?: CmsRoom[];
}

export function ConvocElevesSection({
  candidates,
  siteInfo,
  exams = [],
  examSlots = [],
  rooms = [],
}: ConvocElevesSectionProps) {
  const [printMode, setPrintMode] = useState<"convocation" | "etiquettes">("convocation");
  const [filterScope, setFilterScope] = useState<"single" | "room" | "class" | "all">("single");
  const [selectedExamTitle, setSelectedExamTitle] = useState<string>(() => {
    return exams.length > 0 ? exams[0].title : "all";
  });
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || "");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  // Cascade filters specifically for A4 Table Labels (Planche d'Étiquettes)
  const [labelDateFilter, setLabelDateFilter] = useState<string>("all");
  const [labelSlotFilter, setLabelSlotFilter] = useState<string>("all");
  const [labelRoomFilter, setLabelRoomFilter] = useState<string>("all");

  const activeExam = useMemo(() => {
    if (!exams || exams.length === 0 || selectedExamTitle === "all") return null;
    return (
      exams.find((e) => e.title.trim().toLowerCase() === selectedExamTitle.trim().toLowerCase()) ||
      null
    );
  }, [exams, selectedExamTitle]);

  const resolveExamForCandidate = useCallback(
    (candidate: CmsCandidate): CmsExam | null => {
      if (activeExam) return activeExam;
      if (candidate.examName) {
        const match = exams.find(
          (e) => e.title.trim().toLowerCase() === candidate.examName?.trim().toLowerCase()
        );
        if (match) return match;
      }
      const byClass = exams.find((e) =>
        isCandidateMatchingLevel(candidate.className, getExamTargetLevels(e))
      );
      return byClass || exams[0] || null;
    },
    [activeExam, exams]
  );

  // Candidates filtered by selected exam (multi-level & per-exam aware)
  const candidatesFilteredByExam = useMemo(() => {
    if (!activeExam) return candidates;
    const targetLevels = getExamTargetLevels(activeExam);
    return candidates.filter((c) => {
      if (c.assignmentsByExam?.[activeExam.id]) return true;
      if (c.examName && c.examName.trim().toLowerCase() === activeExam.title.trim().toLowerCase()) {
        return true;
      }
      return isCandidateMatchingLevel(c.className, targetLevels);
    });
  }, [candidates, activeExam]);

  // Helper to get effective room for a candidate in the active/resolved exam
  const getCandidateRoomInScope = useCallback(
    (candidate: CmsCandidate): string => {
      const exam = resolveExamForCandidate(candidate);
      return getCandidateAssignmentForExam(candidate, exam, examSlots, rooms).roomName;
    },
    [resolveExamForCandidate, examSlots, rooms]
  );

  // Distinct rooms from candidates (for selected exam)
  const distinctRooms = useMemo(() => {
    const set = new Set<string>();
    candidatesFilteredByExam.forEach((c) => {
      const rm = getCandidateRoomInScope(c);
      if (rm) set.add(rm);
    });
    return Array.from(set).sort();
  }, [candidatesFilteredByExam, getCandidateRoomInScope]);

  // Distinct classes from candidates
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    candidatesFilteredByExam.forEach((c) => {
      if (c.className) set.add(c.className);
    });
    return Array.from(set).sort();
  }, [candidatesFilteredByExam]);

  // Target candidates to print based on selective filter
  const candidatesToPrint = useMemo(() => {
    const base = candidatesFilteredByExam;
    if (filterScope === "single") {
      const c = base.find((cand) => cand.id === selectedCandidateId) || base[0];
      return c ? [c] : [];
    }
    if (filterScope === "room") {
      if (selectedRoomFilter === "all") return base;
      return base.filter((c) => getCandidateRoomInScope(c) === selectedRoomFilter);
    }
    if (filterScope === "class") {
      if (selectedClassFilter === "all") return base;
      return base.filter((c) => c.className === selectedClassFilter);
    }
    return base;
  }, [candidatesFilteredByExam, filterScope, selectedCandidateId, selectedRoomFilter, selectedClassFilter, getCandidateRoomInScope]);

  // Slots scoped to selected exam for Table Labels cascade
  const slotsInExam = useMemo(() => {
    const base = !activeExam
      ? examSlots
      : examSlots.filter((s) => {
          const titleNorm = activeExam.title.trim().toLowerCase();
          return s.examId === activeExam.id || (s.examTitle || "").trim().toLowerCase() === titleNorm;
        });
    return [...base].sort(
      (a, b) => (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || "")
    );
  }, [examSlots, activeExam]);

  const labelDistinctDates = useMemo(() => {
    return Array.from(new Set(slotsInExam.map((s) => s.date).filter(Boolean))).sort();
  }, [slotsInExam]);

  const labelDateSlots = useMemo(() => {
    if (labelDateFilter === "all") return slotsInExam;
    return slotsInExam.filter((s) => s.date === labelDateFilter);
  }, [slotsInExam, labelDateFilter]);

  const selectedLabelSlotObj = useMemo(() => {
    if (labelSlotFilter === "all") return null;
    return labelDateSlots.find((s) => s.id === labelSlotFilter) || null;
  }, [labelDateSlots, labelSlotFilter]);

  interface ResolvedTableLabelItem {
    key: string;
    candidate: CmsCandidate;
    roomName: string;
    tableNumber: string;
    tableSortNum: number;
    anonymatNumber: string;
    subjectLabel: string;
    dateLabel: string;
    timeLabel: string;
    isTT: boolean;
  }

  const allLabelItemsBeforeRoomFilter = useMemo<ResolvedTableLabelItem[]>(() => {
    const items: ResolvedTableLabelItem[] = [];
    const seenKeys = new Set<string>();

    const buildFromSlot = (cand: CmsCandidate, examObj: CmsExam | null, slot: CmsExamSlot) => {
      const assign = getCandidateAssignmentForSlot(cand, examObj, slot, examSlots, rooms);
      const roomName = assign.roomName || "";
      if (!roomName) return;
      const key = `${cand.id}::${slot.id}::${roomName}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const roomObj = rooms.find((r) => r.name.trim().toLowerCase() === roomName.trim().toLowerCase());
      const isCandTT = isCandidateTiersTemps(cand);
      const isRoomTT = roomObj ? isRoomMarkedTiersTemps(roomObj, [slot], examObj) : false;
      const isTT = isCandTT || isRoomTT;
      const ttEnd = computeTiersTempsEndTimeColon(slot.startTime, slot.durationMinutes, slot.tiersTempsEndTime);
      const timeLabel = isTT && ttEnd ? `${slot.startTime} – ${ttEnd} (+1/3)` : `${slot.startTime} – ${slot.endTime}`;
      const tbl = assign.tableNumber || "";
      items.push({
        key,
        candidate: cand,
        roomName,
        tableNumber: tbl,
        tableSortNum: parseInt(tbl || "9999", 10) || 9999,
        anonymatNumber: assign.anonymatNumber || cand.anonymatNumber || "",
        subjectLabel: slot.targetSpecialty ? `${slot.subject} (${slot.targetSpecialty})` : slot.subject,
        dateLabel: slot.date || "",
        timeLabel,
        isTT,
      });
    };

    if (selectedLabelSlotObj) {
      candidatesFilteredByExam.forEach((cand) => {
        const examObj = resolveExamForCandidate(cand);
        const directSlotAssign = cand.assignmentsBySlot?.[selectedLabelSlotObj.id];
        if (directSlotAssign?.roomName) {
          buildFromSlot(cand, examObj, selectedLabelSlotObj);
        } else {
          const matched = getCandidateMatchingSlots(cand, examObj, [selectedLabelSlotObj]);
          if (matched.length > 0) {
            buildFromSlot(cand, examObj, selectedLabelSlotObj);
          }
        }
      });
    } else if (labelDateFilter !== "all" && labelDateSlots.length > 0) {
      candidatesFilteredByExam.forEach((cand) => {
        const examObj = resolveExamForCandidate(cand);
        labelDateSlots.forEach((slot) => {
          if (cand.assignmentsBySlot?.[slot.id]?.roomName) {
            buildFromSlot(cand, examObj, slot);
          }
        });
      });
      // Fallback if no per-slot assignments saved yet on that date
      if (items.length === 0) {
        candidatesFilteredByExam.forEach((cand) => {
          const examObj = resolveExamForCandidate(cand);
          const matched = getCandidateMatchingSlots(cand, examObj, labelDateSlots);
          if (matched.length > 0) {
            buildFromSlot(cand, examObj, matched[0]);
          }
        });
      }
    } else {
      candidatesFilteredByExam.forEach((cand, idx) => {
        const examObj = resolveExamForCandidate(cand);
        const examAssign = getCandidateAssignmentForExam(cand, examObj, examSlots, rooms);
        const matched = getCandidateMatchingSlots(cand, examObj, examSlots);
        const firstSlot = matched[0] || slotsInExam[0] || null;
        const roomName = examAssign.roomName || "Salle non affectée";
        const roomObj = rooms.find((r) => r.name.trim().toLowerCase() === roomName.trim().toLowerCase());
        const isTT = isCandidateTiersTemps(cand) || (roomObj ? isRoomMarkedTiersTemps(roomObj, matched, examObj) : false);
        const ttEnd = firstSlot
          ? computeTiersTempsEndTimeColon(firstSlot.startTime, firstSlot.durationMinutes, firstSlot.tiersTempsEndTime)
          : "";
        const timeLabel = firstSlot
          ? isTT && ttEnd
            ? `${firstSlot.startTime} – ${ttEnd} (+1/3)`
            : `${firstSlot.startTime} – ${firstSlot.endTime}`
          : "";
        const tbl = examAssign.tableNumber || String(idx + 1);
        items.push({
          key: `${cand.id}::overview`,
          candidate: cand,
          roomName,
          tableNumber: tbl,
          tableSortNum: parseInt(tbl || "9999", 10) || 9999,
          anonymatNumber: examAssign.anonymatNumber || `LFJP-${String(idx + 101).padStart(4, "0")}`,
          subjectLabel: firstSlot
            ? firstSlot.targetSpecialty
              ? `${firstSlot.subject} (${firstSlot.targetSpecialty})`
              : firstSlot.subject
            : examObj?.title || "Examen Blanc",
          dateLabel: firstSlot?.date || examObj?.period || "",
          timeLabel,
          isTT,
        });
      });
    }

    return items.sort((a, b) => {
      const rCmp = a.roomName.localeCompare(b.roomName);
      if (rCmp !== 0) return rCmp;
      if (a.tableSortNum !== b.tableSortNum) return a.tableSortNum - b.tableSortNum;
      return a.candidate.lastName.localeCompare(b.candidate.lastName);
    });
  }, [
    selectedLabelSlotObj,
    labelDateFilter,
    labelDateSlots,
    candidatesFilteredByExam,
    resolveExamForCandidate,
    examSlots,
    rooms,
    slotsInExam,
  ]);

  const labelDistinctRooms = useMemo(() => {
    return Array.from(new Set(allLabelItemsBeforeRoomFilter.map((i) => i.roomName).filter(Boolean))).sort();
  }, [allLabelItemsBeforeRoomFilter]);

  const labelItemsGroupedByRoom = useMemo(() => {
    const filtered =
      labelRoomFilter === "all"
        ? allLabelItemsBeforeRoomFilter
        : allLabelItemsBeforeRoomFilter.filter((i) => i.roomName === labelRoomFilter);

    const groups = new Map<string, ResolvedTableLabelItem[]>();
    filtered.forEach((item) => {
      const key = item.roomName || "Salle non affectée";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return Array.from(groups.entries());
  }, [allLabelItemsBeforeRoomFilter, labelRoomFilter]);

  const totalLabelCardsCount = useMemo(
    () => labelItemsGroupedByRoom.reduce((acc, [, list]) => acc + list.length, 0),
    [labelItemsGroupedByRoom]
  );

  const handlePrint = (singleCand?: CmsCandidate) => {
    const cand = singleCand || candidatesToPrint[0];
    const prevTitle = document.title;
    if (printMode === "etiquettes") {
      document.title = `Etiquettes_Table_${labelRoomFilter === "all" ? "Toutes_Salles" : labelRoomFilter}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    } else if (cand) {
      document.title = `Convocation_${cand.lastName.toUpperCase()}_${cand.firstName}_${cand.className}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    } else {
      document.title = `Convocations_Officielles_LFJP`;
    }
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
              Documents Officiels
            </span>
            <span className="text-xs text-slate-500">
              Impression ciblée : Convocations conformes & Étiquettes
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            🎓 Convocations des Candidats & Étiquettes de Table
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Génération conforme au calendrier d&apos;épreuves de chaque examen, avec horaires d&apos;épreuves, créneaux adaptés (tiers-temps) et affectations de salles.
          </p>
        </div>

        <button
          onClick={() => handlePrint()}
          className="px-5 py-2.5 rounded-xl bg-[#0F2A56] hover:bg-[#1D4ED8] text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>
            {printMode === "etiquettes"
              ? `Imprimer la planche (${totalLabelCardsCount} étiquettes)`
              : `Imprimer la sélection (${candidatesToPrint.length})`}
          </span>
        </button>
      </div>

      {/* Selective Filters Bar (hidden on print) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3 print:hidden">
        {/* Top bar with Exam Filter and Print Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Exam Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Examen de rattachement :</span>
            </span>
            <select
              value={selectedExamTitle}
              onChange={(e) => setSelectedExamTitle(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tous les examens ({candidates.length} élèves)</option>
              {exams.map((ex) => {
                const levels = getExamTargetLevels(ex);
                const count = candidates.filter(
                  (c) =>
                    Boolean(c.assignmentsByExam?.[ex.id]) ||
                    (c.examName && c.examName.trim().toLowerCase() === ex.title.trim().toLowerCase()) ||
                    isCandidateMatchingLevel(c.className, levels)
                ).length;
                return (
                  <option key={ex.id} value={ex.title}>
                    {ex.title} ({formatTargetLevelsSummary(levels)} • {count} élèves)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintMode("convocation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                printMode === "convocation"
                  ? "bg-[#3498db] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              📄 Convocations Nominatives
            </button>
            <button
              onClick={() => setPrintMode("etiquettes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                printMode === "etiquettes"
                  ? "bg-[#3498db] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🏷️ Planche d'Étiquettes de Table
            </button>
          </div>
        </div>

        {/* Scope Radio Tabs (Convocations mode) OR Cascade Selectors (Étiquettes A4 mode) */}
        {printMode === "convocation" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
                <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  <span>Périmètre :</span>
                </span>
                {[
                  { id: "single", label: "Élève unique" },
                  { id: "room", label: "Par salle" },
                  { id: "class", label: "Par classe" },
                  { id: "all", label: "Tous les élèves ciblés" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterScope(tab.id as any)}
                    className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                      filterScope === tab.id
                        ? "bg-white text-[#0F2A56] shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-500 font-medium tabular-nums">
                Impression ciblée de <strong className="text-[#0F2A56]">{candidatesToPrint.length}</strong> document(s)
              </div>
            </div>

            {/* Dynamic Secondary Filter */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
              {filterScope === "single" && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Candidat :</span>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white max-w-sm font-medium"
                  >
                    {candidatesFilteredByExam.map((c) => {
                      const rm = getCandidateRoomInScope(c);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.lastName.toUpperCase()} {c.firstName} ({c.className} • {rm || "Sans salle"})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {filterScope === "room" && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Choisir la salle :</span>
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="all">Toutes les salles</option>
                    {distinctRooms.map((r) => (
                      <option key={r} value={r}>
                        {r} ({candidatesFilteredByExam.filter((c) => getCandidateRoomInScope(c) === r).length} élèves)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {filterScope === "class" && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Choisir la classe :</span>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="all">Toutes les classes</option>
                    {distinctClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} ({candidatesFilteredByExam.filter((c) => c.className === cls).length} élèves)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                1. Date d&apos;examen :
              </label>
              <select
                value={labelDateFilter}
                onChange={(e) => {
                  setLabelDateFilter(e.target.value);
                  setLabelSlotFilter("all");
                  setLabelRoomFilter("all");
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
              >
                <option value="all">Toutes les dates ({labelDistinctDates.length})</option>
                {labelDistinctDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                2. Épreuve / Créneau :
              </label>
              <select
                value={labelSlotFilter}
                onChange={(e) => {
                  setLabelSlotFilter(e.target.value);
                  setLabelRoomFilter("all");
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
              >
                <option value="all">Toutes les épreuves ({labelDateSlots.length})</option>
                {labelDateSlots.map((sl) => (
                  <option key={sl.id} value={sl.id}>
                    {sl.date} • {sl.startTime}-{sl.endTime} : {sl.subject}
                    {sl.targetSpecialty ? ` (${sl.targetSpecialty})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                3. Salle physique :
              </label>
              <select
                value={labelRoomFilter}
                onChange={(e) => setLabelRoomFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-[#0F2A56]"
              >
                <option value="all">
                  Toutes les salles ({labelDistinctRooms.length} salle(s) • {allLabelItemsBeforeRoomFilter.length} étiquettes)
                </option>
                {labelDistinctRooms.map((rm) => {
                  const cnt = allLabelItemsBeforeRoomFilter.filter((i) => i.roomName === rm).length;
                  return (
                    <option key={rm} value={rm}>
                      {rm} ({cnt} candidat{cnt > 1 ? "s" : ""})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. PRINTABLE CONVOCATIONS                                */}
      {/* ======================================================== */}
      {printMode === "convocation" && (
        <div className="space-y-8">
          {candidatesToPrint.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              Aucun élève trouvé pour ce filtre d'impression.
            </div>
          ) : (
            candidatesToPrint.map((candidate, idx) => {
              const candResolvedExam = resolveExamForCandidate(candidate);
              const candExamName = candResolvedExam?.title || "Examen Blanc";
              const candAssignment = getCandidateAssignmentForExam(
                candidate,
                candResolvedExam,
                examSlots,
                rooms
              );
              const matchingSlots = getCandidateMatchingSlots(
                candidate,
                candResolvedExam,
                examSlots
              );
              const isTT = isCandidateTiersTemps(candidate);
              const locationSummary = summarizeCandidateConvocationLocation(
                candidate,
                candResolvedExam,
                matchingSlots,
                examSlots,
                rooms
              );
              const anonDisplay =
                locationSummary.anonymatNumber ||
                candAssignment.anonymatNumber ||
                `LFJP-${String(idx + 101).padStart(4, "0")}`;

              return (
                <div
                  key={candidate.id}
                  className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 max-w-3xl mx-auto printable-content space-y-4 print:space-y-3 print:border-none print:shadow-none print:p-0 print:my-0 print:max-w-none print:w-full"
                  style={{ pageBreakAfter: idx < candidatesToPrint.length - 1 ? "always" : "auto" }}
                >
                  {/* Individual Action Bar (Hidden on print) */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 print:hidden text-xs">
                    <span className="text-slate-600 font-medium">
                      Élève {idx + 1}/{candidatesToPrint.length} : <strong className="text-slate-900">{candidate.lastName.toUpperCase()} {candidate.firstName}</strong> ({candidate.className}) • Examen : <strong>{candExamName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePrint(candidate)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition border border-indigo-200 cursor-pointer"
                      title={`Imprimer uniquement la convocation de ${candidate.firstName} ${candidate.lastName}`}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Imprimer cette convocation</span>
                    </button>
                  </div>

                  {/* Official Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 gap-3 print-avoid-break">
                    <div className="flex items-center gap-3">
                      <img
                        src="/assets/aistudio/logo-lfjp_62451311.png"
                        alt="Logo LFJP"
                        className="h-12 w-auto object-contain shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                        }}
                      />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                          RÉPUBLIQUE FRANÇAISE • RÉSEAU AEFE
                        </p>
                        <h1 className="text-base font-black text-[#002060]">
                          LYCÉE FRANÇAIS JACQUES PRÉVERT DE SALY
                        </h1>
                        <p className="text-xs text-slate-600">
                          Session Officielle {siteInfo.schoolYear || "2026-2027"} • Saly Portudal
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-3 py-1 rounded bg-[#002060] text-white font-bold text-xs uppercase shadow-xs">
                        CONVOCATION OFFICIELLE
                      </span>
                      <p className="text-[11px] font-bold text-slate-800 mt-1">
                        {candExamName}
                      </p>
                      {candResolvedExam?.period && (
                        <p className="text-[10px] text-slate-500 font-medium">
                          Période : {candResolvedExam.period}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Student Info Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 text-xs print-avoid-break">
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold">Candidat(e) :</p>
                      <p className="text-sm font-black text-slate-900">
                        {candidate.lastName.toUpperCase()} {candidate.firstName}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Classe : <strong>{candidate.className}</strong>
                        {candidate.specialty ? (
                          <span className="ml-2 text-indigo-700 font-semibold">• {candidate.specialty}</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="text-right">
                      {locationSummary.hasMultipleLocations ? (
                        <>
                          <p className="text-[11px] text-slate-500 font-semibold">Salle d&apos;Examen :</p>
                          <p className="text-xs font-black text-[#002060]">Voir tableau ci-dessous</p>
                        </>
                      ) : locationSummary.singleRoom ? (
                        <>
                          <p className="text-[11px] text-slate-500 font-semibold">Salle d&apos;Examen :</p>
                          <p className="text-sm font-black text-[#002060]">{locationSummary.singleRoom}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[11px] text-slate-500 font-semibold">Salle d&apos;Examen :</p>
                          <p className="text-xs font-bold text-slate-500">Non affecté</p>
                        </>
                      )}
                      <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                        {!locationSummary.hasMultipleLocations && locationSummary.singleTable
                          ? `Table ${formatConvocationTableNumber(locationSummary.singleTable)} • `
                          : ""}
                        Anonymat : {anonDisplay}
                      </p>
                    </div>
                  </div>

                  {/* Accommodation Banner */}
                  {isTT && (
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 flex flex-wrap items-center justify-between gap-2 print-avoid-break">
                      <span className="font-bold flex items-center gap-1.5">
                        <span>♿ Aménagement Réglementaire Accordé :</span>
                        <span>{candidate.accommodation || "Tiers-Temps Accordé"}</span>
                      </span>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-300">
                        Majoration réglementaire (+1/3 temps) incluse
                      </span>
                    </div>
                  )}

                  {/* Schedule Table: Strictly filtered by candidate level & specialty */}
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-900 flex flex-wrap items-center justify-between gap-2">
                      <span>Calendrier Officiel des Épreuves &amp; Créneaux :</span>
                      <span className="font-normal text-slate-500">
                        Session : <strong>{candExamName}</strong>
                        {candResolvedExam?.period ? ` (${candResolvedExam.period})` : ""}
                      </span>
                    </p>
                    <div className="print-table-wrap overflow-x-auto">
                      <table className="print-a4-table w-full text-left border-collapse border border-slate-300 text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold">
                            <th className="p-2 border border-slate-300">Épreuve / Discipline</th>
                            <th className="p-2 border border-slate-300">Date</th>
                            <th className="p-2 border border-slate-300">Horaires</th>
                            <th className="p-2 border border-slate-300">Salle &amp; Table</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchingSlots.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-3 border border-slate-300 text-center text-slate-500 italic">
                                Aucune épreuve correspondant à votre niveau ({candidate.className}) n&apos;est encore programmée pour &quot;{candExamName}&quot;.
                              </td>
                            </tr>
                          ) : (
                            matchingSlots.map((slot) => {
                              const endTimeDisplay = isTT
                                ? slot.tiersTempsEndTime || calcTTEndTime(slot.startTime, slot.durationMinutes)
                                : slot.endTime;
                              const slotAssign = getCandidateAssignmentForSlot(
                                candidate,
                                candResolvedExam,
                                slot,
                                examSlots,
                                rooms
                              );
                              return (
                                <tr key={slot.id} className="hover:bg-slate-50">
                                  <td className="p-2 border border-slate-300 font-bold text-slate-900">
                                    <div>{slot.subject}</div>
                                    {slot.targetSpecialty && (
                                      <span className="text-[10px] font-semibold text-indigo-700">
                                        {slot.targetSpecialty}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2 border border-slate-300 whitespace-nowrap">
                                    {slot.date}
                                  </td>
                                  <td className="p-2 border border-slate-300 font-mono font-semibold whitespace-nowrap">
                                    {slot.startTime} - {endTimeDisplay}
                                    {isTT && (
                                      <span className="ml-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-1 py-0.5 rounded">
                                        +1/3 TT
                                      </span>
                                    )}
                                  </td>
                                  <td
                                    className={`p-2 border border-slate-300 font-bold whitespace-nowrap ${
                                      slotAssign.roomName ? "text-[#002060]" : "text-slate-400 italic font-medium"
                                    }`}
                                  >
                                    {formatConvocationRoomAndTable(
                                      slotAssign.roomName,
                                      slotAssign.tableNumber
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Official Instructions */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 print-avoid-break">
                    <p className="font-bold text-slate-900">Consignes Impératives aux Candidats :</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Se présenter 15 minutes avant le début de chaque épreuve avec sa convocation et sa pièce d&apos;identité officielle.</li>
                      <li>Les téléphones portables et montres connectées doivent être impérativement éteints et déposés dans les sacs.</li>
                      <li>L&apos;usage de la calculatrice est soumis aux consignes du sujet (mode examen clignotant obligatoire).</li>
                    </ul>
                  </div>

                  {/* Signature Block */}
                  <div className="pt-5 flex justify-between items-end text-xs border-t border-slate-200 print-avoid-break">
                    <div className="text-center">
                      <p className="text-[11px] text-slate-400">Signature du Candidat</p>
                      <div className="w-40 h-10 border-b border-dashed border-slate-400 mt-2" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-slate-900 font-bold">Le / La Proviseur(e)</p>
                      <p className="font-serif italic text-slate-700 mt-2">Direction du {siteInfo.title || "Lycée Français Jacques Prévert"}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Cachet et signature officielle</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PRINTABLE TABLE LABELS (PLANCHE D'ÉTIQUETTES A4 LFJP) */}
      {/* ======================================================== */}
      {printMode === "etiquettes" && (
        <div className="space-y-6">
          {labelItemsGroupedByRoom.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
              Aucun candidat affecté trouvé pour ces critères (Session / Date / Épreuve / Salle).
            </div>
          ) : (
            labelItemsGroupedByRoom.map(([roomName, roomItems], groupIdx) => (
              <div
                key={roomName}
                className={`bg-white rounded-2xl border border-slate-300 shadow-md p-6 max-w-4xl mx-auto printable-content print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full ${
                  groupIdx > 0 ? "print-break-before" : ""
                }`}
              >
                <div className="border-b-2 border-[#0F2A56] pb-3 mb-4 flex flex-wrap items-center justify-between gap-2 print-avoid-break">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Lycée Français Jacques Prévert • Planche d&apos;Étiquettes de Table A4
                    </p>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#0F2A56]">
                      {roomName} — {roomItems.length} étiquette{roomItems.length > 1 ? "s" : ""} (triées par N° de Table)
                    </h3>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    {activeExam ? <span className="font-bold text-slate-700">{activeExam.title}</span> : null}
                    <span className="block">Découpe le long des pointillés</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3.5 print:gap-2.5">
                  {roomItems.map((item, idx) => {
                    const tableDisp = item.tableNumber
                      ? formatConvocationTableNumber(item.tableNumber)
                      : String(idx + 1).padStart(2, "0");
                    const anonDisp =
                      item.anonymatNumber || `LFJP-${String(idx + 101).padStart(4, "0")}`;

                    return (
                      <div
                        key={item.key}
                        className="border-2 border-dashed border-slate-400 rounded-xl overflow-hidden bg-white print-avoid-break flex flex-col justify-between"
                      >
                        {/* Top LFJP Navy Header: Table N° & Room */}
                        <div className="bg-[#0F2A56] text-white px-3 py-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono tracking-wide tabular-nums bg-white text-[#0F2A56] px-2 py-0.5 rounded">
                              TABLE N° {tableDisp}
                            </span>
                            <span className="text-[11px] font-bold truncate max-w-[130px]">
                              {item.roomName}
                            </span>
                          </div>
                          {item.isTT && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-950 font-black text-[9px] shrink-0">
                              ♿ +1/3 TT
                            </span>
                          )}
                        </div>

                        {/* Body: Anonymat + Identity + Exam Details */}
                        <div className="p-3 print:p-2.5 space-y-2 print:space-y-1.5 text-xs">
                          <div className="flex items-start justify-between gap-2 border-b border-dashed border-slate-200 pb-2">
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                                Candidat
                              </span>
                              <p className="font-black text-sm text-[#0F2A56] truncate">
                                {item.candidate.lastName.toUpperCase()} {item.candidate.firstName}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-600">
                                Classe : <strong className="text-slate-900">{item.candidate.className}</strong>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                                N° Anonymat
                              </span>
                              <span className="inline-block font-mono font-black text-xs bg-slate-100 border border-slate-300 text-slate-900 px-2 py-0.5 rounded tabular-nums">
                                {anonDisp}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-0.5 text-[11px]">
                            <p className="font-bold text-slate-800 truncate" title={item.subjectLabel}>
                              {item.subjectLabel}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono tabular-nums">
                              <span>{item.dateLabel}</span>
                              {item.timeLabel && <span className="font-bold text-[#0F2A56]">{item.timeLabel}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface ConvocProfsSectionProps {
  teachers: CmsTeacher[];
  surveillances: CmsSurveillance[];
  siteInfo: SiteInfo;
  exams?: CmsExam[];
  examSlots?: CmsExamSlot[];
  rooms?: CmsRoom[];
}

export function ConvocProfsSection({
  teachers,
  surveillances,
  siteInfo,
  exams = [],
  examSlots = [],
  rooms = [],
}: ConvocProfsSectionProps) {
  const [printScope, setPrintScope] = useState<"single" | "all">("single");
  const [selectedExamTitle, setSelectedExamTitle] = useState<string>("all");

  // Merge regular teachers with any manual surveillants renfort present in surveillances
  const allSupervisors = useMemo(() => {
    const list: Array<CmsTeacher & { isRenfort?: boolean }> = [...teachers];
    const existingNames = new Set(
      teachers.map((t) => `${t.lastName} ${t.firstName}`.toLowerCase().trim())
    );

    surveillances.forEach((s) => {
      const cleanedFull = cleanSupervisorName(s.teacherName);
      const baseName = cleanedFull.replace(/^(madame|monsieur|mme|m\.|mlle)\s+/i, "").trim();
      const baseLower = baseName.toLowerCase();
      if (!baseLower) return;

      const isExisting = Array.from(existingNames).some(
        (n) => n.includes(baseLower) || baseLower.includes(n)
      );
      if (!isExisting) {
        existingNames.add(baseLower);
        const isFemale = /^(mme|madame|mlle)\b/i.test(s.teacherName);
        list.push({
          id: `renfort-${baseLower.replace(/\s+/g, "-")}`,
          civility: isFemale ? "Madame" : "Monsieur",
          lastName: baseName,
          firstName: "",
          subject: "Surveillant renfort",
          email: `${baseLower.replace(/\s+/g, ".")}@lfjpsaly.org`,
          isRenfort: true,
        });
      }
    });
    return list;
  }, [teachers, surveillances]);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    allSupervisors[0]?.id || ""
  );

  const teachersToPrint = useMemo(() => {
    if (printScope === "single") {
      const t = allSupervisors.find((teach) => teach.id === selectedTeacherId) || allSupervisors[0];
      return t ? [t] : [];
    }
    return allSupervisors;
  }, [allSupervisors, printScope, selectedTeacherId]);

  const handlePrint = (singleTeacher?: CmsTeacher) => {
    const t = singleTeacher || teachersToPrint[0];
    const prevTitle = document.title;
    if (t) {
      document.title = `Ordre_Mission_${t.lastName.toUpperCase()}_${t.firstName}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    } else {
      document.title = `Ordres_de_Mission_Surveillances_LFJP`;
    }
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Surveillance Officielle
            </span>
            <span className="text-xs text-slate-500">
              Impression ciblée des ordres de mission conformes
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            👔 Ordres de Mission & Convocations Professeurs & Surveillants
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Convocations officielles aux épreuves avec détail des créneaux, disciplines, salles assignées et consignes réglementaires.
          </p>
        </div>

        <button
          onClick={() => handlePrint()}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer l'ordre de mission ({teachersToPrint.length})</span>
        </button>
      </div>

      {/* Selector Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        {/* Exam Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Examen :</span>
          </span>
          <select
            value={selectedExamTitle}
            onChange={(e) => setSelectedExamTitle(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
          >
            <option value="all">Tous les examens</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.title}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPrintScope("single")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              printScope === "single"
                ? "bg-[#3498db] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            👤 Personnel Unique
          </button>
          <button
            type="button"
            onClick={() => setPrintScope("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              printScope === "all"
                ? "bg-[#3498db] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            👥 Tout le Personnel ({allSupervisors.length})
          </button>
        </div>

        {printScope === "single" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Choisir :</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white max-w-xs font-medium"
            >
              {allSupervisors.map((t) => {
                const cleanLast = cleanSupervisorName(t.lastName);
                const cleanFirst = cleanSupervisorName(t.firstName);
                const labelName = [cleanLast, cleanFirst].filter(Boolean).join(" ");
                const displaySubj = t.isRenfort ? "Surveillant renfort" : t.subject;
                return (
                  <option key={t.id} value={t.id}>
                    {t.civility === "Madame" ? "Mme" : "M."} {labelName} ({displaySubj})
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Render Mission Orders */}
      <div className="space-y-8">
        {teachersToPrint.map((teacher, idx) => {
          const cleanLast = cleanSupervisorName(teacher.lastName);
          const cleanFirst = cleanSupervisorName(teacher.firstName);
          const displayHeaderName = [cleanFirst, cleanLast.toUpperCase()].filter(Boolean).join(" ");
          const displayTopName = [cleanLast.toUpperCase(), cleanFirst].filter(Boolean).join(" ");
          const displaySubject = teacher.isRenfort ? "Surveillant renfort" : teacher.subject;

          const rawTeacherSurvs = surveillances.filter((s) => {
            const cleanSurvTeacher = cleanSupervisorName(s.teacherName).toLowerCase();
            const matchesTeacher =
              (cleanLast && cleanSurvTeacher.includes(cleanLast.toLowerCase())) ||
              (cleanFirst && cleanSurvTeacher.includes(cleanFirst.toLowerCase()));
            if (!matchesTeacher) return false;
            if (selectedExamTitle !== "all") {
              return (s.examTitle || "").trim().toLowerCase() === selectedExamTitle.trim().toLowerCase();
            }
            return true;
          });
          const consolidatedSurvs = consolidateTeacherSurveillances(rawTeacherSurvs, examSlots);

          return (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 max-w-3xl mx-auto printable-content space-y-5 print:border-none print:shadow-none print:p-0 print:my-0 print:max-w-none print:w-full"
              style={{ pageBreakAfter: idx < teachersToPrint.length - 1 ? "always" : "auto" }}
            >
              {/* Individual Print Button (Hidden on print) */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 print:hidden text-xs">
                <span className="text-slate-600 font-medium">
                  Personnel {idx + 1}/{teachersToPrint.length} : <strong className="text-slate-900">{teacher.civility} {displayTopName}</strong> ({displaySubject})
                </span>
                <button
                  type="button"
                  onClick={() => handlePrint(teacher)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition border border-amber-200 cursor-pointer"
                  title={`Imprimer uniquement l'ordre de mission de ${displayHeaderName}`}
                >
                  <Printer className="h-3.5 w-3.5 text-amber-700" />
                  <span>Imprimer cet ordre de mission</span>
                </button>
              </div>

              {/* Official Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 gap-3 print-avoid-break">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/aistudio/logo-lfjp_62451311.png"
                    alt="Logo LFJP"
                    className="h-12 w-auto object-contain shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                    }}
                  />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                      RÉPUBLIQUE FRANÇAISE • RÉSEAU AEFE
                    </p>
                    <h1 className="text-base font-black text-[#002060]">
                      LYCÉE FRANÇAIS JACQUES PRÉVERT DE SALY
                    </h1>
                    <p className="text-xs text-slate-600">Direction des Examens et Concours • Session {siteInfo.schoolYear || "2026-2027"}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-3 py-1 rounded bg-[#002060] text-white font-bold text-xs uppercase shadow-xs">
                    ORDRE DE MISSION • SURVEILLANCE
                  </span>
                  {selectedExamTitle !== "all" && (
                    <p className="text-[11px] font-bold text-slate-800 mt-1">
                      {selectedExamTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Teacher Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs print-avoid-break">
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold">Personnel Convoqué :</p>
                  <p className="text-sm font-black text-slate-900">
                    {teacher.civility} {displayHeaderName}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Discipline / Fonction : <strong>{displaySubject}</strong></p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] tabular-nums">
                    {consolidatedSurvs.length} créneau(x) assigné(s)
                  </span>
                </div>
              </div>

              {/* Assigned slots (Consolidated chronologically, combining shared physical room subjects) */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900">Détail des Créneaux &amp; Surveillances Assignées :</p>
                {consolidatedSurvs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-lg">
                    Aucun créneau de surveillance n&apos;est actuellement affecté à cet enseignant pour la sélection.
                  </p>
                ) : (
                  <div className="print-table-wrap overflow-x-auto">
                    <table className="print-a4-table w-full text-left border-collapse border border-slate-300 text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold">
                          <th className="p-2 border border-slate-300">Session d&apos;Examen</th>
                          <th className="p-2 border border-slate-300">Épreuve(s) / Discipline(s)</th>
                          <th className="p-2 border border-slate-300">Date</th>
                          <th className="p-2 border border-slate-300">Horaire</th>
                          <th className="p-2 border border-slate-300">Salle</th>
                          <th className="p-2 border border-slate-300">Mission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidatedSurvs.map((s) => {
                          const isRenfort = s.isRenfort || isRenfortSurveillance(s);
                          return (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="p-2 border border-slate-300 font-bold">{s.examTitle}</td>
                              <td className="p-2 border border-slate-300 font-semibold text-slate-900">
                                {s.subjects.join(" • ")}
                              </td>
                              <td className="p-2 border border-slate-300 whitespace-nowrap tabular-nums">{s.date}</td>
                              <td className="p-2 border border-slate-300 font-mono font-bold text-[#002060] whitespace-nowrap tabular-nums">
                                {s.timeSlot}
                              </td>
                              <td className="p-2 border border-slate-300 font-bold">
                                {isRenfort ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 font-extrabold text-[11px] whitespace-nowrap">
                                      Salle Renfort
                                    </span>
                                    {s.renfortRooms && s.renfortRooms.length > 0 && (
                                      <div className="text-[10px] font-medium text-slate-600 leading-tight">
                                        ({s.renfortRooms.join(", ")})
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  s.roomName
                                )}
                              </td>
                              <td className="p-2 border border-slate-300">
                                {isRenfort ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
                                    {formatSupervisorMissionLabel(s.mission, true)}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {s.mission || "Surveillant titulaire"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 print-avoid-break">
                <p className="font-bold text-slate-900">Rappels Réglementaires aux Surveillants :</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Se présenter au secrétariat des examens 20 minutes avant le début de l&apos;épreuve pour retirer la pochette.</li>
                  <li>Vérifier scrupuleusement l&apos;identité de chaque candidat lors de l&apos;émargement.</li>
                  <li>Ne pas utiliser de téléphone portable durant la surveillance dans la salle d&apos;examen.</li>
                </ul>
              </div>

              {/* Signatures */}
              <div className="pt-5 flex justify-between items-end text-xs border-t border-slate-200 print-avoid-break">
                <div className="text-center">
                  <p className="text-[11px] text-slate-400">Émargement du surveillant</p>
                  <div className="w-40 h-10 border-b border-dashed border-slate-400 mt-2" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-slate-900 font-bold">Le / La Proviseur(e)</p>
                  <p className="font-serif italic text-slate-700 mt-2">Direction du {siteInfo.title || "Lycée Français Jacques Prévert"}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Cachet et signature officielle</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import {
  Printer,
  School,
  Calendar,
  Clock,
  Layers,
  UserCheck,
  FileText,
} from "lucide-react";
import type {
  CmsRoom,
  CmsCandidate,
  CmsSurveillance,
  CmsExam,
  CmsExamSlot,
  SiteInfo,
} from "../../../shared/services/cms-store";
import {
  getCandidateAssignmentForExam,
  getCandidateAssignmentForSlot,
  isCandidateTiersTemps,
  isRoomMarkedTiersTemps,
  computeTiersTempsEndTimeColon,
  formatConvocationTableNumber,
  surveillancesTimeOverlap,
} from "../../../shared/services/cms-store";

interface SecPochettesSectionProps {
  rooms: CmsRoom[];
  candidates: CmsCandidate[];
  surveillances: CmsSurveillance[];
  siteInfo: SiteInfo;
  exams?: CmsExam[];
  examSlots?: CmsExamSlot[];
}

export default function SecPochettesSection({
  rooms,
  candidates,
  surveillances,
  siteInfo,
  exams = [],
  examSlots = [],
}: SecPochettesSectionProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || "all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("all");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || "__all__");
  const [selectedDocType, setSelectedDocType] = useState<
    "emargement" | "consignes" | "pv" | "etiquette"
  >("emargement");

  const activeExam = useMemo(() => {
    if (selectedExamId === "all") return null;
    return exams.find((e) => e.id === selectedExamId) || null;
  }, [exams, selectedExamId]);

  const slotsInExam = useMemo(() => {
    const base = !activeExam
      ? examSlots
      : examSlots.filter(
          (s) =>
            s.examId === activeExam.id ||
            (s.examTitle || "").trim().toLowerCase() === activeExam.title.trim().toLowerCase()
        );
    return [...base].sort(
      (a, b) =>
        (a.date || "").localeCompare(b.date || "") ||
        (a.startTime || "").localeCompare(b.startTime || "")
    );
  }, [examSlots, activeExam]);

  const availableDates = useMemo(() => {
    return Array.from(new Set(slotsInExam.map((s) => s.date).filter(Boolean))).sort();
  }, [slotsInExam]);

  const effectiveDate = useMemo(() => {
    if (selectedDate === "all") return "all";
    return availableDates.includes(selectedDate) ? selectedDate : "all";
  }, [selectedDate, availableDates]);

  const slotsForDate = useMemo(() => {
    if (effectiveDate === "all") return slotsInExam;
    return slotsInExam.filter((s) => s.date === effectiveDate);
  }, [slotsInExam, effectiveDate]);

  const effectiveSlot = useMemo(() => {
    if (selectedSlotId === "all") return null;
    return slotsForDate.find((s) => s.id === selectedSlotId) || null;
  }, [slotsForDate, selectedSlotId]);

  // Target rooms for the cascade (either single chosen room OR all rooms mobilized on slot/exam)
  const roomsToRender = useMemo(() => {
    if (selectedRoomId !== "__all__") {
      const found = rooms.find((r) => r.id === selectedRoomId);
      if (found) return [found];
    }

    // All rooms mobilized on the chosen slot, date slots, or all rooms with candidates
    const mobilizedNames = new Set<string>();
    if (effectiveSlot) {
      (effectiveSlot.roomNames || []).forEach((rn) => mobilizedNames.add(rn.trim().toLowerCase()));
      candidates.forEach((c) => {
        const rn = c.assignmentsBySlot?.[effectiveSlot.id]?.roomName;
        if (rn) mobilizedNames.add(rn.trim().toLowerCase());
      });
    } else if (slotsForDate.length > 0) {
      slotsForDate.forEach((sl) => {
        (sl.roomNames || []).forEach((rn) => mobilizedNames.add(rn.trim().toLowerCase()));
      });
    } else if (activeExam?.mobilizedRoomIds?.length) {
      return rooms.filter((r) => activeExam.mobilizedRoomIds!.includes(r.id));
    }

    if (mobilizedNames.size > 0) {
      return rooms.filter((r) => mobilizedNames.has(r.name.trim().toLowerCase()));
    }
    return rooms;
  }, [rooms, selectedRoomId, effectiveSlot, slotsForDate, activeExam, candidates]);

  interface RoomCandidateRow {
    candidate: CmsCandidate;
    tableNumber: string;
    tableSortNum: number;
    anonymatNumber: string;
    subjectLabel: string;
    isTT: boolean;
  }

  interface RoomPacketData {
    room: CmsRoom;
    isTTRoom: boolean;
    hostedSlots: CmsExamSlot[];
    rows: RoomCandidateRow[];
    subjectCounts: Array<{ subject: string; count: number }>;
    timeRangeDisplay: string;
    dateDisplay: string;
    surveillants: CmsSurveillance[];
  }

  const roomPackets = useMemo<RoomPacketData[]>(() => {
    return roomsToRender.map((room) => {
      const rmLower = room.name.trim().toLowerCase();

      // Identify slots hosted in this physical room within filter scope
      const hostedSlots = effectiveSlot
        ? [effectiveSlot]
        : slotsForDate.filter((sl) => {
            const hasRoom = (sl.roomNames || []).some(
              (rn) => rn.trim().toLowerCase() === rmLower
            );
            const hasCandInRoom = candidates.some(
              (c) => c.assignmentsBySlot?.[sl.id]?.roomName?.trim().toLowerCase() === rmLower
            );
            return hasRoom || hasCandInRoom;
          });

      const isTTRoom = isRoomMarkedTiersTemps(
        room,
        hostedSlots.length > 0 ? hostedSlots : slotsForDate,
        activeExam
      );

      // Build deduplicated candidate rows in this room
      const rows: RoomCandidateRow[] = [];
      const seenCandSlot = new Set<string>();

      if (hostedSlots.length > 0) {
        hostedSlots.forEach((slot) => {
          const examObj =
            activeExam ||
            exams.find(
              (e) =>
                e.id === slot.examId ||
                e.title.trim().toLowerCase() === (slot.examTitle || "").trim().toLowerCase()
            ) ||
            null;

          candidates.forEach((cand) => {
            const directAssign = cand.assignmentsBySlot?.[slot.id];
            const resolvedAssign = directAssign?.roomName
              ? directAssign
              : getCandidateAssignmentForSlot(cand, examObj, slot, examSlots, rooms);

            if (resolvedAssign.roomName.trim().toLowerCase() !== rmLower) return;

            const uniqKey = effectiveSlot ? cand.id : `${cand.id}::${slot.id}`;
            if (seenCandSlot.has(uniqKey)) return;
            seenCandSlot.add(uniqKey);

            const tbl = resolvedAssign.tableNumber || "";
            const subj = slot.targetSpecialty
              ? `${slot.subject} (${slot.targetSpecialty})`
              : slot.subject;

            rows.push({
              candidate: cand,
              tableNumber: tbl,
              tableSortNum: parseInt(tbl || "9999", 10) || 9999,
              anonymatNumber: resolvedAssign.anonymatNumber || cand.anonymatNumber || "",
              subjectLabel: subj,
              isTT: isCandidateTiersTemps(cand) || isTTRoom,
            });
          });
        });
      }

      // Legacy fallback if zero slot-level matches and no specific slot chosen
      if (rows.length === 0 && !effectiveSlot) {
        candidates.forEach((cand) => {
          const assign = getCandidateAssignmentForExam(cand, activeExam, examSlots, rooms);
          if (assign.roomName.trim().toLowerCase() !== rmLower) return;
          const tbl = assign.tableNumber || "";
          rows.push({
            candidate: cand,
            tableNumber: tbl,
            tableSortNum: parseInt(tbl || "9999", 10) || 9999,
            anonymatNumber: assign.anonymatNumber || cand.anonymatNumber || "",
            subjectLabel: cand.specialty
              ? `${activeExam?.title || "Épreuve"} (${cand.specialty})`
              : activeExam?.title || cand.examName || "Épreuve écrite",
            isTT: isCandidateTiersTemps(cand) || isTTRoom,
          });
        });
      }

      rows.sort((a, b) => {
        if (a.tableSortNum !== b.tableSortNum) return a.tableSortNum - b.tableSortNum;
        return a.candidate.lastName.localeCompare(b.candidate.lastName);
      });

      // Copy count breakdown by subject/specialty
      const subjMap = new Map<string, number>();
      rows.forEach((r) => {
        const key = r.subjectLabel || "Épreuve écrite";
        subjMap.set(key, (subjMap.get(key) || 0) + 1);
      });
      const subjectCounts = Array.from(subjMap.entries()).map(([subject, count]) => ({
        subject,
        count,
      }));

      // Date & Time window display (with TT +1/3 extension if applicable)
      const primaryHosted = hostedSlots[0] || null;
      const dateDisplay =
        primaryHosted?.date || (effectiveDate !== "all" ? effectiveDate : activeExam?.period || "");
      let timeRangeDisplay = "";
      if (primaryHosted) {
        const maxDuration = Math.max(
          ...hostedSlots.map((sl) => sl.durationMinutes || 60)
        );
        const ttEnd = computeTiersTempsEndTimeColon(
          primaryHosted.startTime,
          maxDuration,
          primaryHosted.tiersTempsEndTime
        );
        timeRangeDisplay = isTTRoom
          ? `${primaryHosted.startTime} – ${ttEnd} (+1/3 Temps)`
          : `${primaryHosted.startTime} – ${primaryHosted.endTime}`;
      }

      // Surveillances tied to this room and date/slot
      const roomSurvs = surveillances.filter((s) => {
        if (s.roomName.trim().toLowerCase() !== rmLower) return false;
        if (effectiveDate !== "all" && s.date !== effectiveDate) return false;
        if (effectiveSlot) {
          if (s.slotId === effectiveSlot.id) return true;
          return surveillancesTimeOverlap(
            s.date,
            s.timeSlot,
            effectiveSlot.date,
            `${effectiveSlot.startTime} - ${effectiveSlot.tiersTempsEndTime || effectiveSlot.endTime}`
          );
        }
        return true;
      });

      return {
        room,
        isTTRoom,
        hostedSlots,
        rows,
        subjectCounts,
        timeRangeDisplay,
        dateDisplay,
        surveillants: roomSurvs,
      };
    });
  }, [
    roomsToRender,
    effectiveSlot,
    slotsForDate,
    activeExam,
    exams,
    candidates,
    examSlots,
    rooms,
    effectiveDate,
    surveillances,
  ]);

  const handlePrint = () => {
    const prevTitle = document.title;
    const docTag =
      selectedDocType === "emargement"
        ? "Emargement"
        : selectedDocType === "consignes"
          ? "Consignes"
          : selectedDocType === "pv"
            ? "PV"
            : "Etiquette_Enveloppe";
    const rmTag =
      selectedRoomId === "__all__"
        ? "Toutes_Salles"
        : rooms.find((r) => r.id === selectedRoomId)?.name || "Salle";
    document.title = `${docTag}_${rmTag}_LFJP`.replace(/[\s/\\?%*:|"<>]+/g, "_");
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
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
              Organisation Matérielle • LFJP
            </span>
            <span className="text-xs text-slate-500">
              Dossiers par créneau, décompte des copies &amp; feuilles d&apos;émargement
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A56] mt-1 tracking-tight">
            📁 Pochettes Surveillants &amp; Émargements
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Génération conforme par Session, Date, Épreuve et Salle : émargements triés par N° de table, décompte exact des sujets et PV d&apos;épreuve.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-[#0F2A56] hover:bg-[#1D4ED8] text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer ({roomPackets.length} salle{roomPackets.length > 1 ? "s" : ""})</span>
        </button>
      </div>

      {/* Cascade Filters & Document Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>1. Session d&apos;Examen :</span>
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setSelectedDate("all");
                setSelectedSlotId("all");
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
            >
              <option value="all">Toutes les sessions</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>2. Date :</span>
            </label>
            <select
              value={effectiveDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlotId("all");
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
            >
              <option value="all">Toutes les dates ({availableDates.length})</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>3. Épreuve / Créneau :</span>
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
            >
              <option value="all">Toutes les épreuves / salles regroupées</option>
              {slotsForDate.map((sl) => (
                <option key={sl.id} value={sl.id}>
                  {sl.date} • {sl.startTime}-{sl.endTime} : {sl.subject}
                  {sl.targetSpecialty ? ` (${sl.targetSpecialty})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <School className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>4. Salle physique :</span>
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold text-[#0F2A56]"
            >
              <option value="__all__">Toutes les salles du créneau (Tirage groupé)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.capacity} places)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Document type switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { id: "emargement", label: "📋 Feuille d'Émargement" },
              { id: "etiquette", label: "🏷️ Étiquette Pochette (Copies)" },
              { id: "pv", label: "📝 Procès-Verbal (PV)" },
              { id: "consignes", label: "📜 Consignes Surveillants" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDocType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  selectedDocType === tab.id
                    ? "bg-white text-[#0F2A56] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium tabular-nums">
            <strong className="text-[#0F2A56]">{roomPackets.length}</strong> fiche(s) générée(s)
          </span>
        </div>
      </div>

      {/* Printable Room Packets */}
      <div className="space-y-8">
        {roomPackets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
            Aucune salle trouvée pour ces critères.
          </div>
        ) : (
          roomPackets.map((packet, packetIdx) => {
            const uniqueSupervisors = Array.from(
              new Set(packet.surveillants.map((s) => `${s.teacherName} (${s.timeSlot})`))
            );

            return (
              <div
                key={packet.room.id}
                className={`bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 max-w-4xl mx-auto printable-content print:border-none print:shadow-none print:p-0 print:my-0 print:max-w-none print:w-full ${
                  packetIdx > 0 ? "print-break-before" : ""
                }`}
              >
                {/* Institutional Document Header */}
                <div className="flex items-center justify-between border-b-2 border-[#0F2A56] pb-4 mb-5 gap-3 print-avoid-break">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/logo-lfjp_62451311.png"
                      alt="Logo LFJP"
                      className="h-11 w-auto object-contain shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                      }}
                    />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                        RÉPUBLIQUE FRANÇAISE • RÉSEAU AEFE
                      </p>
                      <h1 className="text-base font-black text-[#0F2A56]">
                        {siteInfo.title || "LYCÉE FRANÇAIS JACQUES PRÉVERT DE SALY"}
                      </h1>
                      <p className="text-xs text-slate-600">
                        {activeExam?.title || "Organisation des Examens Blancs"} • Session {siteInfo.schoolYear || "2026-2027"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="px-3 py-1 rounded bg-[#0F2A56] text-white font-black text-sm tracking-wide uppercase">
                        {packet.room.name}
                      </span>
                      {packet.isTTRoom && (
                        <span className="px-2 py-1 rounded bg-purple-100 border border-purple-300 text-purple-900 font-black text-xs">
                          ♿ Tiers-Temps
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 font-mono tabular-nums">
                      {packet.dateDisplay ? `${packet.dateDisplay}` : ""}
                      {packet.timeRangeDisplay ? ` • ${packet.timeRangeDisplay}` : ""}
                    </p>
                  </div>
                </div>

                {/* Room Disciplines & Exact Paper Count Summary Strip */}
                {(packet.subjectCounts.length > 0 || uniqueSupervisors.length > 0) && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print-avoid-break">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[#0F2A56] flex items-center gap-1 mr-1">
                        <FileText className="h-3.5 w-3.5 text-[#1D4ED8]" />
                        <span>Sujets / Copies ({packet.rows.length}) :</span>
                      </span>
                      {packet.subjectCounts.map((sc) => (
                        <span
                          key={sc.subject}
                          className="px-2 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-800 tabular-nums"
                        >
                          {sc.subject} : {sc.count}
                        </span>
                      ))}
                    </div>
                    {uniqueSupervisors.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-900 font-semibold">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{uniqueSupervisors.join(" • ")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 1. FEUILLE D'ÉMARGEMENT */}
                {selectedDocType === "emargement" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-lg border border-blue-200 print-avoid-break">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#0F2A56]">
                          LISTE OFFICIELLE D&apos;ÉMARGEMENT DES CANDIDATS
                        </h3>
                        <p className="text-[11px] text-slate-600">
                          Contrôler la pièce d&apos;identité et la convocation avant entrée. Aucune sortie autorisée durant la 1ère heure.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-[#0F2A56] text-white text-xs font-bold font-mono tabular-nums">
                        {packet.rows.length} Inscrit(s)
                      </span>
                    </div>

                    <div className="print-table-wrap">
                      <table className="print-a4-table w-full text-left text-xs border border-slate-300 border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                            <th className="p-2 border-r border-slate-300 text-center w-14">Table</th>
                            <th className="p-2 border-r border-slate-300 text-center w-28">N° Anonymat</th>
                            <th className="p-2 border-r border-slate-300">Nom &amp; Prénom</th>
                            <th className="p-2 border-r border-slate-300 text-center w-20">Classe</th>
                            <th className="p-2 border-r border-slate-300">Épreuve / Spécialité</th>
                            <th className="p-2 border-r border-slate-300 text-center w-24">Aménagement</th>
                            <th className="p-2 text-center w-36">Signature</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {packet.rows.length > 0 ? (
                            packet.rows.map((row, idx) => (
                              <tr key={`${row.candidate.id}-${idx}`} className="h-10">
                                <td className="p-2 border-r border-slate-200 text-center font-black font-mono text-[#0F2A56] tabular-nums">
                                  {row.tableNumber
                                    ? formatConvocationTableNumber(row.tableNumber)
                                    : String(idx + 1).padStart(2, "0")}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px] font-semibold text-slate-700 tabular-nums">
                                  {row.anonymatNumber || `A-${idx + 101}`}
                                </td>
                                <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                                  {row.candidate.lastName.toUpperCase()} {row.candidate.firstName}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700">
                                  {row.candidate.className}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-[11px] font-semibold text-slate-800">
                                  {row.subjectLabel}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-center">
                                  {row.isTT ? (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px]">
                                      +1/3 TT
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">Standard</span>
                                  )}
                                </td>
                                <td className="p-2 border-slate-200 bg-slate-50/30" />
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-slate-400">
                                Aucun candidat affecté dans cette salle pour le créneau sélectionné.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Bilan Chiffré de Salle */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-slate-300 rounded-xl p-3 bg-slate-50 text-xs print-avoid-break">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Inscrits</p>
                        <p className="text-base font-black text-[#0F2A56] tabular-nums">
                          {packet.rows.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Présents</p>
                        <p className="text-base font-bold text-emerald-700">__________</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Absents</p>
                        <p className="text-base font-bold text-rose-700">__________</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Copies remises</p>
                        <p className="text-base font-bold text-[#0F2A56]">__________</p>
                      </div>
                    </div>

                    {/* Bottom Signatures for Surveillants */}
                    <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-200 text-xs print-avoid-break">
                      <div className="border border-slate-200 rounded-lg p-3 h-24 flex flex-col justify-between">
                        <p className="font-bold text-slate-800">Nom &amp; Signature du Surveillant 1 :</p>
                        <div className="border-b border-dashed border-slate-300" />
                      </div>
                      <div className="border border-slate-200 rounded-lg p-3 h-24 flex flex-col justify-between">
                        <p className="font-bold text-slate-800">Nom &amp; Signature du Surveillant 2 :</p>
                        <div className="border-b border-dashed border-slate-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CONSIGNES SURVEILLANTS */}
                {selectedDocType === "consignes" && (
                  <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                    <h3 className="font-extrabold text-sm text-[#0F2A56] border-b border-slate-200 pb-2">
                      CONSIGNES OFFICIELLES POUR LES SURVEILLANTS DE SALLE
                    </h3>

                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950">
                        <p className="font-bold">1. Arrivée et ouverture de la salle (H - 20 min)</p>
                        <p>
                          Récupérer la pochette scellée au secrétariat 20 minutes avant l&apos;épreuve. Vérifier la numérotation des tables ({packet.rows.length} places préparées) et la ventilation de la salle.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="font-bold text-slate-900">2. Appel, Identité &amp; Appareils connectés</p>
                        <p>
                          Contrôler convocation et pièce d&apos;identité avec photo à l&apos;entrée. Téléphones portables et montres connectées doivent être éteints et rangés dans les sacs au fond de la salle.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="font-bold text-slate-900">3. Calculatrices &amp; Anonymat</p>
                        <p>
                          Si autorisée par l&apos;en-tête du sujet, vérifier le voyant clignotant « Mode Examen ». Rappeler aux candidats de renseigner uniquement leur N° d&apos;anonymat sur les entêtes de copies.
                        </p>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-950">
                        <p className="font-bold">4. Aménagements Tiers-Temps (+1/3 temps)</p>
                        <p>
                          {packet.isTTRoom
                            ? `Cette salle (${packet.room.name}) est désignée Tiers-Temps : la majoration réglementaire (+1/3) est appliquée (${packet.timeRangeDisplay || "horaire majoré"}).`
                            : "Les candidats bénéficiant d'aménagements disposent du temps majoré d'un tiers dans leur salle dédiée."}
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950">
                        <p className="font-bold">5. Comptage contradictoire et retour pochette</p>
                        <p>
                          Compter les copies collectées avant la sortie du dernier candidat, compléter le PV de salle et remettre immédiatement la pochette au secrétariat des examens.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PROCÈS-VERBAL (PV) */}
                {selectedDocType === "pv" && (
                  <div className="space-y-4 text-xs text-slate-800">
                    <h3 className="font-extrabold text-sm text-[#0F2A56] border-b border-slate-200 pb-2">
                      PROCÈS-VERBAL DE DÉROULEMENT D&apos;ÉPREUVE (PV DE SALLE)
                    </h3>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="space-y-1">
                        <p>
                          <strong>Salle :</strong> {packet.room.name} {packet.isTTRoom ? "(Tiers-Temps +1/3)" : "(Standard)"}
                        </p>
                        <p>
                          <strong>Date :</strong> {packet.dateDisplay || new Date().toLocaleDateString("fr-FR")}
                        </p>
                        <p>
                          <strong>Horaire :</strong> {packet.timeRangeDisplay || "—"}
                        </p>
                        <p>
                          <strong>Surveillants :</strong>{" "}
                          {uniqueSupervisors.length > 0 ? uniqueSupervisors.join(", ") : "____________________"}
                        </p>
                      </div>
                      <div className="space-y-1 text-right tabular-nums">
                        <p>
                          <strong>Candidats inscrits :</strong> {packet.rows.length}
                        </p>
                        <p>
                          <strong>Candidats présents :</strong> _________
                        </p>
                        <p>
                          <strong>Candidats absents :</strong> _________
                        </p>
                        <p>
                          <strong>Copies remises :</strong> _________
                        </p>
                      </div>
                    </div>

                    {packet.subjectCounts.length > 0 && (
                      <div className="border border-slate-200 rounded-xl p-3 bg-white">
                        <p className="font-bold text-[#0F2A56] mb-1.5">
                          Répartition des sujets &amp; copies par discipline dans cette salle :
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {packet.subjectCounts.map((sc) => (
                            <div
                              key={sc.subject}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                            >
                              <span className="font-semibold text-slate-800 truncate">{sc.subject}</span>
                              <span className="font-mono font-black text-[#0F2A56] ml-2 tabular-nums">
                                {sc.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border border-slate-300 rounded-xl p-3 space-y-2">
                      <p className="font-bold">
                        Observations &amp; Incidents constatés (ouverture des enveloppes, retards, malaise, fraude) :
                      </p>
                      <div className="h-28 border border-dashed border-slate-200 rounded p-2 text-slate-400">
                        R.A.S. — Ouverture et déroulement conformes au règlement.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div>
                        <p className="font-bold">Signatures des surveillants :</p>
                        <div className="h-20 border-b border-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold">Visa du Secrétariat / Chef de Centre :</p>
                        <div className="h-20 border-b border-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ÉTIQUETTE POCHETTE / ENVELOPPE */}
                {selectedDocType === "etiquette" && (
                  <div className="p-6 border-4 border-dashed border-[#0F2A56]/50 rounded-2xl text-center space-y-4 max-w-xl mx-auto">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-[#0F2A56] text-white tracking-wider">
                      POCHETTE SUJETS &amp; COPIES • LFJP SALY
                    </span>
                    <div>
                      <h2 className="text-3xl font-black text-[#0F2A56]">
                        {packet.room.name}
                      </h2>
                      {packet.isTTRoom && (
                        <p className="text-xs font-extrabold text-purple-800 mt-1">
                          ♿ SALLE TIERS-TEMPS (+1/3 TEMPS)
                        </p>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-600 font-mono tabular-nums">
                      {packet.dateDisplay} {packet.timeRangeDisplay ? `• ${packet.timeRangeDisplay}` : ""}
                    </p>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-left">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-700">Nombre total de sujets / copies attendus :</span>
                        <span className="text-lg font-black text-[#0F2A56] font-mono tabular-nums">
                          {packet.rows.length}
                        </span>
                      </div>
                      {packet.subjectCounts.map((sc) => (
                        <div key={sc.subject} className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">{sc.subject}</span>
                          <span className="font-mono font-bold text-[#0F2A56] tabular-nums">
                            {sc.count} sujet(s) / copie(s)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                      <div className="p-2 rounded border border-slate-300">
                        <span className="text-[10px] font-bold text-slate-500 block">PRÉSENTS</span>
                        <span className="font-bold">_____</span>
                      </div>
                      <div className="p-2 rounded border border-slate-300">
                        <span className="text-[10px] font-bold text-slate-500 block">ABSENTS</span>
                        <span className="font-bold">_____</span>
                      </div>
                      <div className="p-2 rounded border border-slate-300">
                        <span className="text-[10px] font-bold text-slate-500 block">COPIES REMISES</span>
                        <span className="font-bold">_____</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 pt-1">
                      À rapporter immédiatement scellée au secrétariat des examens en fin d&apos;épreuve.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


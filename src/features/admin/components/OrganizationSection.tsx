import React, { useState, useMemo } from "react";
import {
  Shuffle,
  Grid,
  School,
  AlertCircle,
  Sparkles,
  Users,
  Layers,
  GraduationCap,
  Clock,
  UserCheck,
} from "lucide-react";
import type {
  CmsCandidate,
  CmsRoom,
  CmsTeacher,
  CmsExamSlot,
  CmsSurveillance,
} from "../../../shared/services/cms-store";

interface OrganizationSectionProps {
  candidates: CmsCandidate[];
  rooms: CmsRoom[];
  teachers?: CmsTeacher[];
  examSlots?: CmsExamSlot[];
  surveillances?: CmsSurveillance[];
  onSetCandidates: (candidates: CmsCandidate[]) => void;
  onSetSurveillances?: (surveillances: CmsSurveillance[]) => void;
  onShowNotification: (msg: string) => void;
}

export default function OrganizationSection({
  candidates,
  rooms,
  teachers = [],
  examSlots = [],
  surveillances = [],
  onSetCandidates,
  onSetSurveillances,
  onShowNotification,
}: OrganizationSectionProps) {
  // Main view tab: "eleves" or "surveillants"
  const [activeTab, setActiveTab] = useState<"eleves" | "surveillants">("eleves");

  // --- ELEVES BRASSAGE STATE ---
  const [dispatchMode, setDispatchMode] = useState<"brassage" | "alphabetique">("brassage");
  const [separateTT, setSeparateTT] = useState<boolean>(true);
  const [anonymatPrefix, setAnonymatPrefix] = useState<string>("DNB-");
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(() => rooms.map((r) => r.id));
  const [ttRoomIds, setTtRoomIds] = useState<string[]>(() => {
    const defaultTT = rooms.filter(
      (r) => r.name.toLowerCase().includes("tt") || r.notes?.toLowerCase().includes("tt")
    );
    return defaultTT.length > 0 ? defaultTT.map((r) => r.id) : rooms.length > 0 ? [rooms[rooms.length - 1].id] : [];
  });

  // --- SURVEILLANTS ASSIGNMENT STATE ---
  const [selectedSlotId, setSelectedSlotId] = useState<string>("all");

  // Summary by class
  const classBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    candidates.forEach((c) => {
      const cls = c.className || "Sans classe";
      map.set(cls, (map.get(cls) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [candidates]);

  // Selected mobilized rooms
  const selectedRooms = useMemo(() => {
    return rooms.filter((r) => selectedRoomIds.includes(r.id));
  }, [rooms, selectedRoomIds]);

  // Capacity of chosen rooms
  const selectedCapacity = useMemo(() => {
    return selectedRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  }, [selectedRooms]);

  // Total capacity of all rooms in school
  const totalCapacity = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  }, [rooms]);

  // Breakdown by room for the selected rooms
  const roomBreakdown = useMemo(() => {
    return rooms.map((r) => {
      const isMobilized = selectedRoomIds.includes(r.id);
      const isTT = ttRoomIds.includes(r.id);
      const assigned = candidates.filter((c) => c.roomName === r.name);
      const ttCount = assigned.filter((c) => c.accommodation?.includes("1/3")).length;
      return {
        room: r,
        isMobilized,
        isTT,
        assignedCount: assigned.length,
        ttCount,
        fillRate: r.capacity > 0 ? Math.round((assigned.length / r.capacity) * 100) : 0,
      };
    });
  }, [rooms, candidates, selectedRoomIds, ttRoomIds]);

  // Toggle room selection for candidate dispatch
  const handleToggleRoomSelection = (roomId: string) => {
    if (selectedRoomIds.includes(roomId)) {
      if (selectedRoomIds.length === 1) {
        alert("Vous devez conserver au moins une salle mobilisée.");
        return;
      }
      setSelectedRoomIds(selectedRoomIds.filter((id) => id !== roomId));
    } else {
      setSelectedRoomIds([...selectedRoomIds, roomId]);
    }
  };

  // Toggle room as Tiers-Temps
  const handleToggleTTRoom = (roomId: string) => {
    if (ttRoomIds.includes(roomId)) {
      setTtRoomIds(ttRoomIds.filter((id) => id !== roomId));
    } else {
      setTtRoomIds([...ttRoomIds, roomId]);
    }
  };

  // Main algorithm to dispatch candidates into the SELECTED rooms
  const handleRunDispatch = () => {
    if (candidates.length === 0) {
      alert("Aucun candidat importé. Veuillez d'abord importer des élèves dans Données > Élèves.");
      return;
    }
    if (selectedRooms.length === 0) {
      alert("Aucune salle sélectionnée. Veuillez cocher au moins une salle mobilisée.");
      return;
    }

    if (selectedCapacity < candidates.length) {
      const confirmProceed = confirm(
        `Attention : La capacité des salles sélectionnées (${selectedCapacity} places) est inférieure au nombre d'élèves (${candidates.length} élèves). Voulez-vous tout de même continuer ?`
      );
      if (!confirmProceed) return;
    }

    const updatedCandidates: CmsCandidate[] = [];
    const regularCandidates: CmsCandidate[] = [];
    const ttCandidates: CmsCandidate[] = [];

    // Separate regular and tiers-temps students if requested
    candidates.forEach((c) => {
      const isTT =
        Boolean(c.accommodation?.includes("1/3")) ||
        Boolean(c.accommodation?.toLowerCase().includes("tiers")) ||
        c.className.toLowerCase().includes("tt");
      if (separateTT && isTT) {
        ttCandidates.push({ ...c });
      } else {
        regularCandidates.push({ ...c });
      }
    });

    // Sort regular students according to mode
    let sortedRegular: CmsCandidate[] = [];
    if (dispatchMode === "brassage") {
      const byClass: Record<string, CmsCandidate[]> = {};
      regularCandidates.forEach((c) => {
        const cls = c.className || "Standard";
        if (!byClass[cls]) byClass[cls] = [];
        byClass[cls].push(c);
      });

      Object.keys(byClass).forEach((k) => {
        byClass[k].sort((a, b) => a.lastName.localeCompare(b.lastName));
      });

      const classKeys = Object.keys(byClass);
      let hasMore = true;
      let index = 0;
      while (hasMore) {
        hasMore = false;
        classKeys.forEach((k) => {
          if (byClass[k][index]) {
            sortedRegular.push(byClass[k][index]);
            hasMore = true;
          }
        });
        index++;
      }
    } else {
      sortedRegular = [...regularCandidates].sort((a, b) =>
        a.lastName.localeCompare(b.lastName)
      );
    }

    // Partition selected rooms into TT and Standard
    const chosenTtRooms = selectedRooms.filter((r) => ttRoomIds.includes(r.id));
    const chosenStdRooms = selectedRooms.filter((r) => !ttRoomIds.includes(r.id));

    // Fallbacks if user didn't specify TT room
    const finalTtRooms = chosenTtRooms.length > 0 ? chosenTtRooms : [selectedRooms[selectedRooms.length - 1]];
    const finalStdRooms = chosenStdRooms.length > 0 ? chosenStdRooms : selectedRooms;

    let globalAnonymatIndex = 101;

    // 1. Assign TT students into chosen TT rooms
    if (ttCandidates.length > 0) {
      let currentTTRoomIdx = 0;
      let currentTTTable = 1;

      ttCandidates.sort((a, b) => a.lastName.localeCompare(b.lastName));
      ttCandidates.forEach((student) => {
        const room = finalTtRooms[currentTTRoomIdx] || selectedRooms[0];
        student.roomName = room.name;
        student.tableNumber = String(currentTTTable);
        student.anonymatNumber = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
        updatedCandidates.push(student);

        currentTTTable++;
        globalAnonymatIndex++;
        if (currentTTTable > room.capacity && currentTTRoomIdx < finalTtRooms.length - 1) {
          currentTTRoomIdx++;
          currentTTTable = 1;
        }
      });
    }

    // 2. Assign Regular students into chosen Standard rooms
    let currentStdRoomIdx = 0;
    let currentStdTable = 1;

    sortedRegular.forEach((student) => {
      const room = finalStdRooms[currentStdRoomIdx] || selectedRooms[0];
      student.roomName = room.name;
      student.tableNumber = String(currentStdTable);
      student.anonymatNumber = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
      updatedCandidates.push(student);

      currentStdTable++;
      globalAnonymatIndex++;
      if (currentStdTable > room.capacity && currentStdRoomIdx < finalStdRooms.length - 1) {
        currentStdRoomIdx++;
        currentStdTable = 1;
      }
    });

    onSetCandidates(updatedCandidates);
    onShowNotification(
      `🎉 Répartition réussie ! ${updatedCandidates.length} élèves répartis dans les ${selectedRooms.length} salles sélectionnées (${selectedCapacity} places dispo).`
    );
  };

  // --- AUTOMATIC SUPERVISOR DISPATCH ALGORITHM ---
  const handleAutoDispatchSurveillants = () => {
    if (!onSetSurveillances) return;
    if (teachers.length === 0) {
      alert("Aucun professeur disponible. Importez ou ajoutez des professeurs dans Données > Professeurs.");
      return;
    }
    if (examSlots.length === 0) {
      alert("Aucun créneau d'épreuve programmé. Programmez d'abord des créneaux dans l'Étape 3 : Créneaux des Épreuves.");
      return;
    }

    // Keep count of assignments per teacher to ensure fairness
    const teacherLoad: Record<string, number> = {};
    teachers.forEach((t) => {
      const name = `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`;
      teacherLoad[name] = 0;
    });

    const newSurveillances: CmsSurveillance[] = [];

    // Slots to process: either selected slot or all slots
    const targetSlots = selectedSlotId === "all"
      ? examSlots
      : examSlots.filter((s) => s.id === selectedSlotId);

    targetSlots.forEach((slot) => {
      const mobilizedRooms = slot.roomNames && slot.roomNames.length > 0
        ? rooms.filter((r) => slot.roomNames!.includes(r.name))
        : rooms;

      // Track teachers assigned on this exact slot to avoid double-booking
      const assignedOnSlot = new Set<string>();

      mobilizedRooms.forEach((room) => {
        // Pick available teacher with lowest current load not yet assigned on this slot
        const availableTeachers = [...teachers]
          .map((t) => `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`)
          .filter((name) => !assignedOnSlot.has(name))
          .sort((a, b) => (teacherLoad[a] || 0) - (teacherLoad[b] || 0));

        if (availableTeachers.length > 0) {
          const chosen = availableTeachers[0];
          assignedOnSlot.add(chosen);
          teacherLoad[chosen] = (teacherLoad[chosen] || 0) + 1;

          newSurveillances.push({
            id: `surv-auto-${slot.id}-${room.id}-${Date.now()}-${Math.random()}`,
            examTitle: slot.examTitle,
            slotId: slot.id,
            teacherName: chosen,
            roomName: room.name,
            date: slot.date,
            timeSlot: `${slot.startTime} - ${slot.endTime}`,
            mission: "Surveillant titulaire",
          });
        }
      });
    });

    // Merge with existing surveillances for other slots if filtering a single slot
    if (selectedSlotId === "all") {
      onSetSurveillances(newSurveillances);
    } else {
      const remaining = surveillances.filter((s) => s.slotId !== selectedSlotId);
      onSetSurveillances([...remaining, ...newSurveillances]);
    }

    onShowNotification(
      `🎲 Brassage équitable des surveillants réussi ! ${newSurveillances.length} affectations générées sans conflits horaires.`
    );
  };

  // Manual assign or change surveillant for a specific room & slot
  const handleAssignTeacherToRoomSlot = (
    slot: CmsExamSlot,
    room: CmsRoom,
    teacherFullName: string
  ) => {
    if (!onSetSurveillances) return;

    // Remove existing surveillance for this exact slot and room
    const filtered = surveillances.filter(
      (s) =>
        !(
          (s.slotId === slot.id || (s.date === slot.date && s.timeSlot.includes(slot.startTime))) &&
          s.roomName === room.name
        )
    );

    if (teacherFullName) {
      filtered.push({
        id: `surv-${Date.now()}`,
        examTitle: slot.examTitle,
        slotId: slot.id,
        teacherName: teacherFullName,
        roomName: room.name,
        date: slot.date,
        timeSlot: `${slot.startTime} - ${slot.endTime}`,
        mission: "Surveillant titulaire",
      });
      onShowNotification(`${teacherFullName} affecté(e) à ${room.name} (${slot.subject}).`);
    } else {
      onShowNotification(`Surveillance retirée pour ${room.name}.`);
    }

    onSetSurveillances(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Étape 4 • Logistique & Brassage
            </span>
            <span className="text-xs text-slate-500">
              Affectation anti-fraude des candidats & attribution des surveillants
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Grid className="h-5 w-5 text-emerald-600" />
            <span>🧩 Répartition & Brassage (Élèves & Surveillants)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Mélange automatique des classes, attribution des tables et affectation équitable des professeurs surveillants par salle et par créneau.
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("eleves")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "eleves"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-sky-600" />
            <span>Élèves & Tables</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("surveillants")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "surveillants"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
            <span>Surveillants par Salle & Créneau</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: BRASSAGE ET RÉPARTITION DES ÉLÈVES                */}
      {/* ======================================================== */}
      {activeTab === "eleves" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleRunDispatch}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Lancer le Brassage des Candidats</span>
            </button>
          </div>

          {/* Options de répartition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Mode */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-[#3498db]" />
                <span>Mode d'agencement des candidats</span>
              </h3>

              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    dispatchMode === "brassage"
                      ? "border-[#3498db] bg-sky-50/60 ring-1 ring-[#3498db]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="dispatchMode"
                    checked={dispatchMode === "brassage"}
                    onChange={() => setDispatchMode("brassage")}
                    className="mt-0.5 text-[#3498db] focus:ring-[#3498db]"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">
                      🔀 Brassage Inter-Classes (Recommandé anti-fraude)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Alterne les élèves de chaque classe (3A, 3B, 3C) sur chaque rangée pour empêcher la triche entre camarades.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    dispatchMode === "alphabetique"
                      ? "border-[#3498db] bg-sky-50/60 ring-1 ring-[#3498db]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="dispatchMode"
                    checked={dispatchMode === "alphabetique"}
                    onChange={() => setDispatchMode("alphabetique")}
                    className="mt-0.5 text-[#3498db] focus:ring-[#3498db]"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">
                      🔤 Ordre Alphabétique Général
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Répartition séquentielle de A à Z sur l'ensemble de la cohorte.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Card Tiers-Temps & Anonymat */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                <span>Salles Tiers-Temps & Numéros d'Anonymat</span>
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={separateTT}
                    onChange={(e) => setSeparateTT(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span>Isoler les élèves Tiers-Temps dans une salle aménagée spécifique</span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Préfixe pour les codes d'anonymat
                  </label>
                  <input
                    type="text"
                    value={anonymatPrefix}
                    onChange={(e) => setAnonymatPrefix(e.target.value)}
                    placeholder="Ex: DNB-, BAC-26-"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Exemple généré : {anonymatPrefix}0101, {anonymatPrefix}0102...
                  </p>
                </div>

                {classBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-600 mb-1">
                      Classes détectées pour le brassage ({classBreakdown.length}) :
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {classBreakdown.map(([cls, count]) => (
                        <span
                          key={cls}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium"
                        >
                          {cls} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Salles Mobilisées & Remplissage */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <School className="h-4 w-4 text-emerald-600" />
                  <span>Salles mobilisées pour la répartition ({selectedRooms.length} / {rooms.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cochez les salles utilisées et désignez la salle réservée aux élèves à besoins particuliers (Tiers-Temps).
                </p>
              </div>

              {/* Capacity Banner Indicator */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${
                    selectedCapacity >= candidates.length
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  <span>
                    Capacité : {selectedCapacity} places / {candidates.length} élèves
                  </span>
                  {selectedCapacity >= candidates.length ? "✓" : "⚠️ Manque de places"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRoomIds(rooms.map((r) => r.id))}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Toutes
                </button>
              </div>
            </div>

            {/* Room Cards with Mobilization & TT toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomBreakdown.map(({ room, isMobilized, isTT, assignedCount, ttCount, fillRate }) => (
                <div
                  key={room.id}
                  className={`p-4 rounded-xl border transition space-y-3 ${
                    isMobilized
                      ? isTT
                        ? "border-purple-300 bg-purple-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-[#3498db] shadow-xs"
                      : "border-slate-200 bg-slate-100/60 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-900">
                      <input
                        type="checkbox"
                        checked={isMobilized}
                        onChange={() => handleToggleRoomSelection(room.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{room.name}</span>
                    </label>

                    <button
                      type="button"
                      disabled={!isMobilized}
                      onClick={() => handleToggleTTRoom(room.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                        isTT
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700"
                      }`}
                    >
                      {isTT ? "♿ Salle TT" : "+ Marquer TT"}
                    </button>
                  </div>

                  {isMobilized ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Élèves affectés :</span>
                        <span className="font-bold text-slate-900">
                          {assignedCount} / {room.capacity} places
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            fillRate > 100
                              ? "bg-rose-500"
                              : fillRate > 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(fillRate, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Remplissage : {fillRate}%</span>
                        {ttCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                            {ttCount} Tiers-temps
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Non mobilisée pour cette session (les élèves ne seront pas placés ici).
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: AFFECTATION ET BRASSAGE DES SURVEILLANTS          */}
      {/* ======================================================== */}
      {activeTab === "surveillants" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Créneau d'épreuve :</span>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 max-w-xs"
              >
                <option value="all">Tous les créneaux ({examSlots.length})</option>
                {examSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} • {s.subject} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAutoDispatchSurveillants}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <Sparkles className="h-4 w-4" />
              <span>🎲 Répartir équitablement les surveillants</span>
            </button>
          </div>

          {/* Slots & Rooms Grid Sorted Chronologically */}
          {examSlots.length === 0 ? (
            <div className="p-10 rounded-xl bg-white border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs">
              Aucun créneau d'épreuve configuré. Allez dans l'Étape 3 : "Créneaux des Épreuves" pour créer le calendrier.
            </div>
          ) : (
            <div className="space-y-6">
              {[...examSlots]
                .sort((a, b) => {
                  const d = (a.date || "").localeCompare(b.date || "");
                  if (d !== 0) return d;
                  return (a.startTime || "").localeCompare(b.startTime || "");
                })
                .filter((s) => selectedSlotId === "all" || s.id === selectedSlotId)
                .map((slot) => {
                  const mobilizedRooms = slot.roomNames && slot.roomNames.length > 0
                    ? rooms.filter((r) => slot.roomNames!.includes(r.name))
                    : selectedRooms;

                return (
                  <div
                    key={slot.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
                  >
                    {/* Slot Header */}
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <div>
                          <span className="font-bold text-sm text-slate-900">{slot.subject}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            ({slot.date} de {slot.startTime} à {slot.endTime})
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {slot.examTitle}
                      </span>
                    </div>

                    {/* Rooms Matrix */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mobilizedRooms.map((room) => {
                        const currentSurv = surveillances.find(
                          (s) =>
                            (s.slotId === slot.id ||
                              (s.date === slot.date && s.timeSlot.includes(slot.startTime))) &&
                            s.roomName === room.name
                        );

                        return (
                          <div
                            key={room.id}
                            className={`p-4 rounded-xl border transition space-y-3 ${
                              currentSurv
                                ? "border-emerald-200 bg-emerald-50/20"
                                : "border-rose-200 bg-rose-50/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <School className="h-4 w-4 text-slate-600" />
                                <span className="font-bold text-xs text-slate-900">{room.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                Capacité : {room.capacity}
                              </span>
                            </div>

                            {/* Surveillance Selector */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Enseignant Surveillant :
                              </label>
                              <select
                                value={currentSurv?.teacherName || ""}
                                onChange={(e) =>
                                  handleAssignTeacherToRoomSlot(slot, room, e.target.value)
                                }
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 ${
                                  currentSurv
                                    ? "border-emerald-300 font-bold text-slate-900"
                                    : "border-rose-300 text-rose-700"
                                }`}
                              >
                                <option value="">-- Non affecté (Salle non surveillée) --</option>
                                {teachers.map((t) => {
                                  const fullName = `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`;
                                  // Check if teacher is already assigned in another room on this slot
                                  const isAssignedElsewhere = surveillances.some(
                                    (s) =>
                                      (s.slotId === slot.id ||
                                        (s.date === slot.date && s.timeSlot.includes(slot.startTime))) &&
                                      s.roomName !== room.name &&
                                      s.teacherName === fullName
                                  );

                                  return (
                                    <option
                                      key={t.id}
                                      value={fullName}
                                      disabled={isAssignedElsewhere}
                                    >
                                      {fullName} ({t.subject})
                                      {isAssignedElsewhere ? " ⚠️ (Déjà mobilisé ailleurs)" : ""}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1">
                              {currentSurv ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  <span>Surveillance assurée</span>
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Salle sans surveillant !</span>
                                </span>
                              )}

                              {currentSurv && (
                                <button
                                  type="button"
                                  onClick={() => handleAssignTeacherToRoomSlot(slot, room, "")}
                                  className="text-[10px] text-slate-400 hover:text-rose-600"
                                >
                                  Retirer
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

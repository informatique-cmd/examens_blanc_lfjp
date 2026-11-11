import React, { useState, useMemo, useCallback } from "react";
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
  UserPlus,
  Plus,
  X,
  Trash2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import type {
  CmsCandidate,
  CmsRoom,
  CmsTeacher,
  CmsExam,
  CmsExamSlot,
  CmsSurveillance,
} from "../../../shared/services/cms-store";
import { isCandidateMatchingLevel } from "../../../shared/services/cms-store";

interface OrganizationSectionProps {
  candidates: CmsCandidate[];
  rooms: CmsRoom[];
  teachers?: CmsTeacher[];
  exams?: CmsExam[];
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
  exams = [],
  examSlots = [],
  surveillances = [],
  onSetCandidates,
  onSetSurveillances,
  onShowNotification,
}: OrganizationSectionProps) {
  // Main view tab: "eleves" or "surveillants"
  const [activeTab, setActiveTab] = useState<"eleves" | "surveillants">("eleves");

  // Selected Exam for Brassage
  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    return exams.length > 0 ? exams[0].id : "";
  });

  const selectedExam = useMemo(() => {
    if (exams.length === 0) return null;
    return exams.find((e) => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  // Candidates targeted for this exam (by level or by existing examName assignment)
  const targetCandidates = useMemo(() => {
    if (!selectedExam) return candidates;
    return candidates.filter((c) => {
      if (c.examName && c.examName.trim().toLowerCase() === selectedExam.title.trim().toLowerCase()) {
        return true;
      }
      return isCandidateMatchingLevel(c.className, selectedExam.targetLevel);
    });
  }, [candidates, selectedExam]);

  // Non-target candidates to protect from erasure during dispatch
  const nonTargetCandidates = useMemo(() => {
    const targetIds = new Set(targetCandidates.map((c) => c.id));
    return candidates.filter((c) => !targetIds.has(c.id));
  }, [candidates, targetCandidates]);

  // Exam slots belonging to the active exam
  const currentExamSlots = useMemo(() => {
    if (!selectedExam) return examSlots;
    return examSlots.filter(
      (s) => s.examTitle.trim().toLowerCase() === selectedExam.title.trim().toLowerCase()
    );
  }, [examSlots, selectedExam]);

  // --- ELEVES BRASSAGE STATE ---
  const [dispatchMode, setDispatchMode] = useState<"brassage" | "alphabetique">("brassage");
  const [separateTT, setSeparateTT] = useState<boolean>(true);
  const [anonymatPrefix, setAnonymatPrefix] = useState<string>(() => {
    if (selectedExam) {
      const clean = selectedExam.title.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return clean.length > 0 ? `${clean.slice(0, 4)}-` : "DNB-";
    }
    return "DNB-";
  });

  // Only mobilize the rooms chosen in the exam slots or previously assigned to candidates
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(() => {
    const slotRooms = new Set<string>();
    (examSlots || []).forEach((s) => {
      if (s.roomNames && Array.isArray(s.roomNames)) {
        s.roomNames.forEach((rn) => slotRooms.add(rn.trim().toLowerCase()));
      }
    });

    const candidateRooms = new Set<string>();
    (candidates || []).forEach((c) => {
      if (c.roomName) candidateRooms.add(c.roomName.trim().toLowerCase());
    });

    const chosenFromSlots = rooms.filter(
      (r) => slotRooms.has(r.name.trim().toLowerCase()) || candidateRooms.has(r.name.trim().toLowerCase())
    );

    if (chosenFromSlots.length > 0) {
      return chosenFromSlots.map((r) => r.id);
    }

    return rooms.slice(0, Math.min(4, rooms.length)).map((r) => r.id);
  });

  const [showAllSchoolRooms, setShowAllSchoolRooms] = useState<boolean>(false);

  const [ttRoomIds, setTtRoomIds] = useState<string[]>(() => {
    const defaultTT = rooms.filter(
      (r) => r.name.toLowerCase().includes("tt") || r.notes?.toLowerCase().includes("tt")
    );
    return defaultTT.length > 0 ? defaultTT.map((r) => r.id) : rooms.length > 0 ? [rooms[rooms.length - 1].id] : [];
  });

  // Automatically select rooms mobilized for current exam slots if available
  const handleMobilizeExamRooms = () => {
    if (currentExamSlots.length === 0) return;
    const names = new Set<string>();
    currentExamSlots.forEach((s) => {
      (s.roomNames || []).forEach((rn) => names.add(rn.trim().toLowerCase()));
    });
    const matchingRoomIds = rooms.filter((r) => names.has(r.name.trim().toLowerCase())).map((r) => r.id);
    if (matchingRoomIds.length > 0) {
      setSelectedRoomIds(matchingRoomIds);
      onShowNotification(`${matchingRoomIds.length} salle(s) mobilisée(s) selon les créneaux de ${selectedExam?.title || "l'examen"}.`);
    } else {
      onShowNotification("Aucune salle spécifique n'a été rattachée aux créneaux de cet examen.");
    }
  };

  // --- SURVEILLANTS ASSIGNMENT STATE ---
  const [selectedSlotId, setSelectedSlotId] = useState<string>("all");

  // --- CUSTOM ROOM CAPACITY (QUOTAS PAR SALLE) ---
  const [customRoomCapacities, setCustomRoomCapacities] = useState<Record<string, number>>({});

  // Helper to determine the effective capacity / quota of a room
  const getRoomQuota = useCallback((room: CmsRoom): number => {
    if (customRoomCapacities[room.id] !== undefined && customRoomCapacities[room.id] > 0) {
      return customRoomCapacities[room.id];
    }
    return room.capacity || 24;
  }, [customRoomCapacities]);

  // --- MANUAL ASSIGNMENT STATE ---
  const [isManualAssignOpen, setIsManualAssignOpen] = useState(false);
  const [manualCandidateId, setManualCandidateId] = useState<string>("");
  const [manualTargetRoomName, setManualTargetRoomName] = useState<string>("");
  const [manualTableNumber, setManualTableNumber] = useState<string>("");
  const [manualSearchTerm, setManualSearchTerm] = useState<string>("");
  const [inspectingRoomName, setInspectingRoomName] = useState<string | null>(null);

  // Summary by class for the TARGET candidates of the selected exam
  const classBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    targetCandidates.forEach((c) => {
      const cls = c.className || "Sans classe";
      map.set(cls, (map.get(cls) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [targetCandidates]);

  // Selected mobilized rooms
  const selectedRooms = useMemo(() => {
    return rooms.filter((r) => selectedRoomIds.includes(r.id));
  }, [rooms, selectedRoomIds]);

  // Total capacity of chosen rooms based on custom quotas
  const selectedCapacity = useMemo(() => {
    return selectedRooms.reduce((acc, r) => acc + getRoomQuota(r), 0);
  }, [selectedRooms, getRoomQuota]);

  // Total capacity of all rooms in school
  const totalCapacity = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  }, [rooms]);

  // Breakdown by room for the target candidates
  const roomBreakdown = useMemo(() => {
    const roomsToDisplay = showAllSchoolRooms
      ? rooms
      : rooms.filter((r) => selectedRoomIds.includes(r.id));

    return roomsToDisplay.map((r) => {
      const isMobilized = selectedRoomIds.includes(r.id);
      const isTT = ttRoomIds.includes(r.id);
      const assigned = targetCandidates.filter((c) => c.roomName === r.name);
      const ttCount = assigned.filter((c) => c.accommodation?.includes("1/3")).length;
      const quota = getRoomQuota(r);
      return {
        room: r,
        isMobilized,
        isTT,
        quota,
        assignedCount: assigned.length,
        ttCount,
        fillRate: quota > 0 ? Math.round((assigned.length / quota) * 100) : 0,
      };
    });
  }, [rooms, targetCandidates, selectedRoomIds, ttRoomIds, showAllSchoolRooms, getRoomQuota]);

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
    if (targetCandidates.length === 0) {
      alert(
        selectedExam
          ? `Aucun candidat ne correspond au niveau "${selectedExam.targetLevel}" ciblé par l'examen "${selectedExam.title}". Vérifiez vos données élèves dans Données > Élèves.`
          : "Aucun candidat importé. Veuillez d'abord importer des élèves dans Données > Élèves."
      );
      return;
    }
    if (selectedRooms.length === 0) {
      alert("Aucune salle sélectionnée. Veuillez cocher au moins une salle mobilisée.");
      return;
    }

    if (selectedCapacity < targetCandidates.length) {
      const confirmProceed = confirm(
        `Attention : La capacité des salles sélectionnées (${selectedCapacity} places) est inférieure au nombre d'élèves de cet examen (${targetCandidates.length} élèves). Voulez-vous tout de même continuer ?`
      );
      if (!confirmProceed) return;
    }

    const updatedCandidates: CmsCandidate[] = [];
    const regularCandidates: CmsCandidate[] = [];
    const ttCandidates: CmsCandidate[] = [];

    // Separate regular and tiers-temps students for this targeted exam
    targetCandidates.forEach((c) => {
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
    const examTitle = selectedExam ? selectedExam.title : "Examen Blanc";

    // 1. Assign TT students into chosen TT rooms
    if (ttCandidates.length > 0) {
      let currentTTRoomIdx = 0;
      let currentTTTable = 1;

      ttCandidates.sort((a, b) => a.lastName.localeCompare(b.lastName));
      ttCandidates.forEach((student) => {
        const room = finalTtRooms[currentTTRoomIdx] || selectedRooms[0];
        const roomLimit = getRoomQuota(room);
        student.roomName = room.name;
        student.tableNumber = String(currentTTTable);
        student.anonymatNumber = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
        student.examName = examTitle;
        updatedCandidates.push(student);

        currentTTTable++;
        globalAnonymatIndex++;
        if (currentTTTable > roomLimit && currentTTRoomIdx < finalTtRooms.length - 1) {
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
      const roomLimit = getRoomQuota(room);
      student.roomName = room.name;
      student.tableNumber = String(currentStdTable);
      student.anonymatNumber = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
      student.examName = examTitle;
      updatedCandidates.push(student);

      currentStdTable++;
      globalAnonymatIndex++;
      if (currentStdTable > roomLimit && currentStdRoomIdx < finalStdRooms.length - 1) {
        currentStdRoomIdx++;
        currentStdTable = 1;
      }
    });

    // Merge with non-target candidates so candidates from other exams are not deleted
    onSetCandidates([...nonTargetCandidates, ...updatedCandidates]);
    onShowNotification(
      `🎉 Répartition réussie pour "${examTitle}" ! ${updatedCandidates.length} élève(s) (${ttCandidates.length} TT) répartis dans les ${selectedRooms.length} salles selon vos quotas personnalisés.`
    );
  };

  const handleResetDispatch = () => {
    if (targetCandidates.length === 0) {
      alert("Aucun élève à réinitialiser pour cet examen.");
      return;
    }
    const confirmed = confirm(
      selectedExam
        ? `Voulez-vous réinitialiser l'affectation des élèves de la session "${selectedExam.title}" (${targetCandidates.length} élèves) ?\n\nCela effacera les salles attribuées, les numéros de table et les numéros d'anonymat pour cette session, sans toucher aux autres sessions ni supprimer les fiches.`
        : "Voulez-vous réinitialiser l'affectation des élèves ?"
    );
    if (!confirmed) return;

    const targetIds = new Set(targetCandidates.map((c) => c.id));
    const resetCandidates = candidates.map((c) => {
      if (targetIds.has(c.id)) {
        return {
          ...c,
          roomName: "",
          tableNumber: "",
          anonymatNumber: "",
        };
      }
      return c;
    });
    onSetCandidates(resetCandidates);
    onShowNotification(
      `Le brassage a été réinitialisé pour "${selectedExam?.title || "la session"}". Tous les élèves ciblés sont désormais en attente d'affectation.`
    );
  };

  // --- MANUAL ASSIGNMENT HELPERS ---
  const handleOpenManualAssign = (preselectedRoomName?: string) => {
    if (preselectedRoomName) {
      setManualTargetRoomName(preselectedRoomName);
    } else if (selectedRooms.length > 0) {
      setManualTargetRoomName(selectedRooms[0].name);
    }
    // Default to first unassigned candidate if available
    const unassigned = candidates.find((c) => !c.roomName);
    if (unassigned) {
      setManualCandidateId(unassigned.id);
    } else if (candidates.length > 0) {
      setManualCandidateId(candidates[0].id);
    }
    setIsManualAssignOpen(true);
  };

  const handleSaveManualAssignment = () => {
    if (!manualCandidateId) {
      alert("Veuillez sélectionner un élève.");
      return;
    }
    if (!manualTargetRoomName) {
      alert("Veuillez sélectionner une salle de destination.");
      return;
    }

    const targetCandidate = candidates.find((c) => c.id === manualCandidateId);
    if (!targetCandidate) return;

    // Auto-calculate table number if empty
    let finalTable = manualTableNumber.trim();
    if (!finalTable) {
      const inRoom = candidates.filter((c) => c.roomName === manualTargetRoomName);
      const maxTable = inRoom.reduce((max, c) => {
        const n = parseInt(c.tableNumber || "0", 10);
        return !isNaN(n) && n > max ? n : max;
      }, 0);
      finalTable = String(maxTable + 1);
    }

    const updated = candidates.map((c) => {
      if (c.id === manualCandidateId) {
        return {
          ...c,
          roomName: manualTargetRoomName,
          tableNumber: finalTable,
          anonymatNumber: c.anonymatNumber || `${anonymatPrefix}${String(100 + candidates.indexOf(c) + 1).padStart(4, "0")}`,
        };
      }
      return c;
    });

    onSetCandidates(updated);
    onShowNotification(
      `✅ Élève ${targetCandidate.lastName} ${targetCandidate.firstName} affecté(e) en ${manualTargetRoomName} (Table ${finalTable})`
    );
    setIsManualAssignOpen(false);
    setManualTableNumber("");
  };

  const handleRemoveCandidateFromRoom = (candidateId: string) => {
    const targetCandidate = candidates.find((c) => c.id === candidateId);
    const updated = candidates.map((c) => {
      if (c.id === candidateId) {
        return { ...c, roomName: "", tableNumber: "", anonymatNumber: "" };
      }
      return c;
    });
    onSetCandidates(updated);
    onShowNotification(`Élève ${targetCandidate?.lastName} retiré(e) de la salle.`);
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
          {/* EXAM SELECTOR BAR */}
          {exams.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs">
                    <Layers className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      1. Choisir la Session d'Examen pour le Brassage & les Salles
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cliquez sur une session pour filtrer automatiquement les élèves par niveau ciblé et organiser leurs salles.
                    </p>
                  </div>
                </div>
                {selectedExam && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMobilizeExamRooms}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition flex items-center gap-1.5"
                      title="Sélectionne automatiquement les salles indiquées sur les créneaux d'épreuves de cet examen"
                    >
                      <School className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Mobiliser les salles des épreuves</span>
                    </button>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Session active : {selectedExam.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Grid of Exam Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {exams.map((exam) => {
                  const isSelected = selectedExam?.id === exam.id;
                  const matchingCount = candidates.filter(
                    (c) =>
                      (c.examName && c.examName.trim().toLowerCase() === exam.title.trim().toLowerCase()) ||
                      isCandidateMatchingLevel(c.className, exam.targetLevel)
                  ).length;
                  const slotsCount = examSlots.filter(
                    (s) => s.examTitle.trim().toLowerCase() === exam.title.trim().toLowerCase()
                  ).length;

                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        const clean = exam.title.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        setAnonymatPrefix(clean.length > 0 ? `${clean.slice(0, 4)}-` : "DNB-");
                      }}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all relative ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 line-clamp-1">
                          {exam.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isSelected ? "Actif" : "Sélectionner"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200 font-semibold text-slate-700">
                          {exam.targetLevel || "Tous niveaux"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200 font-bold text-emerald-700">
                          {matchingCount} élève(s)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-500">
                          {slotsCount} épreuve(s)
                        </span>
                      </div>
                      {exam.period && (
                        <p className="text-[10px] text-slate-500 mt-1.5">
                          📅 Période : {exam.period}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons: Reset & Dispatch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-600">
              Session sélectionnée : <strong className="text-slate-900">{selectedExam?.title || "Examen général"}</strong> • Niveau : <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-800">{selectedExam?.targetLevel || "Tous niveaux"}</span> • Candidats ciblés : <strong className="text-emerald-700">{targetCandidates.length} élèves</strong>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleResetDispatch}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition shadow-2xs flex items-center gap-1.5"
                title="Efface les attributions pour cet examen"
              >
                <RotateCcw className="h-4 w-4 text-rose-600" />
                <span>Réinitialiser cet examen</span>
              </button>
              <button
                type="button"
                onClick={handleRunDispatch}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Lancer le Brassage ({targetCandidates.length} élèves)</span>
              </button>
            </div>
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
                      Alterne les élèves de chaque classe ({classBreakdown.map(([k]) => k).slice(0, 3).join(", ") || "classes"}) sur chaque rangée pour empêcher la triche entre camarades.
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
                  <span>Isoler les élèves Tiers-Temps dans la/les salle(s) dédiée(s)</span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Préfixe pour les codes d'anonymat ({selectedExam?.title || "Examen"})
                  </label>
                  <input
                    type="text"
                    value={anonymatPrefix}
                    onChange={(e) => setAnonymatPrefix(e.target.value)}
                    placeholder="Ex: BAC-, DNB-, TEST-"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Exemple généré : {anonymatPrefix}0101, {anonymatPrefix}0102...
                  </p>
                </div>

                {classBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-600 mb-1">
                      Classes ciblées ({classBreakdown.length}) :
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
                  <span>Salles mobilisées pour cet examen ({selectedRooms.length} / {rooms.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choisissez les salles et définissez la salle réservée aux élèves Tiers-Temps (les élèves TT iront exclusivement là-bas).
                </p>
              </div>

              {/* Capacity Banner Indicator */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${
                    selectedCapacity >= targetCandidates.length
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  <span>
                    Capacité : {selectedCapacity} places / {targetCandidates.length} élèves
                  </span>
                  {selectedCapacity >= targetCandidates.length ? "✓" : "⚠️ Manque de places"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllSchoolRooms(!showAllSchoolRooms)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  {showAllSchoolRooms ? "Afficher uniquement les salles mobilisées" : "+ Afficher toutes les salles"}
                </button>
              </div>
            </div>

            {/* Room Cards with Mobilization & TT toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomBreakdown.map(({ room, isMobilized, isTT, assignedCount, ttCount, fillRate, quota }) => (
                <div
                  key={room.id}
                  className={`p-4 rounded-xl border-2 transition space-y-3 ${
                    isMobilized
                      ? isTT
                        ? "border-purple-400 bg-purple-50/50 shadow-xs ring-1 ring-purple-200"
                        : "border-slate-300 bg-white hover:border-[#3498db] shadow-xs"
                      : "border-dashed border-slate-200 bg-slate-100/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-900">
                      <input
                        type="checkbox"
                        checked={isMobilized}
                        onChange={() => handleToggleRoomSelection(room.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>{room.name}</span>
                    </label>

                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                      Cap. {room.capacity} pl.
                    </span>
                  </div>

                  {/* Prominent Standard vs Tiers-Temps Categorization Switch */}
                  {isMobilized && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            if (isTT) handleToggleTTRoom(room.id);
                          }}
                          className={`flex-1 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                            !isTT
                              ? "bg-white text-slate-900 shadow-2xs border border-slate-300/80"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          🏫 Standard
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isTT) handleToggleTTRoom(room.id);
                          }}
                          className={`flex-1 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                            isTT
                              ? "bg-purple-600 text-white shadow-2xs font-bold"
                              : "text-purple-700 hover:bg-purple-100/60"
                          }`}
                        >
                          ♿ Tiers-Temps
                        </button>
                      </div>

                      {isTT ? (
                        <p className="text-[10px] text-purple-800 font-semibold flex items-center gap-1">
                          <span>♿ Réservée exclusivement aux élèves Tiers-Temps (+1/3).</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>🏫 Accueil des élèves standards (brassage anti-fraude).</span>
                        </p>
                      )}
                    </div>
                  )}

                  {isMobilized ? (
                    <>
                      {/* Quota Setting for this room */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <SlidersHorizontal className="h-3 w-3 text-blue-600" />
                            <span>Quota d'élèves pour cette salle :</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={100}
                              value={quota}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setCustomRoomCapacities((prev) => ({
                                  ...prev,
                                  [room.id]: isNaN(val) || val <= 0 ? 1 : val,
                                }));
                              }}
                              className="w-16 px-2 py-0.5 text-xs font-bold text-center border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-slate-400">places</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Capacité physique : <strong>{room.capacity}</strong> places. La répartition placera au maximum <strong>{quota}</strong> élèves ici.
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Élèves affectés :</span>
                        <span className="font-bold text-slate-900">
                          {assignedCount} / {quota} prévus ({room.capacity} max phys.)
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
                        <span>Remplissage quota : {fillRate}%</span>
                        {ttCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                            {ttCount} Tiers-temps
                          </span>
                        )}
                      </div>

                      {/* Action buttons on room card */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenManualAssign(room.name)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition flex items-center gap-1 border border-blue-200"
                        >
                          <UserPlus className="h-3 w-3" />
                          <span>+ Ajouter élève</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInspectingRoomName(inspectingRoomName === room.name ? null : room.name)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition flex items-center gap-1"
                        >
                          <span>Élèves ({assignedCount})</span>
                          {inspectingRoomName === room.name ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      {/* Expandable list of students in this room */}
                      {inspectingRoomName === room.name && (
                        <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {assignedCount === 0 ? (
                            <p className="text-[11px] text-slate-400 italic text-center py-2">
                              Aucun élève affecté à cette salle.
                            </p>
                          ) : (
                            targetCandidates
                              .filter((c) => c.roomName === room.name)
                              .sort((a, b) => (parseInt(a.tableNumber || "0", 10) - parseInt(b.tableNumber || "0", 10)))
                              .map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]"
                                >
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="font-bold text-blue-700 w-6 text-center shrink-0">
                                      T.{c.tableNumber || "?"}
                                    </span>
                                    <span className="font-semibold text-slate-900 truncate">
                                      {c.lastName} {c.firstName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0">({c.className})</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCandidateFromRoom(c.id)}
                                    title="Retirer de la salle"
                                    className="p-1 text-slate-400 hover:text-rose-600 transition shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))
                          )}
                        </div>
                      )}
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

      {/* MODAL: MANUAL CANDIDATE ASSIGNMENT */}
      {isManualAssignOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-700">
                <UserPlus className="h-5 w-5" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Affecter Manuellement un Élève à une Salle
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsManualAssignOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Search candidate filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Rechercher et sélectionner l'élève :
                </label>
                <div className="relative mb-2">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={manualSearchTerm}
                    onChange={(e) => setManualSearchTerm(e.target.value)}
                    placeholder="Filtrer par nom, prénom ou classe..."
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <select
                  value={manualCandidateId}
                  onChange={(e) => setManualCandidateId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                  size={5}
                >
                  {candidates
                    .filter((c) => {
                      if (!manualSearchTerm.trim()) return true;
                      const term = manualSearchTerm.toLowerCase();
                      return (
                        c.lastName.toLowerCase().includes(term) ||
                        c.firstName.toLowerCase().includes(term) ||
                        c.className.toLowerCase().includes(term)
                      );
                    })
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.lastName} {c.firstName} ({c.className}) — {c.roomName ? `Actuellement en ${c.roomName} (T.${c.tableNumber || "?"})` : "⚠️ Non affecté"} {c.accommodation ? `[${c.accommodation}]` : ""}
                      </option>
                    ))}
                </select>
              </div>

              {/* Target Room */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Salle de destination :
                </label>
                <select
                  value={manualTargetRoomName}
                  onChange={(e) => setManualTargetRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 bg-white"
                >
                  {rooms.map((r) => {
                    const assignedInRoom = candidates.filter((c) => c.roomName === r.name).length;
                    const quota = getRoomQuota(r);
                    return (
                      <option key={r.id} value={r.name}>
                        {r.name} ({assignedInRoom} / {quota} places prévues - max {r.capacity})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Table Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. N° de table (optionnel - auto-calculé si vide) :
                </label>
                <input
                  type="text"
                  value={manualTableNumber}
                  onChange={(e) => setManualTableNumber(e.target.value)}
                  placeholder="Laisser vide pour affecter automatiquement le prochain numéro"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManualAssignOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveManualAssignment}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <UserCheck className="h-4 w-4" />
                <span>Confirmer l'affectation</span>
              </button>
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

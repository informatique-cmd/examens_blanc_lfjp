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
import {
  isCandidateMatchingLevel,
  getExamTargetLevels,
  getShortLevelBadge,
  isCandidateTiersTemps,
  getCandidateAssignmentForExam,
} from "../../../shared/services/cms-store";

type DispatchMode = "brassage" | "alphabetique" | "classe" | "specialite";

interface OrganizationSectionProps {
  candidates: CmsCandidate[];
  rooms: CmsRoom[];
  teachers?: CmsTeacher[];
  exams?: CmsExam[];
  examSlots?: CmsExamSlot[];
  surveillances?: CmsSurveillance[];
  onSetCandidates: (candidates: CmsCandidate[]) => void;
  onSetSurveillances?: (surveillances: CmsSurveillance[]) => void;
  onUpdateExam?: (id: string, updates: Partial<CmsExam>) => void;
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
  onUpdateExam,
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

  // Candidates targeted strictly for this exam (by selected school level(s) or explicit per-exam assignment)
  const targetCandidates = useMemo(() => {
    if (!selectedExam) return candidates;
    const levels = getExamTargetLevels(selectedExam);
    return candidates.filter((c) => {
      if (c.assignmentsByExam?.[selectedExam.id]?.roomName) {
        return true;
      }
      if (c.examName && c.examName.trim().toLowerCase() === selectedExam.title.trim().toLowerCase()) {
        return true;
      }
      return isCandidateMatchingLevel(c.className, levels);
    });
  }, [candidates, selectedExam]);

  // Non-target candidates to protect from erasure during dispatch
  const nonTargetCandidates = useMemo(() => {
    const targetIds = new Set(targetCandidates.map((c) => c.id));
    return candidates.filter((c) => !targetIds.has(c.id));
  }, [candidates, targetCandidates]);

  // Exam slots belonging strictly to the active exam
  const currentExamSlots = useMemo(() => {
    if (!selectedExam) return examSlots;
    const titleNorm = selectedExam.title.trim().toLowerCase();
    return examSlots.filter(
      (s) => s.examId === selectedExam.id || s.examTitle.trim().toLowerCase() === titleNorm
    );
  }, [examSlots, selectedExam]);

  // --- ELEVES BRASSAGE STATE (persisted per exam with local state mirror) ---
  const [dispatchModeMap, setDispatchModeMap] = useState<Record<string, DispatchMode>>({});
  const dispatchMode: DispatchMode = useMemo(() => {
    if (!selectedExam) return "brassage";
    return dispatchModeMap[selectedExam.id] || selectedExam.dispatchMode || "brassage";
  }, [selectedExam, dispatchModeMap]);

  const handleSetDispatchMode = (mode: DispatchMode) => {
    if (!selectedExam) return;
    setDispatchModeMap((prev) => ({ ...prev, [selectedExam.id]: mode }));
    onUpdateExam?.(selectedExam.id, { dispatchMode: mode });
  };

  const [separateTT, setSeparateTT] = useState<boolean>(true);
  const [anonymatPrefixMap, setAnonymatPrefixMap] = useState<Record<string, string>>({});
  const defaultPrefixForExam = (exam: CmsExam | null) => {
    if (!exam) return "DNB-";
    if (exam.anonymatPrefix) return exam.anonymatPrefix;
    const clean = exam.title.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return clean.length > 0 ? `${clean.slice(0, 4)}-` : "DNB-";
  };
  const anonymatPrefix = useMemo(() => {
    if (!selectedExam) return "DNB-";
    return anonymatPrefixMap[selectedExam.id] ?? defaultPrefixForExam(selectedExam);
  }, [selectedExam, anonymatPrefixMap]);

  const setAnonymatPrefix = (val: string) => {
    if (!selectedExam) return;
    setAnonymatPrefixMap((prev) => ({ ...prev, [selectedExam.id]: val }));
  };

  // Per-exam room mobilization: examId -> roomIds[]
  const [examRoomMap, setExamRoomMap] = useState<Record<string, string[]>>({});
  // Per-exam TT room designation: examId -> roomIds[]
  const [examTTRoomMap, setExamTTRoomMap] = useState<Record<string, string[]>>({});

  const [showAllSchoolRooms, setShowAllSchoolRooms] = useState<boolean>(false);

  // Helper to determine the mobilized room IDs strictly for a given exam
  const getExamMobilizedRoomIds = useCallback((exam: CmsExam | null): string[] => {
    if (!exam) return [];
    if (examRoomMap[exam.id] !== undefined) {
      return examRoomMap[exam.id];
    }
    if (Array.isArray(exam.mobilizedRoomIds) && exam.mobilizedRoomIds.length > 0) {
      return exam.mobilizedRoomIds;
    }

    const slotRooms = new Set<string>();
    const titleNorm = exam.title.trim().toLowerCase();
    (examSlots || []).forEach((s) => {
      if ((s.examId === exam.id || s.examTitle.trim().toLowerCase() === titleNorm) && s.roomNames) {
        s.roomNames.forEach((rn) => slotRooms.add(rn.trim().toLowerCase()));
      }
    });

    // Rooms already assigned specifically to candidates of THIS exam
    (candidates || []).forEach((c) => {
      const assigned = getCandidateAssignmentForExam(c, exam, examSlots, rooms);
      if (assigned.roomName) {
        slotRooms.add(assigned.roomName.trim().toLowerCase());
      }
    });

    const matched = rooms.filter((r) => slotRooms.has(r.name.trim().toLowerCase()));
    return matched.map((r) => r.id);
  }, [examRoomMap, examSlots, candidates, rooms]);

  // Selected room IDs strictly for the CURRENT selected exam
  const selectedRoomIds = useMemo(() => {
    return getExamMobilizedRoomIds(selectedExam);
  }, [selectedExam, getExamMobilizedRoomIds]);

  // Helper to determine TT room IDs strictly for a given exam
  const ttRoomIds = useMemo(() => {
    if (!selectedExam) return [];
    if (examTTRoomMap[selectedExam.id] !== undefined) {
      return examTTRoomMap[selectedExam.id];
    }
    if (Array.isArray(selectedExam.ttRoomIds)) {
      return selectedExam.ttRoomIds;
    }
    const defaultTT = rooms.filter(
      (r) =>
        selectedRoomIds.includes(r.id) &&
        (r.name.toLowerCase().includes("tt") ||
          r.notes?.toLowerCase().includes("tiers") ||
          r.notes?.toLowerCase().includes("tt"))
    );
    return defaultTT.map((r) => r.id);
  }, [selectedExam, examTTRoomMap, selectedRoomIds, rooms]);

  // Automatically select rooms mobilized for current exam slots if available
  const handleMobilizeExamRooms = () => {
    if (!selectedExam) return;
    const names = new Set<string>();
    currentExamSlots.forEach((s) => {
      (s.roomNames || []).forEach((rn) => names.add(rn.trim().toLowerCase()));
    });
    const matchingRoomIds = rooms.filter((r) => names.has(r.name.trim().toLowerCase())).map((r) => r.id);
    if (matchingRoomIds.length > 0) {
      setExamRoomMap((prev) => ({
        ...prev,
        [selectedExam.id]: matchingRoomIds,
      }));
      onUpdateExam?.(selectedExam.id, { mobilizedRoomIds: matchingRoomIds });
      onShowNotification(`${matchingRoomIds.length} salle(s) mobilisée(s) pour "${selectedExam.title}".`);
    } else {
      onShowNotification(`Aucune salle spécifique n'a encore été cochée dans les créneaux de "${selectedExam.title}". Cliquez sur "+ Afficher toutes les salles" pour en mobiliser manuellement.`);
    }
  };

  // Toggle room selection for candidate dispatch of the ACTIVE exam
  const handleToggleRoomSelection = (roomId: string) => {
    if (!selectedExam) return;
    const current = selectedRoomIds;
    const next = current.includes(roomId)
      ? current.filter((id) => id !== roomId)
      : [...current, roomId];
    setExamRoomMap((prev) => ({
      ...prev,
      [selectedExam.id]: next,
    }));
    onUpdateExam?.(selectedExam.id, { mobilizedRoomIds: next });
  };

  // --- CUSTOM ROOM CAPACITY (QUOTAS PAR SALLE) ---
  const [customRoomCapacities, setCustomRoomCapacities] = useState<Record<string, number>>({});

  // Helper to determine the effective capacity / quota of a room for the active exam
  const getRoomQuota = useCallback((room: CmsRoom): number => {
    const key = selectedExam ? `${selectedExam.id}:${room.id}` : room.id;
    if (customRoomCapacities[key] !== undefined && customRoomCapacities[key] > 0) {
      return customRoomCapacities[key];
    }
    const persisted = selectedExam?.customRoomQuotas?.[room.id];
    if (persisted !== undefined && persisted > 0) {
      return persisted;
    }
    return room.capacity || 24;
  }, [customRoomCapacities, selectedExam]);

  // Toggle room as Tiers-Temps for the ACTIVE exam AND auto-assign TT/PAP/PPS students of that exam's level
  const handleToggleTTRoom = (roomId: string) => {
    if (!selectedExam) return;
    const current = ttRoomIds;
    const turningOn = !current.includes(roomId);
    const nextTT = turningOn
      ? [...current, roomId]
      : current.filter((id) => id !== roomId);

    setExamTTRoomMap((prev) => ({
      ...prev,
      [selectedExam.id]: nextTT,
    }));
    onUpdateExam?.(selectedExam.id, { ttRoomIds: nextTT });

    const toggledRoom = rooms.find((r) => r.id === roomId);
    if (turningOn && toggledRoom) {
      const activeTtRooms = rooms.filter((r) => nextTT.includes(r.id));
      const ttStudents = targetCandidates
        .filter((c) => isCandidateTiersTemps(c))
        .sort((a, b) => a.lastName.localeCompare(b.lastName));

      if (ttStudents.length === 0) {
        onShowNotification(
          `♿ Salle "${toggledRoom.name}" définie en Salle Tiers-Temps. Aucun élève PAP/PPS/Tiers-Temps détecté sur le niveau ciblé pour l'instant.`
        );
        return;
      }

      // Automatically assign all TT students of this session's level directly into the TT room(s)
      const ttRoomList = activeTtRooms.length > 0 ? activeTtRooms : [toggledRoom];
      let roomIdx = 0;
      let tableNum = 1;
      const assignmentMap = new Map<string, { roomName: string; tableNumber: string; anonymatNumber: string }>();

      ttStudents.forEach((st, idx) => {
        const destRoom = ttRoomList[roomIdx] || toggledRoom;
        const limit = getRoomQuota(destRoom);
        const existingAssign = getCandidateAssignmentForExam(st, selectedExam, currentExamSlots, rooms);
        const anon =
          existingAssign.anonymatNumber ||
          `${anonymatPrefix}TT${String(idx + 1).padStart(3, "0")}`;

        assignmentMap.set(st.id, {
          roomName: destRoom.name,
          tableNumber: String(tableNum),
          anonymatNumber: anon,
        });

        tableNum++;
        if (tableNum > limit && roomIdx < ttRoomList.length - 1) {
          roomIdx++;
          tableNum = 1;
        }
      });

      const updatedCandidates = candidates.map((c) => {
        const assign = assignmentMap.get(c.id);
        if (!assign) return c;
        return {
          ...c,
          roomName: assign.roomName,
          tableNumber: assign.tableNumber,
          anonymatNumber: assign.anonymatNumber,
          examName: selectedExam.title,
          assignmentsByExam: {
            ...(c.assignmentsByExam || {}),
            [selectedExam.id]: assign,
          },
        };
      });

      onSetCandidates(updatedCandidates);
      onShowNotification(
        `♿ Salle "${toggledRoom.name}" définie en Tiers-Temps : ${ttStudents.length} élève(s) PAP / PPS / Tiers-Temps détecté(s) et affecté(s) automatiquement !`
      );
    } else if (toggledRoom) {
      onShowNotification(`Salle "${toggledRoom.name}" repassée en salle Standard.`);
    }
  };

  // --- SURVEILLANTS ASSIGNMENT STATE ---
  const [selectedSlotId, setSelectedSlotId] = useState<string>("all");

  // --- MANUAL ASSIGNMENT STATE (Multi-selection) ---
  const [isManualAssignOpen, setIsManualAssignOpen] = useState(false);
  const [manualSelectedIds, setManualSelectedIds] = useState<string[]>([]);
  const [manualClassFilter, setManualClassFilter] = useState<string>("all");
  const [manualTargetRoomName, setManualTargetRoomName] = useState<string>("");
  const [manualRoomLocked, setManualRoomLocked] = useState<boolean>(false);
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

  // Selected mobilized rooms for this active exam
  const selectedRooms = useMemo(() => {
    return rooms.filter((r) => selectedRoomIds.includes(r.id));
  }, [rooms, selectedRoomIds]);

  // Total capacity of chosen rooms based on custom quotas
  const selectedCapacity = useMemo(() => {
    return selectedRooms.reduce((acc, r) => acc + getRoomQuota(r), 0);
  }, [selectedRooms, getRoomQuota]);

  // Breakdown by room strictly for the target candidates and assignments of the SELECTED exam
  const roomBreakdown = useMemo(() => {
    const roomsToDisplay = showAllSchoolRooms
      ? rooms
      : rooms.filter((r) => selectedRoomIds.includes(r.id));

    return roomsToDisplay.map((r) => {
      const isMobilized = selectedRoomIds.includes(r.id);
      const isTT = ttRoomIds.includes(r.id);
      const assigned = targetCandidates.filter(
        (c) => getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms).roomName === r.name
      );
      const ttCount = assigned.filter((c) => isCandidateTiersTemps(c)).length;
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
  }, [rooms, targetCandidates, selectedExam, currentExamSlots, selectedRoomIds, ttRoomIds, showAllSchoolRooms, getRoomQuota]);

  // Main algorithm to dispatch candidates strictly for the ACTIVE exam into its SELECTED rooms
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
      alert("Aucune salle sélectionnée pour cet examen. Veuillez cocher au moins une salle mobilisée.");
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
      if (separateTT && isCandidateTiersTemps(c)) {
        ttCandidates.push({ ...c });
      } else {
        regularCandidates.push({ ...c });
      }
    });

    // Partition selected rooms into TT and Standard
    const chosenTtRooms = selectedRooms.filter((r) => ttRoomIds.includes(r.id));
    const chosenStdRooms = selectedRooms.filter((r) => !ttRoomIds.includes(r.id));

    const finalTtRooms =
      chosenTtRooms.length > 0 ? chosenTtRooms : [selectedRooms[selectedRooms.length - 1]];
    const finalStdRooms = chosenStdRooms.length > 0 ? chosenStdRooms : selectedRooms;

    let globalAnonymatIndex = 101;
    const examTitle = selectedExam ? selectedExam.title : "Examen Blanc";

    const applyStudentAssignment = (
      student: CmsCandidate,
      roomName: string,
      tableNumber: string,
      anonymatNumber: string
    ): CmsCandidate => {
      const assignment = { roomName, tableNumber, anonymatNumber };
      return {
        ...student,
        roomName,
        tableNumber,
        anonymatNumber,
        examName: examTitle,
        ...(selectedExam
          ? {
              assignmentsByExam: {
                ...(student.assignmentsByExam || {}),
                [selectedExam.id]: assignment,
              },
            }
          : {}),
      };
    };

    // 1. Assign TT students into chosen TT rooms
    if (ttCandidates.length > 0) {
      let currentTTRoomIdx = 0;
      let currentTTTable = 1;

      ttCandidates.sort((a, b) => a.lastName.localeCompare(b.lastName));
      ttCandidates.forEach((student) => {
        const room = finalTtRooms[currentTTRoomIdx] || selectedRooms[0];
        const roomLimit = getRoomQuota(room);
        const anon = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
        updatedCandidates.push(
          applyStudentAssignment(student, room.name, String(currentTTTable), anon)
        );

        currentTTTable++;
        globalAnonymatIndex++;
        if (currentTTTable > roomLimit && currentTTRoomIdx < finalTtRooms.length - 1) {
          currentTTRoomIdx++;
          currentTTTable = 1;
        }
      });
    }

    // 2. Assign Regular students according to selected dispatchMode
    const assignGroupedBlocks = (groups: CmsCandidate[][]) => {
      // If we have at least one dedicated room per group, give each group its own dedicated room(s)
      if (finalStdRooms.length >= groups.length && groups.length > 1) {
        let roomCursor = 0;
        groups.forEach((group) => {
          let tableNum = 1;
          group.forEach((student) => {
            const room = finalStdRooms[roomCursor] || finalStdRooms[finalStdRooms.length - 1];
            const limit = getRoomQuota(room);
            if (tableNum > limit && roomCursor < finalStdRooms.length - 1) {
              roomCursor++;
              tableNum = 1;
            }
            const activeRoom = finalStdRooms[roomCursor] || finalStdRooms[finalStdRooms.length - 1];
            const anon = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
            updatedCandidates.push(
              applyStudentAssignment(student, activeRoom.name, String(tableNum), anon)
            );
            tableNum++;
            globalAnonymatIndex++;
          });
          if (roomCursor < finalStdRooms.length - 1) {
            roomCursor++;
          }
        });
      } else {
        // Contiguous blocks across available standard rooms
        const flat = groups.flat();
        let roomIdx = 0;
        let tableNum = 1;
        flat.forEach((student) => {
          const room = finalStdRooms[roomIdx] || selectedRooms[0];
          const limit = getRoomQuota(room);
          const anon = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
          updatedCandidates.push(
            applyStudentAssignment(student, room.name, String(tableNum), anon)
          );
          tableNum++;
          globalAnonymatIndex++;
          if (tableNum > limit && roomIdx < finalStdRooms.length - 1) {
            roomIdx++;
            tableNum = 1;
          }
        });
      }
    };

    if (dispatchMode === "classe") {
      const byClass = new Map<string, CmsCandidate[]>();
      regularCandidates.forEach((c) => {
        const key = (c.className || "Sans classe").trim();
        if (!byClass.has(key)) byClass.set(key, []);
        byClass.get(key)!.push(c);
      });
      const groups = Array.from(byClass.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, list]) => list.sort((a, b) => a.lastName.localeCompare(b.lastName)));
      assignGroupedBlocks(groups);
    } else if (dispatchMode === "specialite") {
      const bySpec = new Map<string, CmsCandidate[]>();
      regularCandidates.forEach((c) => {
        const spec = (c.specialty || (Array.isArray(c.options) ? c.options.join(", ") : "") || "").trim() || "Tronc Commun / Générale";
        if (!bySpec.has(spec)) bySpec.set(spec, []);
        bySpec.get(spec)!.push(c);
      });
      const groups = Array.from(bySpec.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, list]) => list.sort((a, b) => a.lastName.localeCompare(b.lastName)));
      assignGroupedBlocks(groups);
    } else {
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

      let currentStdRoomIdx = 0;
      let currentStdTable = 1;

      sortedRegular.forEach((student) => {
        const room = finalStdRooms[currentStdRoomIdx] || selectedRooms[0];
        const roomLimit = getRoomQuota(room);
        const anon = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
        updatedCandidates.push(
          applyStudentAssignment(student, room.name, String(currentStdTable), anon)
        );

        currentStdTable++;
        globalAnonymatIndex++;
        if (currentStdTable > roomLimit && currentStdRoomIdx < finalStdRooms.length - 1) {
          currentStdRoomIdx++;
          currentStdTable = 1;
        }
      });
    }

    if (selectedExam) {
      onUpdateExam?.(selectedExam.id, {
        mobilizedRoomIds: selectedRoomIds,
        ttRoomIds,
        anonymatPrefix,
        dispatchMode,
      });
    }

    // Merge with non-target candidates so candidates from other exams are untouched
    onSetCandidates([...nonTargetCandidates, ...updatedCandidates]);
    onShowNotification(
      `🎉 Répartition réussie pour "${examTitle}" ! ${updatedCandidates.length} élève(s) (${ttCandidates.length} Tiers-Temps) répartis dans ${selectedRooms.length} salle(s).`
    );
  };

  const handleResetDispatch = () => {
    if (targetCandidates.length === 0) {
      alert("Aucun élève à réinitialiser pour cet examen.");
      return;
    }
    const confirmed = confirm(
      selectedExam
        ? `Voulez-vous réinitialiser l'affectation des élèves de la session "${selectedExam.title}" (${targetCandidates.length} élèves) ?\n\nCela effacera uniquement les salles attribuées pour cette session, sans toucher aux autres sessions ni supprimer les fiches élèves.`
        : "Voulez-vous réinitialiser l'affectation des élèves ?"
    );
    if (!confirmed) return;

    const targetIds = new Set(targetCandidates.map((c) => c.id));
    const resetCandidates = candidates.map((c) => {
      if (!targetIds.has(c.id)) return c;
      const nextByExam = { ...(c.assignmentsByExam || {}) };
      if (selectedExam) {
        delete nextByExam[selectedExam.id];
      }
      const fallbackKeys = Object.keys(nextByExam);
      const fallbackAssign = fallbackKeys.length > 0 ? nextByExam[fallbackKeys[0]] : null;
      return {
        ...c,
        assignmentsByExam: nextByExam,
        roomName: fallbackAssign ? fallbackAssign.roomName : "",
        tableNumber: fallbackAssign ? fallbackAssign.tableNumber : "",
        anonymatNumber: fallbackAssign ? fallbackAssign.anonymatNumber : "",
      };
    });
    onSetCandidates(resetCandidates);
    onShowNotification(
      `Le brassage a été réinitialisé pour "${selectedExam?.title || "la session"}".`
    );
  };

  // --- MANUAL ASSIGNMENT HELPERS (MULTI-SELECT BATCH ADD) ---
  const handleOpenManualAssign = (preselectedRoomName?: string) => {
    if (preselectedRoomName) {
      setManualTargetRoomName(preselectedRoomName);
      setManualRoomLocked(true);
    } else if (selectedRooms.length > 0) {
      setManualTargetRoomName(selectedRooms[0].name);
      setManualRoomLocked(false);
    } else if (rooms.length > 0) {
      setManualTargetRoomName(rooms[0].name);
      setManualRoomLocked(false);
    }
    setManualSelectedIds([]);
    setManualClassFilter("all");
    setManualSearchTerm("");
    setManualTableNumber("");
    setIsManualAssignOpen(true);
  };

  const filteredManualCandidates = useMemo(() => {
    return targetCandidates.filter((c) => {
      const matchClass = manualClassFilter === "all" || c.className === manualClassFilter;
      if (!matchClass) return false;
      if (!manualSearchTerm.trim()) return true;
      const term = manualSearchTerm.toLowerCase();
      return (
        c.lastName.toLowerCase().includes(term) ||
        c.firstName.toLowerCase().includes(term) ||
        c.className.toLowerCase().includes(term) ||
        (c.specialty && c.specialty.toLowerCase().includes(term))
      );
    });
  }, [targetCandidates, manualClassFilter, manualSearchTerm]);

  const handleToggleManualCandidate = (id: string) => {
    setManualSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveManualAssignment = () => {
    if (manualSelectedIds.length === 0) {
      alert("Veuillez cocher au moins un élève à affecter.");
      return;
    }
    if (!manualTargetRoomName) {
      alert("Veuillez sélectionner une salle de destination.");
      return;
    }

    const inRoom = targetCandidates.filter(
      (c) => getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms).roomName === manualTargetRoomName
    );
    const currentMaxTable = inRoom.reduce((max, c) => {
      const assign = getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms);
      const n = parseInt(assign.tableNumber || "0", 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);

    const parsedStart = parseInt(manualTableNumber.trim(), 10);
    let nextTable = !isNaN(parsedStart) && parsedStart > 0 ? parsedStart : currentMaxTable + 1;

    const selectedOrderMap = new Map<string, string>();
    const selectedObjects = candidates
      .filter((c) => manualSelectedIds.includes(c.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName));

    selectedObjects.forEach((c) => {
      selectedOrderMap.set(c.id, String(nextTable));
      nextTable++;
    });

    const examTitle = selectedExam?.title || "Examen Blanc";
    const updated = candidates.map((c, idx) => {
      const assignedTable = selectedOrderMap.get(c.id);
      if (!assignedTable) return c;
      const anon =
        getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms).anonymatNumber ||
        `${anonymatPrefix}${String(100 + idx + 1).padStart(4, "0")}`;
      const assignment = {
        roomName: manualTargetRoomName,
        tableNumber: assignedTable,
        anonymatNumber: anon,
      };
      return {
        ...c,
        roomName: manualTargetRoomName,
        tableNumber: assignedTable,
        anonymatNumber: anon,
        examName: examTitle,
        ...(selectedExam
          ? {
              assignmentsByExam: {
                ...(c.assignmentsByExam || {}),
                [selectedExam.id]: assignment,
              },
            }
          : {}),
      };
    });

    // Ensure target room is marked mobilized for this exam
    const destRoomObj = rooms.find((r) => r.name === manualTargetRoomName);
    if (selectedExam && destRoomObj && !selectedRoomIds.includes(destRoomObj.id)) {
      const nextMobilized = [...selectedRoomIds, destRoomObj.id];
      setExamRoomMap((prev) => ({ ...prev, [selectedExam.id]: nextMobilized }));
      onUpdateExam?.(selectedExam.id, { mobilizedRoomIds: nextMobilized });
    }

    onSetCandidates(updated);
    onShowNotification(
      `✅ ${selectedObjects.length} élève(s) affecté(s) dans ${manualTargetRoomName} pour "${examTitle}".`
    );
    setIsManualAssignOpen(false);
    setManualSelectedIds([]);
    setManualTableNumber("");
  };

  const handleRemoveCandidateFromRoom = (candidateId: string) => {
    const targetCandidate = candidates.find((c) => c.id === candidateId);
    const updated = candidates.map((c) => {
      if (c.id !== candidateId) return c;
      const nextByExam = { ...(c.assignmentsByExam || {}) };
      if (selectedExam) {
        delete nextByExam[selectedExam.id];
      }
      const remainingKeys = Object.keys(nextByExam);
      const fallbackAssign = remainingKeys.length > 0 ? nextByExam[remainingKeys[0]] : null;
      return {
        ...c,
        assignmentsByExam: nextByExam,
        roomName: fallbackAssign ? fallbackAssign.roomName : "",
        tableNumber: fallbackAssign ? fallbackAssign.tableNumber : "",
        anonymatNumber: fallbackAssign ? fallbackAssign.anonymatNumber : "",
      };
    });
    onSetCandidates(updated);
    onShowNotification(`Élève ${targetCandidate?.lastName} retiré(e) de la salle pour cette session.`);
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
                  const examLevels = getExamTargetLevels(exam);
                  const matchingCount = candidates.filter(
                    (c) =>
                      Boolean(c.assignmentsByExam?.[exam.id]?.roomName) ||
                      isCandidateMatchingLevel(c.className, examLevels)
                  ).length;
                  const slotsCount = examSlots.filter(
                    (s) => s.examId === exam.id || s.examTitle.trim().toLowerCase() === exam.title.trim().toLowerCase()
                  ).length;

                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        setShowAllSchoolRooms(false);
                        setInspectingRoomName(null);
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
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isSelected ? "Actif" : "Sélectionner"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {examLevels.map((lvl) => (
                          <span
                            key={lvl}
                            className="px-2 py-0.5 rounded bg-white/80 border border-slate-200 font-semibold text-slate-700"
                          >
                            {getShortLevelBadge(lvl) || lvl}
                          </span>
                        ))}
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
              Session sélectionnée : <strong className="text-slate-900">{selectedExam?.title || "Examen général"}</strong> • Niveau(x) : <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-800">{selectedExam ? getExamTargetLevels(selectedExam).map((l) => getShortLevelBadge(l) || l).join(", ") : "Tous niveaux"}</span> • Candidats ciblés : <strong className="text-emerald-700">{targetCandidates.length} élèves</strong>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleResetDispatch}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition shadow-2xs flex items-center gap-1.5"
                title="Efface les attributions pour cet examen uniquement"
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
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
                    onChange={() => handleSetDispatchMode("brassage")}
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
                    onChange={() => handleSetDispatchMode("alphabetique")}
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

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    dispatchMode === "classe"
                      ? "border-[#3498db] bg-sky-50/60 ring-1 ring-[#3498db]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="dispatchMode"
                    checked={dispatchMode === "classe"}
                    onChange={() => handleSetDispatchMode("classe")}
                    className="mt-0.5 text-[#3498db] focus:ring-[#3498db]"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">
                      🏫 Regroupement par Classe d'origine (Suivi pédagogique)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Regroupe les élèves d'une même classe dans des salles dédiées ou par blocs continus pour faciliter l'appel et la remise des copies.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    dispatchMode === "specialite"
                      ? "border-[#3498db] bg-sky-50/60 ring-1 ring-[#3498db]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="dispatchMode"
                    checked={dispatchMode === "specialite"}
                    onChange={() => handleSetDispatchMode("specialite")}
                    className="mt-0.5 text-[#3498db] focus:ring-[#3498db]"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">
                      📚 Regroupement par Spécialité / Série / Option
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Regroupe les candidats passant la même épreuve de spécialité ou option (ex: Maths, Physique, SES) pour simplifier la distribution des sujets.
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
            {roomBreakdown.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                <School className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  Aucune salle n'est actuellement mobilisée pour "{selectedExam?.title || "cet examen"}".
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Les salles se mobilisent automatiquement à partir des épreuves programmées, ou vous pouvez choisir parmi toutes les salles du lycée.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllSchoolRooms(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  + Afficher toutes les salles ({rooms.length}) et choisir
                </button>
              </div>
            ) : (
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
                          <span>♿ Salle Tiers-Temps : les élèves PAP/PPS/Tiers-Temps du niveau y sont automatiquement affectés.</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>🏫 Accueil des élèves standards.</span>
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
                                const safeVal = isNaN(val) || val <= 0 ? 1 : val;
                                const key = selectedExam ? `${selectedExam.id}:${room.id}` : room.id;
                                setCustomRoomCapacities((prev) => ({
                                  ...prev,
                                  [key]: safeVal,
                                }));
                                if (selectedExam) {
                                  onUpdateExam?.(selectedExam.id, {
                                    customRoomQuotas: {
                                      ...(selectedExam.customRoomQuotas || {}),
                                      [room.id]: safeVal,
                                    },
                                  });
                                }
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
                            {ttCount} Tiers-temps / PAP
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
                          <span>+ Ajouter élève(s)</span>
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

                      {/* Expandable list of students strictly assigned to this room for THIS exam */}
                      {inspectingRoomName === room.name && (
                        <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {assignedCount === 0 ? (
                            <p className="text-[11px] text-slate-400 italic text-center py-2">
                              Aucun élève affecté à cette salle pour cet examen.
                            </p>
                          ) : (
                            targetCandidates
                              .filter(
                                (c) =>
                                  getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms).roomName ===
                                  room.name
                              )
                              .sort((a, b) => {
                                const tA = parseInt(
                                  getCandidateAssignmentForExam(a, selectedExam, currentExamSlots, rooms).tableNumber || "0",
                                  10
                                );
                                const tB = parseInt(
                                  getCandidateAssignmentForExam(b, selectedExam, currentExamSlots, rooms).tableNumber || "0",
                                  10
                                );
                                return tA - tB;
                              })
                              .map((c) => {
                                const assign = getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms);
                                return (
                                  <div
                                    key={c.id}
                                    className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]"
                                  >
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      <span className="font-bold text-blue-700 w-6 text-center shrink-0">
                                        T.{assign.tableNumber || "?"}
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
                                );
                              })
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
            )}
          </div>
        </div>
      )}

      {/* MODAL: MULTI-SELECT MANUAL CANDIDATE ASSIGNMENT */}
      {isManualAssignOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-700">
                <UserPlus className="h-5 w-5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Affecter un lot d'élèves à une salle
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Session : {selectedExam?.title || "Général"} • Filtré strictement par niveau ciblé ({targetCandidates.length} éligible(s))
                  </p>
                </div>
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
              {/* Search + Class filter + Select All */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-slate-700">
                    1. Cocher les élèves ({manualSelectedIds.length} sélectionné(s)) :
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setManualSelectedIds(filteredManualCandidates.map((c) => c.id))}
                      className="text-[11px] font-bold text-blue-700 hover:underline"
                    >
                      Tout cocher ({filteredManualCandidates.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setManualSelectedIds([])}
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                    >
                      Tout décocher
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-2">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={manualSearchTerm}
                      onChange={(e) => setManualSearchTerm(e.target.value)}
                      placeholder="Rechercher par nom, prénom, spécialité..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <select
                    value={manualClassFilter}
                    onChange={(e) => setManualClassFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                  >
                    <option value="all">Toutes classes ({targetCandidates.length})</option>
                    {classBreakdown.map(([cls, count]) => (
                      <option key={cls} value={cls}>
                        {cls} ({count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/40">
                  {filteredManualCandidates.length === 0 ? (
                    <p className="p-4 text-center text-slate-400 text-xs italic">
                      Aucun élève éligible ne correspond à ce filtre.
                    </p>
                  ) : (
                    filteredManualCandidates.map((c) => {
                      const checked = manualSelectedIds.includes(c.id);
                      const assign = getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms);
                      const isTT = isCandidateTiersTemps(c);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition ${
                            checked ? "bg-blue-50/80" : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleManualCandidate(c.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {c.lastName} {c.firstName}{" "}
                                <span className="font-normal text-slate-500">({c.className})</span>
                              </div>
                              {(c.specialty || isTT) && (
                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                  {isTT && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                      ♿ {c.accommodation}
                                    </span>
                                  )}
                                  {c.specialty && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                                      {c.specialty}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${
                              assign.roomName
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {assign.roomName ? `${assign.roomName} (T.${assign.tableNumber || "?"})` : "Non affecté"}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {manualRoomLocked ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="px-3 py-2 rounded-lg bg-[#0F2A56]/5 border border-[#0F2A56]/20 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">Salle sélectionnée :</span>
                    <span className="font-bold text-[#0F2A56] text-xs">{manualTargetRoomName}</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      2. Table de départ (auto si vide) :
                    </label>
                    <input
                      type="text"
                      value={manualTableNumber}
                      onChange={(e) => setManualTableNumber(e.target.value)}
                      placeholder="Auto-incrémenté à la suite"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        const assignedInRoom = targetCandidates.filter(
                          (c) =>
                            getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms).roomName === r.name
                        ).length;
                        const quota = getRoomQuota(r);
                        return (
                          <option key={r.id} value={r.name}>
                            {r.name} ({assignedInRoom} / {quota} places)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      3. Table de départ (auto si vide) :
                    </label>
                    <input
                      type="text"
                      value={manualTableNumber}
                      onChange={(e) => setManualTableNumber(e.target.value)}
                      placeholder="Auto-incrémenté à la suite"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
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
                disabled={manualSelectedIds.length === 0}
                onClick={handleSaveManualAssignment}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <UserCheck className="h-4 w-4" />
                <span>Affecter {manualSelectedIds.length} élève(s)</span>
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

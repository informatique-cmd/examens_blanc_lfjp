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
  Calendar,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
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
  isCandidateEligibleForSlot,
  slotsTimeOverlap,
  canAssignCandidateToSlot,
  detectExamScheduleConflicts,
  surveillancesTimeOverlap,
  parseTimeRangeMinutes,
  computeTiersTempsEndTimeColon,
  isRoomMarkedTiersTemps,
  teacherMatchesSlotSubjects,
  formatMinutesToColon,
} from "../../../shared/services/cms-store";

type DispatchMode = "brassage" | "alphabetique" | "classe" | "specialite";

function formatDisplayDateFr(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const d = new Date(`${isoDate}T12:00:00`);
  if (isNaN(d.getTime())) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  const weekday = d.toLocaleDateString("fr-FR", { weekday: "short" });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${parts[2]}/${parts[1]}/${parts[0]}`;
}

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
  onUpdateExamSlot?: (id: string, updates: Partial<CmsExamSlot>) => void;
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
  onUpdateExamSlot,
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

  // Exam slots belonging strictly to the active exam (sorted chronologically)
  const currentExamSlots = useMemo(() => {
    const base = !selectedExam
      ? examSlots
      : examSlots.filter((s) => {
          const titleNorm = selectedExam.title.trim().toLowerCase();
          return s.examId === selectedExam.id || s.examTitle.trim().toLowerCase() === titleNorm;
        });
    return [...base].sort((a, b) => {
      const dateCmp = (a.date || "").localeCompare(b.date || "");
      if (dateCmp !== 0) return dateCmp;
      const timeCmp = (a.startTime || "").localeCompare(b.startTime || "");
      if (timeCmp !== 0) return timeCmp;
      return (a.subject || "").localeCompare(b.subject || "");
    });
  }, [examSlots, selectedExam]);

  // --- CASCADE SELECTOR 2: DATE -> ÉPREUVE (CRÉNEAU) ---
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    currentExamSlots.forEach((s) => {
      if (s.date) set.add(s.date);
    });
    return Array.from(set).sort();
  }, [currentExamSlots]);

  const [selectedDateByExam, setSelectedDateByExam] = useState<Record<string, string>>({});
  const selectedDate = useMemo(() => {
    if (availableDates.length === 0) return "";
    const examKey = selectedExam?.id || "__all__";
    const stored = selectedDateByExam[examKey];
    if (stored && availableDates.includes(stored)) return stored;
    return availableDates[0];
  }, [availableDates, selectedDateByExam, selectedExam]);

  const setSelectedDate = (date: string) => {
    const examKey = selectedExam?.id || "__all__";
    setSelectedDateByExam((prev) => ({ ...prev, [examKey]: date }));
    setCheckedSlotIdsByExamDate((prev) => ({ ...prev, [`${examKey}::${date}`]: [] }));
    setShowAllSchoolRooms(false);
    setInspectingRoomName(null);
  };

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return currentExamSlots;
    return currentExamSlots.filter((s) => s.date === selectedDate);
  }, [currentExamSlots, selectedDate]);

  const [checkedSlotIdsByExamDate, setCheckedSlotIdsByExamDate] = useState<Record<string, string[]>>({});

  // Multi-épreuve checked slots on the current date (0 checked by default)
  const checkedSlotIds = useMemo(() => {
    if (slotsForSelectedDate.length === 0) return [];
    const key = `${selectedExam?.id || "__all__"}::${selectedDate}`;
    const stored = checkedSlotIdsByExamDate[key];
    if (!Array.isArray(stored)) return [];
    return stored.filter((id) => slotsForSelectedDate.some((s) => s.id === id));
  }, [slotsForSelectedDate, checkedSlotIdsByExamDate, selectedExam, selectedDate]);

  const activeSlots: CmsExamSlot[] = useMemo(() => {
    if (slotsForSelectedDate.length === 0) return [];
    return slotsForSelectedDate.filter((s) => checkedSlotIds.includes(s.id));
  }, [slotsForSelectedDate, checkedSlotIds]);

  const hasSlotsButNoneChecked = currentExamSlots.length > 0 && activeSlots.length === 0;
  const primarySlot: CmsExamSlot | null = activeSlots[0] || null;
  const isMultiSlotMode = activeSlots.length > 1;

  const setSelectedDispatchSlotId = (slotId: string) => {
    const key = `${selectedExam?.id || "__all__"}::${selectedDate}`;
    setCheckedSlotIdsByExamDate((prev) => ({ ...prev, [key]: [slotId] }));
    setShowAllSchoolRooms(false);
    setInspectingRoomName(null);
  };

  const handleToggleCheckedSlot = (slotId: string) => {
    const key = `${selectedExam?.id || "__all__"}::${selectedDate}`;
    const current = checkedSlotIds;
    const exists = current.includes(slotId);
    const next = exists ? current.filter((id) => id !== slotId) : [...current, slotId];
    setCheckedSlotIdsByExamDate((prev) => ({ ...prev, [key]: next }));
    setShowAllSchoolRooms(false);
    setInspectingRoomName(null);
  };

  const handleUncheckAllDateSlots = () => {
    const key = `${selectedExam?.id || "__all__"}::${selectedDate}`;
    setCheckedSlotIdsByExamDate((prev) => ({ ...prev, [key]: [] }));
    setShowAllSchoolRooms(false);
    setInspectingRoomName(null);
  };

  const handleCheckSameTimeWindow = () => {
    if (!primarySlot) return;
    const key = `${selectedExam?.id || "__all__"}::${selectedDate}`;
    const parallelIds = slotsForSelectedDate
      .filter((s) => s.id === primarySlot.id || slotsTimeOverlap(s, primarySlot))
      .map((s) => s.id);
    if (parallelIds.length > 0) {
      setCheckedSlotIdsByExamDate((prev) => ({ ...prev, [key]: parallelIds }));
    }
    setInspectingRoomName(null);
  };

  const handleCheckAllDateSlots = () => {
    const key = `${selectedExam?.id || "__all__"}::${selectedDate}`;
    const allIds = slotsForSelectedDate.map((s) => s.id);
    if (allIds.length > 0) {
      setCheckedSlotIdsByExamDate((prev) => ({ ...prev, [key]: allIds }));
    }
    setInspectingRoomName(null);
  };

  // Map of candidateId -> "Room (Subject)" for candidates already assigned to ANOTHER slot OUTSIDE activeSlots at an overlapping time
  const occupiedInParallelSlots = useMemo(() => {
    const map = new Map<string, string>();
    if (activeSlots.length === 0) return map;
    const activeIds = new Set(activeSlots.map((s) => s.id));
    const parallelSlots = currentExamSlots.filter(
      (s) => !activeIds.has(s.id) && activeSlots.some((as) => slotsTimeOverlap(s, as))
    );
    if (parallelSlots.length === 0) return map;

    candidates.forEach((c) => {
      for (const pSlot of parallelSlots) {
        const pAssign = c.assignmentsBySlot?.[pSlot.id];
        if (pAssign?.roomName) {
          map.set(c.id, `${pAssign.roomName} (${pSlot.subject})`);
          break;
        }
      }
    });
    return map;
  }, [candidates, currentExamSlots, activeSlots]);

  // Detect any overlapping slot assignments or overlapping compatible schedules for the active exam
  const examConflicts = useMemo(() => {
    return detectExamScheduleConflicts(candidates, selectedExam, currentExamSlots);
  }, [candidates, selectedExam, currentExamSlots]);

  const assignedOverlapConflicts = useMemo(
    () => examConflicts.filter((item) => item.kind === "assigned_overlap"),
    [examConflicts]
  );

  // Per-slot & per-exam room mobilization state
  const [slotRoomMap, setSlotRoomMap] = useState<Record<string, string[]>>({});
  const [examRoomMap, setExamRoomMap] = useState<Record<string, string[]>>({});
  const [slotTTRoomMap, setSlotTTRoomMap] = useState<Record<string, string[]>>({});
  const [examTTRoomMap, setExamTTRoomMap] = useState<Record<string, string[]>>({});
  const [showAllSchoolRooms, setShowAllSchoolRooms] = useState<boolean>(false);

  const getRoomIdsForSlot = useCallback(
    (slot: CmsExamSlot): string[] => {
      if (slotRoomMap[slot.id] !== undefined) {
        return slotRoomMap[slot.id];
      }
      const names = new Set<string>((slot.roomNames || []).map((rn) => rn.trim().toLowerCase()));
      candidates.forEach((c) => {
        const rm = c.assignmentsBySlot?.[slot.id]?.roomName;
        if (rm) names.add(rm.trim().toLowerCase());
      });
      return rooms.filter((r) => names.has(r.name.trim().toLowerCase())).map((r) => r.id);
    },
    [slotRoomMap, candidates, rooms]
  );

  const getTTRoomIdsForSlot = useCallback(
    (slot: CmsExamSlot, slotRoomIds: string[]): string[] => {
      if (slotTTRoomMap[slot.id] !== undefined) {
        return slotTTRoomMap[slot.id];
      }
      if (Array.isArray(slot.ttRoomIds)) {
        return slot.ttRoomIds;
      }
      if (selectedExam && Array.isArray(selectedExam.ttRoomIds)) {
        return selectedExam.ttRoomIds.filter((id) => slotRoomIds.includes(id));
      }
      return rooms
        .filter((r) => slotRoomIds.includes(r.id) && isRoomMarkedTiersTemps(r, [slot], selectedExam))
        .map((r) => r.id);
    },
    [slotTTRoomMap, selectedExam, rooms]
  );

  // Deduplicated selected room IDs across ALL active checked slots
  const selectedRoomIds = useMemo(() => {
    if (hasSlotsButNoneChecked) return [];
    if (activeSlots.length > 0) {
      const idSet = new Set<string>();
      activeSlots.forEach((slot) => {
        getRoomIdsForSlot(slot).forEach((id) => idSet.add(id));
      });
      return rooms.filter((r) => idSet.has(r.id)).map((r) => r.id);
    }

    if (!selectedExam) return [];
    if (examRoomMap[selectedExam.id] !== undefined) {
      return examRoomMap[selectedExam.id];
    }
    if (Array.isArray(selectedExam.mobilizedRoomIds) && selectedExam.mobilizedRoomIds.length > 0) {
      return selectedExam.mobilizedRoomIds;
    }
    const matchedNames = new Set<string>();
    currentExamSlots.forEach((s) => {
      (s.roomNames || []).forEach((rn) => matchedNames.add(rn.trim().toLowerCase()));
    });
    return rooms.filter((r) => matchedNames.has(r.name.trim().toLowerCase())).map((r) => r.id);
  }, [hasSlotsButNoneChecked, activeSlots, getRoomIdsForSlot, rooms, selectedExam, examRoomMap, currentExamSlots]);

  // Deduplicated TT room IDs across ALL active checked slots
  const ttRoomIds = useMemo(() => {
    if (hasSlotsButNoneChecked) return [];
    if (activeSlots.length > 0) {
      const ttSet = new Set<string>();
      activeSlots.forEach((slot) => {
        const sRooms = getRoomIdsForSlot(slot);
        getTTRoomIdsForSlot(slot, sRooms).forEach((id) => ttSet.add(id));
      });
      // Also catch rooms explicitly marked TT by name/subject when slot.ttRoomIds isn't yet initialized
      rooms.forEach((r) => {
        if (selectedRoomIds.includes(r.id) && !activeSlots.some((s) => slotTTRoomMap[s.id] !== undefined || Array.isArray(s.ttRoomIds))) {
          if (isRoomMarkedTiersTemps(r, activeSlots, selectedExam)) {
            ttSet.add(r.id);
          }
        }
      });
      return rooms.filter((r) => selectedRoomIds.includes(r.id) && ttSet.has(r.id)).map((r) => r.id);
    }

    if (!selectedExam) return [];
    if (examTTRoomMap[selectedExam.id] !== undefined) {
      return examTTRoomMap[selectedExam.id];
    }
    if (Array.isArray(selectedExam.ttRoomIds)) {
      return selectedExam.ttRoomIds;
    }
    return rooms
      .filter((r) => selectedRoomIds.includes(r.id) && isRoomMarkedTiersTemps(r, [], selectedExam))
      .map((r) => r.id);
  }, [hasSlotsButNoneChecked, activeSlots, getRoomIdsForSlot, getTTRoomIdsForSlot, rooms, selectedRoomIds, slotTTRoomMap, selectedExam, examTTRoomMap]);

  // Score and pick the most logical slot within activeSlots for a given candidate
  const pickBestSlotForCandidate = useCallback(
    (c: CmsCandidate, candidateSlots: CmsExamSlot[]): CmsExamSlot | null => {
      if (candidateSlots.length === 0) return null;
      const eligible = candidateSlots.filter((s) =>
        isCandidateEligibleForSlot(c, selectedExam, s, {
          ignoreExistingAssignment: true,
          allowMissingSpecialty: true,
        })
      );
      if (eligible.length === 0) return null;
      if (eligible.length === 1) return eligible[0];

      const isTT = isCandidateTiersTemps(c);
      const candHasSpec = Boolean(
        (c.specialty && c.specialty.trim()) || (Array.isArray(c.options) && c.options.length > 0)
      );

      let best = eligible[0];
      let bestScore = -Infinity;

      for (const sl of eligible) {
        let score = 0;
        const slotMentionsTT = /\b(tiers[\s-]*temps|tt)\b/i.test(sl.subject || "");
        const slotRooms = getRoomIdsForSlot(sl);
        const slotHasTTRoom = getTTRoomIdsForSlot(sl, slotRooms).length > 0;
        const slotHasSpec = Boolean(sl.targetSpecialty && sl.targetSpecialty.trim());

        if (isTT) {
          if (slotMentionsTT) score += 200;
          else if (slotHasTTRoom) score += 60;
        } else {
          if (slotMentionsTT) score -= 200;
        }

        if (candHasSpec && slotHasSpec) score += 100;
        else if (!candHasSpec && !slotHasSpec) score += 20;

        if (c.assignmentsBySlot?.[sl.id]?.roomName) score += 10;

        if (score > bestScore) {
          bestScore = score;
          best = sl;
        }
      }
      return best;
    },
    [selectedExam, getRoomIdsForSlot, getTTRoomIdsForSlot]
  );

  // Helper to get a candidate's assignment across ALL active checked slots (or exam fallback if 0 slots)
  const getActiveAssignment = useCallback(
    (c: CmsCandidate): { roomName: string; tableNumber: string; anonymatNumber: string; slotSubject?: string; slotId?: string } => {
      if (activeSlots.length > 0) {
        for (const sl of activeSlots) {
          const slotAssign = c.assignmentsBySlot?.[sl.id];
          if (slotAssign?.roomName) {
            return {
              roomName: slotAssign.roomName,
              tableNumber: slotAssign.tableNumber || "",
              anonymatNumber: slotAssign.anonymatNumber || "",
              slotSubject: sl.subject,
              slotId: sl.id,
            };
          }
        }
        const examSlotIdSet = new Set(currentExamSlots.map((s) => s.id));
        const hasAnySlotAssignInExam = Boolean(
          c.assignmentsBySlot &&
            Object.entries(c.assignmentsBySlot).some(
              ([sId, a]) =>
                Boolean(a?.roomName) &&
                ((selectedExam && a.examId === selectedExam.id) || examSlotIdSet.has(sId))
            )
        );
        if (hasAnySlotAssignInExam) {
          return { roomName: "", tableNumber: "", anonymatNumber: "" };
        }
        // Pure legacy fallback before first per-slot dispatch
        const legacy = getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms);
        if (legacy.roomName) {
          const groupRoomNames = new Set(
            activeSlots.flatMap((s) => (s.roomNames || []).map((rn) => rn.trim().toLowerCase()))
          );
          if (groupRoomNames.size === 0 || groupRoomNames.has(legacy.roomName.trim().toLowerCase())) {
            return legacy;
          }
        }
        return { roomName: "", tableNumber: "", anonymatNumber: "" };
      }
      return getCandidateAssignmentForExam(c, selectedExam, currentExamSlots, rooms);
    },
    [activeSlots, selectedExam, currentExamSlots, rooms]
  );

  // Deduplicated eligible candidates across active checked slots (filtered strictly by level & specialty, never duplicated)
  const slotEligibleAllCandidates = useMemo(() => {
    if (!selectedExam) return candidates;
    if (hasSlotsButNoneChecked) return [];
    if (activeSlots.length > 0) {
      return candidates.filter((c) => {
        if (activeSlots.some((s) => Boolean(c.assignmentsBySlot?.[s.id]?.roomName))) {
          return true;
        }
        return activeSlots.some((s) =>
          isCandidateEligibleForSlot(c, selectedExam, s, {
            ignoreExistingAssignment: false,
            allowMissingSpecialty: true,
          })
        );
      });
    }
    const levels = getExamTargetLevels(selectedExam);
    return candidates.filter((c) => {
      if (c.assignmentsByExam?.[selectedExam.id]?.roomName) return true;
      if (c.examName && c.examName.trim().toLowerCase() === selectedExam.title.trim().toLowerCase()) {
        return true;
      }
      return isCandidateMatchingLevel(c.className, levels);
    });
  }, [candidates, selectedExam, activeSlots, hasSlotsButNoneChecked]);

  // Candidates targeted for dispatch (excluding only those already assigned in OTHER external parallel slots)
  const targetCandidates = useMemo(() => {
    if (activeSlots.length === 0) return slotEligibleAllCandidates;
    return slotEligibleAllCandidates.filter(
      (c) =>
        activeSlots.some((s) => Boolean(c.assignmentsBySlot?.[s.id]?.roomName)) ||
        !occupiedInParallelSlots.has(c.id)
    );
  }, [slotEligibleAllCandidates, activeSlots, occupiedInParallelSlots]);

  // Non-target candidates to protect from erasure during dispatch
  const nonTargetCandidates = useMemo(() => {
    const targetIds = new Set(targetCandidates.map((c) => c.id));
    return candidates.filter((c) => !targetIds.has(c.id));
  }, [candidates, targetCandidates]);

  // --- ELEVES BRASSAGE STATE (persisted per slot/exam with local state mirror) ---
  const scopeKey =
    activeSlots.length > 1
      ? activeSlots.map((s) => s.id).join("+")
      : primarySlot?.id || selectedExam?.id || "__default__";

  const [dispatchModeMap, setDispatchModeMap] = useState<Record<string, DispatchMode>>({});
  const dispatchMode: DispatchMode = useMemo(() => {
    return (
      dispatchModeMap[scopeKey] ||
      primarySlot?.dispatchMode ||
      selectedExam?.dispatchMode ||
      "brassage"
    );
  }, [scopeKey, dispatchModeMap, primarySlot, selectedExam]);

  const handleSetDispatchMode = (mode: DispatchMode) => {
    setDispatchModeMap((prev) => ({ ...prev, [scopeKey]: mode }));
    if (activeSlots.length > 0) {
      activeSlots.forEach((s) => onUpdateExamSlot?.(s.id, { dispatchMode: mode }));
    } else if (selectedExam) {
      onUpdateExam?.(selectedExam.id, { dispatchMode: mode });
    }
  };

  const [separateTT, setSeparateTT] = useState<boolean>(true);
  const [anonymatPrefixMap, setAnonymatPrefixMap] = useState<Record<string, string>>({});
  const defaultPrefixForExam = (exam: CmsExam | null, slot: CmsExamSlot | null) => {
    if (slot?.anonymatPrefix) return slot.anonymatPrefix;
    if (exam?.anonymatPrefix) return exam.anonymatPrefix;
    if (!exam) return "DNB-";
    const clean = exam.title.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return clean.length > 0 ? `${clean.slice(0, 4)}-` : "DNB-";
  };
  const anonymatPrefix = useMemo(() => {
    return anonymatPrefixMap[scopeKey] ?? defaultPrefixForExam(selectedExam, primarySlot);
  }, [scopeKey, selectedExam, primarySlot, anonymatPrefixMap]);

  const setAnonymatPrefix = (val: string) => {
    setAnonymatPrefixMap((prev) => ({ ...prev, [scopeKey]: val }));
  };

  // Toggle room mobilization across checked slot(s) (or exam if no slot)
  const handleToggleRoomSelection = (roomId: string) => {
    const isAdding = !selectedRoomIds.includes(roomId);
    const roomObj = rooms.find((r) => r.id === roomId);
    if (!roomObj) return;

    if (activeSlots.length > 0) {
      activeSlots.forEach((slot) => {
        const curIds = getRoomIdsForSlot(slot);
        const nextIds = isAdding
          ? Array.from(new Set([...curIds, roomId]))
          : curIds.filter((id) => id !== roomId);
        setSlotRoomMap((prev) => ({ ...prev, [slot.id]: nextIds }));
        const nextNames = rooms.filter((r) => nextIds.includes(r.id)).map((r) => r.name);
        onUpdateExamSlot?.(slot.id, { roomNames: nextNames });
      });
      return;
    }

    if (!selectedExam) return;
    const next = isAdding
      ? [...selectedRoomIds, roomId]
      : selectedRoomIds.filter((id) => id !== roomId);
    setExamRoomMap((prev) => ({ ...prev, [selectedExam.id]: next }));
    onUpdateExam?.(selectedExam.id, { mobilizedRoomIds: next });
  };

  // --- CUSTOM ROOM CAPACITY (QUOTAS PAR SALLE) ---
  const [customRoomCapacities, setCustomRoomCapacities] = useState<Record<string, number>>({});

  const getRoomQuota = useCallback(
    (room: CmsRoom): number => {
      const key = `${scopeKey}:${room.id}`;
      if (customRoomCapacities[key] !== undefined && customRoomCapacities[key] > 0) {
        return customRoomCapacities[key];
      }
      for (const sl of activeSlots) {
        const q = sl.customRoomQuotas?.[room.id];
        if (q !== undefined && q > 0) return q;
      }
      const examPersisted = selectedExam?.customRoomQuotas?.[room.id];
      if (examPersisted !== undefined && examPersisted > 0) {
        return examPersisted;
      }
      return room.capacity || 24;
    },
    [customRoomCapacities, scopeKey, activeSlots, selectedExam]
  );

  // Build updated candidate record for a target slot (or exam)
  const applyAssignmentToCandidateForSlot = useCallback(
    (
      c: CmsCandidate,
      assignment: { roomName: string; tableNumber: string; anonymatNumber: string },
      targetSlot: CmsExamSlot | null
    ): CmsCandidate => {
      const examTitle = selectedExam ? selectedExam.title : "Examen Blanc";
      if (targetSlot && selectedExam) {
        return {
          ...c,
          roomName: c.roomName || assignment.roomName,
          tableNumber: c.tableNumber || assignment.tableNumber,
          anonymatNumber: c.anonymatNumber || assignment.anonymatNumber,
          examName: examTitle,
          assignmentsByExam: {
            ...(c.assignmentsByExam || {}),
            ...(c.assignmentsByExam?.[selectedExam.id]
              ? {}
              : { [selectedExam.id]: assignment }),
          },
          assignmentsBySlot: {
            ...(c.assignmentsBySlot || {}),
            [targetSlot.id]: {
              ...assignment,
              examId: selectedExam.id,
              slotId: targetSlot.id,
            },
          },
        };
      }
      return {
        ...c,
        roomName: assignment.roomName,
        tableNumber: assignment.tableNumber,
        anonymatNumber: assignment.anonymatNumber,
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
    },
    [selectedExam]
  );

  // Toggle room as Tiers-Temps across checked slot(s) AND auto-assign TT students into TT rooms
  const handleToggleTTRoom = (roomId: string) => {
    if (!selectedExam) return;
    const turningOn = !ttRoomIds.includes(roomId);
    const nextTTGlobal = turningOn
      ? Array.from(new Set([...ttRoomIds, roomId]))
      : ttRoomIds.filter((id) => id !== roomId);

    if (activeSlots.length > 0) {
      activeSlots.forEach((slot) => {
        const sRooms = getRoomIdsForSlot(slot);
        const curSlotTT = getTTRoomIdsForSlot(slot, sRooms);
        const nextSlotTT = turningOn
          ? Array.from(new Set([...curSlotTT, roomId]))
          : curSlotTT.filter((id) => id !== roomId);
        setSlotTTRoomMap((prev) => ({ ...prev, [slot.id]: nextSlotTT }));
        onUpdateExamSlot?.(slot.id, { ttRoomIds: nextSlotTT });
      });
    } else {
      setExamTTRoomMap((prev) => ({ ...prev, [selectedExam.id]: nextTTGlobal }));
      onUpdateExam?.(selectedExam.id, { ttRoomIds: nextTTGlobal });
    }

    const toggledRoom = rooms.find((r) => r.id === roomId);
    if (turningOn && toggledRoom) {
      const activeTtRooms = rooms.filter((r) => nextTTGlobal.includes(r.id));
      const ttStudents = targetCandidates
        .filter((c) => isCandidateTiersTemps(c))
        .sort((a, b) => a.lastName.localeCompare(b.lastName));

      if (ttStudents.length === 0) {
        onShowNotification(
          `♿ Salle "${toggledRoom.name}" définie en Salle Tiers-Temps. Aucun élève PAP/PPS/Tiers-Temps détecté dans les candidats ciblés.`
        );
        return;
      }

      const ttRoomList = activeTtRooms.length > 0 ? activeTtRooms : [toggledRoom];
      let roomIdx = 0;
      let tableNum = 1;
      const assignmentMap = new Map<
        string,
        { roomName: string; tableNumber: string; anonymatNumber: string; slot: CmsExamSlot | null }
      >();

      ttStudents.forEach((st, idx) => {
        const destRoom = ttRoomList[roomIdx] || toggledRoom;
        const limit = getRoomQuota(destRoom);
        const existingAssign = getActiveAssignment(st);
        const anon =
          existingAssign.anonymatNumber ||
          `${anonymatPrefix}TT${String(idx + 1).padStart(3, "0")}`;
        const destSlot = activeSlots.length > 0 ? pickBestSlotForCandidate(st, activeSlots) : null;

        assignmentMap.set(st.id, {
          roomName: destRoom.name,
          tableNumber: String(tableNum),
          anonymatNumber: anon,
          slot: destSlot,
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
        // Clear any old assignment on other activeSlots before moving to TT slot
        let base = c;
        if (activeSlots.length > 0 && c.assignmentsBySlot) {
          const nextBySlot = { ...c.assignmentsBySlot };
          activeSlots.forEach((s) => delete nextBySlot[s.id]);
          base = { ...c, assignmentsBySlot: nextBySlot };
        }
        return applyAssignmentToCandidateForSlot(
          base,
          { roomName: assign.roomName, tableNumber: assign.tableNumber, anonymatNumber: assign.anonymatNumber },
          assign.slot
        );
      });

      onSetCandidates(updatedCandidates);
      onShowNotification(
        `♿ Salle "${toggledRoom.name}" définie en Tiers-Temps : ${ttStudents.length} élève(s) PAP/PPS/TT affecté(s) !`
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

  // Summary by class for the TARGET candidates
  const classBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    targetCandidates.forEach((c) => {
      const cls = c.className || "Sans classe";
      map.set(cls, (map.get(cls) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [targetCandidates]);

  // Deduplicated mobilized rooms across active checked slots (or exam)
  const selectedRooms = useMemo(() => {
    return rooms.filter((r) => selectedRoomIds.includes(r.id));
  }, [rooms, selectedRoomIds]);

  // Dual capacity stats (Standard vs Tiers-Temps +1/3)
  const capacityStats = useMemo(() => {
    const stdRooms = selectedRooms.filter((r) => !ttRoomIds.includes(r.id));
    const ttRoomsList = selectedRooms.filter((r) => ttRoomIds.includes(r.id));
    const stdCapacity = stdRooms.reduce((acc, r) => acc + getRoomQuota(r), 0);
    const ttCapacity = ttRoomsList.reduce((acc, r) => acc + getRoomQuota(r), 0);
    const totalCapacity = stdCapacity + ttCapacity;

    const ttStudentsCount = targetCandidates.filter((c) => separateTT && isCandidateTiersTemps(c)).length;
    const stdStudentsCount = targetCandidates.length - ttStudentsCount;

    return {
      stdRoomsCount: stdRooms.length,
      ttRoomsCount: ttRoomsList.length,
      stdCapacity,
      ttCapacity,
      totalCapacity,
      stdStudentsCount,
      ttStudentsCount,
      totalStudentsCount: targetCandidates.length,
    };
  }, [selectedRooms, ttRoomIds, getRoomQuota, targetCandidates, separateTT]);

  const selectedCapacity = capacityStats.totalCapacity;

  // Deduplicated breakdown by physical room across checked slot(s)
  const roomBreakdown = useMemo(() => {
    const roomsToDisplay = showAllSchoolRooms
      ? rooms
      : rooms.filter((r) => selectedRoomIds.includes(r.id));

    return roomsToDisplay.map((r) => {
      const isMobilized = selectedRoomIds.includes(r.id);
      const isTT = ttRoomIds.includes(r.id);
      const assigned = slotEligibleAllCandidates.filter(
        (c) => getActiveAssignment(c).roomName === r.name
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
  }, [
    rooms,
    slotEligibleAllCandidates,
    getActiveAssignment,
    selectedRoomIds,
    ttRoomIds,
    showAllSchoolRooms,
    getRoomQuota,
  ]);

  // Main algorithm to dispatch deduplicated candidates across checked slot(s) into deduplicated Standard & TT rooms
  const handleRunDispatch = () => {
    if (hasSlotsButNoneChecked) {
      alert("Veuillez cocher au moins une épreuve ci-dessus avant de lancer le brassage.");
      return;
    }
    if (targetCandidates.length === 0) {
      alert(
        activeSlots.length > 0
          ? `Aucun candidat disponible pour les épreuves sélectionnées (${formatDisplayDateFr(selectedDate)}). Vérifiez les niveaux/spécialités ou les affectations déjà prises sur un autre créneau.`
          : selectedExam
            ? `Aucun candidat ne correspond au niveau "${selectedExam.targetLevel}" ciblé par l'examen "${selectedExam.title}".`
            : "Aucun candidat importé."
      );
      return;
    }
    if (selectedRooms.length === 0) {
      alert(
        activeSlots.length > 0
          ? `Aucune salle sélectionnée pour cette sélection d'épreuves. Cliquez sur "+ Afficher toutes les salles" pour en mobiliser au moins une.`
          : "Aucune salle sélectionnée pour cet examen. Veuillez cocher au moins une salle mobilisée."
      );
      return;
    }

    if (selectedCapacity < targetCandidates.length) {
      const confirmProceed = confirm(
        `Attention : La capacité cumulée des salles sélectionnées (${selectedCapacity} places) est inférieure au nombre d'élèves ciblés (${targetCandidates.length} élèves). Voulez-vous tout de même continuer ?`
      );
      if (!confirmProceed) return;
    }

    const updatedCandidates: CmsCandidate[] = [];
    const regularCandidates: CmsCandidate[] = [];
    const ttCandidates: CmsCandidate[] = [];

    targetCandidates.forEach((c) => {
      if (separateTT && isCandidateTiersTemps(c)) {
        ttCandidates.push({ ...c });
      } else {
        regularCandidates.push({ ...c });
      }
    });

    const chosenTtRooms = selectedRooms.filter((r) => ttRoomIds.includes(r.id));
    const chosenStdRooms = selectedRooms.filter((r) => !ttRoomIds.includes(r.id));

    const finalTtRooms =
      chosenTtRooms.length > 0 ? chosenTtRooms : [selectedRooms[selectedRooms.length - 1]];
    const finalStdRooms = chosenStdRooms.length > 0 ? chosenStdRooms : selectedRooms;

    let globalAnonymatIndex = 101;
    const examTitle = selectedExam ? selectedExam.title : "Examen Blanc";

    // Collision-free continuous table number counter per physical room name
    const nextTableByRoom: Record<string, number> = {};
    const takeNextTable = (roomName: string): string => {
      const next = nextTableByRoom[roomName] || 1;
      nextTableByRoom[roomName] = next + 1;
      return String(next);
    };

    const applyStudentAssignment = (
      student: CmsCandidate,
      roomName: string,
      anonymatNumber: string
    ): CmsCandidate => {
      // Clear any previous entry in activeSlots first so a candidate is never double-assigned across checked overlapping slots
      let cleanedStudent = student;
      if (activeSlots.length > 0 && student.assignmentsBySlot) {
        const nextBySlot = { ...student.assignmentsBySlot };
        activeSlots.forEach((s) => delete nextBySlot[s.id]);
        cleanedStudent = { ...student, assignmentsBySlot: nextBySlot };
      }
      const destSlot =
        activeSlots.length > 0 ? pickBestSlotForCandidate(cleanedStudent, activeSlots) : null;
      return applyAssignmentToCandidateForSlot(
        cleanedStudent,
        { roomName, tableNumber: takeNextTable(roomName), anonymatNumber },
        destSlot
      );
    };

    // 1. Prioritize Tiers-Temps students into TT room(s)
    if (ttCandidates.length > 0) {
      let currentTTRoomIdx = 0;
      let countInCurrTT = 0;

      ttCandidates.sort((a, b) => a.lastName.localeCompare(b.lastName));
      ttCandidates.forEach((student) => {
        const room = finalTtRooms[currentTTRoomIdx] || selectedRooms[0];
        const roomLimit = getRoomQuota(room);
        if (countInCurrTT >= roomLimit && currentTTRoomIdx < finalTtRooms.length - 1) {
          currentTTRoomIdx++;
          countInCurrTT = 0;
        }
        const activeRoom = finalTtRooms[currentTTRoomIdx] || selectedRooms[0];
        const existingAnon = getActiveAssignment(student).anonymatNumber;
        const anon =
          existingAnon || `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
        updatedCandidates.push(applyStudentAssignment(student, activeRoom.name, anon));
        countInCurrTT++;
        globalAnonymatIndex++;
      });
    }

    // 2. Dispatch Standard candidates respecting dispatchMode
    const assignGroupedBlocks = (groups: CmsCandidate[][]) => {
      if (finalStdRooms.length >= groups.length && groups.length > 1) {
        let roomCursor = 0;
        groups.forEach((group) => {
          let countInRoom = 0;
          group.forEach((student) => {
            const room = finalStdRooms[roomCursor] || finalStdRooms[finalStdRooms.length - 1];
            const limit = getRoomQuota(room);
            if (countInRoom >= limit && roomCursor < finalStdRooms.length - 1) {
              roomCursor++;
              countInRoom = 0;
            }
            const activeRoom =
              finalStdRooms[roomCursor] || finalStdRooms[finalStdRooms.length - 1];
            const existingAnon = getActiveAssignment(student).anonymatNumber;
            const anon =
              existingAnon ||
              `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
            updatedCandidates.push(applyStudentAssignment(student, activeRoom.name, anon));
            countInRoom++;
            globalAnonymatIndex++;
          });
          if (roomCursor < finalStdRooms.length - 1) {
            roomCursor++;
          }
        });
      } else {
        const flat = groups.flat();
        let roomIdx = 0;
        let countInRoom = 0;
        flat.forEach((student) => {
          const room = finalStdRooms[roomIdx] || selectedRooms[0];
          const limit = getRoomQuota(room);
          if (countInRoom >= limit && roomIdx < finalStdRooms.length - 1) {
            roomIdx++;
            countInRoom = 0;
          }
          const activeRoom = finalStdRooms[roomIdx] || selectedRooms[0];
          const existingAnon = getActiveAssignment(student).anonymatNumber;
          const anon =
            existingAnon || `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
          updatedCandidates.push(applyStudentAssignment(student, activeRoom.name, anon));
          countInRoom++;
          globalAnonymatIndex++;
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
        const spec =
          (c.specialty || (Array.isArray(c.options) ? c.options.join(", ") : "") || "").trim() ||
          "Tronc Commun / Générale";
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
      let countInStdRoom = 0;

      sortedRegular.forEach((student) => {
        const room = finalStdRooms[currentStdRoomIdx] || selectedRooms[0];
        const roomLimit = getRoomQuota(room);
        if (countInStdRoom >= roomLimit && currentStdRoomIdx < finalStdRooms.length - 1) {
          currentStdRoomIdx++;
          countInStdRoom = 0;
        }
        const activeRoom = finalStdRooms[currentStdRoomIdx] || selectedRooms[0];
        const existingAnon = getActiveAssignment(student).anonymatNumber;
        const anon =
          existingAnon || `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
        updatedCandidates.push(applyStudentAssignment(student, activeRoom.name, anon));
        countInStdRoom++;
        globalAnonymatIndex++;
      });
    }

    if (activeSlots.length > 0) {
      activeSlots.forEach((sl) => {
        onUpdateExamSlot?.(sl.id, {
          roomNames: selectedRooms.map((r) => r.name),
          ttRoomIds,
          anonymatPrefix,
          dispatchMode,
        });
      });
    } else if (selectedExam) {
      onUpdateExam?.(selectedExam.id, {
        mobilizedRoomIds: selectedRoomIds,
        ttRoomIds,
        anonymatPrefix,
        dispatchMode,
      });
    }

    onSetCandidates([...nonTargetCandidates, ...updatedCandidates]);
    onShowNotification(
      activeSlots.length > 1
        ? `🎉 Brassage groupé réussi sur ${activeSlots.length} épreuves (${formatDisplayDateFr(selectedDate)}) : ${updatedCandidates.length} élève(s) réparti(s) sans doublon dans ${selectedRooms.length} salle(s).`
        : primarySlot
          ? `🎉 Répartition réussie pour « ${primarySlot.subject} » (${formatDisplayDateFr(primarySlot.date)}) : ${updatedCandidates.length} élève(s) dans ${selectedRooms.length} salle(s).`
          : `🎉 Répartition réussie pour "${examTitle}" ! ${updatedCandidates.length} élève(s) (${ttCandidates.length} Tiers-Temps) répartis dans ${selectedRooms.length} salle(s).`
    );
  };

  // Resolve and deduplicate any overlapping assigned slot conflicts by keeping the earliest slot per time window
  const handleCleanAssignedConflicts = () => {
    if (assignedOverlapConflicts.length === 0) return;
    const working = candidates.map((c) => ({
      ...c,
      assignmentsBySlot: c.assignmentsBySlot ? { ...c.assignmentsBySlot } : undefined,
    }));

    let cleanedCount = 0;
    for (const c of working) {
      if (!c.assignmentsBySlot) continue;
      const kept: CmsExamSlot[] = [];
      for (const slot of currentExamSlots) {
        if (!c.assignmentsBySlot[slot.id]?.roomName) continue;
        if (kept.some((prev) => slotsTimeOverlap(prev, slot))) {
          delete c.assignmentsBySlot[slot.id];
          cleanedCount++;
        } else {
          kept.push(slot);
        }
      }
    }

    onSetCandidates(working);
    onShowNotification(
      `✅ ${cleanedCount} double(s) affectation(s) horaire(s) supprimée(s). Règle d'unicité horaire rétablie.`
    );
  };

  // Global intelligent dispatch across ALL slots of the selected session (épreuve par épreuve)
  const handleRunDispatchAllSlots = () => {
    if (!selectedExam || currentExamSlots.length === 0) {
      handleRunDispatch();
      return;
    }

    const confirmed = confirm(
      `Lancer le brassage intelligent sur toutes les épreuves de « ${selectedExam.title} » (${currentExamSlots.length} épreuve(s)) ?\n\n• Chaque épreuve utilisera uniquement ses propres salles mobilisées et sa salle Tiers-Temps.\n• Les élèves PAP/PPRE/PPS/Tiers-Temps seront automatiquement placés dans la salle Tiers-Temps de chaque épreuve.\n• Un élève ne sera jamais affecté à deux épreuves simultanées.`
    );
    if (!confirmed) return;

    const workingCandidates: CmsCandidate[] = candidates.map((c) => ({
      ...c,
      assignmentsByExam: c.assignmentsByExam ? { ...c.assignmentsByExam } : undefined,
      assignmentsBySlot: c.assignmentsBySlot ? { ...c.assignmentsBySlot } : undefined,
    }));

    let dispatchedSlotsCount = 0;
    let totalAssignmentsCount = 0;
    const skippedNoRooms: string[] = [];
    const skippedNoEligible: string[] = [];
    const nextTableByWindowRoom: Record<string, number> = {};

    const takeWindowTable = (date: string, startTime: string, roomName: string): string => {
      const key = `${(date || "").trim()}::${(startTime || "").trim()}::${roomName.trim().toLowerCase()}`;
      const next = nextTableByWindowRoom[key] || 1;
      nextTableByWindowRoom[key] = next + 1;
      return String(next);
    };

    for (const slot of currentExamSlots) {
      // 1. Resolve mobilized rooms strictly for THIS slot
      const explicitIds = slotRoomMap[slot.id];
      const slotRooms: CmsRoom[] =
        explicitIds !== undefined
          ? rooms.filter((r) => explicitIds.includes(r.id))
          : rooms.filter((r) =>
              (slot.roomNames || []).some(
                (rn) => rn.trim().toLowerCase() === r.name.trim().toLowerCase()
              )
            );

      if (slotRooms.length === 0) {
        skippedNoRooms.push(`${slot.subject} (${slot.date})`);
        continue;
      }

      // 2. Resolve TT rooms strictly for THIS slot
      const slotTTRoomIds =
        slotTTRoomMap[slot.id] !== undefined
          ? slotTTRoomMap[slot.id]
          : Array.isArray(slot.ttRoomIds)
            ? slot.ttRoomIds
            : selectedExam.ttRoomIds
              ? selectedExam.ttRoomIds.filter((id) => slotRooms.some((r) => r.id === id))
              : slotRooms
                  .filter(
                    (r) =>
                      r.name.toLowerCase().includes("tt") ||
                      r.notes?.toLowerCase().includes("tiers") ||
                      r.notes?.toLowerCase().includes("tt")
                  )
                  .map((r) => r.id);

      const slotMode: DispatchMode =
        dispatchModeMap[slot.id] || slot.dispatchMode || selectedExam.dispatchMode || "brassage";
      const slotPrefix =
        anonymatPrefixMap[slot.id] ?? defaultPrefixForExam(selectedExam, slot);

      const getSlotRoomLimit = (room: CmsRoom): number => {
        const key = `${slot.id}:${room.id}`;
        if (customRoomCapacities[key] && customRoomCapacities[key] > 0) {
          return customRoomCapacities[key];
        }
        if (slot.customRoomQuotas?.[room.id] && slot.customRoomQuotas[room.id] > 0) {
          return slot.customRoomQuotas[room.id];
        }
        return room.capacity || 24;
      };

      // 3. Filter eligible candidates strictly for THIS slot (zero overlap with already-assigned parallel slots)
      const eligible = workingCandidates.filter((c) => {
        const overlapCheck = canAssignCandidateToSlot(c, slot, currentExamSlots);
        if (!overlapCheck.allowed) return false;
        if (c.assignmentsBySlot?.[slot.id]?.roomName) return true;
        return isCandidateEligibleForSlot(c, selectedExam, slot, {
          ignoreExistingAssignment: true,
          allowMissingSpecialty: false,
        });
      });

      if (eligible.length === 0) {
        skippedNoEligible.push(`${slot.subject} (${slot.date})`);
        continue;
      }

      const slotTT = eligible
        .filter((c) => separateTT && isCandidateTiersTemps(c))
        .sort((a, b) => a.lastName.localeCompare(b.lastName));
      const slotReg = eligible.filter((c) => !(separateTT && isCandidateTiersTemps(c)));

      const chosenTtRooms = slotRooms.filter((r) => slotTTRoomIds.includes(r.id));
      const chosenStdRooms = slotRooms.filter((r) => !slotTTRoomIds.includes(r.id));
      const finalTtRooms =
        chosenTtRooms.length > 0 ? chosenTtRooms : [slotRooms[slotRooms.length - 1]];
      const finalStdRooms = chosenStdRooms.length > 0 ? chosenStdRooms : slotRooms;

      let anonIdx = 101;
      const recordSlotAssign = (
        student: CmsCandidate,
        roomName: string,
        tableNumber: string,
        anonymatNumber: string
      ) => {
        const assign = { roomName, tableNumber, anonymatNumber };
        student.roomName = student.roomName || roomName;
        student.tableNumber = student.tableNumber || tableNumber;
        student.anonymatNumber = student.anonymatNumber || anonymatNumber;
        student.examName = selectedExam.title;
        student.assignmentsByExam = {
          ...(student.assignmentsByExam || {}),
          ...(student.assignmentsByExam?.[selectedExam.id]
            ? {}
            : { [selectedExam.id]: assign }),
        };
        student.assignmentsBySlot = {
          ...(student.assignmentsBySlot || {}),
          [slot.id]: {
            ...assign,
            examId: selectedExam.id,
            slotId: slot.id,
          },
        };
        totalAssignmentsCount++;
      };

      if (slotTT.length > 0) {
        let ttRoomIdx = 0;
        let ttCountInRoom = 0;
        slotTT.forEach((student) => {
          const rm = finalTtRooms[ttRoomIdx] || slotRooms[0];
          const limit = getSlotRoomLimit(rm);
          if (ttCountInRoom >= limit && ttRoomIdx < finalTtRooms.length - 1) {
            ttRoomIdx++;
            ttCountInRoom = 0;
          }
          const activeRm = finalTtRooms[ttRoomIdx] || slotRooms[0];
          const existingAnon =
            student.assignmentsBySlot?.[slot.id]?.anonymatNumber ||
            student.anonymatNumber ||
            `${slotPrefix}${String(anonIdx).padStart(4, "0")}`;
          recordSlotAssign(
            student,
            activeRm.name,
            takeWindowTable(slot.date, slot.startTime, activeRm.name),
            existingAnon
          );
          ttCountInRoom++;
          anonIdx++;
        });
      }

      let orderedStd: CmsCandidate[] = [];
      if (slotMode === "classe") {
        const byClass = new Map<string, CmsCandidate[]>();
        slotReg.forEach((c) => {
          const k = (c.className || "Sans classe").trim();
          if (!byClass.has(k)) byClass.set(k, []);
          byClass.get(k)!.push(c);
        });
        orderedStd = Array.from(byClass.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .flatMap(([, list]) => list.sort((a, b) => a.lastName.localeCompare(b.lastName)));
      } else if (slotMode === "specialite") {
        const bySpec = new Map<string, CmsCandidate[]>();
        slotReg.forEach((c) => {
          const k =
            (c.specialty || (Array.isArray(c.options) ? c.options.join(", ") : "") || "").trim() ||
            "Tronc Commun";
          if (!bySpec.has(k)) bySpec.set(k, []);
          bySpec.get(k)!.push(c);
        });
        orderedStd = Array.from(bySpec.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .flatMap(([, list]) => list.sort((a, b) => a.lastName.localeCompare(b.lastName)));
      } else if (slotMode === "brassage") {
        const byClass: Record<string, CmsCandidate[]> = {};
        slotReg.forEach((c) => {
          const k = c.className || "Standard";
          if (!byClass[k]) byClass[k] = [];
          byClass[k].push(c);
        });
        Object.keys(byClass).forEach((k) =>
          byClass[k].sort((a, b) => a.lastName.localeCompare(b.lastName))
        );
        const keys = Object.keys(byClass);
        let more = true;
        let idx = 0;
        while (more) {
          more = false;
          keys.forEach((k) => {
            if (byClass[k][idx]) {
              orderedStd.push(byClass[k][idx]);
              more = true;
            }
          });
          idx++;
        }
      } else {
        orderedStd = [...slotReg].sort((a, b) => a.lastName.localeCompare(b.lastName));
      }

      let stdRoomIdx = 0;
      let stdCountInRoom = 0;
      orderedStd.forEach((student) => {
        const rm = finalStdRooms[stdRoomIdx] || slotRooms[0];
        const limit = getSlotRoomLimit(rm);
        if (stdCountInRoom >= limit && stdRoomIdx < finalStdRooms.length - 1) {
          stdRoomIdx++;
          stdCountInRoom = 0;
        }
        const activeRm = finalStdRooms[stdRoomIdx] || slotRooms[0];
        const existingAnon =
          student.assignmentsBySlot?.[slot.id]?.anonymatNumber ||
          student.anonymatNumber ||
          `${slotPrefix}${String(anonIdx).padStart(4, "0")}`;
        recordSlotAssign(
          student,
          activeRm.name,
          takeWindowTable(slot.date, slot.startTime, activeRm.name),
          existingAnon
        );
        stdCountInRoom++;
        anonIdx++;
      });

      onUpdateExamSlot?.(slot.id, {
        roomNames: slotRooms.map((r) => r.name),
        ttRoomIds: slotTTRoomIds,
        anonymatPrefix: slotPrefix,
        dispatchMode: slotMode,
      });
      dispatchedSlotsCount++;
    }

    onSetCandidates(workingCandidates);
    const notes: string[] = [];
    if (skippedNoRooms.length > 0) {
      notes.push(`${skippedNoRooms.length} sans salle`);
    }
    if (skippedNoEligible.length > 0) {
      notes.push(`${skippedNoEligible.length} sans spécialité élève renseignée`);
    }
    onShowNotification(
      `🚀 Brassage intelligent terminé : ${dispatchedSlotsCount}/${currentExamSlots.length} épreuve(s) réparties (${totalAssignmentsCount} affectation(s))${notes.length > 0 ? ` — Ignorées : ${notes.join(", ")}` : ""}.`
    );
  };

  const handleResetDispatch = () => {
    if (hasSlotsButNoneChecked) {
      alert("Veuillez cocher au moins une épreuve ci-dessus avant de réinitialiser.");
      return;
    }
    if (slotEligibleAllCandidates.length === 0) {
      alert("Aucun élève à réinitialiser pour ce créneau.");
      return;
    }

    const confirmed = confirm(
      activeSlots.length > 1
        ? `Voulez-vous réinitialiser l'affectation des salles pour les ${activeSlots.length} épreuves cochées du ${formatDisplayDateFr(selectedDate)} ?\n\nCela n'affectera ni les autres dates, ni les autres sessions.`
        : primarySlot
          ? `Voulez-vous réinitialiser l'affectation des salles pour l'épreuve "${primarySlot.subject}" du ${formatDisplayDateFr(primarySlot.date)} ?\n\nCela n'affectera ni les autres épreuves, ni les autres sessions.`
          : selectedExam
            ? `Voulez-vous réinitialiser l'affectation des élèves de la session "${selectedExam.title}" (${targetCandidates.length} élèves) ?\n\nCela effacera uniquement les salles attribuées pour cette session, sans toucher aux autres sessions ni supprimer les fiches élèves.`
            : "Voulez-vous réinitialiser l'affectation des élèves ?"
    );
    if (!confirmed) return;

    if (activeSlots.length > 0) {
      const resetSlotIds = new Set(activeSlots.map((s) => s.id));
      const examSlotIdSet = new Set(currentExamSlots.map((s) => s.id));
      const resetCandidates = candidates.map((c) => {
        const hadAnyInResetSlots = Boolean(
          c.assignmentsBySlot && activeSlots.some((s) => Boolean(c.assignmentsBySlot?.[s.id]))
        );
        const isEligibleInScope = slotEligibleAllCandidates.some((sc) => sc.id === c.id);

        if (!hadAnyInResetSlots && !isEligibleInScope) return c;

        const nextBySlot = { ...(c.assignmentsBySlot || {}) };
        resetSlotIds.forEach((sId) => {
          delete nextBySlot[sId];
        });

        const stillHasSlotInExam = Object.entries(nextBySlot).some(
          ([sId, a]) =>
            Boolean(a?.roomName) &&
            ((selectedExam && a.examId === selectedExam.id) || examSlotIdSet.has(sId))
        );

        const nextByExam = { ...(c.assignmentsByExam || {}) };
        if (!stillHasSlotInExam && selectedExam) {
          delete nextByExam[selectedExam.id];
          const examTitleNorm = selectedExam.title.trim().toLowerCase();
          Object.keys(nextByExam).forEach((k) => {
            if (k.trim().toLowerCase() === examTitleNorm) delete nextByExam[k];
          });
        }

        // CRITICAL FIX: if candidate no longer has ANY slot left in this exam,
        // clear legacy roomName/tableNumber/anonymatNumber (or restore from another remaining exam)
        // so getActiveAssignment falls back cleanly to 0 / quota!
        if (!stillHasSlotInExam) {
          const remainingExamKeys = Object.keys(nextByExam);
          const fallbackAssign =
            remainingExamKeys.length > 0 ? nextByExam[remainingExamKeys[0]] : null;
          return {
            ...c,
            assignmentsBySlot: nextBySlot,
            assignmentsByExam: nextByExam,
            roomName: fallbackAssign ? fallbackAssign.roomName : "",
            tableNumber: fallbackAssign ? fallbackAssign.tableNumber : "",
            anonymatNumber: fallbackAssign ? fallbackAssign.anonymatNumber : "",
          };
        }

        return {
          ...c,
          assignmentsBySlot: nextBySlot,
          assignmentsByExam: nextByExam,
        };
      });
      setInspectingRoomName(null);
      onSetCandidates(resetCandidates);
      onShowNotification(
        activeSlots.length > 1
          ? `🔄 Réinitialisation complète pour les ${activeSlots.length} épreuves cochées (0 élève affecté).`
          : `🔄 Le brassage a été réinitialisé pour « ${primarySlot?.subject || "l'épreuve"} » (0 élève affecté).`
      );
      return;
    }

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
    setInspectingRoomName(null);
    onSetCandidates(resetCandidates);
    onShowNotification(
      `🔄 Le brassage a été réinitialisé pour "${selectedExam?.title || "la session"}" (0 élève affecté).`
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
    return slotEligibleAllCandidates.filter((c) => {
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
  }, [slotEligibleAllCandidates, manualClassFilter, manualSearchTerm]);

  const handleToggleManualCandidate = (id: string) => {
    if (activeSlots.length > 0 && occupiedInParallelSlots.has(id)) {
      return;
    }
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

    if (activeSlots.length > 0) {
      const blocked = candidates.filter((c) => {
        if (!manualSelectedIds.includes(c.id)) return false;
        return occupiedInParallelSlots.has(c.id);
      });
      if (blocked.length > 0) {
        alert(
          `Double affectation interdite : ${blocked.map((b) => `${b.lastName} ${b.firstName}`).join(", ")} est déjà affecté(e) à une autre épreuve sur le même créneau horaire.`
        );
        return;
      }
    }

    const inRoom = slotEligibleAllCandidates.filter(
      (c) => getActiveAssignment(c).roomName === manualTargetRoomName
    );
    const currentMaxTable = inRoom.reduce((max, c) => {
      const assign = getActiveAssignment(c);
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
        getActiveAssignment(c).anonymatNumber ||
        `${anonymatPrefix}${String(100 + idx + 1).padStart(4, "0")}`;
      let base = c;
      if (activeSlots.length > 0 && c.assignmentsBySlot) {
        const nextBySlot = { ...c.assignmentsBySlot };
        activeSlots.forEach((s) => delete nextBySlot[s.id]);
        base = { ...c, assignmentsBySlot: nextBySlot };
      }
      const destSlot = activeSlots.length > 0 ? pickBestSlotForCandidate(base, activeSlots) : null;
      return applyAssignmentToCandidateForSlot(
        base,
        {
          roomName: manualTargetRoomName,
          tableNumber: assignedTable,
          anonymatNumber: anon,
        },
        destSlot
      );
    });

    const destRoomObj = rooms.find((r) => r.name === manualTargetRoomName);
    if (activeSlots.length > 0 && destRoomObj && !selectedRoomIds.includes(destRoomObj.id)) {
      activeSlots.forEach((sl) => {
        const curIds = getRoomIdsForSlot(sl);
        if (!curIds.includes(destRoomObj.id)) {
          const nextMobilized = [...curIds, destRoomObj.id];
          setSlotRoomMap((prev) => ({ ...prev, [sl.id]: nextMobilized }));
          const nextNames = rooms.filter((r) => nextMobilized.includes(r.id)).map((r) => r.name);
          onUpdateExamSlot?.(sl.id, { roomNames: nextNames });
        }
      });
    } else if (selectedExam && destRoomObj && !selectedRoomIds.includes(destRoomObj.id)) {
      const nextMobilized = [...selectedRoomIds, destRoomObj.id];
      setExamRoomMap((prev) => ({ ...prev, [selectedExam.id]: nextMobilized }));
      onUpdateExam?.(selectedExam.id, { mobilizedRoomIds: nextMobilized });
    }

    onSetCandidates(updated);
    onShowNotification(
      `✅ ${selectedObjects.length} élève(s) affecté(s) dans ${manualTargetRoomName}${primarySlot ? ` (${activeSlots.map((s) => s.subject).join(", ")})` : ` pour "${examTitle}"`}.`
    );
    setIsManualAssignOpen(false);
    setManualSelectedIds([]);
    setManualTableNumber("");
  };

  const handleRemoveCandidateFromRoom = (candidateId: string) => {
    const targetCandidate = candidates.find((c) => c.id === candidateId);
    const updated = candidates.map((c) => {
      if (c.id !== candidateId) return c;
      if (activeSlots.length > 0) {
        const nextBySlot = { ...(c.assignmentsBySlot || {}) };
        activeSlots.forEach((s) => delete nextBySlot[s.id]);
        const examSlotIdSet = new Set(currentExamSlots.map((s) => s.id));
        const stillHasSlot = Object.entries(nextBySlot).some(
          ([sId, a]) =>
            Boolean(a?.roomName) &&
            ((selectedExam && a.examId === selectedExam.id) || examSlotIdSet.has(sId))
        );
        const nextByExam = { ...(c.assignmentsByExam || {}) };
        if (!stillHasSlot && selectedExam) {
          delete nextByExam[selectedExam.id];
          return {
            ...c,
            assignmentsBySlot: nextBySlot,
            assignmentsByExam: nextByExam,
            roomName: "",
            tableNumber: "",
            anonymatNumber: "",
          };
        }
        return {
          ...c,
          assignmentsBySlot: nextBySlot,
          assignmentsByExam: nextByExam,
        };
      }
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
    onShowNotification(
      `Élève ${targetCandidate?.lastName} retiré(e) de la salle.`
    );
  };

  // --- CONSOLIDATED PHYSICAL ROOM × TIME WINDOW MODEL FOR TAB 2 (SURVEILLANTS) ---
  interface ConsolidatedRoomUnit {
    room: CmsRoom;
    hostedSlots: CmsExamSlot[];
    subjects: string[];
    isTT: boolean;
    effectiveEndTime: string;
    effectiveTimeSlot: string;
    durationMinutes: number;
    examTitle: string;
    primarySlot: CmsExamSlot;
  }

  interface ConsolidatedTimeWindow {
    windowKey: string;
    date: string;
    startTime: string;
    baseEndTime: string;
    slots: CmsExamSlot[];
    roomUnits: ConsolidatedRoomUnit[];
  }

  const consolidatedTimeWindows: ConsolidatedTimeWindow[] = useMemo(() => {
    const filtered = (
      selectedSlotId === "all"
        ? examSlots
        : examSlots.filter((s) => s.id === selectedSlotId)
    ).slice();

    filtered.sort((a, b) => {
      const d = (a.date || "").localeCompare(b.date || "");
      if (d !== 0) return d;
      const t = (a.startTime || "").localeCompare(b.startTime || "");
      if (t !== 0) return t;
      return (a.subject || "").localeCompare(b.subject || "");
    });

    const windowMap = new Map<string, CmsExamSlot[]>();
    filtered.forEach((slot) => {
      const key = `${slot.date || ""}::${slot.startTime || ""}`;
      if (!windowMap.has(key)) windowMap.set(key, []);
      windowMap.get(key)!.push(slot);
    });

    return Array.from(windowMap.entries()).map(([windowKey, slotsInWin]) => {
      const date = slotsInWin[0]?.date || "";
      const startTime = slotsInWin[0]?.startTime || "08:00";
      const baseEndTime =
        slotsInWin
          .map((s) => s.endTime || "")
          .sort()
          .pop() || "10:00";

      // Deduplicate unique physical rooms across all simultaneous slots in this window
      const roomToSlots = new Map<string, CmsExamSlot[]>();
      slotsInWin.forEach((sl) => {
        const roomNamesForSlot =
          sl.roomNames && sl.roomNames.length > 0
            ? sl.roomNames
            : selectedRooms.map((r) => r.name);
        roomNamesForSlot.forEach((rn) => {
          const matchedRoom = rooms.find(
            (r) => r.name.trim().toLowerCase() === rn.trim().toLowerCase()
          );
          if (!matchedRoom) return;
          if (!roomToSlots.has(matchedRoom.id)) roomToSlots.set(matchedRoom.id, []);
          roomToSlots.get(matchedRoom.id)!.push(sl);
        });
      });

      const roomUnits: ConsolidatedRoomUnit[] = rooms
        .filter((r) => roomToSlots.has(r.id))
        .map((room) => {
          const hostedSlots = roomToSlots.get(room.id) || [];
          const subjects = Array.from(new Set(hostedSlots.map((s) => s.subject).filter(Boolean)));
          const parentExam = exams.find((e) =>
            hostedSlots.some(
              (hs) =>
                hs.examId === e.id ||
                hs.examTitle.trim().toLowerCase() === e.title.trim().toLowerCase()
            )
          );
          const hasTTCandidate = candidates.some(
            (c) =>
              isCandidateTiersTemps(c) &&
              hostedSlots.some(
                (hs) =>
                  (c.assignmentsBySlot?.[hs.id]?.roomName || "").trim().toLowerCase() ===
                  room.name.trim().toLowerCase()
              )
          );
          const isTT =
            hasTTCandidate || isRoomMarkedTiersTemps(room, hostedSlots, parentExam || selectedExam);

          const maxBaseDur = Math.max(
            60,
            ...hostedSlots.map((s) => Number(s.durationMinutes) || 60)
          );
          const roomBaseEnd =
            hostedSlots
              .map((s) => s.endTime || "")
              .sort()
              .pop() || baseEndTime;
          const explicitTT = hostedSlots.find((s) => Boolean(s.tiersTempsEndTime))?.tiersTempsEndTime;
          const effectiveEndTime = isTT
            ? computeTiersTempsEndTimeColon(startTime, maxBaseDur, explicitTT)
            : roomBaseEnd;
          const effectiveTimeSlot = `${startTime} - ${effectiveEndTime}`;
          const parsedRange = parseTimeRangeMinutes(effectiveTimeSlot);
          const durationMinutes = parsedRange
            ? Math.max(30, parsedRange.endMin - parsedRange.startMin)
            : maxBaseDur;

          return {
            room,
            hostedSlots,
            subjects,
            isTT,
            effectiveEndTime,
            effectiveTimeSlot,
            durationMinutes,
            examTitle: hostedSlots[0]?.examTitle || "",
            primarySlot: hostedSlots[0],
          };
        });

      return {
        windowKey,
        date,
        startTime,
        baseEndTime,
        slots: slotsInWin,
        roomUnits,
      };
    });
  }, [examSlots, selectedSlotId, rooms, selectedRooms, exams, candidates, selectedExam]);

  // --- AUTOMATIC SUPERVISOR DISPATCH (BY CONSOLIDATED PHYSICAL ROOM × TIME WINDOW) ---
  const handleAutoDispatchSurveillants = () => {
    if (!onSetSurveillances) return;
    if (teachers.length === 0) {
      alert("Aucun professeur disponible. Importez ou ajoutez des professeurs dans Données > Professeurs.");
      return;
    }
    if (examSlots.length === 0) {
      alert("Aucun créneau d'épreuve programmé. Programmez d'abord des créneaux dans l'Étape 4 : Créneaux des Épreuves.");
      return;
    }

    // Track remaining surveillances if filtering a single slot
    const targetWindowSlotIds = new Set(consolidatedTimeWindows.flatMap((w) => w.slots.map((s) => s.id)));
    const targetWindowRoomDates = new Set(
      consolidatedTimeWindows.flatMap((w) =>
        w.roomUnits.map((u) => `${w.date}::${u.room.name.trim().toLowerCase()}`)
      )
    );

    const keptSurveillances =
      selectedSlotId === "all"
        ? surveillances.filter((s) => s.roomName === "Renfort") // keep Renfort posts
        : surveillances.filter(
            (s) =>
              !(
                (s.slotId && targetWindowSlotIds.has(s.slotId)) ||
                targetWindowRoomDates.has(`${s.date}::${(s.roomName || "").trim().toLowerCase()}`)
              )
          );

    // Track cumulative assigned minutes per teacher across all preserved + newly created surveillances
    const teacherMinutesLoad: Record<string, number> = {};
    const teacherObjectByName = new Map<string, CmsTeacher>();
    teachers.forEach((t) => {
      const name = `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`;
      teacherMinutesLoad[name] = 0;
      teacherObjectByName.set(name, t);
    });

    keptSurveillances.forEach((s) => {
      const r = parseTimeRangeMinutes(s.timeSlot);
      const mins = r ? Math.max(30, r.endMin - r.startMin) : 60;
      if (s.teacherName && s.teacherName in teacherMinutesLoad) {
        teacherMinutesLoad[s.teacherName] += mins;
      }
    });

    const workingSurveillances: CmsSurveillance[] = [...keptSurveillances];
    let assignedCount = 0;
    let skippedNoTeacherCount = 0;

    consolidatedTimeWindows.forEach((win) => {
      win.roomUnits.forEach((unit) => {
        // Teachers whose schedule does NOT overlap [startTime..effectiveEndTime] on win.date
        const nonConflictingNames = teachers
          .map((t) => `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`)
          .filter(
            (fullName) =>
              !workingSurveillances.some(
                (existing) =>
                  existing.teacherName === fullName &&
                  surveillancesTimeOverlap(existing.date, existing.timeSlot, win.date, unit.effectiveTimeSlot)
              )
          );

        if (nonConflictingNames.length === 0) {
          skippedNoTeacherCount++;
          return;
        }

        // Strongly prefer teachers who do NOT teach any of the subjects hosted in that room
        const neutralSubjectTeachers = nonConflictingNames.filter((fullName) => {
          const tObj = teacherObjectByName.get(fullName);
          return !tObj || !teacherMatchesSlotSubjects(tObj.subject, unit.subjects);
        });

        const pool = neutralSubjectTeachers.length > 0 ? neutralSubjectTeachers : nonConflictingNames;
        pool.sort((a, b) => (teacherMinutesLoad[a] || 0) - (teacherMinutesLoad[b] || 0));

        const chosen = pool[0];
        teacherMinutesLoad[chosen] = (teacherMinutesLoad[chosen] || 0) + unit.durationMinutes;

        workingSurveillances.push({
          id: `surv-auto-${unit.primarySlot.id}-${unit.room.id}-${Date.now()}-${assignedCount}`,
          examTitle: unit.examTitle,
          slotId: unit.primarySlot.id,
          teacherName: chosen,
          roomName: unit.room.name,
          date: win.date,
          timeSlot: unit.effectiveTimeSlot,
          mission: unit.isTT
            ? "Surveillant titulaire (Tiers-Temps +1/3)"
            : "Surveillant titulaire",
        });
        assignedCount++;
      });
    });

    onSetSurveillances(workingSurveillances);
    onShowNotification(
      `🎲 Brassage équitable réussi : ${assignedCount} salle(s) physique(s) couverte(s) sans aucun conflit horaire${skippedNoTeacherCount > 0 ? ` (${skippedNoTeacherCount} salle(s) sans enseignant disponible)` : ""}.`
    );
  };

  // Manual assign or change surveillant for a consolidated physical room × time window
  const handleAssignTeacherToRoomWindow = (
    unit: ConsolidatedRoomUnit,
    date: string,
    teacherFullName: string
  ) => {
    if (!onSetSurveillances) return;

    // Remove existing surveillance rows matching this exact physical room overlapping this window
    const filtered = surveillances.filter(
      (s) =>
        !(
          s.roomName.trim().toLowerCase() === unit.room.name.trim().toLowerCase() &&
          surveillancesTimeOverlap(s.date, s.timeSlot, date, unit.effectiveTimeSlot)
        )
    );

    if (teacherFullName) {
      filtered.push({
        id: `surv-${Date.now()}-${unit.room.id}`,
        examTitle: unit.examTitle,
        slotId: unit.primarySlot.id,
        teacherName: teacherFullName,
        roomName: unit.room.name,
        date,
        timeSlot: unit.effectiveTimeSlot,
        mission: unit.isTT
          ? "Surveillant titulaire (Tiers-Temps +1/3)"
          : "Surveillant titulaire",
      });
      onShowNotification(
        `${teacherFullName} affecté(e) à ${unit.room.name} (${unit.effectiveTimeSlot}${unit.isTT ? " • TT" : ""}).`
      );
    } else {
      onShowNotification(`Surveillance retirée pour ${unit.room.name}.`);
    }

    onSetSurveillances(filtered);
  };

  // Teacher equity summary for Tab 2
  const teacherEquityStats = useMemo(() => {
    const minutesByTeacher = new Map<string, number>();
    surveillances.forEach((s) => {
      if (!s.teacherName) return;
      const r = parseTimeRangeMinutes(s.timeSlot);
      const mins = r ? Math.max(30, r.endMin - r.startMin) : 60;
      minutesByTeacher.set(s.teacherName, (minutesByTeacher.get(s.teacherName) || 0) + mins);
    });
    const values = Array.from(minutesByTeacher.values());
    const minM = values.length > 0 ? Math.min(...values) : 0;
    const maxM = values.length > 0 ? Math.max(...values) : 0;
    const totalRooms = consolidatedTimeWindows.reduce((acc, w) => acc + w.roomUnits.length, 0);
    const coveredRooms = consolidatedTimeWindows.reduce(
      (acc, w) =>
        acc +
        w.roomUnits.filter((u) =>
          surveillances.some(
            (s) =>
              s.roomName.trim().toLowerCase() === u.room.name.trim().toLowerCase() &&
              surveillancesTimeOverlap(s.date, s.timeSlot, w.date, u.effectiveTimeSlot)
          )
        ).length,
      0
    );
    return {
      mobilizedCount: minutesByTeacher.size,
      minLabel: formatMinutesToColon(minM).replace(":", "h"),
      maxLabel: formatMinutesToColon(maxM).replace(":", "h"),
      totalRooms,
      coveredRooms,
    };
  }, [surveillances, consolidatedTimeWindows]);

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
                        setCheckedSlotIdsByExamDate((prev) => {
                          const next = { ...prev };
                          Object.keys(next).forEach((k) => {
                            if (k.startsWith(`${exam.id}::`)) delete next[k];
                          });
                          return next;
                        });
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
                        <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200 font-bold text-emerald-700 tabular-nums">
                          {matchingCount} élève(s)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-500 tabular-nums">
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

          {/* STEP 2: CASCADE SELECTOR -> DATE -> ÉPREUVE / CRÉNEAU */}
          {selectedExam && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-[#0F2A56] font-bold text-xs">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      2. Cibler la Date et l&apos;Épreuve (Créneau)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chaque créneau d&apos;épreuve dispose de ses propres salles mobilisées et de sa répartition dédiée.
                    </p>
                  </div>
                </div>
                {currentExamSlots.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Basculer rapidement vers une épreuve"
                      value={activeSlots.length === 1 ? activeSlots[0].id : ""}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const target = currentExamSlots.find((s) => s.id === e.target.value);
                        if (target) {
                          const examKey = selectedExam.id;
                          setSelectedDateByExam((prev) => ({ ...prev, [examKey]: target.date }));
                          setCheckedSlotIdsByExamDate((prev) => ({
                            ...prev,
                            [`${examKey}::${target.date}`]: [target.id],
                          }));
                          setShowAllSchoolRooms(false);
                          setInspectingRoomName(null);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 max-w-xs"
                    >
                      <option value="">-- Choisir rapidement une épreuve --</option>
                      {currentExamSlots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.date} • {s.startTime}-{s.endTime} • {s.subject}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {currentExamSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Aucun créneau d&apos;épreuve n&apos;est encore programmé pour &laquo; {selectedExam.title} &raquo;. Créez vos créneaux dans <strong>04 Créneaux des Épreuves</strong> pour répartir par date et par matière (mode session globale actif en attendant).
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 2A. Dates */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Date des épreuves ({availableDates.length} journée{availableDates.length > 1 ? "s" : ""}) :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableDates.map((d) => {
                        const daySlots = currentExamSlots.filter((s) => s.date === d);
                        const isSelected = d === selectedDate;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedDate(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                              isSelected
                                ? "bg-[#0F2A56] text-white border-[#0F2A56] shadow-xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span className="tabular-nums">{formatDisplayDateFr(d)}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                                isSelected ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200"
                              }`}
                            >
                              {daySlots.length} épr.
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2B. Épreuves du jour sélectionné (Multi-sélection par cases à cocher) */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex flex-wrap items-center gap-2">
                        <span>
                          Épreuve(s) / Créneau(x) du {formatDisplayDateFr(selectedDate)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold tabular-nums ${
                            checkedSlotIds.length === 0
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-blue-100 text-[#0F2A56] border border-blue-200"
                          }`}
                        >
                          {checkedSlotIds.length} COCHÉE{checkedSlotIds.length > 1 ? "S" : ""} / {slotsForSelectedDate.length}
                        </span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {primarySlot && slotsForSelectedDate.length > 1 && (
                          <button
                            type="button"
                            onClick={handleCheckSameTimeWindow}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0F2A56] border border-blue-200 text-[11px] font-semibold transition cursor-pointer"
                            title="Cocher automatiquement toutes les épreuves ayant lieu simultanément sur le même horaire"
                          >
                            Regrouper même créneau horaire
                          </button>
                        )}
                        {slotsForSelectedDate.length > 1 && checkedSlotIds.length < slotsForSelectedDate.length && (
                          <button
                            type="button"
                            onClick={handleCheckAllDateSlots}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Tout cocher ce jour
                          </button>
                        )}
                        {isMultiSlotMode && primarySlot && (
                          <button
                            type="button"
                            onClick={() => setSelectedDispatchSlotId(primarySlot.id)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold transition cursor-pointer"
                          >
                            1 seule épreuve
                          </button>
                        )}
                        {checkedSlotIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleUncheckAllDateSlots}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Tout décocher
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {slotsForSelectedDate.map((slot) => {
                        const isChecked = checkedSlotIds.includes(slot.id);
                        const slotAssignedCount = candidates.filter((c) =>
                          Boolean(c.assignmentsBySlot?.[slot.id]?.roomName)
                        ).length;
                        const slotRoomsList = slot.roomNames || [];
                        return (
                          <label
                            key={slot.id}
                            className={`text-left p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 select-none ${
                              isChecked
                                ? "border-[#1D4ED8] bg-blue-50/75 ring-2 ring-blue-500/20 shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCheckedSlot(slot.id)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8] shrink-0 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-xs text-slate-900 leading-snug">
                                  {slot.subject}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#0F2A56] bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0 tabular-nums">
                                  {slot.startTime}–{slot.endTime}
                                </span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600">
                                {slot.targetLevel && (
                                  <span className="font-semibold text-slate-700">
                                    {getShortLevelBadge(slot.targetLevel) || slot.targetLevel}
                                  </span>
                                )}
                                {slot.targetSpecialty && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-semibold text-indigo-700">{slot.targetSpecialty}</span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums font-medium">
                                  {slotRoomsList.length > 0
                                    ? `${slotRoomsList.length} salle${slotRoomsList.length > 1 ? "s" : ""}`
                                    : "0 salle"}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className={`tabular-nums font-bold ${slotAssignedCount > 0 ? "text-emerald-700" : "text-slate-500"}`}>
                                  {slotAssignedCount} affecté{slotAssignedCount > 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conflict Alert Banner (if any overlapping compatible slots or double-booking detected) */}
          {examConflicts.length > 0 && (
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/90 text-rose-950 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>
                    Alerte de conflit horaire détectée ({examConflicts.length} chevauchement{examConflicts.length > 1 ? "s" : ""})
                  </span>
                </div>
                {assignedOverlapConflicts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCleanAssignedConflicts}
                    className="px-3 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold transition self-start sm:self-auto"
                  >
                    Corriger les {assignedOverlapConflicts.length} double(s) affectation(s)
                  </button>
                )}
              </div>
              <div className="text-[11px] text-rose-800 space-y-1 max-h-28 overflow-y-auto pr-1">
                {examConflicts.slice(0, 6).map((c, i) => (
                  <p key={`${c.candidate.id}-${c.slotA.id}-${c.slotB.id}-${i}`}>
                    • <strong>{c.candidate.lastName} {c.candidate.firstName}</strong> ({c.candidate.className}) :{" "}
                    {c.kind === "assigned_overlap" ? (
                      <>
                        affecté(e) simultanément à <strong>{c.slotA.subject}</strong> ({c.roomA}) et{" "}
                        <strong>{c.slotB.subject}</strong> ({c.roomB}) le {formatDisplayDateFr(c.slotA.date)}
                      </>
                    ) : (
                      <>
                        épreuves compatibles en conflit le {formatDisplayDateFr(c.slotA.date)} :{" "}
                        <strong>{c.slotA.subject}</strong> ({c.slotA.startTime}–{c.slotA.endTime}) et{" "}
                        <strong>{c.slotB.subject}</strong> ({c.slotB.startTime}–{c.slotB.endTime})
                      </>
                    )}
                  </p>
                ))}
                {examConflicts.length > 6 && (
                  <p className="italic font-medium">
                    ...et {examConflicts.length - 6} autre(s) conflit(s).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons: Reset, Multi-Slot Dispatch & Global Intelligent Dispatch */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-600 space-y-1">
              <div>
                {hasSlotsButNoneChecked ? (
                  <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Aucune épreuve cochée pour le {formatDisplayDateFr(selectedDate)} — Cochez une ou plusieurs épreuves ci-dessus pour traiter ses salles et candidats.
                    </span>
                  </span>
                ) : activeSlots.length > 1 ? (
                  <>
                    Sélection groupée ({activeSlots.length} épreuves) :{" "}
                    <strong className="text-[#0F2A56]">
                      {activeSlots.map((s) => s.subject).join(" + ")}
                    </strong>{" "}
                    <span className="text-slate-500 font-mono tabular-nums">
                      ({formatDisplayDateFr(selectedDate)})
                    </span>{" "}
                    • Candidats dédoublonnés :{" "}
                    <strong className="text-emerald-700 tabular-nums">
                      {targetCandidates.length} élève(s)
                    </strong>
                  </>
                ) : primarySlot ? (
                  <>
                    Épreuve active : <strong className="text-[#0F2A56]">{primarySlot.subject}</strong>{" "}
                    <span className="text-slate-500 font-mono tabular-nums">
                      ({formatDisplayDateFr(primarySlot.date)} • {primarySlot.startTime}–{primarySlot.endTime})
                    </span>{" "}
                    • Niveau :{" "}
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-800">
                      {getShortLevelBadge(primarySlot.targetLevel || "") || "Session"}
                    </span>{" "}
                    • Candidats ciblés :{" "}
                    <strong className="text-emerald-700 tabular-nums">
                      {targetCandidates.length} élève(s)
                    </strong>
                  </>
                ) : (
                  <>
                    Session sélectionnée : <strong className="text-slate-900">{selectedExam?.title || "Examen général"}</strong> • Niveau(x) : <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-800">{selectedExam ? getExamTargetLevels(selectedExam).map((l) => getShortLevelBadge(l) || l).join(", ") : "Tous niveaux"}</span> • Candidats ciblés : <strong className="text-emerald-700 tabular-nums">{targetCandidates.length} élèves</strong>
                  </>
                )}
              </div>
              {activeSlots.length > 0 && occupiedInParallelSlots.size > 0 && (
                <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>
                    Protection anti-chevauchement active : <strong>{occupiedInParallelSlots.size}</strong> élève(s) déjà affecté(s) sur une autre épreuve hors sélection sont automatiquement exclu(s).
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto shrink-0">
              <button
                type="button"
                disabled={hasSlotsButNoneChecked}
                onClick={handleResetDispatch}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 disabled:opacity-45 disabled:cursor-not-allowed text-rose-700 font-semibold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Efface les attributions des épreuves sélectionnées et remet les salles à zéro"
              >
                <RotateCcw className="h-4 w-4 text-rose-600" />
                <span>
                  {activeSlots.length > 1
                    ? `Réinitialiser les ${activeSlots.length} épreuves`
                    : primarySlot
                      ? "Réinitialiser cette épreuve"
                      : hasSlotsButNoneChecked
                        ? "Réinitialiser la sélection"
                        : "Réinitialiser cet examen"}
                </span>
              </button>
              <button
                type="button"
                disabled={hasSlotsButNoneChecked}
                onClick={handleRunDispatch}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Lancer le Brassage ({targetCandidates.length} élèves)</span>
              </button>
              {currentExamSlots.length > 1 && (
                <button
                  type="button"
                  onClick={handleRunDispatchAllSlots}
                  className="px-4 py-2 rounded-xl bg-[#0F2A56] hover:bg-[#1D4ED8] text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  title="Exécute la répartition épreuve par épreuve sur toute la session en respectant salles, Tiers-Temps, spécialités et unicité horaire"
                >
                  <Layers className="h-4 w-4 text-amber-300" />
                  <span>Brassage intelligent (toute la session)</span>
                </button>
              )}
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

          {/* Salles Mobilisées & Jauges Standard / Tiers-Temps */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            {hasSlotsButNoneChecked ? (
              <div className="p-8 text-center bg-slate-50/80 border-2 border-dashed border-slate-200 rounded-2xl space-y-2.5">
                <Calendar className="h-9 w-9 text-[#0F2A56]/60 mx-auto" />
                <p className="text-sm font-bold text-slate-900">
                  Aucune épreuve cochée sur la journée du {formatDisplayDateFr(selectedDate)}
                </p>
                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Veuillez cocher au moins une épreuve ci-dessus (étape 2) pour afficher ses salles mobilisées, ajuster les quotas Standard / Tiers-Temps et lancer la répartition des candidats.
                </p>
              </div>
            ) : (
              <>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <School className="h-4 w-4 text-emerald-600" />
                  <span>
                    {activeSlots.length > 1
                      ? `Salles mobilisées fusionnées (${selectedRooms.length} salle${selectedRooms.length > 1 ? "s" : ""} unique${selectedRooms.length > 1 ? "s" : ""})`
                      : primarySlot
                        ? `Salles mobilisées pour « ${primarySlot.subject} » (${selectedRooms.length} / ${rooms.length})`
                        : `Salles mobilisées pour cet examen (${selectedRooms.length} / ${rooms.length})`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeSlots.length > 1
                    ? `${formatDisplayDateFr(selectedDate)} — Fusion sans doublon de ${activeSlots.map((s) => s.subject).join(", ")}.`
                    : primarySlot
                      ? `${formatDisplayDateFr(primarySlot.date)} • ${primarySlot.startTime}–${primarySlot.endTime} — Choisissez uniquement les salles réservées à cette épreuve et définissez la salle Tiers-Temps.`
                      : "Choisissez les salles et définissez la salle réservée aux élèves Tiers-Temps."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 border tabular-nums ${
                    capacityStats.totalCapacity >= capacityStats.totalStudentsCount
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  <span>
                    Capacité totale : {capacityStats.totalCapacity} pl. / {capacityStats.totalStudentsCount} él.
                  </span>
                  {capacityStats.totalCapacity >= capacityStats.totalStudentsCount ? "✓" : "⚠️ Manque de places"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllSchoolRooms(!showAllSchoolRooms)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  {showAllSchoolRooms ? "Afficher uniquement les salles sélectionnées" : "+ Afficher toutes les salles"}
                </button>
              </div>
            </div>

            {/* Dual Capacity Gauges: Standard vs Tiers-Temps (+1/3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Gauge 1: Standard */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    🏫 Salles Standard ({capacityStats.stdRoomsCount})
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {capacityStats.stdCapacity} places / {capacityStats.stdStudentsCount} candidats
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      capacityStats.stdCapacity >= capacityStats.stdStudentsCount
                        ? "bg-emerald-600"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        capacityStats.stdCapacity > 0
                          ? Math.round((capacityStats.stdStudentsCount / capacityStats.stdCapacity) * 100)
                          : capacityStats.stdStudentsCount > 0
                            ? 100
                            : 0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Gauge 2: Tiers-Temps (+1/3) */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900">
                    ♿ Salles Tiers-Temps (+1/3) ({capacityStats.ttRoomsCount})
                  </span>
                  <span className="font-mono font-bold text-purple-950 tabular-nums">
                    {capacityStats.ttCapacity} places / {capacityStats.ttStudentsCount} PAP·PPS·TT
                  </span>
                </div>
                <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      capacityStats.ttCapacity >= capacityStats.ttStudentsCount
                        ? "bg-purple-600"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        capacityStats.ttCapacity > 0
                          ? Math.round((capacityStats.ttStudentsCount / capacityStats.ttCapacity) * 100)
                          : capacityStats.ttStudentsCount > 0
                            ? 100
                            : 0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Room Cards with Mobilization & TT toggles */}
            {roomBreakdown.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                <School className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  {primarySlot
                    ? `Aucune salle réservée pour les épreuves sélectionnées (${formatDisplayDateFr(selectedDate)}).`
                    : `Aucune salle n'est actuellement mobilisée pour "${selectedExam?.title || "cet examen"}".`}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Les salles cochées ici sont enregistrées pour les épreuves sélectionnées et dédoublonnées automatiquement.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllSchoolRooms(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
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
                        ? "border-purple-400 bg-purple-50/40 shadow-xs ring-1 ring-purple-200"
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

                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 tabular-nums">
                      Cap. {room.capacity} pl.
                    </span>
                  </div>

                  {/* Standard vs Tiers-Temps Switch */}
                  {isMobilized && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            if (isTT) handleToggleTTRoom(room.id);
                          }}
                          className={`flex-1 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
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
                          className={`flex-1 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            isTT
                              ? "bg-purple-600 text-white shadow-2xs font-bold"
                              : "text-purple-700 hover:bg-purple-100/60"
                          }`}
                        >
                          ♿ Tiers-Temps
                        </button>
                      </div>

                      {isTT ? (
                        <p className="text-[10px] text-purple-800 font-semibold">
                          ♿ Salle Tiers-Temps : les élèves PAP/PPS/TT y sont orientés en priorité.
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500">
                          🏫 Accueil des candidats standard.
                        </p>
                      )}
                    </div>
                  )}

                  {isMobilized ? (
                    <>
                      {/* Quota Setting */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <SlidersHorizontal className="h-3 w-3 text-blue-600" />
                            <span>Quota :</span>
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
                                const key = `${scopeKey}:${room.id}`;
                                setCustomRoomCapacities((prev) => ({
                                  ...prev,
                                  [key]: safeVal,
                                }));
                                if (activeSlots.length > 0) {
                                  activeSlots.forEach((sl) => {
                                    onUpdateExamSlot?.(sl.id, {
                                      customRoomQuotas: {
                                        ...(sl.customRoomQuotas || {}),
                                        [room.id]: safeVal,
                                      },
                                    });
                                  });
                                } else if (selectedExam) {
                                  onUpdateExam?.(selectedExam.id, {
                                    customRoomQuotas: {
                                      ...(selectedExam.customRoomQuotas || {}),
                                      [room.id]: safeVal,
                                    },
                                  });
                                }
                              }}
                              className="w-16 px-2 py-0.5 text-xs font-bold text-center border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 tabular-nums"
                            />
                            <span className="text-[10px] text-slate-400">pl.</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Élèves affectés :</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {assignedCount} / {quota} prévus ({room.capacity} max)
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

                      <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                        <span>Remplissage : {fillRate}%</span>
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
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition flex items-center gap-1 border border-blue-200 cursor-pointer"
                        >
                          <UserPlus className="h-3 w-3" />
                          <span>+ Ajouter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInspectingRoomName(inspectingRoomName === room.name ? null : room.name)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer tabular-nums"
                        >
                          <span>Élèves ({assignedCount})</span>
                          {inspectingRoomName === room.name ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      {/* Expandable list of students assigned to this room */}
                      {inspectingRoomName === room.name && (
                        <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {assignedCount === 0 ? (
                            <p className="text-[11px] text-slate-400 italic text-center py-2">
                              Aucun élève affecté à cette salle (0 / {quota}).
                            </p>
                          ) : (
                            slotEligibleAllCandidates
                              .filter((c) => getActiveAssignment(c).roomName === room.name)
                              .sort((a, b) => {
                                const tA = parseInt(getActiveAssignment(a).tableNumber || "0", 10);
                                const tB = parseInt(getActiveAssignment(b).tableNumber || "0", 10);
                                return tA - tB;
                              })
                              .map((c) => {
                                const assign = getActiveAssignment(c);
                                return (
                                  <div
                                    key={c.id}
                                    className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]"
                                  >
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      <span className="font-bold text-blue-700 w-7 text-center shrink-0 tabular-nums">
                                        T.{assign.tableNumber || "?"}
                                      </span>
                                      <span className="font-semibold text-slate-900 truncate">
                                        {c.lastName} {c.firstName}
                                      </span>
                                      <span className="text-[10px] text-slate-400 shrink-0">({c.className})</span>
                                      {isMultiSlotMode && assign.slotSubject && (
                                        <span className="text-[9px] px-1 rounded bg-blue-50 text-blue-700 font-semibold truncate max-w-[80px]">
                                          {assign.slotSubject}
                                        </span>
                                      )}
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
                      Non mobilisée pour cette sélection.
                    </p>
                  )}
                </div>
              ))}
            </div>
            )}
              </>
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
                    {primarySlot
                      ? `Épreuve(s) : ${activeSlots.map((s) => s.subject).join(" + ")} (${formatDisplayDateFr(selectedDate)}) • ${slotEligibleAllCandidates.length} élève(s) éligible(s)`
                      : `Session : ${selectedExam?.title || "Général"} • Filtré strictement par niveau ciblé (${targetCandidates.length} éligible(s))`}
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
                      onClick={() =>
                        setManualSelectedIds(
                          filteredManualCandidates
                            .filter((c) => !occupiedInParallelSlots.has(c.id))
                            .map((c) => c.id)
                        )
                      }
                      className="text-[11px] font-bold text-blue-700 hover:underline"
                    >
                      Tout cocher ({filteredManualCandidates.filter((c) => !occupiedInParallelSlots.has(c.id)).length})
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
                      const assign = getActiveAssignment(c);
                      const parallelRoom = occupiedInParallelSlots.get(c.id);
                      const isBlocked = Boolean(parallelRoom);
                      const isTT = isCandidateTiersTemps(c);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center justify-between gap-2 px-3 py-2 transition ${
                            isBlocked
                              ? "bg-rose-50/40 opacity-65 cursor-not-allowed"
                              : checked
                                ? "bg-blue-50/80 cursor-pointer"
                                : "hover:bg-white cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isBlocked}
                              onChange={() => handleToggleManualCandidate(c.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0 disabled:opacity-50"
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
                                : parallelRoom
                                  ? "bg-rose-50 text-rose-800 border border-rose-300"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {assign.roomName
                              ? `${assign.roomName} (T.${assign.tableNumber || "?"})`
                              : parallelRoom
                                ? `Bloqué : ${parallelRoom}`
                                : "Non affecté"}
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
                        const assignedInRoom = slotEligibleAllCandidates.filter(
                          (c) => getActiveAssignment(c).roomName === r.name
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
      {/* TAB 2: AFFECTATION DES SURVEILLANTS (SALLE PHYSIQUE × CRÉNEAU) */}
      {/* ======================================================== */}
      {activeTab === "surveillants" && (
        <div className="space-y-6">
          {/* Controls & Equity Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-[#0F2A56]">Filtrer par créneau :</span>
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
                className="px-5 py-2.5 rounded-xl bg-[#0F2A56] hover:bg-[#1D4ED8] text-white font-bold text-xs transition shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Répartir équitablement par salle physique</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Couverture consolidée :</span>
                <strong className="tabular-nums text-emerald-700">
                  {teacherEquityStats.coveredRooms} / {teacherEquityStats.totalRooms} salles×créneaux
                </strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="tabular-nums">
                Professeurs mobilisés : <strong>{teacherEquityStats.mobilizedCount}</strong>
              </span>
              {teacherEquityStats.mobilizedCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="tabular-nums">
                    Amplitude horaire :{" "}
                    <strong>
                      {teacherEquityStats.minLabel} à {teacherEquityStats.maxLabel}
                    </strong>
                  </span>
                </>
              )}
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-slate-500">
                Verrouillage anti-chevauchement (+1/3 Tiers-Temps inclus) et détection même discipline actifs.
              </span>
            </div>
          </div>

          {/* Consolidated Physical Rooms Grid by Date × Time Window */}
          {consolidatedTimeWindows.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs">
              Aucun créneau d&apos;épreuve configuré. Allez dans l&apos;Étape 4 : &laquo; Créneaux des Épreuves &raquo; pour créer le calendrier.
            </div>
          ) : (
            <div className="space-y-6">
              {consolidatedTimeWindows.map((win) => (
                <div
                  key={win.windowKey}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
                >
                  {/* Consolidated Window Header */}
                  <div className="bg-[#0F2A56] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Clock className="h-4 w-4 text-sky-300 shrink-0" />
                      <span className="font-bold text-sm">
                        {formatDisplayDateFr(win.date)} • {win.startTime} – {win.baseEndTime}
                      </span>
                      <span className="text-[11px] text-blue-200">
                        ({win.roomUnits.length} salle{win.roomUnits.length > 1 ? "s" : ""} physique{win.roomUnits.length > 1 ? "s" : ""})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {Array.from(new Set(win.slots.map((s) => s.subject))).map((subj) => (
                        <span
                          key={subj}
                          className="px-2 py-0.5 rounded bg-white/15 text-white text-[10px] font-semibold"
                        >
                          {subj}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Physical Rooms Matrix */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {win.roomUnits.map((unit) => {
                      const currentSurv = surveillances.find(
                        (s) =>
                          s.roomName.trim().toLowerCase() === unit.room.name.trim().toLowerCase() &&
                          surveillancesTimeOverlap(s.date, s.timeSlot, win.date, unit.effectiveTimeSlot)
                      );
                      const assignedTeacherObj = currentSurv
                        ? teachers.find(
                            (t) =>
                              `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}` ===
                              currentSurv.teacherName
                          )
                        : undefined;
                      const isCurrentSameSubject = Boolean(
                        assignedTeacherObj &&
                          teacherMatchesSlotSubjects(assignedTeacherObj.subject, unit.subjects)
                      );

                      return (
                        <div
                          key={`${win.windowKey}-${unit.room.id}`}
                          className={`p-4 rounded-xl border transition space-y-3 ${
                            currentSurv
                              ? unit.isTT
                                ? "border-purple-300 bg-purple-50/30"
                                : "border-emerald-200 bg-emerald-50/20"
                              : "border-rose-200 bg-rose-50/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <School className="h-4 w-4 text-[#0F2A56] shrink-0" />
                                <span className="font-bold text-sm text-slate-900 truncate">
                                  {unit.room.name}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-600 truncate">
                                {unit.subjects.join(" • ")}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 tabular-nums ${
                                unit.isTT
                                  ? "bg-purple-100 text-purple-900 border border-purple-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {unit.isTT ? `♿ TT ${unit.effectiveTimeSlot}` : unit.effectiveTimeSlot}
                            </span>
                          </div>

                          {/* Surveillance Selector */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Surveillant unique affecté :
                            </label>
                            <select
                              value={currentSurv?.teacherName || ""}
                              onChange={(e) =>
                                handleAssignTeacherToRoomWindow(unit, win.date, e.target.value)
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
                                const conflict = surveillances.find(
                                  (s) =>
                                    s.teacherName === fullName &&
                                    s.roomName.trim().toLowerCase() !==
                                      unit.room.name.trim().toLowerCase() &&
                                    surveillancesTimeOverlap(
                                      s.date,
                                      s.timeSlot,
                                      win.date,
                                      unit.effectiveTimeSlot
                                    )
                                );
                                const isSameSubj = teacherMatchesSlotSubjects(
                                  t.subject,
                                  unit.subjects
                                );

                                return (
                                  <option
                                    key={t.id}
                                    value={fullName}
                                    disabled={Boolean(conflict)}
                                  >
                                    {fullName} ({t.subject})
                                    {conflict
                                      ? ` ⚠️ Indisponible (${conflict.roomName} • ${conflict.timeSlot})`
                                      : isSameSubj
                                        ? " ⚠️ Même discipline"
                                        : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 gap-2">
                            {currentSurv ? (
                              <span
                                className={`font-semibold flex items-center gap-1 ${
                                  isCurrentSameSubject ? "text-amber-700" : "text-emerald-700"
                                }`}
                              >
                                <UserCheck className="h-3 w-3 shrink-0" />
                                <span>
                                  {isCurrentSameSubject
                                    ? "Affecté (même discipline)"
                                    : unit.isTT
                                      ? `Couvert jusqu'à ${unit.effectiveEndTime} (TT)`
                                      : "Surveillance assurée"}
                                </span>
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                <span>Salle sans surveillant !</span>
                              </span>
                            )}

                            {currentSurv && (
                              <button
                                type="button"
                                onClick={() => handleAssignTeacherToRoomWindow(unit, win.date, "")}
                                className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

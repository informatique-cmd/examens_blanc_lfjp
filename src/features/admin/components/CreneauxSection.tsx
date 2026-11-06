import React, { useState, useMemo } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  School,
  Users,
  Scissors,
  CheckCircle2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import type {
  CmsExamSlot,
  CmsExam,
  CmsRoom,
  CmsSurveillance,
  CmsTeacher,
} from "../../../shared/services/cms-store";
import { OFFICIAL_LFJP_PLANNING_SESSIONS } from "../../../shared/data/official-lfjp-planning";

interface CreneauxSectionProps {
  examSlots: CmsExamSlot[];
  exams: CmsExam[];
  rooms: CmsRoom[];
  teachers?: CmsTeacher[];
  surveillances: CmsSurveillance[];
  onAddExamSlot: (slot: Omit<CmsExamSlot, "id">) => void;
  onUpdateExamSlot: (id: string, updates: Partial<CmsExamSlot>) => void;
  onDeleteExamSlot: (id: string) => void;
  onAddSurveillance?: (s: Omit<CmsSurveillance, "id">) => void;
  onDeleteSurveillance?: (id: string) => void;
  onSetSurveillances?: (survs: CmsSurveillance[]) => void;
  onShowNotification: (msg: string) => void;
}

export default function CreneauxSection({
  examSlots,
  exams,
  rooms,
  teachers = [],
  surveillances,
  onAddExamSlot,
  onUpdateExamSlot,
  onDeleteExamSlot,
  onAddSurveillance,
  onDeleteSurveillance,
  onSetSurveillances,
  onShowNotification,
}: CreneauxSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Form state
  const [formExamTitle, setFormExamTitle] = useState<string>(exams[0]?.title || "DNB blanc");
  const [formSubject, setFormSubject] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formStartTime, setFormStartTime] = useState<string>("08:00");
  const [formEndTime, setFormEndTime] = useState<string>("09:30");
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(90);
  const [formTargetLevel, setFormTargetLevel] = useState<string>("3ème");
  const [formSelectedRooms, setFormSelectedRooms] = useState<string[]>(rooms.map((r) => r.name));
  const [formNotes, setFormNotes] = useState<string>("");

  // Filter state
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>("all");

  // State to track which slot has its surveillance drawer expanded
  const [expandedSurvSlotIds, setExpandedSurvSlotIds] = useState<Record<string, boolean>>({});
  const toggleExpandSurv = (slotId: string) => {
    setExpandedSurvSlotIds((prev) => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  // State for adding custom sub-slot for a room: key is `${slotId}_${roomName}`
  const [customSubSlotForms, setCustomSubSlotForms] = useState<Record<string, { startTime: string; endTime: string; teacherName: string; isAdding: boolean }>>({});

  // Helper to get all surveillances tied to a slot
  const getSlotSurveillances = (slot: CmsExamSlot) => {
    return surveillances.filter(
      (s) => (slot.id && s.slotId === slot.id) || (s.date === slot.date && s.timeSlot.includes(slot.startTime))
    );
  };

  // Helper to get surveillances for a specific room within a slot
  const getRoomSurveillances = (slot: CmsExamSlot, roomName: string) => {
    return surveillances.filter(
      (s) =>
        s.roomName === roomName &&
        ((slot.id && s.slotId === slot.id) || (s.date === slot.date && s.timeSlot.includes(slot.startTime)))
    );
  };

  // Assign or change teacher on a surveillance
  const handleAssignTeacher = (survId: string, teacherFullName: string) => {
    if (onSetSurveillances) {
      onSetSurveillances(
        surveillances.map((s) => (s.id === survId ? { ...s, teacherName: teacherFullName } : s))
      );
    } else if (onAddSurveillance && onDeleteSurveillance) {
      const existing = surveillances.find((s) => s.id === survId);
      if (existing) {
        onDeleteSurveillance(survId);
        onAddSurveillance({ ...existing, teacherName: teacherFullName });
      }
    }
    onShowNotification(`Enseignant ${teacherFullName} affecté.`);
  };

  // Assign full slot to a single teacher
  const handleAssignFullSlotToRoom = (slot: CmsExamSlot, roomName: string, teacherFullName: string) => {
    const existing = getRoomSurveillances(slot, roomName);
    const newSurv: CmsSurveillance = {
      id: `surv-full-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examTitle: slot.examTitle,
      slotId: slot.id,
      roomName,
      date: slot.date,
      timeSlot: `${slot.startTime} - ${slot.endTime}`,
      teacherName: teacherFullName,
      mission: "Surveillant titulaire (plein créneau)",
    };

    if (onSetSurveillances) {
      const kept = surveillances.filter((s) => !existing.some((e) => e.id === s.id));
      onSetSurveillances([...kept, newSurv]);
    } else if (onAddSurveillance) {
      existing.forEach((e) => onDeleteSurveillance?.(e.id));
      onAddSurveillance(newSurv);
    }
    onShowNotification(`${teacherFullName} affecté(e) en plein créneau sur ${roomName}.`);
  };

  // Split slot into 2 equal halves for a room (e.g. 2h => 2 x 1h, 4h => 2 x 2h)
  const handleSplitInTwo = (slot: CmsExamSlot, roomName: string) => {
    const [h1, m1] = (slot.startTime || "08:00").split(":").map(Number);
    const [h2, m2] = (slot.endTime || "10:00").split(":").map(Number);
    const startMin = (h1 || 0) * 60 + (m1 || 0);
    const endMin = (h2 || 0) * 60 + (m2 || 0);
    const midMin = Math.round((startMin + endMin) / 2);

    const midH = Math.floor(midMin / 60) % 24;
    const midM = midMin % 60;
    const midStr = `${String(midH).padStart(2, "0")}:${String(midM).padStart(2, "0")}`;

    const existingForRoom = getRoomSurveillances(slot, roomName);
    const t1 = existingForRoom[0]?.teacherName || (teachers[0] ? `${teachers[0].civility === "Madame" ? "Mme" : "M."} ${teachers[0].lastName}` : "À affecter");
    const t2 = teachers[1] ? `${teachers[1].civility === "Madame" ? "Mme" : "M."} ${teachers[1].lastName}` : "À affecter";

    const s1: CmsSurveillance = {
      id: `surv-split1-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examTitle: slot.examTitle,
      slotId: slot.id,
      roomName,
      date: slot.date,
      timeSlot: `${slot.startTime} - ${midStr}`,
      teacherName: t1,
      mission: `Surveillant relais (${slot.startTime} - ${midStr})`,
    };

    const s2: CmsSurveillance = {
      id: `surv-split2-${Date.now() + 1}-${Math.random().toString(36).substring(2, 6)}`,
      examTitle: slot.examTitle,
      slotId: slot.id,
      roomName,
      date: slot.date,
      timeSlot: `${midStr} - ${slot.endTime}`,
      teacherName: t2,
      mission: `Surveillant relais (${midStr} - ${slot.endTime})`,
    };

    if (onSetSurveillances) {
      const kept = surveillances.filter((s) => !existingForRoom.some((e) => e.id === s.id));
      onSetSurveillances([...kept, s1, s2]);
    } else if (onAddSurveillance) {
      existingForRoom.forEach((e) => onDeleteSurveillance?.(e.id));
      onAddSurveillance(s1);
      onAddSurveillance(s2);
    }
    onShowNotification(`Créneau scindé en 2 sous-créneaux (${slot.startTime} - ${midStr} et ${midStr} - ${slot.endTime}) pour ${roomName}.`);
  };

  // Split slot into 1-hour segments for a room
  const handleSplitInHours = (slot: CmsExamSlot, roomName: string) => {
    const [h1] = (slot.startTime || "08:00").split(":").map(Number);
    const [h2] = (slot.endTime || "12:00").split(":").map(Number);
    const diffH = Math.max(1, (h2 || 12) - (h1 || 8));

    const existingForRoom = getRoomSurveillances(slot, roomName);
    const newSurvs: CmsSurveillance[] = [];

    for (let i = 0; i < diffH; i++) {
      const curH = (h1 || 8) + i;
      const nextH = curH + 1;
      const tStart = `${String(curH).padStart(2, "0")}:00`;
      const tEnd = i === diffH - 1 ? slot.endTime : `${String(nextH).padStart(2, "0")}:00`;
      const teacherObj = teachers[i % Math.max(1, teachers.length)];
      const tName = teacherObj
        ? `${teacherObj.civility === "Madame" ? "Mme" : "M."} ${teacherObj.lastName}`
        : "À affecter";

      newSurvs.push({
        id: `surv-hour-${i}-${Date.now() + i}-${Math.random().toString(36).substring(2, 6)}`,
        examTitle: slot.examTitle,
        slotId: slot.id,
        roomName,
        date: slot.date,
        timeSlot: `${tStart} - ${tEnd}`,
        teacherName: tName,
        mission: `Surveillant relais (${tStart} - ${tEnd})`,
      });
    }

    if (onSetSurveillances) {
      const kept = surveillances.filter((s) => !existingForRoom.some((e) => e.id === s.id));
      onSetSurveillances([...kept, ...newSurvs]);
    } else if (onAddSurveillance) {
      existingForRoom.forEach((e) => onDeleteSurveillance?.(e.id));
      newSurvs.forEach((ns) => onAddSurveillance(ns));
    }
    onShowNotification(`Créneau scindé en ${diffH} tranches de 1h pour ${roomName}.`);
  };

  // Merge sub-slots back into a single full slot
  const handleMergeRoomSlot = (slot: CmsExamSlot, roomName: string) => {
    const existingForRoom = getRoomSurveillances(slot, roomName);
    const tName = existingForRoom[0]?.teacherName || (teachers[0] ? `${teachers[0].civility === "Madame" ? "Mme" : "M."} ${teachers[0].lastName}` : "À affecter");

    const singleSurv: CmsSurveillance = {
      id: `surv-full-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examTitle: slot.examTitle,
      slotId: slot.id,
      roomName,
      date: slot.date,
      timeSlot: `${slot.startTime} - ${slot.endTime}`,
      teacherName: tName,
      mission: "Surveillant titulaire (plein créneau)",
    };

    if (onSetSurveillances) {
      const kept = surveillances.filter((s) => !existingForRoom.some((e) => e.id === s.id));
      onSetSurveillances([...kept, singleSurv]);
    } else if (onAddSurveillance) {
      existingForRoom.forEach((e) => onDeleteSurveillance?.(e.id));
      onAddSurveillance(singleSurv);
    }
    onShowNotification(`Sous-créneaux fusionnés en créneau plein pour ${roomName}.`);
  };

  // Add custom sub-slot (e.g. 10h00 - 11h00, or 12h00 - 13h20 for tiers-temps)
  const handleAddCustomSubSlot = (slot: CmsExamSlot, roomName: string, startTime: string, endTime: string, teacherName: string) => {
    const newSurv: CmsSurveillance = {
      id: `surv-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examTitle: slot.examTitle,
      slotId: slot.id,
      roomName,
      date: slot.date,
      timeSlot: `${startTime} - ${endTime}`,
      teacherName: teacherName || "À affecter",
      mission: `Surveillant relais (${startTime} - ${endTime})`,
    };

    if (onSetSurveillances) {
      onSetSurveillances([...surveillances, newSurv]);
    } else if (onAddSurveillance) {
      onAddSurveillance(newSurv);
    }
    onShowNotification(`Sous-créneau ${startTime} - ${endTime} ajouté pour ${roomName}.`);
  };

  // Add Renfort teacher (couloir & secrétariat d'examen)
  const handleAddRenfort = (slot: CmsExamSlot, teacherName: string) => {
    if (!teacherName) return;
    const renfortSurv: CmsSurveillance = {
      id: `surv-renfort-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examTitle: slot.examTitle,
      slotId: slot.id,
      roomName: "Renfort",
      date: slot.date,
      timeSlot: `${slot.startTime} - ${slot.endTime}`,
      teacherName,
      mission: "Surveillant de renfort & couloir",
    };

    if (onSetSurveillances) {
      onSetSurveillances([...surveillances, renfortSurv]);
    } else if (onAddSurveillance) {
      onAddSurveillance(renfortSurv);
    }
    onShowNotification(`Surveillant de renfort (${teacherName}) ajouté.`);
  };

  // Load official PDF schedule from attached document
  const handleLoadOfficialLFJPPlanning = () => {
    if (!confirm("Voulez-vous charger l'organisation officielle complète issue du planning LFJP (8 au 10 décembre) avec tous les sous-créneaux et surveillants ?")) {
      return;
    }

    const newSlots: CmsExamSlot[] = [];
    const newSurvs: CmsSurveillance[] = [];

    OFFICIAL_LFJP_PLANNING_SESSIONS.forEach((session) => {
      const slotId = `slot-off-${session.id}`;
      const roomNames = session.rooms.map((r) => r.roomName);

      newSlots.push({
        id: slotId,
        examTitle: session.examTitle,
        subject: session.subjectTitle,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: calculateDiffMinutes(session.startTime, session.endTime),
        tiersTempsEndTime: session.tiersTempsEndTime,
        tiersTempsDurationMinutes: calculateDiffMinutes(session.startTime, session.tiersTempsEndTime),
        targetLevel: "Terminale & 1ère",
        roomNames,
        notes: `Planning officiel LFJP ${session.jour} (${session.creneau})`,
      });

      session.rooms.forEach((r) => {
        r.subSlots.forEach((sub, subIdx) => {
          newSurvs.push({
            id: `surv-off-${session.id}-${r.roomName.replace(/[^a-zA-Z0-9]/g, "_")}-${subIdx}`,
            examTitle: session.examTitle,
            slotId,
            roomName: r.roomName,
            date: session.date,
            timeSlot: sub.timeSlot,
            teacherName: sub.teacherName,
            mission: r.subSlots.length > 1 ? `Surveillant relais (${sub.timeSlot})` : "Surveillant titulaire",
          });
        });
      });

      if (session.renfort) {
        newSurvs.push({
          id: `surv-off-renfort-${session.id}`,
          examTitle: session.examTitle,
          slotId,
          roomName: "Renfort",
          date: session.date,
          timeSlot: `${session.startTime} - ${session.endTime}`,
          teacherName: session.renfort,
          mission: "Surveillant de renfort & couloir",
        });
      }
    });

    newSlots.forEach((ns) => {
      const exists = examSlots.some((s) => s.id === ns.id || (s.date === ns.date && s.subject === ns.subject));
      if (!exists) {
        onAddExamSlot(ns);
      }
    });

    if (onSetSurveillances) {
      onSetSurveillances([...surveillances, ...newSurvs]);
    }
    onShowNotification("Grille officielle LFJP (8 au 10 décembre) chargée avec succès !");
  };

  // Calculate End Time given Start Time & Duration
  const calculateEndTime = (start: string, durationMin: number): string => {
    const [hStr, mStr] = start.split(":");
    const h = parseInt(hStr || "0", 10);
    const m = parseInt(mStr || "0", 10);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  // Calculate difference in minutes between two HH:MM strings
  const calculateDiffMinutes = (start: string, end: string): number => {
    const [h1, m1] = start.split(":").map((v) => parseInt(v || "0", 10));
    const [h2, m2] = end.split(":").map((v) => parseInt(v || "0", 10));
    const total1 = (h1 || 0) * 60 + (m1 || 0);
    const total2 = (h2 || 0) * 60 + (m2 || 0);
    return total2 - total1;
  };

  // Handlers for two-way binding of Start Time, End Time, and Duration
  const handleStartTimeChange = (newStart: string) => {
    setFormStartTime(newStart);
    if (formEndTime) {
      const diff = calculateDiffMinutes(newStart, formEndTime);
      if (diff > 0) {
        setFormDurationMinutes(diff);
      } else {
        setFormEndTime(calculateEndTime(newStart, formDurationMinutes));
      }
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setFormEndTime(newEnd);
    if (formStartTime) {
      const diff = calculateDiffMinutes(formStartTime, newEnd);
      if (diff > 0) {
        setFormDurationMinutes(diff);
      }
    }
  };

  const handleDurationPresetChange = (mins: number) => {
    setFormDurationMinutes(mins);
    setFormEndTime(calculateEndTime(formStartTime, mins));
  };

  // Auto-calculated tiers-temps (+1/3 rounded up to nearest 5 or standard)
  const formTiersTempsDuration = useMemo(() => {
    return Math.round(formDurationMinutes * (4 / 3));
  }, [formDurationMinutes]);

  const formTiersTempsEndTime = useMemo(() => {
    return calculateEndTime(formStartTime, formTiersTempsDuration);
  }, [formStartTime, formTiersTempsDuration]);

  // Open modal for new slot
  const handleOpenNewModal = () => {
    setEditingSlotId(null);
    setFormExamTitle(exams[0]?.title || "DNB blanc");
    setFormSubject("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormStartTime("08:00");
    setFormEndTime("09:30");
    setFormDurationMinutes(90);
    setFormTargetLevel("3ème");
    setFormSelectedRooms(rooms.map((r) => r.name));
    setFormNotes("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (slot: CmsExamSlot) => {
    setEditingSlotId(slot.id);
    setFormExamTitle(slot.examTitle);
    setFormSubject(slot.subject);
    setFormDate(slot.date);
    setFormStartTime(slot.startTime);
    const endT = slot.endTime || calculateEndTime(slot.startTime, slot.durationMinutes);
    setFormEndTime(endT);
    setFormDurationMinutes(slot.durationMinutes);
    setFormTargetLevel(slot.targetLevel || "3ème");
    setFormSelectedRooms(slot.roomNames || rooms.map((r) => r.name));
    setFormNotes(slot.notes || "");
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmitSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) {
      alert("Veuillez indiquer le nom de l'épreuve ou de la discipline.");
      return;
    }

    const payload: Omit<CmsExamSlot, "id"> = {
      examTitle: formExamTitle,
      subject: formSubject.trim(),
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      durationMinutes: formDurationMinutes,
      tiersTempsEndTime: formTiersTempsEndTime,
      tiersTempsDurationMinutes: formTiersTempsDuration,
      targetLevel: formTargetLevel,
      roomNames: formSelectedRooms.length > 0 ? formSelectedRooms : rooms.map((r) => r.name),
      notes: formNotes.trim(),
    };

    if (editingSlotId) {
      onUpdateExamSlot(editingSlotId, payload);
      onShowNotification("Créneau d'épreuve modifié avec succès !");
    } else {
      onAddExamSlot(payload);
      onShowNotification("Nouveau créneau d'épreuve programmé avec succès !");
    }

    setIsModalOpen(false);
  };

  // Toggle a room in room selection
  const handleToggleRoom = (roomName: string) => {
    if (formSelectedRooms.includes(roomName)) {
      setFormSelectedRooms(formSelectedRooms.filter((r) => r !== roomName));
    } else {
      setFormSelectedRooms([...formSelectedRooms, roomName]);
    }
  };

  // Distinct dates for filtering
  const distinctDates = useMemo(() => {
    const set = new Set<string>();
    examSlots.forEach((s) => {
      if (s.date) set.add(s.date);
    });
    return Array.from(set).sort();
  }, [examSlots]);

  // Filtered and chronologically sorted slots
  const filteredSlots = useMemo(() => {
    return examSlots
      .filter((s) => {
        const matchDate = selectedDateFilter === "all" || s.date === selectedDateFilter;
        const matchExam = selectedExamFilter === "all" || s.examTitle === selectedExamFilter;
        return matchDate && matchExam;
      })
      .sort((a, b) => {
        const dateCompare = (a.date || "").localeCompare(b.date || "");
        if (dateCompare !== 0) return dateCompare;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
  }, [examSlots, selectedDateFilter, selectedExamFilter]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, CmsExamSlot[]>();
    filteredSlots.forEach((slot) => {
      const d = slot.date || "Date non définie";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(slot);
    });
    return Array.from(map.entries());
  }, [filteredSlots]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Étape 3 • Calendrier des Épreuves
            </span>
            <span className="text-xs text-slate-500">
              Horaires, épreuves et tiers-temps
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <span>🕒 Créneaux des Épreuves & Programmation</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Définissez les dates, heures de début et fin de chaque épreuve. Le calcul de la majoration Tiers-Temps (+1/3) est automatisé.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLoadOfficialLFJPPlanning}
            className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 font-bold text-xs transition shadow-2xs flex items-center gap-2 cursor-pointer"
            title="Charger les 5 sessions officielles et tous les surveillants du document PDF LFJP (8 au 10 décembre)"
          >
            <FileSpreadsheet className="h-4 w-4 text-indigo-700" />
            <span>Charger Grille PDF LFJP (8-10 déc.)</span>
          </button>
          <button
            onClick={handleOpenNewModal}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Programmer une Épreuve</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Créneaux Totaux</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{examSlots.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Jours d'épreuves</p>
          <p className="text-2xl font-bold text-indigo-600 mt-0.5">{distinctDates.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Salles Mobilisées</p>
          <p className="text-2xl font-bold text-emerald-600 mt-0.5">{rooms.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Surveillances Liées</p>
          <p className="text-2xl font-bold text-purple-600 mt-0.5">{surveillances.length}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filtrer par Jour :</span>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous les jours ({distinctDates.length})</option>
              {distinctDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Examen :</span>
            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Toutes les sessions</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.title}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Affichage : <strong>{filteredSlots.length}</strong> créneau(x)
        </span>
      </div>

      {/* Chronological Slot Listing grouped by Date */}
      <div className="space-y-6">
        {slotsByDate.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <Clock className="h-10 w-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">Aucun créneau d'épreuve programmé pour l'instant.</p>
            <p className="text-xs text-slate-500">
              Cliquez sur "Programmer une Épreuve" ci-dessus pour planifier les dates et horaires.
            </p>
          </div>
        ) : (
          slotsByDate.map(([dateStr, slots]) => (
            <div key={dateStr} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Date Header */}
              <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-sm text-slate-900">
                    {dateStr}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                    {slots.length} épreuve(s)
                  </span>
                </div>
              </div>

              {/* Slots Table */}
              <div className="divide-y divide-slate-100">
                {slots.map((slot) => {
                  // Surveillances tied to this slot
                  const tiedSurvs = surveillances.filter(
                    (s) =>
                      s.date === slot.date &&
                      (s.timeSlot.includes(slot.startTime) || (slot.id && s.slotId === slot.id))
                  );
                  const roomCoverage = slot.roomNames?.length || rooms.length;
                  const coveredCount = tiedSurvs.length;

                  return (
                    <div key={slot.id} className="divide-y divide-slate-100">
                      <div
                        className="p-5 hover:bg-slate-50/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {slot.subject}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {slot.examTitle}
                          </span>
                          {slot.targetLevel && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              Niveau {slot.targetLevel}
                            </span>
                          )}
                        </div>

                        {/* Schedules */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase">Standard ({slot.durationMinutes} min)</p>
                              <p className="font-mono font-bold text-slate-800">
                                {slot.startTime} ➔ {slot.endTime}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/70 border border-purple-200">
                            <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <div>
                              <p className="text-[10px] text-purple-700 font-semibold uppercase">
                                Tiers-Temps +1/3 ({slot.tiersTempsDurationMinutes || Math.round(slot.durationMinutes * 4 / 3)} min)
                              </p>
                              <p className="font-mono font-bold text-purple-900">
                                {slot.startTime} ➔ {slot.tiersTempsEndTime || calculateEndTime(slot.startTime, Math.round(slot.durationMinutes * 4 / 3))}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                            <School className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-[10px] text-emerald-700 font-semibold uppercase">
                                Surveillance Salles
                              </p>
                              <p className="font-bold text-emerald-900">
                                {coveredCount} / {roomCoverage} salle(s) couverte(s)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Mobilized Rooms chips */}
                        {slot.roomNames && slot.roomNames.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-slate-400 font-semibold mr-1">
                              Salles mobilisées :
                            </span>
                            {slot.roomNames.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}

                        {slot.notes && (
                          <p className="text-[11px] text-slate-500 italic">
                            Consigne : {slot.notes}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpandSurv(slot.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            expandedSurvSlotIds[slot.id]
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "border border-indigo-200 bg-indigo-50/70 text-indigo-800 hover:bg-indigo-100"
                          }`}
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Surveillants & Relais ({coveredCount}/{roomCoverage})</span>
                          {expandedSurvSlotIds[slot.id] ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(slot)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Modifier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer le créneau "${slot.subject}" du ${slot.date} ?`)) {
                              onDeleteExamSlot(slot.id);
                              onShowNotification("Créneau supprimé.");
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Supprimer ce créneau"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED SURVEILLANTS & SOUS-CRÉNEAUX MANAGEMENT DRAWER */}
                    {expandedSurvSlotIds[slot.id] && (
                      <div className="p-5 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 border-t border-indigo-100 space-y-4 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600" />
                              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-indigo-600" />
                                <span>Affectation & Scindage des Surveillants • {slot.subject}</span>
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Pour chaque salle, affectez 1 surveillant unique pour toute la durée ({slot.startTime} ➔ {slot.endTime}) OU scindez en 2 sous-créneaux (ex: 2 x 1h) ou par tranches de 1h.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-bold text-xs">
                              {tiedSurvs.length} surveillant(s) mobilisé(s)
                            </span>
                          </div>
                        </div>

                        {/* ROOMS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {(slot.roomNames && slot.roomNames.length > 0 ? slot.roomNames : rooms.map((r) => r.name)).map((roomName) => {
                            const roomSurvs = getRoomSurveillances(slot, roomName);
                            const isTTRoom =
                              roomName.toLowerCase().includes("tt") ||
                              roomName.toLowerCase().includes("tiers") ||
                              roomName.toLowerCase().includes("s5") ||
                              roomName.toLowerCase().includes("s6");
                            const formKey = `${slot.id}_${roomName}`;
                            const customForm = customSubSlotForms[formKey] || {
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                              teacherName: "",
                              isAdding: false,
                            };

                            return (
                              <div
                                key={roomName}
                                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                                  isTTRoom
                                    ? "bg-purple-50/30 border-purple-200"
                                    : roomSurvs.length > 0
                                    ? "bg-white border-slate-200 shadow-2xs"
                                    : "bg-rose-50/20 border-rose-200"
                                }`}
                              >
                                <div className="space-y-2">
                                  {/* Room Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <School className="h-4 w-4 text-indigo-600 shrink-0" />
                                      <span className="font-black text-sm text-slate-900">{roomName}</span>
                                      {isTTRoom && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-200 text-purple-900">
                                          ♿ Tiers-Temps
                                        </span>
                                      )}
                                    </div>

                                    {roomSurvs.length > 1 ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                        ✂️ Scindé ({roomSurvs.length} relais)
                                      </span>
                                    ) : roomSurvs.length === 1 ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        ✓ Plein créneau
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        Non affecté
                                      </span>
                                    )}
                                  </div>

                                  {/* Sub-slots / Surveillances list */}
                                  <div className="space-y-2 pt-1">
                                    {roomSurvs.length === 0 ? (
                                      <div className="p-2.5 rounded-lg bg-slate-50 border border-dashed border-slate-200 space-y-2">
                                        <p className="text-[11px] text-slate-500 italic">
                                          Aucun enseignant affecté pour le moment.
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                          <select
                                            onChange={(e) => {
                                              if (e.target.value) {
                                                handleAssignFullSlotToRoom(slot, roomName, e.target.value);
                                              }
                                            }}
                                            defaultValue=""
                                            className="w-full text-xs py-1 px-2 rounded-lg border border-slate-300 bg-white font-medium"
                                          >
                                            <option value="" disabled>
                                              Affecter 1 prof (plein créneau)...
                                            </option>
                                            {teachers.map((t) => {
                                              const fullName = `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`;
                                              return (
                                                <option key={t.id} value={fullName}>
                                                  {fullName} ({t.subject})
                                                </option>
                                              );
                                            })}
                                          </select>
                                        </div>
                                      </div>
                                    ) : (
                                      roomSurvs.map((surv, sIdx) => (
                                        <div
                                          key={surv.id || sIdx}
                                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                                              ⏰ {surv.timeSlot}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                onDeleteSurveillance?.(surv.id);
                                                onShowNotification("Surveillance retirée.");
                                              }}
                                              className="text-slate-300 hover:text-rose-600 font-bold transition text-xs"
                                              title="Détacher cet enseignant"
                                            >
                                              ✕
                                            </button>
                                          </div>

                                          {/* Teacher Dropdown */}
                                          <div className="flex items-center gap-1.5">
                                            <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                            <select
                                              value={surv.teacherName}
                                              onChange={(e) => handleAssignTeacher(surv.id, e.target.value)}
                                              className="w-full text-xs py-1 px-2 rounded-md border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                                            >
                                              <option value={surv.teacherName}>{surv.teacherName}</option>
                                              {teachers.map((t) => {
                                                const fullName = `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`;
                                                if (fullName === surv.teacherName) return null;
                                                return (
                                                  <option key={t.id} value={fullName}>
                                                    {fullName} ({t.subject})
                                                  </option>
                                                );
                                              })}
                                            </select>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  {/* Custom Sub-slot Add Form */}
                                  {customForm.isAdding && (
                                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs">
                                      <p className="font-bold text-indigo-950 text-[11px]">
                                        Nouveau sous-créneau relais :
                                      </p>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-600 block">Début</label>
                                          <input
                                            type="time"
                                            value={customForm.startTime}
                                            onChange={(e) =>
                                              setCustomSubSlotForms((prev) => ({
                                                ...prev,
                                                [formKey]: { ...customForm, startTime: e.target.value },
                                              }))
                                            }
                                            className="w-full p-1 rounded border border-slate-300 bg-white font-mono text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-600 block">Fin</label>
                                          <input
                                            type="time"
                                            value={customForm.endTime}
                                            onChange={(e) =>
                                              setCustomSubSlotForms((prev) => ({
                                                ...prev,
                                                [formKey]: { ...customForm, endTime: e.target.value },
                                              }))
                                            }
                                            className="w-full p-1 rounded border border-slate-300 bg-white font-mono text-xs"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-[10px] font-bold text-slate-600 block">Enseignant</label>
                                        <select
                                          value={customForm.teacherName}
                                          onChange={(e) =>
                                            setCustomSubSlotForms((prev) => ({
                                              ...prev,
                                              [formKey]: { ...customForm, teacherName: e.target.value },
                                            }))
                                          }
                                          className="w-full p-1 rounded border border-slate-300 bg-white text-xs"
                                        >
                                          <option value="">Sélectionner un enseignant...</option>
                                          {teachers.map((t) => {
                                            const fullName = `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`;
                                            return (
                                              <option key={t.id} value={fullName}>
                                                {fullName} ({t.subject})
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </div>

                                      <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setCustomSubSlotForms((prev) => ({
                                              ...prev,
                                              [formKey]: { ...customForm, isAdding: false },
                                            }))
                                          }
                                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold"
                                        >
                                          Annuler
                                        </button>
                                        <button
                                          type="button"
                                          disabled={!customForm.teacherName}
                                          onClick={() => {
                                            handleAddCustomSubSlot(
                                              slot,
                                              roomName,
                                              customForm.startTime,
                                              customForm.endTime,
                                              customForm.teacherName
                                            );
                                            setCustomSubSlotForms((prev) => ({
                                              ...prev,
                                              [formKey]: { ...customForm, isAdding: false },
                                            }));
                                          }}
                                          className="px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-bold disabled:opacity-40"
                                        >
                                          Ajouter
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Splitting Action Buttons */}
                                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                                  {roomSurvs.length > 1 ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleMergeRoomSlot(slot, roomName)}
                                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                                        title="Fusionner les sous-créneaux en 1 seul créneau complet"
                                      >
                                        🔄 Fusionner en 1 créneau
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCustomSubSlotForms((prev) => ({
                                            ...prev,
                                            [formKey]: { ...customForm, isAdding: !customForm.isAdding },
                                          }))
                                        }
                                        className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition ml-auto cursor-pointer"
                                      >
                                        + Relais
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleSplitInTwo(slot, roomName)}
                                        className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold transition flex items-center gap-1 cursor-pointer"
                                        title="Diviser la durée en 2 créneaux égaux (ex: 2 x 1h ou 2 x 2h)"
                                      >
                                        <Scissors className="h-3 w-3" />
                                        <span>Scinder en 2</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSplitInHours(slot, roomName)}
                                        className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold transition cursor-pointer"
                                        title="Scinder le créneau en tranches de 1h"
                                      >
                                        Par tranches de 1h
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCustomSubSlotForms((prev) => ({
                                            ...prev,
                                            [formKey]: { ...customForm, isAdding: !customForm.isAdding },
                                          }))
                                        }
                                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition ml-auto cursor-pointer"
                                        title="Ajouter un sous-créneau personnalisé"
                                      >
                                        + Relais
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* RENFORT POSTE (Couloir & Secrétariat) */}
                        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                              <Shield className="h-4 w-4 text-indigo-600" />
                              <span>Surveillants de Renfort & Couloir ({slot.subject})</span>
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              Enseignants volants chargés du contrôle des couloirs, sorties d'élèves et approvisionnement des pochettes d'examen.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {surveillances
                              .filter(
                                (s) =>
                                  s.roomName === "Renfort" &&
                                  ((slot.id && s.slotId === slot.id) ||
                                    (s.date === slot.date && s.timeSlot.includes(slot.startTime)))
                              )
                              .map((renfort) => (
                                <span
                                  key={renfort.id}
                                  className="px-3 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                                >
                                  <span>{renfort.teacherName}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteSurveillance?.(renfort.id);
                                      onShowNotification("Renfort retiré.");
                                    }}
                                    className="text-slate-400 hover:text-rose-600 transition"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}

                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddRenfort(slot, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                              defaultValue=""
                              className="px-3 py-1.5 rounded-xl border border-indigo-300 bg-white text-xs font-semibold text-slate-800"
                            >
                              <option value="" disabled>
                                + Ajouter un surveillant de renfort...
                              </option>
                              {teachers.map((t) => {
                                const fullName = `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`;
                                return (
                                  <option key={t.id} value={fullName}>
                                    {fullName} ({t.subject})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Program / Edit Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingSlotId ? "Modifier le créneau d'épreuve" : "Programmer une nouvelle épreuve"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSlot} className="space-y-4 pt-4">
              {/* Exam title & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Examen de rattachement
                  </label>
                  <select
                    value={formExamTitle}
                    onChange={(e) => setFormExamTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.title}>
                        {ex.title}
                      </option>
                    ))}
                    <option value="DNB blanc">DNB blanc (Collège)</option>
                    <option value="Baccalauréat blanc">Baccalauréat blanc (Lycée)</option>
                    <option value="Devoir Commun">Devoir Commun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Niveau scolaire ciblé
                  </label>
                  <select
                    value={formTargetLevel}
                    onChange={(e) => setFormTargetLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="3ème">3ème (DNB Collège)</option>
                    <option value="1ère">1ère (Baccalauréat EAF)</option>
                    <option value="Terminale">Terminale (Baccalauréat)</option>
                    <option value="Tous niveaux">Tous niveaux</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discipline / Intitulé précis de l'épreuve *
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Ex: Français (Grammaire, Dictée & Compréhension), Mathématiques..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date, Heure Début, Heure Fin, Durée */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date de l'épreuve *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heure de début (Appel) *
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heure de fin *
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durée totale calculée
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={15}
                      step={5}
                      value={formDurationMinutes}
                      onChange={(e) => handleDurationPresetChange(parseInt(e.target.value, 10) || 60)}
                      className="w-20 px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    />
                    <span className="text-xs text-slate-500 font-semibold">min ({Math.floor(formDurationMinutes / 60)}h{formDurationMinutes % 60 > 0 ? String(formDurationMinutes % 60).padStart(2, '0') : '00'})</span>
                  </div>
                </div>
              </div>

              {/* Quick Presets Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Présélections rapides :</span>
                {[
                  { label: "1h00 (Sciences)", val: 60 },
                  { label: "1h30 (Français / Dictée)", val: 90 },
                  { label: "2h00 (Maths / HG)", val: 120 },
                  { label: "3h00 (Spécialités)", val: 180 },
                  { label: "4h00 (Bac Philo / Français)", val: 240 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handleDurationPresetChange(preset.val)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition ${
                      formDurationMinutes === preset.val
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Automated calculation summary banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                    Horaires Standard ({formDurationMinutes} min)
                  </span>
                  <p className="font-mono font-black text-slate-900 text-sm mt-0.5">
                    {formStartTime} ➔ {formEndTime}
                  </p>
                  <p className="text-[11px] text-slate-500">Fin de l'épreuve pour tous les candidats standard</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                    Aménagement Tiers-Temps +1/3 ({formTiersTempsDuration} min)
                  </span>
                  <p className="font-mono font-black text-purple-900 text-sm mt-0.5">
                    {formStartTime} ➔ {formTiersTempsEndTime}
                  </p>
                  <p className="text-[11px] text-purple-700/80">Calcul automatique réglementaire (+{formTiersTempsDuration - formDurationMinutes} min)</p>
                </div>
              </div>

              {/* Salles mobilisées */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Salles d'examen mobilisées pour cette épreuve :
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formSelectedRooms.length} salle(s) • Capacité :{" "}
                      <strong>
                        {rooms
                          .filter((r) => formSelectedRooms.includes(r.name))
                          .reduce((acc, r) => acc + (r.capacity || 0), 0)}{" "}
                        places
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormSelectedRooms(rooms.map((r) => r.name))}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold"
                    >
                      Toutes
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormSelectedRooms([])}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Aucune
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs max-h-40 overflow-y-auto">
                  {rooms.map((room) => {
                    const isChecked = formSelectedRooms.includes(room.name);
                    return (
                      <label
                        key={room.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                          isChecked
                            ? "bg-white border-indigo-300 font-bold text-indigo-950 shadow-2xs"
                            : "bg-slate-50/50 border-transparent text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRoom(room.name)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{room.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-1">
                          {room.capacity} pl.
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes / Consignes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consignes particulières (matériel, calculatrice, dictionnaire)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Calculatrices autorisées en mode examen, compas obligatoire..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                >
                  {editingSlotId ? "Enregistrer les modifications" : "Programmer ce créneau"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

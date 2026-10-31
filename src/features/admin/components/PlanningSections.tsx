import React, { useState, useMemo } from "react";
import {
  School,
  GraduationCap,
  UserCheck,
  Plus,
  AlertCircle,
  Printer,
} from "lucide-react";
import type {
  CmsRoom,
  CmsTeacher,
  CmsSurveillance,
  CmsExam,
  CmsExamSlot,
  CmsCandidate,
} from "../../../shared/services/cms-store";

// ========================================================
// 1. PLANNING — VUE PAR SALLES
// ========================================================
interface PlanningRoomsSectionProps {
  rooms: CmsRoom[];
  surveillances: CmsSurveillance[];
  exams: CmsExam[];
  teachers: CmsTeacher[];
  examSlots?: CmsExamSlot[];
  candidates?: CmsCandidate[];
  onAddSurveillance: (surveillance: Omit<CmsSurveillance, "id">) => void;
  onDeleteSurveillance: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export function PlanningRoomsSection({
  rooms,
  surveillances,
  teachers,
  examSlots = [],
  candidates = [],
  onAddSurveillance,
  onDeleteSurveillance,
  onShowNotification,
}: PlanningRoomsSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");

  // Distinct dates from examSlots
  const distinctDates = useMemo(() => {
    const set = new Set<string>();
    examSlots.forEach((s) => {
      if (s.date) set.add(s.date);
    });
    return Array.from(set).sort();
  }, [examSlots]);

  // Filtered rooms
  const displayedRooms = useMemo(() => {
    if (selectedRoomId === "all") return rooms;
    return rooms.filter((r) => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  // Filtered slots
  const displayedSlots = useMemo(() => {
    const sorted = [...examSlots].sort((a, b) => {
      const d = (a.date || "").localeCompare(b.date || "");
      if (d !== 0) return d;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
    if (selectedDate === "all") return sorted;
    return sorted.filter((s) => s.date === selectedDate);
  }, [examSlots, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Étape 5 • Plannings Opérationnels
            </span>
            <span className="text-xs text-slate-500">
              Dispositif chronologique par salle d'examen
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <School className="h-5 w-5 text-indigo-600" />
            <span>🏫 Planning — Vue par Salles</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Planning d'occupation des salles, épreuves programmées, effectifs des candidats et affectation des surveillants.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-2xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4 text-slate-500" />
          <span>Imprimer la grille</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Jour d'épreuve :</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Toutes les dates ({distinctDates.length})</option>
              {distinctDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Salle :</span>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Toutes les salles ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          <strong>{displayedRooms.length}</strong> salle(s) • <strong>{displayedSlots.length}</strong> créneau(x)
        </span>
      </div>

      {/* Rooms Cards */}
      <div className="space-y-6">
        {displayedRooms.map((room) => {
          // Candidates assigned to this room
          const roomCandidates = candidates.filter((c) => c.roomName === room.name);

          return (
            <div
              key={room.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Room Header */}
              <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <School className="h-4 w-4 text-[#3498db]" />
                  <span className="font-bold text-sm text-slate-900">{room.name}</span>
                  <span className="text-xs text-slate-500">
                    ({room.building || "Bâtiment principal"})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Capacité : <strong className="text-slate-800">{room.capacity}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">
                    {roomCandidates.length} élèves affectés
                  </span>
                </div>
              </div>

              {/* Scheduled slots for this room */}
              <div className="p-5">
                {displayedSlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Aucun créneau programmé pour la sélection courante.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedSlots.map((slot) => {
                      const surv = surveillances.find(
                        (s) =>
                          (s.slotId === slot.id ||
                            (s.date === slot.date && s.timeSlot.includes(slot.startTime))) &&
                          s.roomName === room.name
                      );

                      return (
                        <div
                          key={slot.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between h-40 transition ${
                            surv
                              ? "bg-slate-50/80 border-slate-200 hover:border-indigo-300"
                              : "bg-rose-50/20 border-rose-200"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                              <span>{slot.date}</span>
                              <span className="font-mono text-slate-700">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>

                            <p className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                              {slot.subject}
                            </p>
                            <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
                              Tiers-Temps jusqu'à {slot.tiersTempsEndTime || slot.endTime}
                            </p>

                            {/* Assigned Supervisor */}
                            <div className="mt-2.5">
                              {surv ? (
                                <div className="flex items-center gap-1.5">
                                  <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  <span className="font-bold text-xs text-indigo-950 truncate">
                                    {surv.teacherName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Non surveillé !</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick assign action */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                            {surv ? (
                              <>
                                <span className="text-slate-400">{surv.mission}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteSurveillance(surv.id);
                                    onShowNotification("Surveillance détachée.");
                                  }}
                                  className="text-rose-500 hover:text-rose-700 font-bold"
                                >
                                  Détacher
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  // Prompt user or assign first available teacher
                                  const teacher = teachers[0];
                                  if (teacher) {
                                    const fullName = `${teacher.civility === "Madame" ? "Mme" : "M."} ${teacher.lastName} ${teacher.firstName}`;
                                    onAddSurveillance({
                                      examTitle: slot.examTitle,
                                      slotId: slot.id,
                                      teacherName: fullName,
                                      roomName: room.name,
                                      date: slot.date,
                                      timeSlot: `${slot.startTime} - ${slot.endTime}`,
                                      mission: "Surveillant titulaire",
                                    });
                                    onShowNotification(`${fullName} assigné(e) à ${room.name}.`);
                                  }
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 ml-auto"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Assigner un prof</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================================
// 2. PLANNING — VUE PROFESSEURS
// ========================================================
interface PlanningProfsSectionProps {
  teachers: CmsTeacher[];
  surveillances: CmsSurveillance[];
  examSlots?: CmsExamSlot[];
  onAddSurveillance: (surveillance: Omit<CmsSurveillance, "id">) => void;
  onDeleteSurveillance: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export function PlanningProfsSection({
  teachers,
  surveillances,
  examSlots = [],
  onDeleteSurveillance,
  onShowNotification,
}: PlanningProfsSectionProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Map each teacher to their assigned surveillances and calculate hours
  const teacherStats = useMemo(() => {
    return teachers
      .map((teacher) => {
        const fullName = `${teacher.civility === "Madame" ? "Mme" : "M."} ${teacher.lastName} ${teacher.firstName}`;
        const teacherSurvs = surveillances.filter(
          (s) =>
            s.teacherName.toLowerCase().includes(teacher.lastName.toLowerCase()) ||
            s.teacherName.toLowerCase().includes(teacher.firstName.toLowerCase())
        );

        // Approximate total minutes based on matched slot or standard 120 min
        let totalMinutes = 0;
        teacherSurvs.forEach((s) => {
          const matchedSlot = examSlots.find(
            (slot) => slot.id === s.slotId || (slot.date === s.date && s.timeSlot.includes(slot.startTime))
          );
          totalMinutes += matchedSlot ? matchedSlot.durationMinutes : 120;
        });

        const totalHours = (totalMinutes / 60).toFixed(1);

        return {
          teacher,
          fullName,
          teacherSurvs,
          totalMinutes,
          totalHours,
        };
      })
      .filter(({ teacher, fullName }) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          fullName.toLowerCase().includes(q) ||
          teacher.subject.toLowerCase().includes(q)
        );
      });
  }, [teachers, surveillances, examSlots, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Étape 5 • Suivi Enseignants & Équité
            </span>
            <span className="text-xs text-slate-500">
              Heures de surveillance réparties
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <span>🎓 Planning — Vue Professeurs</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Suivi des créneaux de surveillance de chaque professeur avec décompte d'heures réelles pour garantir une équité parfaite.
          </p>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un enseignant ou discipline..."
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
        />
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="p-3">Enseignant</th>
              <th className="p-3">Discipline</th>
              <th className="p-3 text-center">Créneaux</th>
              <th className="p-3 text-center">Charge Horaire</th>
              <th className="p-3">Détail des Surveillances (Salle, Date & Horaire)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teacherStats.map(({ teacher, fullName, teacherSurvs, totalHours }) => (
              <tr key={teacher.id} className="hover:bg-slate-50/70 transition">
                <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                  {fullName}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {teacher.subject}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      teacherSurvs.length > 0
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {teacherSurvs.length} créneau(x)
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className="font-mono font-bold text-slate-800">
                    {totalHours} h
                  </span>
                </td>
                <td className="p-3">
                  {teacherSurvs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {teacherSurvs.map((s) => (
                        <div
                          key={s.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200 flex items-center gap-2 group"
                        >
                          <School className="h-3 w-3 text-indigo-600 shrink-0" />
                          <span className="font-bold">{s.roomName}</span>
                          <span className="text-slate-400">•</span>
                          <span>{s.date}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-[10px] text-slate-600">{s.timeSlot}</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteSurveillance(s.id);
                              onShowNotification("Surveillance retirée.");
                            }}
                            className="text-slate-300 hover:text-rose-600 transition ml-1"
                            title="Retirer cette surveillance"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      Aucune surveillance assignée
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

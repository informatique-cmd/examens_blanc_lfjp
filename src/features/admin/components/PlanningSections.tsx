import React, { useState } from "react";
import {
  Calendar,
  School,
  GraduationCap,
  Clock,
  UserCheck,
  Plus,
  Trash2,
  Shield,
  CheckCircle,
} from "lucide-react";
import type {
  CmsRoom,
  CmsTeacher,
  CmsSurveillance,
  CmsExam,
} from "../../../shared/services/cms-store";

interface PlanningRoomsSectionProps {
  rooms: CmsRoom[];
  surveillances: CmsSurveillance[];
  exams: CmsExam[];
  teachers: CmsTeacher[];
  onAddSurveillance: (surveillance: Omit<CmsSurveillance, "id">) => void;
  onDeleteSurveillance: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export function PlanningRoomsSection({
  rooms,
  surveillances,
  exams,
  teachers,
  onAddSurveillance,
  onDeleteSurveillance,
  onShowNotification,
}: PlanningRoomsSectionProps) {
  const [selectedRoomName, setSelectedRoomName] = useState<string>(rooms[0]?.name || "");

  // Time slots for exam day
  const slots = [
    { label: "Matin (08h00 - 10h00)", time: "08h00 - 10h00" },
    { label: "Matin (10h15 - 12h15)", time: "10h15 - 12h15" },
    { label: "Après-midi (13h30 - 15h30)", time: "13h30 - 15h30" },
    { label: "Après-midi (15h45 - 17h00)", time: "15h45 - 17h00" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Planning Opérationnel
            </span>
            <span className="text-xs text-slate-500">
              Dispositif de surveillance par salle
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            🏫 Planning — Vue par Salles
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Grille chronologique d'occupation des salles d'examen et affectation des professeurs surveillants.
          </p>
        </div>
      </div>

      {/* Grid of rooms */}
      <div className="space-y-4">
        {rooms.map((room) => {
          const roomSurvs = surveillances.filter((s) => s.roomName === room.name);
          return (
            <div
              key={room.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-[#3498db]" />
                  <span className="font-bold text-sm text-slate-900">{room.name}</span>
                  <span className="text-xs text-slate-400">({room.building || "Bâtiment principal"})</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-xs">
                  Capacité : {room.capacity} places
                </span>
              </div>

              {/* Slots inside this room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {slots.map((slot) => {
                  const surv = roomSurvs.find((s) => s.timeSlot.includes(slot.time.split(" ")[0]));
                  return (
                    <div
                      key={slot.label}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between h-28"
                    >
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">
                          {slot.label}
                        </p>
                        {surv ? (
                          <div className="mt-1">
                            <p className="font-bold text-xs text-indigo-900 flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-indigo-600" />
                              <span>{surv.teacherName}</span>
                            </p>
                            <p className="text-[10px] text-slate-500">{surv.mission || "Surveillant titulaire"}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic mt-2">Non affecté</p>
                        )}
                      </div>

                      {surv && (
                        <button
                          onClick={() => {
                            onDeleteSurveillance(surv.id);
                            onShowNotification("Surveillance retirée.");
                          }}
                          className="text-[10px] text-rose-500 hover:text-rose-700 self-end font-semibold"
                        >
                          Détacher
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PlanningProfsSectionProps {
  teachers: CmsTeacher[];
  surveillances: CmsSurveillance[];
  onAddSurveillance: (surveillance: Omit<CmsSurveillance, "id">) => void;
  onDeleteSurveillance: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export function PlanningProfsSection({
  teachers,
  surveillances,
  onAddSurveillance,
  onDeleteSurveillance,
  onShowNotification,
}: PlanningProfsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Équité & Décompte
            </span>
            <span className="text-xs text-slate-500">
              Surveillances attribuées par enseignant
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            🎓 Planning — Vue Professeurs
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Suivi des créneaux de surveillance de chaque professeur avec décompte d'heures pour garantir une équité parfaite.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="p-3">Enseignant</th>
              <th className="p-3">Discipline</th>
              <th className="p-3 text-center">Créneaux Assignés</th>
              <th className="p-3">Détail des Surveillances (Salle & Horaire)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map((teacher) => {
              const fullName = `${teacher.civility === "Madame" ? "Mme" : "M."} ${teacher.lastName} ${teacher.firstName}`;
              const teacherSurvs = surveillances.filter(
                (s) =>
                  s.teacherName.toLowerCase().includes(teacher.lastName.toLowerCase()) ||
                  s.teacherName.toLowerCase().includes(teacher.firstName.toLowerCase())
              );

              return (
                <tr key={teacher.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-bold text-slate-900">{fullName}</td>
                  <td className="p-3">
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
                  <td className="p-3">
                    {teacherSurvs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {teacherSurvs.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 flex items-center gap-1"
                          >
                            <School className="h-3 w-3 text-slate-400" />
                            <span>{s.roomName}</span>
                            <span className="text-slate-400">•</span>
                            <span>{s.timeSlot}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Aucune surveillance planifiée pour l'instant
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

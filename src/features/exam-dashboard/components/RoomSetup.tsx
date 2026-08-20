import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutGrid, Users } from "lucide-react";

import { useDashboardContext } from "../context";

const examRooms: { name: string; examCapacity: number }[] = [
  { name: "S9 PRIO / EPS", examCapacity: 5 },
  { name: "S10", examCapacity: 15 },
  { name: "S11", examCapacity: 15 },
  { name: "S12", examCapacity: 13 },
  { name: "S13", examCapacity: 12 },
  { name: "S14", examCapacity: 12 },
  { name: "S15", examCapacity: 12 },
];

const totalExamCapacity = examRooms.reduce(
  (accumulator, room) => accumulator + room.examCapacity,
  0,
);

export default function RoomSetup() {
  const { activeView, container } = useDashboardContext();
  const [studentCount, setStudentCount] = useState(60);

  const sliderMax = useMemo(
    () => Math.max(totalExamCapacity, studentCount, 120),
    [studentCount],
  );

  type RoomAllocation = {
    name: string;
    assigned: number;
    capacity: number;
  };

  const autoDistribution = useMemo<RoomAllocation[]>(() => {
    let remaining = studentCount;

    return examRooms.map((room) => {
      const assigned = Math.min(room.examCapacity, Math.max(remaining, 0));
      remaining = Math.max(remaining - room.examCapacity, 0);

      return {
        name: room.name,
        assigned,
        capacity: room.examCapacity,
      };
    });
  }, [studentCount]);

  const [manualAssignments, setManualAssignments] = useState(autoDistribution);

  useEffect(() => {
    setManualAssignments(autoDistribution);
  }, [autoDistribution]);

  const totalAssigned = useMemo(
    () =>
      manualAssignments.reduce(
        (accumulator, room) => accumulator + room.assigned,
        0,
      ),
    [manualAssignments],
  );

  const roomsUsed = useMemo(
    () => manualAssignments.filter((room) => room.assigned > 0).length,
    [manualAssignments],
  );
  const capacityDelta = totalExamCapacity - totalAssigned;
  const freeSeats = Math.max(capacityDelta, 0);
  const overCapacity = Math.max(totalAssigned - totalExamCapacity, 0);
  const studentsLeftToAssign = Math.max(studentCount - totalAssigned, 0);
  const extraAssignedStudents = Math.max(totalAssigned - studentCount, 0);

  if (!container) {
    return null;
  }

  return createPortal(
    <section
      id="setup-view"
      data-view-section="setup"
      role="tabpanel"
      aria-labelledby="setup-tab"
      tabIndex={activeView === "setup" ? 0 : -1}
      aria-hidden={activeView === "setup" ? "false" : "true"}
      className={`${activeView === "setup" ? "" : "hidden"} space-y-6`}
    >
      <div>
        <h3 className="text-xl font-semibold text-slate-900">
          Paramétrage des salles d’examen
        </h3>
        <p className="text-sm text-slate-500">
          Centralisez ici la configuration des salles, des capacités et des besoins matériels pour les sessions d’examen.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900">
                Capacité des salles au format examen
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Liste des salles disponibles avec la capacité maximale configurée pour les épreuves écrites.
              </p>
            </div>
            <span className="hidden rounded-full bg-blue-100 p-3 text-blue-600 sm:inline-flex">
              <LayoutGrid className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-sm font-medium text-slate-600">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Salle
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Capacité (format examen)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                {examRooms.map((room) => (
                  <tr key={room.name}>
                    <th scope="row" className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      {room.name}
                    </th>
                    <td className="px-6 py-4">{room.examCapacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">Capacité totale</p>
              <p className="text-2xl font-semibold text-slate-900">{totalExamCapacity} candidats</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Les capacités ci-dessus correspondent à la configuration des salles en mode examen (tables individuelles, distanciation, matériel nécessaire). Utilisez ces données pour planifier la répartition des candidats.
          </p>
        </aside>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h4 className="text-base font-semibold text-slate-900">
              Simulateur de répartition des candidats
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Ajustez le nombre de candidats attendus pour visualiser la répartition automatique dans les salles, puis adaptez manuellement la répartition si besoin.
            </p>
          </div>
          <span className="hidden rounded-full bg-blue-100 p-3 text-blue-600 sm:inline-flex">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">Nombre de candidats</span>
              <input
                type="range"
                min={0}
                max={sliderMax}
                value={studentCount}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setStudentCount(Number.isNaN(value) ? 0 : value);
                }}
                className="block w-full accent-blue-600"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600 sr-only md:not-sr-only">
                Saisir précisément le nombre de candidats
              </span>
              <input
                type="number"
                min={0}
                value={studentCount}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setStudentCount(Number.isNaN(value) ? 0 : value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-right text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-sm font-medium text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Salle
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Capacité
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Candidats affectés
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                {manualAssignments.map((room) => (
                  <tr key={room.name}>
                    <th scope="row" className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {room.name}
                    </th>
                    <td className="px-4 py-3">{room.capacity}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={room.capacity}
                        value={room.assigned}
                        onChange={(event) => {
                          const rawValue = Number(event.target.value);
                          const safeValue = Number.isNaN(rawValue) ? 0 : rawValue;
                          const value = Math.min(
                            Math.max(safeValue, 0),
                            room.capacity,
                          );

                          setManualAssignments((previous) =>
                            previous.map((currentRoom) =>
                              currentRoom.name === room.name
                                ? {
                                    ...currentRoom,
                                    assigned: value,
                                  }
                                : currentRoom,
                            ),
                          );
                        }}
                        className="w-24 rounded-md border border-slate-300 px-3 py-2 text-right text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        aria-label={`Nombre de candidats à placer dans la salle ${room.name}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p>
              Répartition actuelle : {totalAssigned} candidat{totalAssigned > 1 ? "s" : ""} affecté{totalAssigned > 1 ? "s" : ""} dans {roomsUsed} salle{roomsUsed > 1 ? "s" : ""}.
            </p>
            {freeSeats > 0 ? (
              <p>Il reste {freeSeats} place{freeSeats > 1 ? "s" : ""} disponibles.</p>
            ) : capacityDelta === 0 ? (
              <p>Toutes les places sont occupées.</p>
            ) : (
              <p className="text-red-600">
                Attention : {overCapacity} candidat{overCapacity > 1 ? "s" : ""} en trop par rapport à la capacité totale.
              </p>
            )}
            {studentsLeftToAssign > 0 && (
              <p>
                Il reste {studentsLeftToAssign} candidat{studentsLeftToAssign > 1 ? "s" : ""} à placer pour atteindre l'objectif de {studentCount} candidat{studentCount > 1 ? "s" : ""}.
              </p>
            )}
            {extraAssignedStudents > 0 && (
              <p>
                Vous avez réparti {extraAssignedStudents} candidat{extraAssignedStudents > 1 ? "s" : ""} de plus que l'objectif fixé ({studentCount}).
              </p>
            )}
            <button
              type="button"
              onClick={() => setManualAssignments(autoDistribution)}
              className="self-start rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
            >
              Réinitialiser la répartition automatique
            </button>
          </div>
        </div>
      </div>
    </section>,
    container,
  );
}

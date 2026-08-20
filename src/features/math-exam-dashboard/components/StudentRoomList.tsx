import { useMemo } from "react";
import { createPortal } from "react-dom";
import { GraduationCap, Users } from "lucide-react";

import { useDashboardContext, useMathExamData } from "../context";

export default function StudentRoomList() {
  const { activeView, container } = useDashboardContext();
  const { studentDistribution = [], dashboardTabs } = useMathExamData();

  const hasStudentTab = useMemo(
    () => dashboardTabs.some((tab) => tab.id === "students"),
    [dashboardTabs],
  );

  const groupedDistribution = useMemo(() => {
    const groups = new Map<string, { student: string; className: string }[]>();

    studentDistribution.forEach(({ room, student, className }) => {
      const current = groups.get(room) ?? [];
      current.push({ student, className });
      groups.set(room, current);
    });

    return Array.from(groups.entries())
      .map(([room, students]) => ({
        room,
        students: students.sort((a, b) =>
          a.student.localeCompare(b.student, "fr", { sensitivity: "base" }),
        ),
      }))
      .sort((a, b) => a.room.localeCompare(b.room, "fr", { sensitivity: "base" }));
  }, [studentDistribution]);

  if (!container || !hasStudentTab) {
    return null;
  }

  return createPortal(
    <section
      id="students-view"
      data-view-section="students"
      role="tabpanel"
      aria-labelledby="students-tab"
      tabIndex={activeView === "students" ? 0 : -1}
      aria-hidden={activeView === "students" ? "false" : "true"}
      className={`${activeView === "students" ? "" : "hidden"} space-y-6`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-slate-900">Listes des élèves par salle</h3>
          <p className="text-sm text-slate-500">
            Vue dédiée pour imprimer ou afficher rapidement les affectations exactes des élèves dans chaque salle.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
            <Users className="h-4 w-4 text-slate-500" /> {studentDistribution.length} élèves affectés
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-800">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Répartition officielle communiquée par la vie scolaire
          </span>
        </div>
      </div>

      {groupedDistribution.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groupedDistribution.map(({ room, students }) => (
            <article
              key={room}
              className="flex h-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <header className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Salle</p>
                  <h4 className="text-lg font-semibold text-slate-900">{room}</h4>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {students.length} élève{students.length > 1 ? "s" : ""}
                </span>
              </header>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="py-1 pr-2">Élève</th>
                      <th scope="col" className="py-1 pr-2">Classe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {students.map((entry) => (
                      <tr key={`${room}-${entry.student}`}>
                        <td className="py-1 pr-2 font-medium text-slate-900">{entry.student}</td>
                        <td className="py-1 pr-2 text-slate-600">{entry.className}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Aucune affectation d’élèves n’est disponible pour le moment.
        </div>
      )}
    </section>,
    container,
  );
}

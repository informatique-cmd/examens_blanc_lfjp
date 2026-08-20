import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, Users2 } from "lucide-react";

import { useDashboardContext, useMathExamData } from "../context";
import {
  downloadAllDnbStudentConvocations,
  downloadDnbStudentConvocation,
  downloadDnbStudentConvocationsForClass,
} from "../services";

const collator = new Intl.Collator("fr", { sensitivity: "base" });

export default function DnbStudents() {
  const { activeView, container } = useDashboardContext();
  const { studentDistribution = [], roomSchedule = [], dashboardTabs } = useMathExamData();

  const hasStudentTab = useMemo(
    () => dashboardTabs.some((tab) => tab.id === "students"),
    [dashboardTabs],
  );

  const sortedStudents = useMemo(
    () =>
      [...studentDistribution].sort((a, b) =>
        collator.compare(a.student, b.student),
      ),
    [studentDistribution],
  );

  const classOptions = useMemo(
    () =>
      Array.from(new Set(studentDistribution.map((student) => student.className))).sort(
        collator.compare,
      ),
    [studentDistribution],
  );

  const [selectedClass, setSelectedClass] = useState(classOptions[0] ?? "");

  const classStudents = useMemo(
    () => sortedStudents.filter((student) => student.className === selectedClass),
    [sortedStudents, selectedClass],
  );

  const handleDownloadStudent = async (studentIndex: number) => {
    try {
      await downloadDnbStudentConvocation(sortedStudents[studentIndex], roomSchedule);
    } catch (error) {
      console.error(error);
      alert("Impossible de générer la convocation de l'élève. Veuillez réessayer.");
    }
  };

  const handleDownloadClass = async () => {
    try {
      await downloadDnbStudentConvocationsForClass(classStudents, selectedClass, roomSchedule);
    } catch (error) {
      console.error(error);
      alert("Aucune convocation disponible pour cette classe.");
    }
  };

  const handleDownloadAll = async () => {
    try {
      await downloadAllDnbStudentConvocations(sortedStudents, roomSchedule);
    } catch (error) {
      console.error(error);
      alert("Impossible de générer les convocations. Veuillez réessayer.");
    }
  };

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-slate-900">
            DNB blanc — élèves, classes et salles
          </h3>
          <p className="text-sm text-slate-500">
            Liste alphabétique des élèves avec leur classe et leur salle d'examen. Utilisez
            les actions pour générer les convocations individuelles, par classe ou pour
            l'ensemble des élèves.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
          <span className="rounded-full bg-blue-100 p-2 text-blue-600">
            <Users2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">{sortedStudents.length} élèves</p>
            <p className="text-xs text-blue-600/80">Répartition validée</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Convocations élèves</h4>
            <p className="text-sm text-slate-500">
              Sélectionnez une classe pour éditer toutes les convocations ou téléchargez la liste complète.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="dnb-class-selector" className="text-sm font-medium text-slate-600">
                Classe
              </label>
              <select
                id="dnb-class-selector"
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {classOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadClass}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Télécharger la classe
              </button>
              <button
                type="button"
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Toutes les convocations
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-sm font-medium text-slate-600">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Élève
                </th>
                <th scope="col" className="px-6 py-3">
                  Classe
                </th>
                <th scope="col" className="px-6 py-3">
                  Salle d'examen
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Convocation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {sortedStudents.map((student, index) => (
                <tr key={`${student.student}-${student.className}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-slate-900">
                    {student.student}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-slate-600">{student.className}</td>
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-blue-700">
                    {student.room}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadStudent(index)}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                      Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>,
    container,
  );
}

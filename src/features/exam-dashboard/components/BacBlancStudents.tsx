import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, Users2 } from "lucide-react";

import { bacBlanc1PremiereStudents, bacBlanc1Students } from "../data";
import type { PremiereBacBlancStudentEntry } from "../data";
import { useDashboardContext } from "../context";
import {
  downloadAllStudentConvocations,
  downloadAllPremiereStudentConvocations,
  downloadStudentConvocation,
  downloadStudentConvocationsForClass,
  downloadPremiereStudentConvocationsForClass,
  downloadPremiereStudentConvocation,
} from "../services";

export default function BacBlancStudents() {
  const { activeView, container } = useDashboardContext();
  const terminaleClassOptions = useMemo(
    () => Array.from(new Set(bacBlanc1Students.map((student) => student.className))).sort(),
    [],
  );
  const premiereClassOptions = useMemo(
    () => Array.from(new Set(bacBlanc1PremiereStudents.map((student) => student.className))).sort(),
    [],
  );
  const [selectedClass, setSelectedClass] = useState(terminaleClassOptions[0] ?? "");
  const [selectedPremiereClass, setSelectedPremiereClass] = useState(
    premiereClassOptions[0] ?? "",
  );

  const classStudents = useMemo(
    () => bacBlanc1Students.filter((student) => student.className === selectedClass),
    [selectedClass],
  );

  const premiereClassStudents = useMemo(
    () => bacBlanc1PremiereStudents.filter((student) => student.className === selectedPremiereClass),
    [selectedPremiereClass],
  );

  const handleDownloadStudent = async (studentIndex: number) => {
    try {
      await downloadStudentConvocation(bacBlanc1Students[studentIndex]);
    } catch (error) {
      console.error(error);
      alert("Impossible de générer la convocation de l'élève. Veuillez réessayer.");
    }
  };

  const handleDownloadClass = async () => {
    try {
      await downloadStudentConvocationsForClass(classStudents, selectedClass);
    } catch (error) {
      console.error(error);
      alert("Aucune convocation disponible pour cette classe.");
    }
  };

  const handleDownloadAll = async () => {
    try {
      await downloadAllStudentConvocations(bacBlanc1Students);
    } catch (error) {
      console.error(error);
      alert("Impossible de générer les convocations. Veuillez réessayer.");
    }
  };

  const handleDownloadPremiereClass = async () => {
    try {
      await downloadPremiereStudentConvocationsForClass(
        premiereClassStudents,
        selectedPremiereClass,
      );
    } catch (error) {
      console.error(error);
      alert("Aucune convocation disponible pour cette classe.");
    }
  };

  const handleDownloadAllPremiere = async () => {
    try {
      await downloadAllPremiereStudentConvocations(bacBlanc1PremiereStudents);
    } catch (error) {
      console.error(error);
      alert("Impossible de générer les convocations. Veuillez réessayer.");
    }
  };

  const handleDownloadPremiereStudent = async (
    student: PremiereBacBlancStudentEntry,
  ) => {
    try {
      await downloadPremiereStudentConvocation(student);
    } catch (error) {
      console.error(error);
      alert("Impossible de générer la convocation de l'élève. Veuillez réessayer.");
    }
  };

  if (!container) {
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
            Bac blanc 1 — élèves et spécialités
          </h3>
          <p className="text-sm text-slate-500">
            Liste des élèves convoqués avec leurs spécialités 1 et 2 issues du
            parcours de Terminale et leur salle de composition par épreuve.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
          <span className="rounded-full bg-blue-100 p-2 text-blue-600">
            <Users2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">{bacBlanc1Students.length} élèves</p>
            <p className="text-xs text-blue-600/80">Spécialité N°1 et N°2</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Répartition par élève</h4>
            <p className="text-sm text-slate-500">
              Utilisez cette vue pour préparer les convocations et la répartition des salles par spécialité.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="class-selector" className="text-sm font-medium text-slate-600">
                Classe
              </label>
              <select
                id="class-selector"
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {terminaleClassOptions.map((className) => (
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
                  Nom
                </th>
                <th scope="col" className="px-6 py-3">
                  Prénom
                </th>
                <th scope="col" className="px-6 py-3">
                  Spécialité 1
                </th>
                <th scope="col" className="px-6 py-3">
                  Spécialité 2
                </th>
                <th scope="col" className="px-6 py-3">
                  Classe
                </th>
                <th scope="col" className="px-6 py-3">
                  Philosophie (Mer. 10 déc. 08h00)
                </th>
                <th scope="col" className="px-6 py-3">
                  Spécialité 1 (Jeu. 11 déc. 08h00)
                </th>
                <th scope="col" className="px-6 py-3">
                  Spécialité 2 (Ven. 12 déc. 08h00)
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Convocation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {bacBlanc1Students.map((student, index) => (
                <tr key={`${student.lastName}-${student.firstName}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-3 font-semibold uppercase text-slate-900">
                    {student.lastName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-slate-800">
                    {student.firstName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-blue-700">
                    {student.specialty1}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-blue-700">
                    {student.specialty2}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-slate-600">
                    {student.className}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-slate-800">
                    {student.philosophyRoom}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-blue-700">
                    {student.specialty1Room}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-blue-700">
                    {student.specialty2Room}
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

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h4 className="text-base font-semibold text-slate-900">
              Élèves de Première — épreuve du jeudi après-midi
            </h4>
            <p className="text-sm text-slate-500">
              Liste des élèves convoqués et leur salle d'examen pour l'épreuve de l'après-midi.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="premiere-class-selector" className="text-sm font-medium text-slate-600">
                Classe
              </label>
              <select
                id="premiere-class-selector"
                value={selectedPremiereClass}
                onChange={(event) => setSelectedPremiereClass(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {premiereClassOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadPremiereClass}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Télécharger la classe
              </button>
              <button
                type="button"
                onClick={handleDownloadAllPremiere}
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
                  Nom
                </th>
                <th scope="col" className="px-6 py-3">
                  Prénom
                </th>
                <th scope="col" className="px-6 py-3">
                  Classe
                </th>
                <th scope="col" className="px-6 py-3">
                  Salle épreuve jeudi (après-midi)
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Convocation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {premiereClassStudents.map((student) => (
                <tr key={`${student.lastName}-${student.firstName}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-3 font-semibold uppercase text-slate-900">
                    {student.lastName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-slate-800">{student.firstName}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-slate-600">{student.className}</td>
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-blue-700">{student.room}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadPremiereStudent(student)}
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

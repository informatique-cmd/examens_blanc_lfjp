import React, { useState } from "react";
import {
  Package,
  GraduationCap,
  FileCheck2,
  Users,
  CheckCircle,
  Shuffle,
  Printer,
} from "lucide-react";
import type { CmsTeacher, CmsCandidate } from "../../../shared/services/cms-store";

interface CorrRepartitionSectionProps {
  teachers: CmsTeacher[];
  candidates: CmsCandidate[];
  onShowNotification: (msg: string) => void;
}

export default function CorrRepartitionSection({
  teachers,
  candidates,
  onShowNotification,
}: CorrRepartitionSectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("Français");

  const subjects = [
    { id: "Français", name: "Français (100 pts)", coef: 1 },
    { id: "Mathématiques", name: "Mathématiques (100 pts)", coef: 1 },
    { id: "Histoire-Géo", name: "Histoire-Géographie & EMC (50 pts)", coef: 1 },
    { id: "Sciences", name: "Sciences SVT/Physique/Techno (50 pts)", coef: 1 },
  ];

  // Teachers teaching this subject
  const subjectTeachers = teachers.filter(
    (t) =>
      t.subject.toLowerCase().includes(selectedSubject.toLowerCase()) ||
      (selectedSubject === "Français" && t.subject.toLowerCase().includes("lettres"))
  );

  const totalCopies = candidates.length;
  const copiesPerTeacher =
    subjectTeachers.length > 0 ? Math.ceil(totalCopies / subjectTeachers.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800">
              Secrétariat des Examens
            </span>
            <span className="text-xs text-slate-500">
              Répartition des paquets de copies & Harmonisation
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            📦 Corrections & Attribution des Lots
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Ventilation équitable des copies anonymées entre les professeurs correcteurs par discipline.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer bordereaux correcteurs</span>
        </button>
      </div>

      {/* Discipline Selector */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubject(sub.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedSubject === sub.id
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Répartition pour : {selectedSubject}
            </h3>
            <p className="text-xs text-slate-500">
              Total de {totalCopies} copies à corriger réparties entre {subjectTeachers.length || 1} correcteur(s).
            </p>
          </div>
          <span className="px-3 py-1 rounded bg-orange-50 text-orange-800 font-bold text-xs border border-orange-200">
            ~{copiesPerTeacher} copies / professeur
          </span>
        </div>

        {/* Teachers List */}
        <div className="space-y-3">
          {subjectTeachers.length > 0 ? (
            subjectTeachers.map((teacher, index) => {
              const startIdx = index * copiesPerTeacher + 1;
              const endIdx = Math.min((index + 1) * copiesPerTeacher, totalCopies);
              return (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center">
                      Lot {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {teacher.civility === "Madame" ? "Mme" : "M."} {teacher.lastName} {teacher.firstName}
                      </p>
                      <p className="text-[11px] text-slate-500">{teacher.subject}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-slate-800">
                      Plage Anonymat : DNB-{String(startIdx).padStart(3, "0")} à DNB-{String(endIdx).padStart(3, "0")}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Effectif du paquet : {Math.max(0, endIdx - startIdx + 1)} copies
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Aucun enseignant spécifiquement rattaché à cette matière. Vous pouvez ajouter des enseignants dans Données &gt; Professeurs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

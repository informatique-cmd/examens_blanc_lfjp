import React, { useState } from "react";
import {
  Printer,
  Mail,
  GraduationCap,
  Award,
  Clock,
  School,
  CheckCircle,
  Tag,
  Search,
} from "lucide-react";
import type {
  CmsCandidate,
  CmsTeacher,
  CmsSurveillance,
  SiteInfo,
} from "../../../shared/services/cms-store";

interface ConvocElevesSectionProps {
  candidates: CmsCandidate[];
  siteInfo: SiteInfo;
}

export function ConvocElevesSection({
  candidates,
  siteInfo,
}: ConvocElevesSectionProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates[0]?.id || ""
  );
  const [printMode, setPrintMode] = useState<"convocation" | "etiquettes">("convocation");
  const [search, setSearch] = useState("");

  const candidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.lastName.toLowerCase().includes(q) ||
      c.firstName.toLowerCase().includes(q) ||
      c.className.toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
              Documents Officiels
            </span>
            <span className="text-xs text-slate-500">
              Convocations & Étiquettes de table
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            🎓 Convocations des Candidats & Étiquettes
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Génération nominative des convocations aux épreuves et impression des étiquettes de table avec découpe anonymat.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer le document</span>
        </button>
      </div>

      {/* Switcher & Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintMode("convocation")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              printMode === "convocation"
                ? "bg-[#3498db] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📄 Convocation Individuelle
          </button>
          <button
            onClick={() => setPrintMode("etiquettes")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              printMode === "etiquettes"
                ? "bg-[#3498db] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            🏷️ Planche d'Étiquettes de Table DNB / Bac
          </button>
        </div>

        {printMode === "convocation" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-semibold">Choisir l'élève :</span>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white max-w-xs"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lastName.toUpperCase()} {c.firstName} ({c.className})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* RENDER CONVOCATION */}
      {printMode === "convocation" && candidate && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 max-w-3xl mx-auto printable-content space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                RÉPUBLIQUE FRANÇAISE • AEFE
              </p>
              <h1 className="text-base font-black text-slate-900">
                {siteInfo.title || "Lycée Français Jacques Prévert de Saly"}
              </h1>
              <p className="text-xs text-slate-600">
                Session Officielle {siteInfo.schoolYear || "2025-2026"}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded bg-slate-900 text-white font-bold text-xs uppercase">
                CONVOCATION OFFICIELLE
              </span>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[11px] text-slate-500">Candidat(e) :</p>
              <p className="text-sm font-black text-slate-900">
                {candidate.lastName.toUpperCase()} {candidate.firstName}
              </p>
              <p className="text-xs text-slate-600 mt-1">Classe : {candidate.className}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500">Salle d'Examen :</p>
              <p className="text-sm font-black text-indigo-700">
                {candidate.roomName || "Salle Principale"}
              </p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                Table N° {candidate.tableNumber || "1"} • Anonymat : {candidate.anonymatNumber || "DNB-01"}
              </p>
            </div>
          </div>

          {/* Timetable of Exam */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
              Calendrier des Épreuves
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                  <th className="p-2 border-r border-slate-200">Épreuve</th>
                  <th className="p-2 border-r border-slate-200">Horaire Standard</th>
                  <th className="p-2">Horaire Tiers-Temps (+1/3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="p-2 border-r border-slate-100 font-sans font-semibold">Français (Grammaire & Dictée)</td>
                  <td className="p-2 border-r border-slate-100">08h00 - 09h30</td>
                  <td className="p-2 text-purple-700 font-bold">08h00 - 10h00</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-100 font-sans font-semibold">Français (Rédaction)</td>
                  <td className="p-2 border-r border-slate-100">09h45 - 11h15</td>
                  <td className="p-2 text-purple-700 font-bold">09h45 - 11h45</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-100 font-sans font-semibold">Mathématiques</td>
                  <td className="p-2 border-r border-slate-100">13h30 - 15h30</td>
                  <td className="p-2 text-purple-700 font-bold">13h30 - 16h10</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-100 font-sans font-semibold">Histoire-Géographie & EMC</td>
                  <td className="p-2 border-r border-slate-100">08h00 - 10h00</td>
                  <td className="p-2 text-purple-700 font-bold">08h00 - 10h40</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-100 font-sans font-semibold">Sciences</td>
                  <td className="p-2 border-r border-slate-100">10h15 - 11h15</td>
                  <td className="p-2 text-purple-700 font-bold">10h15 - 11h35</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Consignes & Signatures */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <p className="font-bold">Instructions obligatoires :</p>
            <p>
              • Présentation obligatoire 15 minutes avant chaque épreuve avec cette convocation imprimée et une pièce d'identité originale.
              <br />
              • Téléphones portables et montres connectées strictement interdits (éteints dans les sacs).
              <br />
              • Calculatrices autorisées uniquement en Mode Examen avec voyant clignotant.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div>
              <p className="text-slate-500">Date d'émission :</p>
              <p className="font-semibold text-slate-800">{new Date().toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">Le Chef d'Établissement</p>
              <p className="text-[11px] text-slate-500">Pour le Lycée Français Jacques Prévert</p>
              <div className="h-12"></div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TABLE LABELS (ÉTIQUETTES DNB / BAC) */}
      {printMode === "etiquettes" && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 max-w-4xl mx-auto printable-content">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                🏷️ Planche d'Étiquettes de Table — Format Officiel
              </h3>
              <p className="text-xs text-slate-500">
                Partie gauche : Numéro d'Anonymat / Partie droite : Identité du candidat.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {candidates.length} étiquette(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {candidates.map((cand, idx) => (
              <div
                key={cand.id}
                className="border-2 border-dashed border-slate-400 rounded-xl p-3 flex divide-x-2 divide-dashed divide-slate-400 text-xs bg-slate-50/50"
              >
                {/* Left side: Anonymat */}
                <div className="w-1/2 pr-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                      ANONYMAT EXAMEN
                    </span>
                    <p className="font-black text-sm text-slate-900 font-mono mt-0.5">
                      {cand.anonymatNumber || `DNB-${idx + 101}`}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <p>Table : <span className="font-bold text-slate-800">{cand.tableNumber || idx + 1}</span></p>
                    <p>Salle : <span className="font-bold text-slate-800">{cand.roomName || "Salle 1"}</span></p>
                  </div>
                </div>

                {/* Right side: Identity */}
                <div className="w-1/2 pl-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-indigo-600 tracking-wider">
                      IDENTITÉ CANDIDAT
                    </span>
                    <p className="font-bold text-xs text-slate-900 mt-0.5">
                      {cand.lastName.toUpperCase()} {cand.firstName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">Classe : {cand.className}</p>
                  </div>
                  {cand.accommodation?.includes("1/3") && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[9px] self-start">
                      1/3 Temps
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ConvocProfsSectionProps {
  teachers: CmsTeacher[];
  surveillances: CmsSurveillance[];
  siteInfo: SiteInfo;
}

export function ConvocProfsSection({
  teachers,
  surveillances,
  siteInfo,
}: ConvocProfsSectionProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ""
  );

  const teacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const teacherSurvs = teacher
    ? surveillances.filter(
        (s) =>
          s.teacherName.toLowerCase().includes(teacher.lastName.toLowerCase()) ||
          s.teacherName.toLowerCase().includes(teacher.firstName.toLowerCase())
      )
    : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Surveillance Officielle
            </span>
            <span className="text-xs text-slate-500">
              Ordres de mission des enseignants
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            👔 Ordres de Mission & Convocations Professeurs
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Convocations officielles aux épreuves avec détail des créneaux, salles assignées et consignes.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer l'ordre de mission</span>
        </button>
      </div>

      {/* Teacher selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-[#3498db]" />
          <span className="text-xs font-bold text-slate-700">Choisir l'enseignant :</span>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.civility === "Madame" ? "Mme" : "M."} {t.lastName} {t.firstName} ({t.subject})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500">
          {teacherSurvs.length} créneau(x) assigné(s)
        </span>
      </div>

      {/* Printable Mission Order */}
      {teacher && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 max-w-3xl mx-auto printable-content space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                RÉPUBLIQUE FRANÇAISE • AEFE
              </p>
              <h1 className="text-base font-black text-slate-900">
                {siteInfo.title || "Lycée Français Jacques Prévert de Saly"}
              </h1>
              <p className="text-xs text-slate-600">
                Organisation des Examens Blancs • Session {siteInfo.schoolYear || "2025-2026"}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded bg-slate-900 text-white font-bold text-xs uppercase">
                ORDRE DE MISSION
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <p className="text-slate-500">Destinataire :</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {teacher.civility === "Madame" ? "Mme" : "M."} {teacher.lastName.toUpperCase()} {teacher.firstName}
            </p>
            <p className="text-slate-600">Professeur de : {teacher.subject}</p>
            <p className="text-slate-600">Courriel : {teacher.email || "Non renseigné"}</p>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
              Créneaux de Surveillance Assignés
            </h3>
            {teacherSurvs.length > 0 ? (
              <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-2 border-r border-slate-200">Date</th>
                    <th className="p-2 border-r border-slate-200">Horaire</th>
                    <th className="p-2 border-r border-slate-200">Salle</th>
                    <th className="p-2">Mission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {teacherSurvs.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2 border-r border-slate-100 font-bold">{s.date}</td>
                      <td className="p-2 border-r border-slate-100 font-mono">{s.timeSlot}</td>
                      <td className="p-2 border-r border-slate-100 font-bold text-indigo-700">{s.roomName}</td>
                      <td className="p-2">{s.mission || "Surveillant titulaire"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg text-center">
                Aucun créneau de surveillance n'est affecté à cet enseignant pour le moment.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-xs">
            <div>
              <p className="text-slate-500">Date : {new Date().toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">Le Chef d'Établissement</p>
              <div className="h-12"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

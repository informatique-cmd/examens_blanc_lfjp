import React, { useState, useMemo } from "react";
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
  Filter,
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
  const [printMode, setPrintMode] = useState<"convocation" | "etiquettes">("convocation");
  const [filterScope, setFilterScope] = useState<"single" | "room" | "class" | "all">("single");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || "");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  // Distinct rooms from candidates
  const distinctRooms = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.roomName) set.add(c.roomName);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Distinct classes from candidates
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.className) set.add(c.className);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Target candidates to print based on selective filter
  const candidatesToPrint = useMemo(() => {
    if (filterScope === "single") {
      const c = candidates.find((cand) => cand.id === selectedCandidateId) || candidates[0];
      return c ? [c] : [];
    }
    if (filterScope === "room") {
      if (selectedRoomFilter === "all") return candidates;
      return candidates.filter((c) => c.roomName === selectedRoomFilter);
    }
    if (filterScope === "class") {
      if (selectedClassFilter === "all") return candidates;
      return candidates.filter((c) => c.className === selectedClassFilter);
    }
    return candidates;
  }, [candidates, filterScope, selectedCandidateId, selectedRoomFilter, selectedClassFilter]);

  const handlePrint = (singleCand?: CmsCandidate) => {
    const cand = singleCand || candidatesToPrint[0];
    const prevTitle = document.title;
    if (cand) {
      document.title = `Convocation_${cand.lastName.toUpperCase()}_${cand.firstName}_${cand.className}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    } else {
      document.title = `Convocations_Officielles_LFJP`;
    }
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
              Documents Officiels
            </span>
            <span className="text-xs text-slate-500">
              Impression ciblée : Convocations & Étiquettes
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            🎓 Convocations des Candidats & Étiquettes de Table
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Imprimez uniquement les documents nécessaires (par élève, par salle ou par classe).
          </p>
        </div>

        <button
          onClick={() => handlePrint()}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer la sélection ({candidatesToPrint.length})</span>
        </button>
      </div>

      {/* Selective Filters Bar (hidden on print) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintMode("convocation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                printMode === "convocation"
                  ? "bg-[#3498db] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              📄 Convocations Nominatives
            </button>
            <button
              onClick={() => setPrintMode("etiquettes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                printMode === "etiquettes"
                  ? "bg-[#3498db] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🏷️ Planche d'Étiquettes de Table
            </button>
          </div>

          {/* Filter Scope Radio Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Périmètre :</span>
            </span>
            {[
              { id: "single", label: "Élève unique" },
              { id: "room", label: "Par salle" },
              { id: "class", label: "Par classe" },
              { id: "all", label: "Tous les élèves" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterScope(tab.id as any)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterScope === tab.id
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Secondary Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {filterScope === "single" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Candidat :</span>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white max-w-sm font-medium"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.lastName.toUpperCase()} {c.firstName} ({c.className} • {c.roomName || "Sans salle"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterScope === "room" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Choisir la salle :</span>
              <select
                value={selectedRoomFilter}
                onChange={(e) => setSelectedRoomFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="all">Toutes les salles</option>
                {distinctRooms.map((r) => (
                  <option key={r} value={r}>
                    {r} ({candidates.filter((c) => c.roomName === r).length} élèves)
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterScope === "class" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Choisir la classe :</span>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="all">Toutes les classes</option>
                {distinctClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} ({candidates.filter((c) => c.className === cls).length} élèves)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs text-slate-500 font-medium ml-auto">
            Impression ciblée de <strong>{candidatesToPrint.length}</strong> document(s)
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. PRINTABLE CONVOCATIONS                                */}
      {/* ======================================================== */}
      {printMode === "convocation" && (
        <div className="space-y-8">
          {candidatesToPrint.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              Aucun élève trouvé pour ce filtre d'impression.
            </div>
          ) : (
            candidatesToPrint.map((candidate, idx) => (
              <div
                key={candidate.id}
                className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 max-w-3xl mx-auto printable-content space-y-6 print:border-none print:shadow-none print:p-0 print:my-0"
                style={{ pageBreakAfter: idx < candidatesToPrint.length - 1 ? "always" : "auto" }}
              >
                {/* Individual Action Bar (Hidden on print) */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 print:hidden text-xs">
                  <span className="text-slate-600 font-medium">
                    Élève {idx + 1}/{candidatesToPrint.length} : <strong className="text-slate-900">{candidate.lastName.toUpperCase()} {candidate.firstName}</strong> ({candidate.className})
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePrint(candidate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition border border-indigo-200"
                    title={`Imprimer uniquement la convocation de ${candidate.firstName} ${candidate.lastName}`}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Imprimer cette convocation</span>
                  </button>
                </div>

                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/logo-lfjp_62451311.png"
                      alt="Logo LFJP"
                      className="h-12 w-auto object-contain shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                      }}
                    />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                        RÉPUBLIQUE FRANÇAISE • RÉSEAU AEFE
                      </p>
                      <h1 className="text-base font-black text-[#002060]">
                        LYCÉE FRANÇAIS JACQUES PRÉVERT DE SALY
                      </h1>
                      <p className="text-xs text-slate-600">
                        Session Officielle {siteInfo.schoolYear || "2026-2027"} • Code RNE 9930032S
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded bg-[#002060] text-white font-bold text-xs uppercase shadow-xs">
                      CONVOCATION OFFICIELLE
                    </span>
                  </div>
                </div>

                {/* Student Info Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">Candidat(e) :</p>
                    <p className="text-sm font-black text-slate-900">
                      {candidate.lastName.toUpperCase()} {candidate.firstName}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Classe : <strong>{candidate.className}</strong></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500 font-semibold">Salle d'Examen :</p>
                    <p className="text-sm font-black text-[#002060]">
                      {candidate.roomName || "Salle Principale"}
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                      Table N° {candidate.tableNumber || "1"} • Anonymat : {candidate.anonymatNumber || `DNB-${String(idx + 101).padStart(4, "0")}`}
                    </p>
                  </div>
                </div>

                {/* Accommodation Banner */}
                {candidate.accommodation && candidate.accommodation !== "Aucun" && (
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                    <span className="font-bold">♿ Aménagement Réglementaire Accordé :</span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-300">
                      {candidate.accommodation} (+1/3 temps)
                    </span>
                  </div>
                )}

                {/* Schedule Table */}
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-slate-900">Calendrier des Épreuves :</p>
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="p-2 border border-slate-300">Épreuve / Discipline</th>
                        <th className="p-2 border border-slate-300">Heure d'Appel</th>
                        <th className="p-2 border border-slate-300">Horaires Épreuve</th>
                        <th className="p-2 border border-slate-300">Salle Assignée</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold">{candidate.examName || "Examen Blanc"}</td>
                        <td className="p-2 border border-slate-300 font-mono text-emerald-700 font-bold">
                          {candidate.convocationTime || "07h45"}
                        </td>
                        <td className="p-2 border border-slate-300 font-mono font-semibold">08h00 - 12h00</td>
                        <td className="p-2 border border-slate-300 font-bold text-[#002060]">{candidate.roomName || "Salle S12"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Official Instructions */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">Consignes Impératives aux Candidats :</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Se présenter 15 minutes avant le début de chaque épreuve avec sa convocation et sa pièce d'identité officielle.</li>
                    <li>Les téléphones portables et montres connectées doivent être impérativement éteints et déposés dans les sacs.</li>
                    <li>L'usage de la calculatrice est soumis aux consignes du sujet (mode examen clignotant obligatoire).</li>
                  </ul>
                </div>

                {/* Signature Block */}
                <div className="pt-6 flex justify-between items-end text-xs border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-[11px] text-slate-400">Signature du Candidat</p>
                    <div className="w-40 h-10 border-b border-dashed border-slate-400 mt-2" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-slate-900 font-bold">Le / La Proviseur(e)</p>
                    <p className="font-serif italic text-slate-700 mt-2">Direction du {siteInfo.title || "Lycée Français Jacques Prévert"}</p>
                    <p className="text-[9px] text-slate-400 mt-1">Cachet et signature officielle</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PRINTABLE TABLE LABELS (ÉTIQUETTES)                   */}
      {/* ======================================================== */}
      {printMode === "etiquettes" && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 max-w-4xl mx-auto printable-content">
          <div className="border-b pb-3 mb-4 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">
              🏷️ Planche d'Étiquettes de Table ({candidatesToPrint.length} étiquettes)
            </span>
            <span className="text-xs text-slate-500">
              Découpe centrale : Anonymat / Identité candidat
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {candidatesToPrint.map((cand, idx) => (
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
                      {cand.anonymatNumber || `DNB-${String(idx + 101).padStart(4, "0")}`}
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
  const [printScope, setPrintScope] = useState<"single" | "all">("single");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || "");

  const teachersToPrint = useMemo(() => {
    if (printScope === "single") {
      const t = teachers.find((teach) => teach.id === selectedTeacherId) || teachers[0];
      return t ? [t] : [];
    }
    // For all, include teachers who have at least one surveillance, or all teachers
    return teachers;
  }, [teachers, printScope, selectedTeacherId]);

  const handlePrint = (singleTeacher?: CmsTeacher) => {
    const t = singleTeacher || teachersToPrint[0];
    const prevTitle = document.title;
    if (t) {
      document.title = `Ordre_Mission_${t.lastName.toUpperCase()}_${t.firstName}`.replace(/[\s/\\?%*:|"<>]+/g, "_");
    } else {
      document.title = `Ordres_de_Mission_Surveillances_LFJP`;
    }
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Surveillance Officielle
            </span>
            <span className="text-xs text-slate-500">
              Impression ciblée des ordres de mission
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
          onClick={() => handlePrint()}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer l'ordre de mission ({teachersToPrint.length})</span>
        </button>
      </div>

      {/* Selector Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPrintScope("single")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              printScope === "single"
                ? "bg-[#3498db] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            👤 Professeur Unique
          </button>
          <button
            type="button"
            onClick={() => setPrintScope("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              printScope === "all"
                ? "bg-[#3498db] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            👥 Tous les Professeurs ({teachers.length})
          </button>
        </div>

        {printScope === "single" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Choisir l'enseignant :</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white max-w-xs font-medium"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.civility === "Madame" ? "Mme" : "M."} {t.lastName} {t.firstName} ({t.subject})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Render Mission Orders */}
      <div className="space-y-8">
        {teachersToPrint.map((teacher, idx) => {
          const teacherSurvs = surveillances.filter(
            (s) =>
              s.teacherName.toLowerCase().includes(teacher.lastName.toLowerCase()) ||
              s.teacherName.toLowerCase().includes(teacher.firstName.toLowerCase())
          );

          return (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 max-w-3xl mx-auto printable-content space-y-6 print:border-none print:shadow-none print:p-0 print:my-0"
              style={{ pageBreakAfter: idx < teachersToPrint.length - 1 ? "always" : "auto" }}
            >
              {/* Individual Print Button (Hidden on print) */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 print:hidden text-xs">
                <span className="text-slate-600 font-medium">
                  Enseignant {idx + 1}/{teachersToPrint.length} : <strong className="text-slate-900">{teacher.civility} {teacher.lastName.toUpperCase()} {teacher.firstName}</strong> ({teacher.subject})
                </span>
                <button
                  type="button"
                  onClick={() => handlePrint(teacher)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition border border-amber-200"
                  title={`Imprimer uniquement l'ordre de mission de ${teacher.firstName} ${teacher.lastName}`}
                >
                  <Printer className="h-3.5 w-3.5 text-amber-700" />
                  <span>Imprimer cet ordre de mission</span>
                </button>
              </div>

              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/aistudio/logo-lfjp_62451311.png"
                    alt="Logo LFJP"
                    className="h-12 w-auto object-contain shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
                    }}
                  />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                      RÉPUBLIQUE FRANÇAISE • RÉSEAU AEFE
                    </p>
                    <h1 className="text-base font-black text-[#002060]">
                      LYCÉE FRANÇAIS JACQUES PRÉVERT DE SALY
                    </h1>
                    <p className="text-xs text-slate-600">Direction des Examens et Concours • Session {siteInfo.schoolYear || "2026-2027"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded bg-[#002060] text-white font-bold text-xs uppercase shadow-xs">
                    ORDRE DE MISSION • SURVEILLANCE
                  </span>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold">Enseignant(e) Convoqué(e) :</p>
                  <p className="text-sm font-black text-slate-900">
                    {teacher.civility} {teacher.firstName} {teacher.lastName.toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Discipline : <strong>{teacher.subject}</strong></p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                    {teacherSurvs.length} créneau(x) assigné(s)
                  </span>
                </div>
              </div>

              {/* Assigned slots */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900">Détail des Surveillances Assignées :</p>
                {teacherSurvs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-lg">
                    Aucun créneau de surveillance n'est actuellement affecté à cet enseignant.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="p-2 border border-slate-300">Session d'Examen</th>
                        <th className="p-2 border border-slate-300">Date</th>
                        <th className="p-2 border border-slate-300">Horaire</th>
                        <th className="p-2 border border-slate-300">Salle</th>
                        <th className="p-2 border border-slate-300">Mission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherSurvs.map((s) => (
                        <tr key={s.id}>
                          <td className="p-2 border border-slate-300 font-bold">{s.examTitle}</td>
                          <td className="p-2 border border-slate-300">{s.date}</td>
                          <td className="p-2 border border-slate-300 font-mono font-bold text-[#002060]">
                            {s.timeSlot}
                          </td>
                          <td className="p-2 border border-slate-300 font-bold">{s.roomName}</td>
                          <td className="p-2 border border-slate-300">{s.mission || "Surveillant titulaire"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Rappels Réglementaires aux Surveillants :</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Se présenter au secrétariat des examens 20 minutes avant le début de l'épreuve pour retirer la pochette.</li>
                  <li>Vérifier scrupuleusement l'identité de chaque candidat lors de l'émargement.</li>
                  <li>Ne pas utiliser de téléphone portable durant la surveillance dans la salle d'examen.</li>
                </ul>
              </div>

              {/* Signatures */}
              <div className="pt-6 flex justify-between items-end text-xs border-t border-slate-200">
                <div className="text-center">
                  <p className="text-[11px] text-slate-400">Émargement de l'enseignant</p>
                  <div className="w-40 h-10 border-b border-dashed border-slate-400 mt-2" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-slate-900 font-bold">Le / La Proviseur(e)</p>
                  <p className="font-serif italic text-slate-700 mt-2">Direction du {siteInfo.title || "Lycée Français Jacques Prévert"}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Cachet et signature officielle</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

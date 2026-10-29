import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Printer,
  Search,
  GraduationCap,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  Info,
} from "lucide-react";
import { useCmsData, type CmsCandidate } from "../../../shared/services/cms-store";

type ViewMode = "candidat" | "classe_lot" | "enseignant" | "emargement";

export default function ConvocationsPage() {
  const { data: cmsData } = useCmsData();

  const [viewMode, setViewMode] = useState<ViewMode>("candidat");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>("all");
  const [selectedRoomName, setSelectedRoomName] = useState<string>("all");

  // Distinct classes
  const classesList = useMemo(() => {
    const set = new Set<string>();
    cmsData.candidates.forEach((c) => {
      if (c.className) set.add(c.className);
    });
    // Add common LFJP classes if empty
    if (set.size === 0) {
      return ["3ème A", "3ème B", "1ère G1", "1ère G2", "Terminale G1", "Terminale G2"];
    }
    return Array.from(set).sort();
  }, [cmsData.candidates]);

  // Distinct exams
  const examsList = useMemo(() => {
    const list = cmsData.exams.map((e) => e.title);
    return Array.from(new Set(list));
  }, [cmsData.exams]);

  // Distinct rooms
  const roomsList = useMemo(() => {
    const list = cmsData.rooms.map((r) => r.name);
    return Array.from(new Set(list));
  }, [cmsData.rooms]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return cmsData.candidates.filter((cand) => {
      const matchClass = selectedClass === "all" || cand.className === selectedClass;
      const matchExam = selectedExam === "all" || cand.examName.toLowerCase().includes(selectedExam.toLowerCase()) || cand.examName === selectedExam;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        cand.firstName.toLowerCase().includes(q) ||
        cand.lastName.toLowerCase().includes(q) ||
        cand.roomName.toLowerCase().includes(q) ||
        cand.className.toLowerCase().includes(q);
      return matchClass && matchExam && matchQuery;
    });
  }, [cmsData.candidates, selectedClass, selectedExam, searchQuery]);

  // Selected candidate object (default to first matching)
  const currentCandidate = useMemo(() => {
    if (selectedCandidateId) {
      const found = cmsData.candidates.find((c) => c.id === selectedCandidateId);
      if (found) return found;
    }
    return filteredCandidates[0] || null;
  }, [selectedCandidateId, cmsData.candidates, filteredCandidates]);

  // Teacher surveillances
  const teacherSurveillances = useMemo(() => {
    if (selectedTeacherName === "all") return cmsData.surveillances;
    return cmsData.surveillances.filter((s) =>
      s.teacherName.toLowerCase().includes(selectedTeacherName.toLowerCase())
    );
  }, [cmsData.surveillances, selectedTeacherName]);

  // Print triggered
  const handlePrint = () => {
    window.print();
  };

  // Helper to build simulated timetable for candidate's exam
  const getExamScheduleForCandidate = (cand: CmsCandidate) => {
    const isTiersTemps =
      cand.accommodation &&
      (cand.accommodation.toLowerCase().includes("tiers") ||
        cand.accommodation.toLowerCase().includes("aménag"));

    const isBac = cand.className.includes("1ère") || cand.className.includes("Terminale") || cand.examName.toLowerCase().includes("bac");
    const is3eme = cand.className.includes("3ème") || cand.examName.toLowerCase().includes("dnb");

    if (isBac) {
      return [
        {
          discipline: "Épreuve écrite de Spécialité 1 / Français",
          date: "Mercredi 08 Avril 2026",
          appel: isTiersTemps ? "07h30" : "07h45",
          debut: "08h00",
          fin: isTiersTemps ? "13h20 (+1/3)" : "12h00",
          salle: cand.roomName || "Salle S12",
          table: `Table N° ${(cand.id.replace(/\D/g, "") || "12").slice(-2)}`,
          materiel: "Calculatrice mode examen autorisée",
        },
        {
          discipline: "Épreuve écrite de Spécialité 2 / Philosophie",
          date: "Jeudi 09 Avril 2026",
          appel: isTiersTemps ? "07h30" : "07h45",
          debut: "08h00",
          fin: isTiersTemps ? "13h20 (+1/3)" : "12h00",
          salle: cand.roomName || "Salle S12",
          table: `Table N° ${(cand.id.replace(/\D/g, "") || "12").slice(-2)}`,
          materiel: "Matériel d'écriture usuel, calculatrice interdite",
        },
        {
          discipline: "Épreuve d'Histoire-Géographie & Langues Vivantes",
          date: "Vendredi 10 Avril 2026",
          appel: isTiersTemps ? "13h15" : "13h30",
          debut: "13h45",
          fin: isTiersTemps ? "17h00 (+1/3)" : "16h00",
          salle: cand.roomName || "Salle S12",
          table: `Table N° ${(cand.id.replace(/\D/g, "") || "12").slice(-2)}`,
          materiel: "Crayons de couleur pour croquis autorisés",
        },
      ];
    }

    if (is3eme) {
      return [
        {
          discipline: "Français 1ère partie (Grammaire, Compréhension, Dictée)",
          date: "Mardi 03 Février 2026",
          appel: isTiersTemps ? "07h30" : "07h45",
          debut: "08h00",
          fin: isTiersTemps ? "10h10 (+1/3)" : "09h30",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${(cand.id.replace(/\D/g, "") || "05").slice(-2)}`,
          materiel: "Dictionnaire interdit pour la dictée",
        },
        {
          discipline: "Français 2ème partie (Rédaction / Expression écrite)",
          date: "Mardi 03 Février 2026",
          appel: "09h45",
          debut: "10h00",
          fin: isTiersTemps ? "12h00 (+1/3)" : "11h30",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${(cand.id.replace(/\D/g, "") || "05").slice(-2)}`,
          materiel: "Dictionnaire unilingue français autorisé",
        },
        {
          discipline: "Mathématiques",
          date: "Mardi 03 Février 2026",
          appel: isTiersTemps ? "13h15" : "13h30",
          debut: "13h45",
          fin: isTiersTemps ? "16h25 (+1/3)" : "15h45",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${(cand.id.replace(/\D/g, "") || "05").slice(-2)}`,
          materiel: "Calculatrice mode examen, instruments de géométrie",
        },
        {
          discipline: "Histoire-Géographie & Enseignement Moral et Civique",
          date: "Mercredi 04 Février 2026",
          appel: isTiersTemps ? "07h30" : "07h45",
          debut: "08h00",
          fin: isTiersTemps ? "10h40 (+1/3)" : "10h00",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${(cand.id.replace(/\D/g, "") || "05").slice(-2)}`,
          materiel: "Matériel d'écriture, crayons de couleur",
        },
        {
          discipline: "Sciences (Physique-Chimie / SVT / Technologie)",
          date: "Mercredi 04 Février 2026",
          appel: "10h15",
          debut: "10h30",
          fin: isTiersTemps ? "11h50 (+1/3)" : "11h30",
          salle: cand.roomName || "Salle S14",
          table: `Table N° ${(cand.id.replace(/\D/g, "") || "05").slice(-2)}`,
          materiel: "Calculatrice autorisée",
        },
      ];
    }

    return [
      {
        discipline: cand.examName || "Épreuve principale",
        date: "Session officielle 2026",
        appel: cand.convocationTime || "07h45",
        debut: "08h00",
        fin: isTiersTemps ? "12h40 (+1/3)" : "12h00",
        salle: cand.roomName || "Salle d'examen",
        table: `Table N° ${(cand.id.replace(/\D/g, "") || "01").slice(-2)}`,
        materiel: "Réglementaire selon discipline",
      },
    ];
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Top Bar for Navigation - Hidden on Print */}
      <header className="print:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="text-sm md:text-base font-bold text-slate-900">
                Portail Officiel des Convocations & Émargements
              </h1>
              <p className="text-[11px] text-slate-500">
                Lycée Français Jacques Prévert — Saly • Réseau AEFE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Administration CMS</span>
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer (A4)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mode Selector Tabs - Hidden on Print */}
      <div className="print:hidden bg-slate-50 border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setViewMode("candidat")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
              viewMode === "candidat"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Convocation Individuelle Élève</span>
          </button>

          <button
            onClick={() => setViewMode("classe_lot")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
              viewMode === "classe_lot"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tirage Groupé par Classe (Lot A4)</span>
          </button>

          <button
            onClick={() => setViewMode("enseignant")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
              viewMode === "enseignant"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ordres de Mission & Plannings Professeurs</span>
          </button>

          <button
            onClick={() => setViewMode("emargement")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition ${
              viewMode === "emargement"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Feuilles d'Émargement par Salle</span>
          </button>
        </div>
      </div>

      {/* Filter Bar for Active Mode - Hidden on Print */}
      <div className="print:hidden max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center gap-3">
          {viewMode === "candidat" || viewMode === "classe_lot" ? (
            <>
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, prénom, classe, salle…"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Classe :</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes les classes ({cmsData.candidates.length} élèves)</option>
                  {classesList.map((cl) => (
                    <option key={cl} value={cl}>
                      {cl}
                    </option>
                  ))}
                </select>
              </div>

              {viewMode === "candidat" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Élève :</span>
                  <select
                    value={currentCandidate?.id || ""}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[220px]"
                  >
                    {filteredCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.lastName.toUpperCase()} {c.firstName} ({c.className})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : viewMode === "enseignant" ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Enseignant :</span>
                <select
                  value={selectedTeacherName}
                  onChange={(e) => setSelectedTeacherName(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tous les professeurs ({cmsData.teachers.length})</option>
                  {cmsData.teachers.map((t) => (
                    <option key={t.id} value={`${t.lastName}`}>
                      {t.civility === "Madame" ? "Mme" : "M."} {t.firstName} {t.lastName} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Salle :</span>
                <select
                  value={selectedRoomName}
                  onChange={(e) => setSelectedRoomName(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes les salles</option>
                  {roomsList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Session d'examen :</span>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes les sessions</option>
                  {examsList.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="ml-auto text-xs text-slate-400">
            {viewMode === "classe_lot"
              ? `${filteredCandidates.length} convocation(s) prête(s) à imprimer`
              : viewMode === "candidat"
              ? `Candidat sélectionné : ${currentCandidate?.lastName || ""} ${currentCandidate?.firstName || ""}`
              : viewMode === "enseignant"
              ? `${teacherSurveillances.length} créneau(x) assigné(s)`
              : `Émargement pour ${filteredCandidates.length} élève(s)`}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pb-16 print:p-0 print:max-w-none">
        {/* VIEW MODE 1: SINGLE CANDIDATE OFFICIAL CONVOCATION */}
        {viewMode === "candidat" && (
          <div>
            {currentCandidate ? (
              <CandidateConvocationSheet
                candidate={currentCandidate}
                schedule={getExamScheduleForCandidate(currentCandidate)}
                schoolYear={cmsData.siteInfo.schoolYear || "2025-2026"}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700">Aucun candidat correspondant</p>
                <p className="text-xs text-slate-400 mt-1">
                  Vérifiez vos critères de recherche ou ajoutez des candidats depuis le panneau administration.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: BATCH PRINT ALL CANDIDATES IN CLASS */}
        {viewMode === "classe_lot" && (
          <div className="space-y-8">
            <div className="print:hidden bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Mode Impression par Lot (Format A4)</p>
                <p className="mt-0.5">
                  Chaque convocation est automatiquement mise en page pour remplir exactement une page A4 avec saut de page automatique lors de l'impression. Cliquez sur le bouton "Imprimer (A4)" en haut pour lancer l'impression de tout le paquet de la classe.
                </p>
              </div>
            </div>

            {filteredCandidates.map((cand, idx) => (
              <div key={cand.id} className="print:break-after-page mb-8 print:mb-0">
                <CandidateConvocationSheet
                  candidate={cand}
                  schedule={getExamScheduleForCandidate(cand)}
                  schoolYear={cmsData.siteInfo.schoolYear || "2025-2026"}
                  batchIndex={idx + 1}
                  batchTotal={filteredCandidates.length}
                />
              </div>
            ))}
          </div>
        )}

        {/* VIEW MODE 3: TEACHER SURVEILLANCES & MISSION ORDERS */}
        {viewMode === "enseignant" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs print:shadow-none print:border-none print:p-0">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  RÉPUBLIQUE FRANÇAISE • MINISTÈRE DE L'ÉDUCATION NATIONALE
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  LYCÉE FRANÇAIS JACQUES PRÉVERT — SALY (SÉNÉGAL)
                </p>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  ORDRE DE MISSION & PLANNING DE SURVEILLANCE DES EXAMENS BLANCS
                </h2>
                <p className="text-xs text-slate-500">Année scolaire {cmsData.siteInfo.schoolYear || "2025-2026"}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300">
                  DOCUMENT OFFICIEL
                </span>
              </div>
            </div>

            {/* Teacher Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <p className="text-slate-500 uppercase font-semibold text-[10px]">Enseignant concerné</p>
                <p className="text-sm font-bold text-slate-900">
                  {selectedTeacherName === "all" ? "Tous les enseignants" : selectedTeacherName}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold text-[10px]">Nombre de créneaux</p>
                <p className="text-sm font-bold text-indigo-600">{teacherSurveillances.length} surveillance(s)</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold text-[10px]">Période</p>
                <p className="text-sm font-bold text-slate-800">Sessions 2025-2026</p>
              </div>
            </div>

            {/* Surveillances Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <th className="p-2.5 border-r border-slate-300">Date</th>
                    <th className="p-2.5 border-r border-slate-300">Horaire</th>
                    <th className="p-2.5 border-r border-slate-300">Examen</th>
                    <th className="p-2.5 border-r border-slate-300">Professeur</th>
                    <th className="p-2.5 border-r border-slate-300">Salle</th>
                    <th className="p-2.5">Rôle / Mission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {teacherSurveillances.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-medium border-r border-slate-200 whitespace-nowrap">{s.date}</td>
                      <td className="p-2.5 font-semibold text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                        {s.timeSlot}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">{s.examTitle}</td>
                      <td className="p-2.5 font-medium border-r border-slate-200">{s.teacherName}</td>
                      <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-200">{s.roomName}</td>
                      <td className="p-2.5 text-slate-600">{s.mission || "Surveillance principale"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Instructions */}
            <div className="mt-8 border-t border-slate-200 pt-4 text-[11px] text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-900">Consignes importantes aux surveillants :</p>
              <p>• Veuillez vous présenter au secrétariat des examens 15 minutes avant le début de l'épreuve pour récupérer l'enveloppe des sujets et les listes d'émargement.</p>
              <p>• Procédez au contrôle scrupuleux de l'identité des candidats et vérifiez qu'aucun téléphone ou montre connectée n'est conservé par un élève.</p>
              <p>• En cas d'absence d'un candidat, mentionnez "ABSENT" en rouge sur la feuille d'émargement.</p>
              <p>• À la fin de l'épreuve, recomptez les copies avant d'autoriser les élèves à quitter la salle, puis rapportez l'enveloppe scellée au secrétariat.</p>
            </div>

            {/* Signatures */}
            <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-300 pt-3">
                <p className="font-semibold text-slate-700">L'Enseignant(e)</p>
                <p className="text-[10px] text-slate-400 mt-1">Date et signature</p>
                <div className="h-16" />
              </div>
              <div className="border-t border-slate-300 pt-3">
                <p className="font-semibold text-slate-700">Pour le Chef d'Établissement</p>
                <p className="text-[10px] text-slate-400 mt-1">Le Proviseur du LFJP</p>
                <div className="h-16" />
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 4: ROOM ATTENDANCE / ÉMARGEMENT SHEET */}
        {viewMode === "emargement" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs print:shadow-none print:border-none print:p-0">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  RÉPUBLIQUE FRANÇAISE • AEFE • LYCÉE FRANÇAIS JACQUES PRÉVERT
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  FEUILLE D'ÉMARGEMENT ET DE PRÉSENCE DES CANDIDATS
                </h2>
                <p className="text-xs text-slate-500">
                  Examen : {selectedExam === "all" ? "Toutes épreuves" : selectedExam} • Salle :{" "}
                  <span className="font-bold text-slate-900">{selectedRoomName}</span>
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-slate-900">Total inscrits : {filteredCandidates.length}</p>
                <p className="text-slate-500">Session 2025-2026</p>
              </div>
            </div>

            {/* Candidates attendance table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-12 text-center">N° Place</th>
                    <th className="p-2 border-r border-slate-300">Nom du Candidat</th>
                    <th className="p-2 border-r border-slate-300">Prénom</th>
                    <th className="p-2 border-r border-slate-300 w-24">Classe</th>
                    <th className="p-2 border-r border-slate-300 w-28">Aménagement</th>
                    <th className="p-2 border-r border-slate-300 w-24 text-center">Identité vérifiée</th>
                    <th className="p-2 w-44 text-center">Signature du candidat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCandidates.map((cand, idx) => (
                    <tr key={cand.id} className="h-10">
                      <td className="p-2 text-center font-bold text-slate-700 border-r border-slate-200">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200 uppercase">
                        {cand.lastName}
                      </td>
                      <td className="p-2 font-medium text-slate-700 border-r border-slate-200">
                        {cand.firstName}
                      </td>
                      <td className="p-2 font-semibold text-indigo-700 border-r border-slate-200">
                        {cand.className}
                      </td>
                      <td className="p-2 text-[10px] text-slate-600 border-r border-slate-200">
                        {cand.accommodation || "Standard"}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200">
                        <div className="w-4 h-4 border border-slate-400 mx-auto rounded-xs" />
                      </td>
                      <td className="p-2 text-center border-slate-200">
                        {/* Space for signature */}
                        <div className="h-6" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Box */}
            <div className="mt-8 grid grid-cols-3 gap-4 border border-slate-300 rounded-lg p-3 text-xs bg-slate-50">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Nombre d'inscrits</p>
                <p className="text-base font-bold text-slate-900">{filteredCandidates.length}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Nombre de présents</p>
                <p className="text-base font-bold text-emerald-600">__________</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Nombre d'absents</p>
                <p className="text-base font-bold text-rose-600">__________</p>
              </div>
            </div>

            {/* Surveillance validation */}
            <div className="mt-8 border-t border-slate-300 pt-4 flex items-start justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-800">Nom & Signature du surveillant principal :</p>
                <div className="h-16 w-64 border-b border-dashed border-slate-300 mt-2" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Nom & Signature du second surveillant :</p>
                <div className="h-16 w-64 border-b border-dashed border-slate-300 mt-2" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Subcomponent: Individual Official Candidate Convocation Sheet (A4 layout)
interface CandidateConvocationSheetProps {
  candidate: CmsCandidate;
  schedule: Array<{
    discipline: string;
    date: string;
    appel: string;
    debut: string;
    fin: string;
    salle: string;
    table: string;
    materiel: string;
  }>;
  schoolYear: string;
  batchIndex?: number;
  batchTotal?: number;
}

function CandidateConvocationSheet({
  candidate,
  schedule,
  schoolYear,
  batchIndex,
  batchTotal,
}: CandidateConvocationSheetProps) {
  const isTiersTemps =
    candidate.accommodation &&
    (candidate.accommodation.toLowerCase().includes("tiers") ||
      candidate.accommodation.toLowerCase().includes("aménag"));

  return (
    <div className="bg-white rounded-2xl border border-slate-300 p-8 shadow-xs print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900 text-xs font-sans">
      {/* Official Header */}
      <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-600">
            RÉPUBLIQUE FRANÇAISE
          </p>
          <p className="text-[10px] font-semibold tracking-wide text-slate-500">
            MINISTÈRE DE L'ÉDUCATION NATIONALE
          </p>
          <p className="text-[10px] font-semibold text-indigo-900">
            AGENCE POUR L'ENSEIGNEMENT FRANÇAIS À L'ÉTRANGER (AEFE)
          </p>
          <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
            LYCÉE FRANÇAIS JACQUES PRÉVERT — SALY (SÉNÉGAL)
          </h2>
          <p className="text-[10px] text-slate-500">Code Établissement AEFE : 332001A</p>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="border border-slate-800 px-3 py-1 rounded bg-slate-50 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-500">Document Officiel</p>
            <p className="text-xs font-black text-slate-900">CONVOCATION AUX ÉPREUVES</p>
            <p className="text-[10px] font-semibold text-slate-600">Session {schoolYear}</p>
          </div>
          {batchIndex && batchTotal && (
            <p className="text-[10px] text-slate-400 mt-1 print:hidden">
              Page {batchIndex} sur {batchTotal}
            </p>
          )}
        </div>
      </div>

      {/* Candidate Identification Box */}
      <div className="my-5 border border-slate-300 rounded-xl p-4 bg-slate-50/60">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Nom & Prénom</p>
            <p className="text-sm font-extrabold text-slate-900 uppercase">
              {candidate.lastName} {candidate.firstName}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Classe</p>
            <p className="text-sm font-bold text-indigo-700">{candidate.className}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">N° Candidat / Anonymat</p>
            <p className="text-sm font-mono font-bold text-slate-900">
              LFJP-{(candidate.id.replace(/\D/g, "") || "101").padStart(4, "0")}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Régime / Aménagement</p>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                isTiersTemps
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
              }`}
            >
              {candidate.accommodation || "Régime Standard"}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
          <div>
            <span className="font-semibold">Examen : </span>
            <span>{candidate.examName || "Baccalauréat / DNB Blanc"}</span>
          </div>
          <div>
            <span className="font-semibold">Centre d'examen : </span>
            <span>LFJP Saly (Bâtiment Principal)</span>
          </div>
        </div>
      </div>

      {/* Timetable Table */}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>Calendrier et Horaires des Épreuves</span>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                <th className="p-2 border-r border-slate-300">Date</th>
                <th className="p-2 border-r border-slate-300 w-16 text-center">Appel</th>
                <th className="p-2 border-r border-slate-300 w-28 text-center">Épreuve</th>
                <th className="p-2 border-r border-slate-300">Matière / Discipline</th>
                <th className="p-2 border-r border-slate-300 w-24">Salle</th>
                <th className="p-2 border-r border-slate-300 w-20">Place</th>
                <th className="p-2">Matériel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {schedule.map((slot, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-2 font-semibold border-r border-slate-200 whitespace-nowrap">{slot.date}</td>
                  <td className="p-2 text-center font-bold text-rose-700 border-r border-slate-200">
                    {slot.appel}
                  </td>
                  <td className="p-2 text-center font-mono font-medium border-r border-slate-200">
                    {slot.debut} - {slot.fin}
                  </td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{slot.discipline}</td>
                  <td className="p-2 font-semibold text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                    {slot.salle}
                  </td>
                  <td className="p-2 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    {slot.table}
                  </td>
                  <td className="p-2 text-[10px] text-slate-500">{slot.materiel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Instructions */}
      <div className="border border-slate-300 rounded-xl p-3 bg-amber-50/50 mb-5 text-[10px] text-slate-700 space-y-1 leading-relaxed">
        <p className="font-bold text-amber-950 uppercase flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          <span>Consignes Réglementaires Impératives aux Candidats</span>
        </p>
        <p>
          <strong>1. Présentation obligatoire :</strong> Vous devez impérativement vous présenter à l'heure d'appel indiquée (15 minutes avant le début des épreuves), muni(e) de la présente convocation et d'une pièce d'identité officielle avec photographie récente (carte d'identité, passeport ou carnet de correspondance).
        </p>
        <p>
          <strong>2. Appareils électroniques strictement interdits :</strong> Les téléphones portables, montres connectées, écouteurs et tout dispositif connecté doivent être éteints dès l'entrée dans le centre et rangés au fond du sac. Toute possession d'un appareil connecté en cours d'épreuve est assimilée à une tentative de fraude.
        </p>
        <p>
          <strong>3. Retards :</strong> Aucun candidat ne sera admis en salle après l'ouverture des enveloppes de sujets au-delà d'un délai d'une heure. Aucun temps supplémentaire ne sera accordé pour compenser un retard.
        </p>
        <p>
          <strong>4. Aménagements 1/3 Temps :</strong> Pour les élèves bénéficiant d'un aménagement horaire validé par la commission médicale, les horaires de fin d'épreuve tiennent compte de la majoration d'un tiers temps (+33%).
        </p>
      </div>

      {/* Official Signature and Stamp Box */}
      <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-300 text-xs">
        <div>
          <p className="text-[10px] text-slate-500">Fait à Saly, le {new Date().toLocaleDateString("fr-FR")}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Signature de l'élève ou du responsable légal :</p>
          <div className="h-14" />
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900">Le Proviseur du LFJP Saly</p>
          <p className="text-[10px] text-slate-500">Cachet de l'établissement</p>
          <div className="h-14 flex items-center justify-end">
            <div className="w-24 h-12 border-2 border-indigo-900/30 rounded-lg flex items-center justify-center text-[9px] font-bold text-indigo-900/40 uppercase tracking-widest rotate-[-6deg]">
              SCEAU LFJP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Printer,
  FileCheck2,
  Users,
  DoorOpen,
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shuffle,
  FileSpreadsheet,
  Upload,
  Check,
  Tag,
  BadgePercent,
} from "lucide-react";
import {
  useCmsData,
  type CmsCandidate,
  type CmsRoom,
} from "../../../shared/services/cms-store";

type WizardStep = 1 | 2 | 3 | 4 | 5;

type PrintDocType =
  | "emargement"
  | "etiquettes"
  | "portes"
  | "convocations"
  | "recapitulatif";

export default function OrgaDnbPage() {
  const { data: cmsData, setCandidates } = useCmsData();

  // Active step
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1: Settings
  const [sessionTitle, setSessionTitle] = useState(
    "Diplôme National du Brevet (DNB) Blanc — Session 2026",
  );
  const [schoolName, setSchoolName] = useState(
    cmsData.siteInfo.title || "Lycée Français Jacques Prévert de Saly",
  );
  const [examDate, setExamDate] = useState("2026-02-03");
  const [anonymatPrefix, setAnonymatPrefix] = useState("DNB-");
  const [dispatchMode, setDispatchMode] = useState<"brassage" | "alphabetique">(
    "brassage",
  );

  // Default DNB subjects
  const [subjects] = useState([
    {
      id: "sub-1",
      name: "Français (Grammaire, Dictée & Compréhension)",
      durationMin: 90,
      standardHours: "08h00 - 09h30",
      tiersTempsHours: "08h00 - 10h00 (+30 min)",
    },
    {
      id: "sub-2",
      name: "Français (Rédaction / Expression écrite)",
      durationMin: 90,
      standardHours: "09h45 - 11h15",
      tiersTempsHours: "09h45 - 11h45 (+30 min)",
    },
    {
      id: "sub-3",
      name: "Mathématiques",
      durationMin: 120,
      standardHours: "13h30 - 15h30",
      tiersTempsHours: "13h30 - 16h10 (+40 min)",
    },
    {
      id: "sub-4",
      name: "Histoire-Géographie & Enseignement Moral et Civique",
      durationMin: 120,
      standardHours: "08h00 - 10h00",
      tiersTempsHours: "08h00 - 10h40 (+40 min)",
    },
    {
      id: "sub-5",
      name: "Sciences (Physique-Chimie / SVT / Techno)",
      durationMin: 60,
      standardHours: "10h15 - 11h15",
      tiersTempsHours: "10h15 - 11h35 (+20 min)",
    },
  ]);

  // Step 2: Salles actives
  const [localRooms, setLocalRooms] = useState<
    Array<CmsRoom & { isTiersTemps?: boolean; isSelected?: boolean }>
  >(() => {
    return (
      cmsData.rooms.map((r, i) => ({
        ...r,
        isSelected: true,
        isTiersTemps:
          r.name.toLowerCase().includes("tiers") ||
          r.notes.toLowerCase().includes("tiers") ||
          i === cmsData.rooms.length - 2,
      })) || []
    );
  });

  // Step 3: Candidates list (local working copy)
  const [localCandidates, setLocalCandidates] = useState<CmsCandidate[]>(
    cmsData.candidates || [],
  );
  const [pronotePasteInput, setPronotePasteInput] = useState("");
  const [importNotification, setImportNotification] = useState("");

  // Step 4: Dispatch state
  const [dispatchExecuted, setDispatchExecuted] = useState(false);
  const [selectedPreviewRoom, setSelectedPreviewRoom] = useState<string>("all");

  // Step 5: Printing configuration
  const [printDoc, setPrintDoc] = useState<PrintDocType>("emargement");
  const [printRoomFilter, setPrintRoomFilter] = useState<string>("all");
  const [printSubjectFilter, setPrintSubjectFilter] = useState<string>(
    subjects[0]?.name || "",
  );

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCandidates = localCandidates.length;
    const tiersTempsCount = localCandidates.filter(
      (c) =>
        c.accommodation &&
        (c.accommodation.toLowerCase().includes("tiers") ||
          c.accommodation.toLowerCase().includes("aménag")),
    ).length;

    const normalCandidatesCount = totalCandidates - tiersTempsCount;

    const activeRooms = localRooms.filter((r) => r.isSelected);
    const totalCapacity = activeRooms.reduce((acc, r) => acc + r.capacity, 0);

    const tiersTempsCapacity = activeRooms
      .filter((r) => r.isTiersTemps)
      .reduce((acc, r) => acc + r.capacity, 0);

    const normalCapacity = activeRooms
      .filter((r) => !r.isTiersTemps)
      .reduce((acc, r) => acc + r.capacity, 0);

    // Classes breakdown
    const classCounts: Record<string, number> = {};
    localCandidates.forEach((c) => {
      const cls = c.className || "Sans classe";
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    });

    return {
      totalCandidates,
      tiersTempsCount,
      normalCandidatesCount,
      totalCapacity,
      tiersTempsCapacity,
      normalCapacity,
      activeRoomsCount: activeRooms.length,
      classCounts,
      isCapacitySufficient: totalCapacity >= totalCandidates,
      isTiersTempsSufficient: tiersTempsCapacity >= tiersTempsCount,
    };
  }, [localCandidates, localRooms]);

  // Import handler for Pronote / CSV
  const handleParsePronoteInput = () => {
    if (!pronotePasteInput.trim()) return;

    const lines = pronotePasteInput.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const newItems: CmsCandidate[] = [];

    lines.forEach((line, idx) => {
      // Split on tabs, semicolons or commas
      const parts = line.includes("\t")
        ? line.split("\t")
        : line.includes(";")
        ? line.split(";")
        : line.split(",");

      if (parts.length >= 2) {
        // Skip header lines
        const first = parts[0].trim();
        const second = parts[1].trim();
        if (
          first.toLowerCase() === "nom" ||
          first.toLowerCase() === "candidat" ||
          second.toLowerCase() === "prénom"
        ) {
          return;
        }

        const lastName = first;
        const firstName = second;
        const className = parts[2]?.trim() || "3ème A";
        const rawAccom = parts[3]?.trim() || "";
        const isTiers =
          rawAccom.toLowerCase().includes("oui") ||
          rawAccom.toLowerCase().includes("tiers") ||
          rawAccom.toLowerCase().includes("1/3") ||
          rawAccom.toLowerCase().includes("aménag");

        newItems.push({
          id: `cand-${Date.now()}-${idx}`,
          lastName: lastName.toUpperCase(),
          firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          className,
          examName: sessionTitle,
          roomName: "À répartir",
          convocationTime: "07h45",
          accommodation: isTiers ? "Tiers-temps accordé (PAP/PPS)" : "Aucun",
        });
      }
    });

    if (newItems.length > 0) {
      setLocalCandidates((prev) => [...prev, ...newItems]);
      setImportNotification(
        `Succès : ${newItems.length} candidats importés depuis vos données Pronote !`,
      );
      setPronotePasteInput("");
      setTimeout(() => setImportNotification(""), 4000);
    } else {
      setImportNotification(
        "Format non reconnu : collez au format 'Nom ; Prénom ; Classe ; Aménagement'.",
      );
    }
  };

  // Automated Algorithmic Dispatch Engine (The "Orga-DNB-Blanc" core algorithm)
  const handleExecuteDispatch = () => {
    const activeRooms = localRooms.filter((r) => r.isSelected);
    if (activeRooms.length === 0) {
      alert("Erreur : Veuillez sélectionner au moins une salle pour la répartition.");
      return;
    }

    const tiersRooms = activeRooms.filter((r) => r.isTiersTemps);
    const standardRooms = activeRooms.filter((r) => !r.isTiersTemps);

    // Separate candidates
    const tiersCandidates = localCandidates.filter(
      (c) =>
        c.accommodation &&
        (c.accommodation.toLowerCase().includes("tiers") ||
          c.accommodation.toLowerCase().includes("aménag")),
    );
    const normalCandidates = localCandidates.filter(
      (c) =>
        !c.accommodation ||
        (!c.accommodation.toLowerCase().includes("tiers") &&
          !c.accommodation.toLowerCase().includes("aménag")),
    );

    const updatedCandidates: CmsCandidate[] = [];
    let globalAnonymatIndex = 1;

    // Phase 1: Assign Tiers-Temps candidates
    const assignedTiersRooms = tiersRooms.length > 0 ? tiersRooms : activeRooms;
    let currentTiersRoomIdx = 0;
    let currentTiersRoomSeat = 1;

    tiersCandidates.forEach((cand) => {
      const room = assignedTiersRooms[currentTiersRoomIdx % assignedTiersRooms.length];
      const tableNum = `T-${String(currentTiersRoomSeat).padStart(2, "0")}`;
      const anonCode = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(3, "0")}`;

      updatedCandidates.push({
        ...cand,
        examName: sessionTitle,
        roomName: room.name,
        tableNumber: tableNum,
        anonymatNumber: anonCode,
        convocationTime: "07h30",
      });

      globalAnonymatIndex++;
      currentTiersRoomSeat++;
      if (currentTiersRoomSeat > room.capacity) {
        currentTiersRoomIdx++;
        currentTiersRoomSeat = 1;
      }
    });

    // Phase 2: Assign Standard candidates with inter-classes shuffling or alphabetical
    let processedNormals = [...normalCandidates];

    if (dispatchMode === "brassage") {
      // Group by class
      const byClass: Record<string, CmsCandidate[]> = {};
      processedNormals.forEach((c) => {
        const cls = c.className || "Autre";
        if (!byClass[cls]) byClass[cls] = [];
        byClass[cls].push(c);
      });

      // Sort each class alphabetically
      Object.keys(byClass).forEach((cls) => {
        byClass[cls].sort((a, b) => a.lastName.localeCompare(b.lastName));
      });

      // Round-robin alternate from each class to avoid adjacent classmates
      const intermixed: CmsCandidate[] = [];
      const classKeys = Object.keys(byClass);
      let remaining = true;
      while (remaining) {
        remaining = false;
        classKeys.forEach((cls) => {
          if (byClass[cls].length > 0) {
            intermixed.push(byClass[cls].shift()!);
            remaining = true;
          }
        });
      }
      processedNormals = intermixed;
    } else {
      // Global alphabetical
      processedNormals.sort((a, b) => a.lastName.localeCompare(b.lastName));
    }

    // Distribute into standard rooms
    const targetRooms = standardRooms.length > 0 ? standardRooms : activeRooms;
    let roomIdx = 0;
    let seatIdx = 1;

    processedNormals.forEach((cand) => {
      const room = targetRooms[roomIdx % targetRooms.length];
      const tableNum = `T-${String(seatIdx).padStart(2, "0")}`;
      const anonCode = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(3, "0")}`;

      updatedCandidates.push({
        ...cand,
        examName: sessionTitle,
        roomName: room.name,
        tableNumber: tableNum,
        anonymatNumber: anonCode,
        convocationTime: "07h45",
      });

      globalAnonymatIndex++;
      seatIdx++;
      if (seatIdx > room.capacity) {
        roomIdx++;
        seatIdx = 1;
      }
    });

    setLocalCandidates(updatedCandidates);
    setDispatchExecuted(true);

    // Save to CMS store so the rest of the application (convocations, admin, search) benefits immediately!
    setCandidates(updatedCandidates);
  };

  // Grouped candidates by room for print views
  const candidatesByRoom = useMemo(() => {
    const map: Record<string, CmsCandidate[]> = {};
    localCandidates.forEach((c) => {
      const rName = c.roomName || "Non assigné";
      if (!map[rName]) map[rName] = [];
      map[rName].push(c);
    });

    // Sort candidates inside each room by table number or last name
    Object.keys(map).forEach((r) => {
      map[r].sort((a, b) => {
        const tA = parseInt((a.tableNumber || "").replace(/\D/g, "") || "0", 10);
        const tB = parseInt((b.tableNumber || "").replace(/\D/g, "") || "0", 10);
        if (tA !== tB) return tA - tB;
        return a.lastName.localeCompare(b.lastName);
      });
    });

    return map;
  }, [localCandidates]);

  // Distinct rooms list from candidates
  const availableRoomsInDispatch = useMemo(() => {
    return Object.keys(candidatesByRoom).sort();
  }, [candidatesByRoom]);

  // Print action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Print Stylesheet injection for clean official forms */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-card {
            border: 1px solid #1e293b !important;
            box-shadow: none !important;
          }
          .print-tight {
            padding: 4px !important;
            margin: 0 !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner & Header (Hidden on print) */}
      <header className="no-print border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Retour au portail d'accueil"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-700">
                  Assistant PERDIR
                </span>
                <span className="text-xs text-slate-400">
                  Inspiré de Frédéric Vedrenne (Orga-DNB-Blanc)
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-900">
                Organisation & Brassage d'Examen Blanc (DNB & Bac)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/convocations"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-1.5"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Portail Convocations</span>
            </Link>
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition inline-flex items-center gap-1.5"
            >
              <span>Console Admin & Git</span>
            </Link>
          </div>
        </div>

        {/* 5-Step Stepper Header */}
        <div className="max-w-7xl mx-auto px-4 border-t border-slate-100 py-2.5 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[680px] gap-2">
            {[
              { num: 1, label: "1. Paramètres & Horaires", icon: Calendar },
              { num: 2, label: "2. Salles & Capacités", icon: DoorOpen },
              { num: 3, label: "3. Élèves & Import Pronote", icon: Users },
              { num: 4, label: "4. Répartition & Brassage", icon: Shuffle },
              { num: 5, label: "5. Documents & Émargement", icon: Printer },
            ].map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isDone = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => setCurrentStep(step.num as WizardStep)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : isDone
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? "bg-white text-indigo-600"
                        : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : step.num}
                  </span>
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ================= STEP 1: PARAMÈTRES ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Étape 1 : Paramètres Généraux de la Session
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configurez l'intitulé de l'épreuve, l'établissement, les règles d'anonymat et le mode de brassage.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Établissement scolaire
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Intitulé officiel de la session d'examen
                  </label>
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date des épreuves
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Préfixe des numéros d'anonymat
                  </label>
                  <input
                    type="text"
                    value={anonymatPrefix}
                    onChange={(e) => setAnonymatPrefix(e.target.value)}
                    placeholder="ex: DNB-, BAC-, SALY-"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dispatch Method selection (Brassage inter-classes) */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Shuffle className="h-4 w-4 text-indigo-600" />
                  Mode de Répartition des Candidats (Philosophie PERDIR)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      dispatchMode === "brassage"
                        ? "bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dispatchMode"
                      checked={dispatchMode === "brassage"}
                      onChange={() => setDispatchMode("brassage")}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Brassage Inter-Classes (Recommandé anti-triche)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Alterne automatiquement les élèves de différentes classes (3ème A, 3ème B...) pour qu'aucun camarade de classe ne soit assis à côté.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      dispatchMode === "alphabetique"
                        ? "bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dispatchMode"
                      checked={dispatchMode === "alphabetique"}
                      onChange={() => setDispatchMode("alphabetique")}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Ordre Alphabétique Continu
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Répartition séquentielle des élèves par ordre alphabétique de leur nom de famille sans mélange des divisions.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Disciplines & Épreuves avec Tiers-temps */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Disciplines au Programme & Horaires Officiels
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Matière / Épreuve</th>
                      <th className="py-2.5 px-3">Durée Standard</th>
                      <th className="py-2.5 px-3">Horaires Normaux</th>
                      <th className="py-2.5 px-3">Horaires Tiers-Temps (+1/3)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {s.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {s.durationMin} minutes
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {s.standardHours}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-700 font-semibold bg-amber-50/40">
                          {s.tiersTempsHours}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition inline-flex items-center gap-2"
              >
                <span>Étape suivante : Salles & Capacités</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SALLES & CAPACITÉS ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <DoorOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Étape 2 : Configuration des Salles & Capacité
                    </h2>
                    <p className="text-xs text-slate-500">
                      Définissez les salles mobilisées et isolez les salles réservées aux candidats Tiers-Temps / Aménagements.
                    </p>
                  </div>
                </div>

                {/* Jauge globale en temps réel */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-500">
                      Capacité totale mobilisée
                    </p>
                    <p className="text-base font-extrabold text-slate-900">
                      {stats.totalCapacity}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        places pour {stats.totalCandidates} élèves
                      </span>
                    </p>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      stats.isCapacitySufficient ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                </div>
              </div>

              {/* Salles list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {localRooms.map((room, idx) => (
                  <div
                    key={room.id}
                    className={`p-4 rounded-xl border transition ${
                      room.isSelected
                        ? room.isTiersTemps
                          ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-300"
                          : "bg-white border-slate-200 shadow-xs"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900">
                        <input
                          type="checkbox"
                          checked={room.isSelected}
                          onChange={(e) => {
                            const next = [...localRooms];
                            next[idx].isSelected = e.target.checked;
                            setLocalRooms(next);
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{room.name}</span>
                      </label>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {room.capacity} places
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">{room.building}</p>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={room.isTiersTemps}
                        onChange={(e) => {
                          const next = [...localRooms];
                          next[idx].isTiersTemps = e.target.checked;
                          setLocalRooms(next);
                        }}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-amber-800 font-semibold">
                        Salle réservée Tiers-Temps / PAP / PPS
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux paramètres</span>
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition inline-flex items-center gap-2"
              >
                <span>Étape suivante : Élèves & Import Pronote</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CANDIDATS & PRONOTE ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Étape 3 : Liste des Candidats & Import Pronote / SIECLE
                    </h2>
                    <p className="text-xs text-slate-500">
                      Importez vos élèves en un clic depuis Pronote ou saisissez-les directement.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                    {stats.totalCandidates} inscrits
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                    {stats.tiersTempsCount} tiers-temps
                  </span>
                </div>
              </div>

              {/* Pronote Paste Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
                <h3 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Copier-Coller direct depuis Pronote ou Excel
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Sélectionnez les colonnes dans Pronote (Nom, Prénom, Division, Aménagement) et collez-les directement ci-dessous :
                </p>
                <textarea
                  rows={3}
                  value={pronotePasteInput}
                  onChange={(e) => setPronotePasteInput(e.target.value)}
                  placeholder="DIOP	Mamadou	3ème A	Non
FAYE	Awa	3ème B	Tiers-temps
SOW	Ibrahima	3ème A	Non"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={handleParsePronoteInput}
                    disabled={!pronotePasteInput.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Intégrer les élèves collés</span>
                  </button>
                  {importNotification && (
                    <span className="text-xs font-semibold text-emerald-700">
                      {importNotification}
                    </span>
                  )}
                </div>
              </div>

              {/* Candidates Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Candidat</th>
                      <th className="py-2.5 px-3">Classe</th>
                      <th className="py-2.5 px-3">Aménagement</th>
                      <th className="py-2.5 px-3">Salle assignée</th>
                      <th className="py-2.5 px-3">N° Table</th>
                      <th className="py-2.5 px-3">N° Anonymat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localCandidates.slice(0, 15).map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {cand.lastName} {cand.firstName}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{cand.className}</td>
                        <td className="py-2 px-3">
                          {cand.accommodation &&
                          cand.accommodation.toLowerCase().includes("tiers") ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Tiers-Temps
                            </span>
                          ) : (
                            <span className="text-slate-400">Standard</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-medium">
                          {cand.roomName || "En attente"}
                        </td>
                        <td className="py-2 px-3 font-mono text-indigo-600 font-bold">
                          {cand.tableNumber || "—"}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {cand.anonymatNumber || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {localCandidates.length > 15 && (
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Affichage des 15 premiers candidats sur {localCandidates.length} au total.
                </p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux salles</span>
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition inline-flex items-center gap-2"
              >
                <span>Étape suivante : Lancer la Répartition</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: MOTEUR DE RÉPARTITION & BRASSAGE ================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Shuffle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Étape 4 : Moteur de Répartition & Brassage Automatique
                    </h2>
                    <p className="text-xs text-slate-500">
                      Algorithme de placement : isolement des Tiers-Temps + brassage anti-triche des divisions.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExecuteDispatch}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs shadow-md transition inline-flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Exécuter la Répartition & Générer les Tables</span>
                </button>
              </div>

              {/* Status Banner */}
              {dispatchExecuted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        Répartition effectuée avec succès !
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Tous les candidats ont reçu une salle, un numéro de table et un code d'anonymat. Les données sont synchronisées avec le CMS.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    <span>Passer aux impressions</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 mb-6 flex items-center gap-3">
                  <BadgePercent className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-xs font-bold text-sky-900">
                      Prêt pour le placement automatique
                    </p>
                    <p className="text-[11px] text-sky-700">
                      Cliquez sur le bouton ci-dessus pour déclencher l'algorithme inspiré d'Orga-DNB-Blanc.
                    </p>
                  </div>
                </div>
              )}

              {/* Filter by room preview */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Plan de répartition par salle
                </h3>
                <select
                  value={selectedPreviewRoom}
                  onChange={(e) => setSelectedPreviewRoom(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                >
                  <option value="all">Toutes les salles ({availableRoomsInDispatch.length})</option>
                  {availableRoomsInDispatch.map((r) => (
                    <option key={r} value={r}>
                      {r} ({candidatesByRoom[r]?.length || 0} élèves)
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid of rooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRoomsInDispatch
                  .filter(
                    (r) => selectedPreviewRoom === "all" || r === selectedPreviewRoom,
                  )
                  .map((roomName) => {
                    const cands = candidatesByRoom[roomName] || [];
                    const isTiers = cands.some(
                      (c) =>
                        c.accommodation &&
                        c.accommodation.toLowerCase().includes("tiers"),
                    );
                    return (
                      <div
                        key={roomName}
                        className={`p-4 rounded-xl border ${
                          isTiers
                            ? "bg-amber-50/30 border-amber-300"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-xs text-slate-900">
                            {roomName}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {cands.length} élèves
                          </span>
                        </div>
                        {isTiers && (
                          <span className="inline-block mb-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Salle Tiers-Temps (+1/3)
                          </span>
                        )}
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {cands.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50 border border-slate-100"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-slate-900">
                                  {c.lastName} {c.firstName}
                                </span>{" "}
                                <span className="text-slate-400">({c.className})</span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[10px]">
                                <span className="font-bold text-indigo-600">
                                  {c.tableNumber}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux élèves</span>
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition inline-flex items-center gap-2"
              >
                <span>Étape suivante : Imprimer les Documents</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: DOCUMENTS OFFICIELS & IMPRESSION ================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {/* Control Bar (Hidden on print) */}
            <div className="no-print bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Printer className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Étape 5 : L'Imprimerie Administrative Officielle
                    </h2>
                    <p className="text-xs text-slate-500">
                      Générez en un clic les feuilles d'émargement, les étiquettes de table et les listes de porte.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer / Exporter en PDF</span>
                </button>
              </div>

              {/* Document Type Selector Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {[
                  {
                    id: "emargement" as PrintDocType,
                    label: "1. Feuilles d'Émargement",
                    icon: FileCheck2,
                  },
                  {
                    id: "etiquettes" as PrintDocType,
                    label: "2. Étiquettes de Table",
                    icon: Tag,
                  },
                  {
                    id: "portes" as PrintDocType,
                    label: "3. Listes Portes de Salle",
                    icon: DoorOpen,
                  },
                  {
                    id: "recapitulatif" as PrintDocType,
                    label: "4. Récapitulatif Global",
                    icon: FileSpreadsheet,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = printDoc === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPrintDoc(tab.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition text-left ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filters for printing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Filtrer par salle pour l'impression :
                  </label>
                  <select
                    value={printRoomFilter}
                    onChange={(e) => setPrintRoomFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="all">Toutes les salles ({availableRoomsInDispatch.length})</option>
                    {availableRoomsInDispatch.map((r) => (
                      <option key={r} value={r}>
                        {r} ({candidatesByRoom[r]?.length || 0} candidats)
                      </option>
                    ))}
                  </select>
                </div>
                {printDoc === "emargement" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Matière / Épreuve concernée :
                    </label>
                    <select
                      value={printSubjectFilter}
                      onChange={(e) => setPrintSubjectFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.standardHours})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* ================= PRINT PREVIEW CONTAINER ================= */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
              {/* --- DOCUMENT 1: FEUILLES D'ÉMARGEMENT PAR SALLE --- */}
              {printDoc === "emargement" && (
                <div className="space-y-12">
                  {availableRoomsInDispatch
                    .filter((r) => printRoomFilter === "all" || r === printRoomFilter)
                    .map((roomName) => {
                      const cands = candidatesByRoom[roomName] || [];
                      const isTiers = cands.some(
                        (c) =>
                          c.accommodation &&
                          c.accommodation.toLowerCase().includes("tiers"),
                      );
                      const currentSubject =
                        subjects.find((s) => s.name === printSubjectFilter) ||
                        subjects[0];

                      return (
                        <div
                          key={roomName}
                          className="print-page-break border-2 border-slate-800 p-6 rounded-lg bg-white"
                        >
                          {/* Official Header */}
                          <div className="border-b-2 border-slate-800 pb-4 mb-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                RÉPUBLIQUE FRANÇAISE • AEFE
                              </p>
                              <h2 className="text-base font-extrabold text-slate-900 uppercase">
                                {schoolName}
                              </h2>
                              <p className="text-xs text-slate-600 font-medium">
                                {sessionTitle}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-extrabold text-sm uppercase">
                                {roomName}
                              </span>
                              {isTiers && (
                                <p className="text-[10px] font-bold text-amber-700 mt-1 uppercase">
                                  SALLE AMÉNAGEMENTS (TIERS-TEMPS)
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Sub-header info */}
                          <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded border border-slate-300 mb-4">
                            <div>
                              <span className="font-bold text-slate-700">Épreuve :</span>{" "}
                              <span className="font-semibold text-slate-900">
                                {printSubjectFilter}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Date :</span>{" "}
                              <span>{examDate}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Horaire :</span>{" "}
                              <span className="font-mono">
                                {isTiers
                                  ? currentSubject.tiersTempsHours
                                  : currentSubject.standardHours}
                              </span>
                            </div>
                          </div>

                          {/* Candidates attendance table */}
                          <table className="w-full text-left text-xs border border-slate-800">
                            <thead>
                              <tr className="bg-slate-100 text-slate-900 border-b border-slate-800">
                                <th className="p-2 border-r border-slate-800 w-16 text-center">
                                  Table
                                </th>
                                <th className="p-2 border-r border-slate-800 w-24">
                                  N° Anonymat
                                </th>
                                <th className="p-2 border-r border-slate-800">
                                  Nom & Prénom du Candidat
                                </th>
                                <th className="p-2 border-r border-slate-800 w-20 text-center">
                                  Classe
                                </th>
                                <th className="p-2 border-r border-slate-800 w-28 text-center">
                                  Aménagement
                                </th>
                                <th className="p-2 border-r border-slate-800 w-36 text-center">
                                  Émargement Entrée
                                </th>
                                <th className="p-2 w-36 text-center">
                                  Remise Copie
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-400">
                              {cands.map((c) => (
                                <tr key={c.id} className="h-10">
                                  <td className="p-2 border-r border-slate-800 font-bold text-center">
                                    {c.tableNumber}
                                  </td>
                                  <td className="p-2 border-r border-slate-800 font-mono text-center">
                                    {c.anonymatNumber}
                                  </td>
                                  <td className="p-2 border-r border-slate-800 font-bold">
                                    {c.lastName} {c.firstName}
                                  </td>
                                  <td className="p-2 border-r border-slate-800 text-center">
                                    {c.className}
                                  </td>
                                  <td className="p-2 border-r border-slate-800 text-[10px] text-center font-semibold text-slate-700">
                                    {c.accommodation || "—"}
                                  </td>
                                  <td className="p-2 border-r border-slate-800"></td>
                                  <td className="p-2"></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Official Footer with signature box */}
                          <div className="mt-6 pt-4 border-t-2 border-slate-800 grid grid-cols-2 gap-4 text-xs">
                            <div className="border border-slate-300 p-3 rounded">
                              <p className="font-bold mb-1">Bilan de la salle :</p>
                              <p>Nombre d'inscrits : {cands.length}</p>
                              <p>Nombre de présents : _______</p>
                              <p>Nombre d'absents : _______</p>
                            </div>
                            <div className="border border-slate-300 p-3 rounded text-right flex flex-col justify-between">
                              <p className="font-bold">
                                Noms et Signatures des Surveillants :
                              </p>
                              <p className="text-slate-400 text-[10px] italic">
                                Signature obligatoire avant le ramassage des copies
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* --- DOCUMENT 2: ÉTIQUETTES DE TABLE (TABLE TENTS) --- */}
              {printDoc === "etiquettes" && (
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    {localCandidates
                      .filter(
                        (c) =>
                          printRoomFilter === "all" || c.roomName === printRoomFilter,
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          className="border-2 border-dashed border-slate-400 p-4 rounded-xl bg-white flex flex-col justify-between h-44 shadow-xs"
                        >
                          <div className="flex items-start justify-between border-b pb-2 border-slate-200">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                {schoolName}
                              </p>
                              <p className="text-xs font-bold text-slate-900">
                                {sessionTitle}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold text-xs">
                              {c.roomName}
                            </span>
                          </div>

                          <div className="my-2 text-center">
                            <h3 className="text-lg font-black text-slate-900 uppercase">
                              {c.lastName} {c.firstName}
                            </h3>
                            <p className="text-xs font-semibold text-slate-600">
                              Division : {c.className}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-xl">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                                Numéro de Table
                              </span>
                              <span className="text-base font-extrabold text-indigo-600 font-mono">
                                {c.tableNumber || "T-01"}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                                Numéro d'Anonymat
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-800">
                                {c.anonymatNumber || "DNB-001"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* --- DOCUMENT 3: LISTES D'AFFICHAGE PORTES DE SALLE --- */}
              {printDoc === "portes" && (
                <div className="space-y-12">
                  {availableRoomsInDispatch
                    .filter((r) => printRoomFilter === "all" || r === printRoomFilter)
                    .map((roomName) => {
                      const cands = [...(candidatesByRoom[roomName] || [])];
                      // Sort alphabetically for door check
                      cands.sort((a, b) => a.lastName.localeCompare(b.lastName));

                      return (
                        <div
                          key={roomName}
                          className="print-page-break border-4 border-slate-900 p-8 rounded-2xl bg-white"
                        >
                          <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {schoolName} • RÉSEAU AEFE
                            </p>
                            <h1 className="text-3xl font-black text-slate-900 uppercase mt-1">
                              {roomName}
                            </h1>
                            <p className="text-sm font-bold text-indigo-600 mt-1">
                              {sessionTitle} — {examDate}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              LISTE DES CANDIDATS ATTENDUS DANS CETTE SALLE (PAR ORDRE ALPHABÉTIQUE)
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                            {cands.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-2 rounded border border-slate-200"
                              >
                                <div className="truncate pr-2">
                                  <span className="font-bold text-slate-900">
                                    {c.lastName} {c.firstName}
                                  </span>{" "}
                                  <span className="text-slate-400">({c.className})</span>
                                </div>
                                <span className="font-mono font-extrabold text-indigo-600 text-xs px-2 py-0.5 rounded bg-indigo-50">
                                  {c.tableNumber}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-500 italic">
                            Les candidats doivent éteindre leurs téléphones portables et montres connectées avant d'entrer en salle d'examen.
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* --- DOCUMENT 4: RÉCAPITULATIF GLOBAL --- */}
              {printDoc === "recapitulatif" && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-base font-extrabold text-slate-900 uppercase">
                      Tableau Récapitulatif Global de Répartition (Direction / Vie Scolaire)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Synthèse des effectifs mobilisés par salle et par division.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        Total Inscrits
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        {stats.totalCandidates}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-xs text-amber-700 uppercase font-semibold">
                        Aménagements / Tiers-Temps
                      </p>
                      <p className="text-2xl font-black text-amber-900">
                        {stats.tiersTempsCount}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <p className="text-xs text-emerald-700 uppercase font-semibold">
                        Salles Mobilisées
                      </p>
                      <p className="text-2xl font-black text-emerald-900">
                        {availableRoomsInDispatch.length}
                      </p>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Salle d'Examen</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-center">Candidats Assignés</th>
                        <th className="py-2.5 px-3 text-center">Classes Représentées</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {availableRoomsInDispatch.map((r) => {
                        const cands = candidatesByRoom[r] || [];
                        const classes = Array.from(
                          new Set(cands.map((c) => c.className)),
                        );
                        const isTiers = cands.some(
                          (c) =>
                            c.accommodation &&
                            c.accommodation.toLowerCase().includes("tiers"),
                        );
                        return (
                          <tr key={r}>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{r}</td>
                            <td className="py-2.5 px-3">
                              {isTiers ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Tiers-Temps
                                </span>
                              ) : (
                                <span className="text-slate-500">Standard</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {cands.length}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                              {classes.join(", ")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center no-print">
              <button
                onClick={() => setCurrentStep(4)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour à la répartition</span>
              </button>
              <Link
                to="/admin"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition inline-flex items-center gap-2"
              >
                <span>Synchroniser et Déployer vers Vercel</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

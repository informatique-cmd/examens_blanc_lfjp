import React, { useState, useMemo } from "react";
import {
  Shuffle,
  Grid,
  School,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users,
  RotateCcw,
  Layers,
  Save,
} from "lucide-react";
import type { CmsCandidate, CmsRoom } from "../../../shared/services/cms-store";

interface OrganizationSectionProps {
  candidates: CmsCandidate[];
  rooms: CmsRoom[];
  onSetCandidates: (candidates: CmsCandidate[]) => void;
  onShowNotification: (msg: string) => void;
}

export default function OrganizationSection({
  candidates,
  rooms,
  onSetCandidates,
  onShowNotification,
}: OrganizationSectionProps) {
  const [dispatchMode, setDispatchMode] = useState<"brassage" | "alphabetique">("brassage");
  const [separateTT, setSeparateTT] = useState<boolean>(true);
  const [anonymatPrefix, setAnonymatPrefix] = useState<string>("DNB-");

  // Summary by class
  const classBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    candidates.forEach((c) => {
      const cls = c.className || "Sans classe";
      map.set(cls, (map.get(cls) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [candidates]);

  // Total capacity of available rooms
  const totalCapacity = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  }, [rooms]);

  // Breakdown by room
  const roomBreakdown = useMemo(() => {
    return rooms.map((r) => {
      const assigned = candidates.filter((c) => c.roomName === r.name);
      const ttCount = assigned.filter((c) => c.accommodation?.includes("1/3")).length;
      return {
        room: r,
        assignedCount: assigned.length,
        ttCount,
        fillRate: r.capacity > 0 ? Math.round((assigned.length / r.capacity) * 100) : 0,
      };
    });
  }, [rooms, candidates]);

  // Main algorithm to dispatch candidates into rooms
  const handleRunDispatch = () => {
    if (candidates.length === 0) {
      alert("Aucun candidat importé. Veuillez d'abord importer des élèves dans le menu Données > Élèves.");
      return;
    }
    if (rooms.length === 0) {
      alert("Aucune salle configurée. Veuillez ajouter des salles dans Données > Salles.");
      return;
    }

    const updatedCandidates: CmsCandidate[] = [];
    const regularCandidates: CmsCandidate[] = [];
    const ttCandidates: CmsCandidate[] = [];

    // Separate regular and tiers-temps students if requested
    candidates.forEach((c) => {
      const isTT =
        Boolean(c.accommodation?.includes("1/3")) ||
        Boolean(c.accommodation?.toLowerCase().includes("tiers")) ||
        c.className.toLowerCase().includes("tt");
      if (separateTT && isTT) {
        ttCandidates.push({ ...c });
      } else {
        regularCandidates.push({ ...c });
      }
    });

    // Sort regular students according to mode
    let sortedRegular: CmsCandidate[] = [];
    if (dispatchMode === "brassage") {
      // Group by class
      const byClass: Record<string, CmsCandidate[]> = {};
      regularCandidates.forEach((c) => {
        const cls = c.className || "Standard";
        if (!byClass[cls]) byClass[cls] = [];
        byClass[cls].push(c);
      });

      // Sort each class alphabetically
      Object.keys(byClass).forEach((k) => {
        byClass[k].sort((a, b) => a.lastName.localeCompare(b.lastName));
      });

      // Interleave round-robin
      const classKeys = Object.keys(byClass);
      let hasMore = true;
      let index = 0;
      while (hasMore) {
        hasMore = false;
        classKeys.forEach((k) => {
          if (byClass[k][index]) {
            sortedRegular.push(byClass[k][index]);
            hasMore = true;
          }
        });
        index++;
      }
    } else {
      // Pure alphabetical
      sortedRegular = [...regularCandidates].sort((a, b) =>
        a.lastName.localeCompare(b.lastName)
      );
    }

    // Identify standard rooms and TT rooms
    const ttRooms = rooms.filter((r) => r.name.toLowerCase().includes("tt") || r.notes?.toLowerCase().includes("tt"));
    const stdRooms = rooms.filter((r) => !ttRooms.includes(r));

    const finalStdRooms = stdRooms.length > 0 ? stdRooms : rooms;
    const finalTtRooms = ttRooms.length > 0 ? ttRooms : [rooms[rooms.length - 1]];

    // 1. Assign TT students into TT rooms
    let currentTTRoomIdx = 0;
    let currentTTTable = 1;
    let globalAnonymatIndex = 101;

    ttCandidates.sort((a, b) => a.lastName.localeCompare(b.lastName));
    ttCandidates.forEach((student) => {
      const room = finalTtRooms[currentTTRoomIdx] || rooms[0];
      student.roomName = room.name;
      student.tableNumber = String(currentTTTable);
      student.anonymatNumber = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
      updatedCandidates.push(student);

      currentTTTable++;
      globalAnonymatIndex++;
      if (currentTTTable > room.capacity && currentTTRoomIdx < finalTtRooms.length - 1) {
        currentTTRoomIdx++;
        currentTTTable = 1;
      }
    });

    // 2. Assign Regular students into Standard rooms
    let currentStdRoomIdx = 0;
    let currentStdTable = 1;

    sortedRegular.forEach((student) => {
      const room = finalStdRooms[currentStdRoomIdx] || rooms[0];
      student.roomName = room.name;
      student.tableNumber = String(currentStdTable);
      student.anonymatNumber = `${anonymatPrefix}${String(globalAnonymatIndex).padStart(4, "0")}`;
      updatedCandidates.push(student);

      currentStdTable++;
      globalAnonymatIndex++;
      if (currentStdTable > room.capacity && currentStdRoomIdx < finalStdRooms.length - 1) {
        currentStdRoomIdx++;
        currentStdTable = 1;
      }
    });

    onSetCandidates(updatedCandidates);
    onShowNotification(
      `🎉 Répartition effectuée avec succès ! ${updatedCandidates.length} élèves répartis dans ${rooms.length} salles.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Algorithme de Répartition
            </span>
            <span className="text-xs text-slate-500">
              Affectation des salles & tables anti-fraude
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            🧩 Répartition & Brassage des Candidats
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Mélange automatique des classes, attribution des numéros de tables (1 à N) et génération des codes d'anonymat.
          </p>
        </div>

        <button
          onClick={handleRunDispatch}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="h-4 w-4" />
          <span>Lancer la Répartition Automatique</span>
        </button>
      </div>

      {/* Options de répartition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Mode */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-[#3498db]" />
            <span>Mode d'agencement des candidats</span>
          </h3>

          <div className="space-y-2">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                dispatchMode === "brassage"
                  ? "border-[#3498db] bg-sky-50/60 ring-1 ring-[#3498db]"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="dispatchMode"
                checked={dispatchMode === "brassage"}
                onChange={() => setDispatchMode("brassage")}
                className="mt-0.5 text-[#3498db] focus:ring-[#3498db]"
              />
              <div>
                <p className="font-bold text-xs text-slate-900">
                  🔀 Brassage Inter-Classes (Recommandé anti-fraude)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Alterne les élèves de chaque classe (3A, 3B, 3C) sur chaque rangée pour empêcher la triche entre camarades de même classe.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                dispatchMode === "alphabetique"
                  ? "border-[#3498db] bg-sky-50/60 ring-1 ring-[#3498db]"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="dispatchMode"
                checked={dispatchMode === "alphabetique"}
                onChange={() => setDispatchMode("alphabetique")}
                className="mt-0.5 text-[#3498db] focus:ring-[#3498db]"
              />
              <div>
                <p className="font-bold text-xs text-slate-900">
                  🔤 Ordre Alphabétique Général
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Répartition séquentielle de A à Z sur l'ensemble de la cohorte.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Card Tiers-Temps & Anonymat */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-600" />
            <span>Salles Tiers-Temps & Numéros d'Anonymat</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={separateTT}
                onChange={(e) => setSeparateTT(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <span>Isoler les élèves Tiers-Temps dans une salle aménagée spécifique</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Préfixe pour les codes d'anonymat
              </label>
              <input
                type="text"
                value={anonymatPrefix}
                onChange={(e) => setAnonymatPrefix(e.target.value)}
                placeholder="Ex: DNB-, BAC-26-"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Exemple généré : {anonymatPrefix}0101, {anonymatPrefix}0102...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Remplissage et répartition actuelle par salle */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <School className="h-4 w-4 text-emerald-600" />
              <span>Remplissage & Attribution des Salles</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Capacité totale : {totalCapacity} places pour {candidates.length} candidats inscrits.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-100 font-bold text-xs text-slate-700">
            {rooms.length} Salles Disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomBreakdown.map(({ room, assignedCount, ttCount, fillRate }) => (
            <div
              key={room.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 hover:bg-white hover:border-[#3498db] transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{room.name}</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {assignedCount} / {room.capacity} places
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    fillRate > 100
                      ? "bg-rose-500"
                      : fillRate > 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(fillRate, 100)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Remplissage : {fillRate}%</span>
                {ttCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                    {ttCount} Tiers-temps
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

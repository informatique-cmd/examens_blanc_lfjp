import React, { useState, useMemo } from "react";
import {
  Accessibility,
  Clock,
  Laptop,
  FileText,
  UserCheck,
  Search,
  Filter,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";
import type { CmsCandidate } from "../../../shared/services/cms-store";

interface DataAmenagementsSectionProps {
  candidates: CmsCandidate[];
  onUpdateCandidate: (id: string, updates: Partial<CmsCandidate>) => void;
  onShowNotification: (msg: string) => void;
}

export default function DataAmenagementsSection({
  candidates,
  onUpdateCandidate,
  onShowNotification,
}: DataAmenagementsSectionProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Extract unique classes
  const classesList = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.className) set.add(c.className);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Candidates who have accommodations or tiers-temps
  const accommodatedStudents = useMemo(() => {
    return candidates.filter((c) => {
      const hasAccom =
        Boolean(c.accommodation && c.accommodation.trim() !== "" && c.accommodation !== "Aucun") ||
        c.className.toLowerCase().includes("tt");
      const matchClass = selectedClass === "all" || c.className === selectedClass;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.lastName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        (c.accommodation && c.accommodation.toLowerCase().includes(q));

      return matchClass && matchSearch;
    });
  }, [candidates, selectedClass, search]);

  const totalTT = candidates.filter(
    (c) => c.accommodation?.includes("1/3") || c.accommodation?.includes("Tiers-temps")
  ).length;

  const totalLaptop = candidates.filter(
    (c) => c.accommodation?.toLowerCase().includes("ordinateur") || c.accommodation?.toLowerCase().includes("pc")
  ).length;

  const totalSecretary = candidates.filter(
    (c) => c.accommodation?.toLowerCase().includes("secrétaire") || c.accommodation?.toLowerCase().includes("scripteur")
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              Inclusion & PAP/PPS
            </span>
            <span className="text-xs text-slate-500">
              Élèves à besoins éducatifs particuliers
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            ♿ Aménagements des Épreuves & Tiers-Temps
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Gestion fine des tiers-temps (+1/3), secrétaires scripteurs, ordinateurs et affectation en salles adaptées.
          </p>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-bold uppercase">Tiers-Temps (+1/3)</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-purple-900">{totalTT} élève(s)</p>
          <p className="text-[11px] text-purple-600 mt-1">Horaires aménagés automatiques</p>
        </div>

        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 shadow-xs">
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-xs font-bold uppercase">Ordinateur / PC</span>
            <Laptop className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-sky-900">{totalLaptop} élève(s)</p>
          <p className="text-[11px] text-sky-600 mt-1">Prise électrique & clé USB</p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-bold uppercase">Secrétaire Scripteur</span>
            <UserCheck className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-amber-900">{totalSecretary} élève(s)</p>
          <p className="text-[11px] text-amber-600 mt-1">Salle isolée requise</p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase">Total Dossiers PAP</span>
            <Accessibility className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">{accommodatedStudents.length} élèves</p>
          <p className="text-[11px] text-emerald-600 mt-1">Sur {candidates.length} candidats</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un élève aménagé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filtrer par classe :</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Toutes les classes ({classesList.length})</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                Classe {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Accommodated Students */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="p-3">Nom & Prénom</th>
                <th className="p-3">Classe</th>
                <th className="p-3">Aménagement Officiel (PAP / PPS)</th>
                <th className="p-3">Salle Attribuée</th>
                <th className="p-3">Numéro Table</th>
                <th className="p-3 text-center">Tiers-Temps (+1/3)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accommodatedStudents.length > 0 ? (
                accommodatedStudents.map((cand) => {
                  const isTT =
                    cand.accommodation?.includes("1/3") ||
                    cand.accommodation?.includes("Tiers-temps") ||
                    cand.accommodation?.includes("Temps");

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900">
                        {cand.lastName.toUpperCase()} {cand.firstName}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 text-[11px]">
                          {cand.className}
                        </span>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={cand.accommodation || ""}
                          onChange={(e) =>
                            onUpdateCandidate(cand.id, { accommodation: e.target.value })
                          }
                          placeholder="Ex: Tiers-temps 1/3, Ordinateur..."
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                          {cand.roomName || "Non affecté"}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {cand.tableNumber ? `Table N° ${cand.tableNumber}` : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const newAccom = isTT ? "Standard" : "Tiers-temps (+1/3)";
                            onUpdateCandidate(cand.id, { accommodation: newAccom });
                            onShowNotification(`Statut tiers-temps mis à jour pour ${cand.lastName}.`);
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                            isTT
                              ? "bg-[#8e44ad] text-white"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          {isTT ? "✓ 1/3 TEMPS" : "Standard"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Aucun élève avec aménagement pour cette sélection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

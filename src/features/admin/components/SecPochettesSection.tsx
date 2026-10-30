import React, { useState, useMemo } from "react";
import {
  FolderArchive,
  Printer,
  FileText,
  School,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { CmsRoom, CmsCandidate, CmsSurveillance, SiteInfo } from "../../../shared/services/cms-store";

interface SecPochettesSectionProps {
  rooms: CmsRoom[];
  candidates: CmsCandidate[];
  surveillances: CmsSurveillance[];
  siteInfo: SiteInfo;
}

export default function SecPochettesSection({
  rooms,
  candidates,
  surveillances,
  siteInfo,
}: SecPochettesSectionProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || "");
  const [selectedDocType, setSelectedDocType] = useState<"emargement" | "consignes" | "pv" | "etiquette">(
    "emargement"
  );

  const currentRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  // Candidates in this room
  const roomCandidates = useMemo(() => {
    if (!currentRoom) return [];
    return candidates
      .filter((c) => c.roomName === currentRoom.name)
      .sort((a, b) => {
        const numA = parseInt(a.tableNumber || "0", 10);
        const numB = parseInt(b.tableNumber || "0", 10);
        return numA - numB;
      });
  }, [candidates, currentRoom]);

  // Surveillants in this room
  const roomSurveillances = useMemo(() => {
    if (!currentRoom) return [];
    return surveillances.filter((s) => s.roomName === currentRoom.name);
  }, [surveillances, currentRoom]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Organisation Matérielle
            </span>
            <span className="text-xs text-slate-500">
              Dossiers & Enveloppes de surveillance
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            📁 Pochettes Surveillants & Émargements
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Génération complète des pochettes d'examen par salle : listes d'émargement officielles, PV et consignes.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer le document officiel</span>
        </button>
      </div>

      {/* Room Selector & Document Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <School className="h-4 w-4 text-[#3498db]" />
          <span className="text-xs font-bold text-slate-700">Choisir la salle :</span>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.building || "Bâtiment principal"}) — Capacité : {r.capacity} places
              </option>
            ))}
          </select>
        </div>

        {/* Document type buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          {[
            { id: "emargement", label: "📋 Feuille d'Émargement" },
            { id: "consignes", label: "📜 Consignes Surveillants" },
            { id: "pv", label: "📝 Procès-Verbal (PV)" },
            { id: "etiquette", label: "🏷️ Étiquette Enveloppe" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDocType(tab.id as any)}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                selectedDocType === tab.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Official Printable Sheet Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 max-w-4xl mx-auto printable-content">
        {/* Document Header with LFJP identity */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              RÉPUBLIQUE FRANÇAISE • RÉSEAU AEFE
            </p>
            <h1 className="text-lg font-black text-slate-900">
              {siteInfo.title || "Lycée Français Jacques Prévert de Saly"}
            </h1>
            <p className="text-xs text-slate-600">
              Organisation des Examens Blancs • Session {siteInfo.schoolYear || "2025-2026"}
            </p>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded bg-slate-900 text-white font-black text-sm tracking-widest uppercase">
              {currentRoom?.name || "SALLE"}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Capacité : {currentRoom?.capacity} places
            </p>
          </div>
        </div>

        {/* CONTENT BASED ON DOCUMENT TYPE */}
        {selectedDocType === "emargement" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  LISTE OFFICIELLE D'ÉMARGEMENT DES CANDIDATS
                </h3>
                <p className="text-xs text-slate-500">
                  Vérifier l'identité du candidat avant émargement. Aucun départ anticipé avant 1h d'épreuve.
                </p>
              </div>
              <span className="px-2 py-1 rounded bg-slate-200 text-slate-800 text-xs font-bold font-mono">
                {roomCandidates.length} Candidat(s)
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th className="p-2 border-r border-slate-300 text-center w-12">Table</th>
                  <th className="p-2 border-r border-slate-300">Nom & Prénom</th>
                  <th className="p-2 border-r border-slate-300 text-center w-16">Classe</th>
                  <th className="p-2 border-r border-slate-300 text-center w-24">Aménagement</th>
                  <th className="p-2 border-r border-slate-300 text-center w-28">N° Anonymat</th>
                  <th className="p-2 text-center w-36">Signature Candidat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roomCandidates.length > 0 ? (
                  roomCandidates.map((cand, idx) => (
                    <tr key={cand.id} className="h-10">
                      <td className="p-2 border-r border-slate-200 text-center font-bold font-mono">
                        {cand.tableNumber || idx + 1}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                        {cand.lastName.toUpperCase()} {cand.firstName}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">
                        {cand.className}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        {cand.accommodation?.includes("1/3") ? (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                            1/3 Temps
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px] text-slate-600">
                        {cand.anonymatNumber || `A-${idx + 101}`}
                      </td>
                      <td className="p-2 border-slate-200 bg-slate-50/30"></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Aucun candidat affecté dans cette salle pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Bottom Signatures for Surveillants */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 mt-6 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 h-28 flex flex-col justify-between">
                <p className="font-bold text-slate-800">Nom & Signature du Surveillant 1 :</p>
                <div className="border-b border-dashed border-slate-300"></div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 h-28 flex flex-col justify-between">
                <p className="font-bold text-slate-800">Nom & Signature du Surveillant 2 :</p>
                <div className="border-b border-dashed border-slate-300"></div>
              </div>
            </div>
          </div>
        )}

        {selectedDocType === "consignes" && (
          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
              CONSIGNES OFFICIELLES POUR LES SURVEILLANTS DE SALLE
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <p className="font-bold">1. Arrivée et ouverture de la salle</p>
                <p>
                  Les surveillants doivent être présents 20 minutes avant le début de l'épreuve.
                  Vérifier l'aération, le tableau blanc propre et la disposition des tables (1 candidat par table).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900">2. Appel & Émargement</p>
                <p>
                  Faire entrer les élèves un à un en contrôlant la convocation et la pièce d'identité avec photo.
                  Les téléphones portables et montres connectées doivent être totalement éteints et déposés dans les sacs au fond de la salle.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900">3. Mode Examen pour les calculatrices</p>
                <p>
                  Si la calculatrice est autorisée pour l'épreuve, le voyant lumineux clignotant du mode examen est strictement obligatoire.
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900">
                <p className="font-bold">4. Gestion des Tiers-Temps (+1/3 temps)</p>
                <p>
                  Les élèves bénéficiant d'aménagements officiels disposent du temps majoré d'un tiers.
                  Ils continuent de composer calmement après la sortie des candidats standards.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                <p className="font-bold">5. Ramassage et comptage des copies</p>
                <p>
                  Compter le nombre de copies collectées devant les candidats avant de les autoriser à quitter la salle.
                  Remettre immédiatement la pochette complète au secrétariat de direction.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedDocType === "pv" && (
          <div className="space-y-4 text-xs text-slate-800">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
              PROCÈS-VERBAL DE DÉROULEMENT DES ÉPREUVES (PV)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold">Établissement : {siteInfo.title}</p>
                <p>Date : {new Date().toLocaleDateString("fr-FR")}</p>
                <p>Salle : {currentRoom?.name}</p>
              </div>
              <div className="text-right">
                <p>Nombre d'inscrits : {roomCandidates.length}</p>
                <p>Nombre de présents : _______</p>
                <p>Nombre d'absents : _______</p>
              </div>
            </div>

            <div className="mt-4 border border-slate-300 rounded-lg p-3 space-y-2">
              <p className="font-bold">Incidents constatés (retards, malaise, tentative de fraude) :</p>
              <div className="h-32 border border-dashed border-slate-200 rounded p-2 text-slate-400">
                R.A.S si aucun incident.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 mt-6">
              <div>
                <p className="font-bold">Signatures des surveillants :</p>
                <div className="h-20 border-b border-slate-400"></div>
              </div>
              <div>
                <p className="font-bold">Visa du Chef d'Établissement :</p>
                <div className="h-20 border-b border-slate-400"></div>
              </div>
            </div>
          </div>
        )}

        {selectedDocType === "etiquette" && (
          <div className="p-6 border-4 border-dashed border-slate-300 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-900 text-white">
              POCHETTE COPIES SURVEILLANCE
            </span>
            <h2 className="text-2xl font-black text-slate-900">{currentRoom?.name}</h2>
            <p className="text-sm font-semibold text-slate-600">
              {siteInfo.title || "LFJP Saly"} • Session {siteInfo.schoolYear || "2025-2026"}
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold">Nombre de copies attendues : {roomCandidates.length}</p>
              <p className="text-slate-500 mt-1">À remettre scellé au secrétariat des examens.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

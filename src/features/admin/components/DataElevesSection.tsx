import React, { useState, useMemo } from "react";
import {
  Download,
  Upload,
  ClipboardPaste,
  User,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  X,
  Clock,
  Accessibility,
} from "lucide-react";
import type { CmsCandidate, CmsRoom } from "../../../shared/services/cms-store";
import {
  downloadCsvTemplate,
  parsePronoteElevesCsv,
} from "../../../shared/services/pronote-csv-service";

interface DataElevesSectionProps {
  candidates: CmsCandidate[];
  rooms?: CmsRoom[];
  onSetCandidates: (candidates: CmsCandidate[]) => void;
  onAddCandidate: (candidate: Omit<CmsCandidate, "id">) => void;
  onUpdateCandidate: (id: string, updates: Partial<CmsCandidate>) => void;
  onDeleteCandidate: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function DataElevesSection({
  candidates,
  rooms = [],
  onSetCandidates,
  onAddCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
  onShowNotification,
}: DataElevesSectionProps) {
  // UI states
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CmsCandidate | null>(null);

  // Import state
  const [pasteText, setPasteText] = useState("");
  const [importMode, setImportMode] = useState<"replace" | "append">("append");
  const [importError, setImportError] = useState<string | null>(null);

  // Manual Form State
  const [formLastName, setFormLastName] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formClass, setFormClass] = useState("3A");
  const [formAccommodation, setFormAccommodation] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formTable, setFormTable] = useState("");

  // Unique classes
  const classesList = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.className) set.add(c.className);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchClass = selectedClass === "all" || c.className === selectedClass;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.lastName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.className.toLowerCase().includes(q) ||
        (c.roomName && c.roomName.toLowerCase().includes(q));

      return matchClass && matchSearch;
    });
  }, [candidates, selectedClass, search]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCsvData(content);
    };
    reader.readAsText(file, "UTF-8");
  };

  const processCsvData = (rawText: string) => {
    setImportError(null);
    const res = parsePronoteElevesCsv(rawText);

    if (!res.success || res.data.length === 0) {
      setImportError(res.error || "Impossible de lire le fichier Pronote. Vérifiez le format.");
      return;
    }

    if (importMode === "replace") {
      onSetCandidates(res.data);
      onShowNotification(`🎉 ${res.count} élèves importés avec succès depuis Pronote (liste remplacée) !`);
    } else {
      // Append only unique
      const existingNames = new Set(candidates.map((c) => `${c.lastName}_${c.firstName}_${c.className}`));
      const newItems = res.data.filter((c) => !existingNames.has(`${c.lastName}_${c.firstName}_${c.className}`));
      onSetCandidates([...candidates, ...newItems]);
      onShowNotification(`🎉 ${newItems.length} nouveaux élèves ajoutés depuis Pronote (${res.count - newItems.length} doublons ignorés) !`);
    }

    setShowImportModal(false);
    setPasteText("");
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLastName.trim()) {
      alert("Veuillez renseigner le nom de l'élève.");
      return;
    }

    if (editingCandidate) {
      onUpdateCandidate(editingCandidate.id, {
        lastName: formLastName.toUpperCase().trim(),
        firstName: formFirstName.trim(),
        className: formClass.trim(),
        accommodation: formAccommodation.trim(),
        roomName: formRoom.trim(),
        tableNumber: formTable.trim(),
      });
      onShowNotification(`Élève ${formLastName} mis à jour avec succès.`);
    } else {
      onAddCandidate({
        lastName: formLastName.toUpperCase().trim(),
        firstName: formFirstName.trim(),
        className: formClass.trim(),
        examName: "DNB Blanc / Bac Blanc",
        roomName: formRoom.trim(),
        convocationTime: "07h45",
        accommodation: formAccommodation.trim(),
        tableNumber: formTable.trim(),
      });
      onShowNotification(`Élève ${formLastName} ajouté avec succès.`);
    }

    setEditingCandidate(null);
    setShowManualModal(false);
    setFormLastName("");
    setFormFirstName("");
    setFormAccommodation("");
  };

  const openEditModal = (c: CmsCandidate) => {
    setEditingCandidate(c);
    setFormLastName(c.lastName);
    setFormFirstName(c.firstName);
    setFormClass(c.className);
    setFormAccommodation(c.accommodation || "");
    setFormRoom(c.roomName || "");
    setFormTable(c.tableNumber || "");
    setShowManualModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
              Pronote & Base Élèves
            </span>
            <span className="text-xs text-slate-500">
              Gestion de la cohorte des candidats
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            👤 Élèves & Import Pronote
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Téléchargez le modèle Pronote, importez votre fichier CSV ou collez directement la liste pour alimenter la plateforme.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => downloadCsvTemplate("eleves")}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Télécharger le modèle de fichier CSV type Pronote avec en-têtes et exemples"
          >
            <Download className="h-4 w-4 text-[#3498db]" />
            <span>Modèle CSV Pronote</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 rounded-xl bg-[#27ae60] hover:bg-[#219653] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="h-4 w-4" />
            <span>Importer depuis Pronote</span>
          </button>

          <button
            onClick={() => {
              setEditingCandidate(null);
              setFormLastName("");
              setFormFirstName("");
              setFormAccommodation("");
              setShowManualModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Ajout manuel</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Total Candidats</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{candidates.length}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Divisions / Classes</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{classesList.length}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-purple-700">Tiers-Temps (+1/3)</p>
          <p className="text-xl font-black text-purple-900 mt-0.5">
            {candidates.filter((c) => c.accommodation?.includes("1/3") || c.accommodation?.includes("Tiers")).length}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-emerald-700">Salles Assignées</p>
          <p className="text-xl font-black text-emerald-900 mt-0.5">
            {candidates.filter((c) => Boolean(c.roomName)).length} / {candidates.length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou salle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Classe :</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="all">Toutes les classes ({candidates.length})</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                Classe {cls} ({candidates.filter((c) => c.className === cls).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Candidates */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 w-14 text-center">N°</th>
                <th className="p-3">Nom & Prénom</th>
                <th className="p-3 text-center">Classe</th>
                <th className="p-3">Aménagement Pronote</th>
                <th className="p-3">Salle Affectée</th>
                <th className="p-3 text-center">Table</th>
                <th className="p-3 text-center">Anonymat</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand, idx) => {
                  const isTT =
                    cand.accommodation?.includes("1/3") ||
                    cand.accommodation?.toLowerCase().includes("tiers");
                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {cand.lastName.toUpperCase()} {cand.firstName}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 text-[11px]">
                          {cand.className}
                        </span>
                      </td>
                      <td className="p-3">
                        {cand.accommodation ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                              isTT
                                ? "bg-[#8e44ad] text-white"
                                : "bg-[#e67e22] text-white"
                            }`}
                          >
                            <Accessibility className="h-3 w-3" />
                            <span>{cand.accommodation}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {cand.roomName ? (
                          <span className="font-semibold text-slate-800">
                            {cand.roomName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Non assignée (Voir Répartition)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {cand.tableNumber ? `N° ${cand.tableNumber}` : "—"}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 text-[11px]">
                        {cand.anonymatNumber || "—"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(cand)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[#3498db] transition"
                            title="Modifier l'élève"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer l'élève ${cand.lastName} ${cand.firstName} ?`)) {
                                onDeleteCandidate(cand.id);
                                onShowNotification(`Élève ${cand.lastName} supprimé.`);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Supprimer l'élève"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    Aucun élève trouvé. Utilisez le bouton « Importer depuis Pronote » pour ajouter votre promotion.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL IMPORT PRONOTE CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in">
            <div className="p-5 bg-[#2c3e50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-base">Importation des Élèves depuis Pronote</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Step 1 : Template button */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Besoin du format officiel Pronote ?</p>
                  <p className="text-slate-500 text-[11px]">
                    Colonnes reconnues : Nom, Prénom, Classe, Sexe, DateNaissance, Aménagement
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCsvTemplate("eleves")}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold transition flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-[#3498db]" />
                  <span>Télécharger Modèle CSV</span>
                </button>
              </div>

              {/* Mode choice : Replace or Append */}
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700">Mode d'import :</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "append"}
                    onChange={() => setImportMode("append")}
                    className="text-[#3498db]"
                  />
                  <span>Ajouter aux {candidates.length} élèves existants</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-rose-700">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="text-rose-600"
                  />
                  <span>Remplacer toute la liste</span>
                </label>
              </div>

              {/* Method A : File Upload */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-[#3498db] transition">
                <input
                  type="file"
                  accept=".csv,.txt"
                  id="fileInputEleves"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="fileInputEleves"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="h-6 w-6 text-[#3498db]" />
                  <span className="font-bold text-slate-800">
                    Sélectionnez votre fichier export Pronote (.CSV ou .TXT)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Glissez votre fichier ici ou cliquez pour parcourir
                  </span>
                </label>
              </div>

              {/* Method B : Direct Paste */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Ou collez directement les données copiées depuis Pronote (Ctrl+V) :</span>
                  <span className="text-slate-400 text-[11px] font-normal">Séparateur auto (; ou tab)</span>
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Exemple :
DIOP;Moussa;3A;M;12/04/2011;;3EME
FALL;Fatou;3A;F;05/09/2011;Tiers-temps;3EME"
                  rows={4}
                  className="w-full p-2.5 font-mono text-[11px] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#3498db]"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!pasteText.trim()}
                onClick={() => processCsvData(pasteText)}
                className="px-5 py-2 rounded-xl bg-[#27ae60] hover:bg-[#219653] disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Valider et Importer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL ADD / EDIT */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="p-4 bg-[#2c3e50] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCandidate ? "Modifier l'élève" : "Ajouter un élève"}
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom de famille *</label>
                <input
                  type="text"
                  required
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="Ex: DIOP"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="Ex: Moussa"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classe / Division</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="Ex: 3A, 1ère, TLE"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Table N°</label>
                  <input
                    type="text"
                    value={formTable}
                    onChange={(e) => setFormTable(e.target.value)}
                    placeholder="Ex: 12"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Aménagement officiel (PAP / PPS / Tiers-Temps)
                </label>
                <input
                  type="text"
                  value={formAccommodation}
                  onChange={(e) => setFormAccommodation(e.target.value)}
                  placeholder="Ex: Tiers-temps (+1/3 temps), Ordinateur..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3498db] hover:bg-[#2980b9] text-white font-bold transition shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

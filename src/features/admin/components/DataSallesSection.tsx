import React, { useState, useMemo } from "react";
import {
  School,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  X,
  Building,
  Users,
} from "lucide-react";
import type { CmsRoom } from "../../../shared/services/cms-store";
import {
  downloadCsvTemplate,
  parsePronoteSallesCsv,
} from "../../../shared/services/pronote-csv-service";

interface DataSallesSectionProps {
  rooms: CmsRoom[];
  onSetRooms: (rooms: CmsRoom[]) => void;
  onAddRoom: (room: Omit<CmsRoom, "id">) => void;
  onUpdateRoom: (id: string, updates: Partial<CmsRoom>) => void;
  onDeleteRoom: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function DataSallesSection({
  rooms,
  onSetRooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onShowNotification,
}: DataSallesSectionProps) {
  const [search, setSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<CmsRoom | null>(null);

  // Import state
  const [pasteText, setPasteText] = useState("");
  const [importMode, setImportMode] = useState<"replace" | "append">("append");
  const [importError, setImportError] = useState<string | null>(null);

  // Manual Form State
  const [formName, setFormName] = useState("");
  const [formCapacity, setFormCapacity] = useState(30);
  const [formBuilding, setFormBuilding] = useState("Bâtiment Principal");
  const [formNotes, setFormNotes] = useState("");

  const totalCapacity = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const q = search.toLowerCase().trim();
      return (
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.building && r.building.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    });
  }, [rooms, search]);

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
    const res = parsePronoteSallesCsv(rawText);

    if (!res.success || res.data.length === 0) {
      setImportError(res.error || "Impossible de lire le fichier des salles. Vérifiez le format.");
      return;
    }

    if (importMode === "replace") {
      onSetRooms(res.data);
      onShowNotification(`🎉 ${res.count} salles importées avec succès depuis Pronote / EDT !`);
    } else {
      const existingNames = new Set(rooms.map((r) => r.name.toLowerCase().trim()));
      const newItems = res.data.filter((r) => !existingNames.has(r.name.toLowerCase().trim()));
      onSetRooms([...rooms, ...newItems]);
      onShowNotification(`🎉 ${newItems.length} nouvelles salles ajoutées (${res.count - newItems.length} doublons ignorés) !`);
    }

    setShowImportModal(false);
    setPasteText("");
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Veuillez renseigner le nom de la salle.");
      return;
    }

    if (editingRoom) {
      onUpdateRoom(editingRoom.id, {
        name: formName.trim(),
        capacity: Number(formCapacity) || 30,
        building: formBuilding.trim(),
        notes: formNotes.trim(),
      });
      onShowNotification(`Salle ${formName} mise à jour avec succès.`);
    } else {
      onAddRoom({
        name: formName.trim(),
        capacity: Number(formCapacity) || 30,
        building: formBuilding.trim(),
        notes: formNotes.trim(),
      });
      onShowNotification(`Salle ${formName} ajoutée avec succès.`);
    }

    setEditingRoom(null);
    setShowManualModal(false);
    setFormName("");
    setFormNotes("");
  };

  const openEditModal = (r: CmsRoom) => {
    setEditingRoom(r);
    setFormName(r.name);
    setFormCapacity(r.capacity);
    setFormBuilding(r.building || "Bâtiment Principal");
    setFormNotes(r.notes || "");
    setShowManualModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Salles & Espaces Pronote
            </span>
            <span className="text-xs text-slate-500">
              Jauges et capacités d'accueil
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            🏫 Salles d'Examen & Espaces
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Téléchargez le modèle Pronote pour récupérer vos salles de classe ou importez votre fichier CSV.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => downloadCsvTemplate("salles")}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Télécharger le modèle de fichier CSV type Pronote/EDT pour les salles"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Modèle CSV Salles</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 rounded-xl bg-[#27ae60] hover:bg-[#219653] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="h-4 w-4" />
            <span>Importer les Salles</span>
          </button>

          <button
            onClick={() => {
              setEditingRoom(null);
              setFormName("");
              setFormCapacity(30);
              setFormNotes("");
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Total Salles Mobilisées</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{rooms.length} salles</p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Capacité Totale d'Accueil</p>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{totalCapacity} places</p>
        </div>
        <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-purple-700">Salles Tiers-Temps Dédiées</p>
          <p className="text-xl font-black text-purple-900 mt-0.5">
            {rooms.filter((r) => r.name.toLowerCase().includes("tt") || r.notes?.toLowerCase().includes("tt")).length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une salle par nom ou bâtiment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table of Rooms */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 w-16 text-center">N°</th>
                <th className="p-3">Nom de la Salle</th>
                <th className="p-3 text-center">Capacité (Places)</th>
                <th className="p-3">Bâtiment / Étage</th>
                <th className="p-3">Spécificité / Aménagement</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room, idx) => {
                  const isTT =
                    room.name.toLowerCase().includes("tt") ||
                    room.notes?.toLowerCase().includes("tiers") ||
                    room.notes?.toLowerCase().includes("tt");
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <School className="h-4 w-4 text-emerald-600" />
                        <span>{room.name}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {room.capacity} places
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {room.building || "Bâtiment Principal"}
                      </td>
                      <td className="p-3">
                        {isTT ? (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                            ♿ Salle Aménagée (Tiers-temps)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">{room.notes || "Salle standard"}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(room)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[#3498db] transition"
                            title="Modifier la salle"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer définitivement la salle ${room.name} ?`)) {
                                onDeleteRoom(room.id);
                                onShowNotification(`Salle ${room.name} supprimée.`);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Supprimer la salle"
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
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                    Aucune salle trouvée. Utilisez le bouton « Importer les Salles » pour importer vos salles depuis Pronote/EDT.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL IMPORT SALLES CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in">
            <div className="p-5 bg-[#2c3e50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-base">Importation des Salles depuis Pronote / EDT</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Format officiel Pronote / EDT</p>
                  <p className="text-slate-500 text-[11px]">
                    Colonnes reconnues : Nom Salle, Capacité, Bâtiment, Remarques
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCsvTemplate("salles")}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold transition flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Télécharger Modèle CSV</span>
                </button>
              </div>

              {/* Mode choice */}
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700">Mode d'import :</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="importModeRooms"
                    checked={importMode === "append"}
                    onChange={() => setImportMode("append")}
                    className="text-[#3498db]"
                  />
                  <span>Ajouter aux {rooms.length} salles existantes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-rose-700">
                  <input
                    type="radio"
                    name="importModeRooms"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="text-rose-600"
                  />
                  <span>Remplacer toute la liste</span>
                </label>
              </div>

              {/* File upload */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-500 transition">
                <input
                  type="file"
                  accept=".csv,.txt"
                  id="fileInputSalles"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="fileInputSalles"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="h-6 w-6 text-emerald-600" />
                  <span className="font-bold text-slate-800">
                    Sélectionnez votre fichier export des salles Pronote / EDT
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Format CSV avec séparateur point-virgule ou tabulation
                  </span>
                </label>
              </div>

              {/* Paste textarea */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Ou collez directement le texte copié depuis Pronote :</span>
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Nom Salle;Capacité;Bâtiment;Aménagement Tiers-Temps
Salle 101;28;Bâtiment Principal;Non
Salle TT-1;12;Bâtiment B;Oui"
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
                {editingRoom ? "Modifier la salle" : "Ajouter une salle"}
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
                <label className="block font-bold text-slate-700 mb-1">Nom de la salle *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Salle 101, Labo SVT..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacité (Places) *</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bâtiment / Zone</label>
                  <input
                    type="text"
                    value={formBuilding}
                    onChange={(e) => setFormBuilding(e.target.value)}
                    placeholder="Ex: Principal, Bât B"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3498db]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Remarques / Aménagements Tiers-Temps
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Salle Tiers-temps, Prises PC..."
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

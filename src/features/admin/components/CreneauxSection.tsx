import React, { useState, useMemo } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  School,
} from "lucide-react";
import type {
  CmsExamSlot,
  CmsExam,
  CmsRoom,
  CmsSurveillance,
} from "../../../shared/services/cms-store";

interface CreneauxSectionProps {
  examSlots: CmsExamSlot[];
  exams: CmsExam[];
  rooms: CmsRoom[];
  surveillances: CmsSurveillance[];
  onAddExamSlot: (slot: Omit<CmsExamSlot, "id">) => void;
  onUpdateExamSlot: (id: string, updates: Partial<CmsExamSlot>) => void;
  onDeleteExamSlot: (id: string) => void;
  onShowNotification: (msg: string) => void;
}

export default function CreneauxSection({
  examSlots,
  exams,
  rooms,
  surveillances,
  onAddExamSlot,
  onUpdateExamSlot,
  onDeleteExamSlot,
  onShowNotification,
}: CreneauxSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Form state
  const [formExamTitle, setFormExamTitle] = useState<string>(exams[0]?.title || "DNB blanc");
  const [formSubject, setFormSubject] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formStartTime, setFormStartTime] = useState<string>("08:00");
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(90);
  const [formTargetLevel, setFormTargetLevel] = useState<string>("3ème");
  const [formSelectedRooms, setFormSelectedRooms] = useState<string[]>(rooms.map((r) => r.name));
  const [formNotes, setFormNotes] = useState<string>("");

  // Filter state
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>("all");

  // Calculate End Time given Start Time & Duration
  const calculateEndTime = (start: string, durationMin: number): string => {
    const [hStr, mStr] = start.split(":");
    const h = parseInt(hStr || "0", 10);
    const m = parseInt(mStr || "0", 10);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  // Auto-calculated tiers-temps (+1/3 rounded up to nearest 5 or standard)
  const formEndTime = useMemo(() => {
    return calculateEndTime(formStartTime, formDurationMinutes);
  }, [formStartTime, formDurationMinutes]);

  const formTiersTempsDuration = useMemo(() => {
    return Math.round(formDurationMinutes * (4 / 3));
  }, [formDurationMinutes]);

  const formTiersTempsEndTime = useMemo(() => {
    return calculateEndTime(formStartTime, formTiersTempsDuration);
  }, [formStartTime, formTiersTempsDuration]);

  // Open modal for new slot
  const handleOpenNewModal = () => {
    setEditingSlotId(null);
    setFormExamTitle(exams[0]?.title || "DNB blanc");
    setFormSubject("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormStartTime("08:00");
    setFormDurationMinutes(90);
    setFormTargetLevel("3ème");
    setFormSelectedRooms(rooms.map((r) => r.name));
    setFormNotes("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (slot: CmsExamSlot) => {
    setEditingSlotId(slot.id);
    setFormExamTitle(slot.examTitle);
    setFormSubject(slot.subject);
    setFormDate(slot.date);
    setFormStartTime(slot.startTime);
    setFormDurationMinutes(slot.durationMinutes);
    setFormTargetLevel(slot.targetLevel || "3ème");
    setFormSelectedRooms(slot.roomNames || rooms.map((r) => r.name));
    setFormNotes(slot.notes || "");
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmitSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) {
      alert("Veuillez indiquer le nom de l'épreuve ou de la discipline.");
      return;
    }

    const payload: Omit<CmsExamSlot, "id"> = {
      examTitle: formExamTitle,
      subject: formSubject.trim(),
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      durationMinutes: formDurationMinutes,
      tiersTempsEndTime: formTiersTempsEndTime,
      tiersTempsDurationMinutes: formTiersTempsDuration,
      targetLevel: formTargetLevel,
      roomNames: formSelectedRooms.length > 0 ? formSelectedRooms : rooms.map((r) => r.name),
      notes: formNotes.trim(),
    };

    if (editingSlotId) {
      onUpdateExamSlot(editingSlotId, payload);
      onShowNotification("Créneau d'épreuve modifié avec succès !");
    } else {
      onAddExamSlot(payload);
      onShowNotification("Nouveau créneau d'épreuve programmé avec succès !");
    }

    setIsModalOpen(false);
  };

  // Toggle a room in room selection
  const handleToggleRoom = (roomName: string) => {
    if (formSelectedRooms.includes(roomName)) {
      setFormSelectedRooms(formSelectedRooms.filter((r) => r !== roomName));
    } else {
      setFormSelectedRooms([...formSelectedRooms, roomName]);
    }
  };

  // Distinct dates for filtering
  const distinctDates = useMemo(() => {
    const set = new Set<string>();
    examSlots.forEach((s) => {
      if (s.date) set.add(s.date);
    });
    return Array.from(set).sort();
  }, [examSlots]);

  // Filtered and chronologically sorted slots
  const filteredSlots = useMemo(() => {
    return examSlots
      .filter((s) => {
        const matchDate = selectedDateFilter === "all" || s.date === selectedDateFilter;
        const matchExam = selectedExamFilter === "all" || s.examTitle === selectedExamFilter;
        return matchDate && matchExam;
      })
      .sort((a, b) => {
        const dateCompare = (a.date || "").localeCompare(b.date || "");
        if (dateCompare !== 0) return dateCompare;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
  }, [examSlots, selectedDateFilter, selectedExamFilter]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, CmsExamSlot[]>();
    filteredSlots.forEach((slot) => {
      const d = slot.date || "Date non définie";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(slot);
    });
    return Array.from(map.entries());
  }, [filteredSlots]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Étape 3 • Calendrier des Épreuves
            </span>
            <span className="text-xs text-slate-500">
              Horaires, épreuves et tiers-temps
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <span>🕒 Créneaux des Épreuves & Programmation</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Définissez les dates, heures de début et fin de chaque épreuve. Le calcul de la majoration Tiers-Temps (+1/3) est automatisé.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Programmer une Épreuve</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Créneaux Totaux</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{examSlots.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Jours d'épreuves</p>
          <p className="text-2xl font-bold text-indigo-600 mt-0.5">{distinctDates.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Salles Mobilisées</p>
          <p className="text-2xl font-bold text-emerald-600 mt-0.5">{rooms.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Surveillances Liées</p>
          <p className="text-2xl font-bold text-purple-600 mt-0.5">{surveillances.length}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filtrer par Jour :</span>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous les jours ({distinctDates.length})</option>
              {distinctDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Examen :</span>
            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Toutes les sessions</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.title}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Affichage : <strong>{filteredSlots.length}</strong> créneau(x)
        </span>
      </div>

      {/* Chronological Slot Listing grouped by Date */}
      <div className="space-y-6">
        {slotsByDate.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <Clock className="h-10 w-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">Aucun créneau d'épreuve programmé pour l'instant.</p>
            <p className="text-xs text-slate-500">
              Cliquez sur "Programmer une Épreuve" ci-dessus pour planifier les dates et horaires.
            </p>
          </div>
        ) : (
          slotsByDate.map(([dateStr, slots]) => (
            <div key={dateStr} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Date Header */}
              <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-sm text-slate-900">
                    {dateStr}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                    {slots.length} épreuve(s)
                  </span>
                </div>
              </div>

              {/* Slots Table */}
              <div className="divide-y divide-slate-100">
                {slots.map((slot) => {
                  // Surveillances tied to this slot
                  const tiedSurvs = surveillances.filter(
                    (s) =>
                      s.date === slot.date &&
                      (s.timeSlot.includes(slot.startTime) || (slot.id && s.slotId === slot.id))
                  );
                  const roomCoverage = slot.roomNames?.length || rooms.length;
                  const coveredCount = tiedSurvs.length;

                  return (
                    <div
                      key={slot.id}
                      className="p-5 hover:bg-slate-50/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {slot.subject}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {slot.examTitle}
                          </span>
                          {slot.targetLevel && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              Niveau {slot.targetLevel}
                            </span>
                          )}
                        </div>

                        {/* Schedules */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase">Standard ({slot.durationMinutes} min)</p>
                              <p className="font-mono font-bold text-slate-800">
                                {slot.startTime} ➔ {slot.endTime}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/70 border border-purple-200">
                            <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <div>
                              <p className="text-[10px] text-purple-700 font-semibold uppercase">
                                Tiers-Temps +1/3 ({slot.tiersTempsDurationMinutes || Math.round(slot.durationMinutes * 4 / 3)} min)
                              </p>
                              <p className="font-mono font-bold text-purple-900">
                                {slot.startTime} ➔ {slot.tiersTempsEndTime || calculateEndTime(slot.startTime, Math.round(slot.durationMinutes * 4 / 3))}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                            <School className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-[10px] text-emerald-700 font-semibold uppercase">
                                Surveillance Salles
                              </p>
                              <p className="font-bold text-emerald-900">
                                {coveredCount} / {roomCoverage} salle(s) couverte(s)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Mobilized Rooms chips */}
                        {slot.roomNames && slot.roomNames.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-slate-400 font-semibold mr-1">
                              Salles mobilisées :
                            </span>
                            {slot.roomNames.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}

                        {slot.notes && (
                          <p className="text-[11px] text-slate-500 italic">
                            Consigne : {slot.notes}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(slot)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Modifier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer le créneau "${slot.subject}" du ${slot.date} ?`)) {
                              onDeleteExamSlot(slot.id);
                              onShowNotification("Créneau supprimé.");
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Supprimer ce créneau"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Program / Edit Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingSlotId ? "Modifier le créneau d'épreuve" : "Programmer une nouvelle épreuve"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSlot} className="space-y-4 pt-4">
              {/* Exam title & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Examen de rattachement
                  </label>
                  <select
                    value={formExamTitle}
                    onChange={(e) => setFormExamTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.title}>
                        {ex.title}
                      </option>
                    ))}
                    <option value="DNB blanc">DNB blanc (Collège)</option>
                    <option value="Baccalauréat blanc">Baccalauréat blanc (Lycée)</option>
                    <option value="Devoir Commun">Devoir Commun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Niveau scolaire ciblé
                  </label>
                  <select
                    value={formTargetLevel}
                    onChange={(e) => setFormTargetLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="3ème">3ème (DNB Collège)</option>
                    <option value="1ère">1ère (Baccalauréat EAF)</option>
                    <option value="Terminale">Terminale (Baccalauréat)</option>
                    <option value="Tous niveaux">Tous niveaux</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discipline / Intitulé précis de l'épreuve *
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Ex: Français (Grammaire, Dictée & Compréhension), Mathématiques..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date, Start time, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date de l'épreuve
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heure de début (Appel)
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durée standard (minutes)
                  </label>
                  <select
                    value={formDurationMinutes}
                    onChange={(e) => setFormDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={60}>1h00 (60 min - Sciences)</option>
                    <option value={90}>1h30 (90 min - Français partie)</option>
                    <option value={120}>2h00 (120 min - Maths / HG)</option>
                    <option value={180}>3h00 (180 min)</option>
                    <option value={210}>3h30 (210 min - Spécialités)</option>
                    <option value={240}>4h00 (240 min - EAF / Philo)</option>
                  </select>
                </div>
              </div>

              {/* Automated calculation summary banner */}
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700">Horaires Standard</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {formStartTime} ➔ {formEndTime} ({formDurationMinutes} min)
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-700">
                    Horaires Tiers-Temps (+1/3 automatique)
                  </span>
                  <p className="font-mono font-bold text-purple-900 mt-0.5">
                    {formStartTime} ➔ {formTiersTempsEndTime} ({formTiersTempsDuration} min)
                  </p>
                </div>
              </div>

              {/* Salles mobilisées */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Salles d'examen mobilisées pour cette épreuve :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs max-h-36 overflow-y-auto">
                  {rooms.map((room) => {
                    const isChecked = formSelectedRooms.includes(room.name);
                    return (
                      <label
                        key={room.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition ${
                          isChecked ? "bg-white border border-indigo-300 font-bold text-indigo-900" : "text-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRoom(room.name)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{room.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes / Consignes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consignes particulières (matériel, calculatrice, dictionnaire)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Calculatrices autorisées en mode examen, compas obligatoire..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                >
                  {editingSlotId ? "Enregistrer les modifications" : "Programmer ce créneau"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

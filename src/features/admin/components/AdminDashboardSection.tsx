import React from "react";
import {
  Users,
  School,
  Calendar,
  Shield,
  Printer,
  Bell,
  Eye,
  ExternalLink,
  Compass,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  DoorOpen,
  Layers,
} from "lucide-react";
import type {
  CmsCandidate,
  CmsRoom,
  CmsTeacher,
  CmsExam,
  CmsExamSlot,
  CmsSurveillance,
  SiteInfo,
  CmsAnnouncement,
} from "../../../shared/services/cms-store";
import type { AdminSection } from "./AdminSidebar";

interface AdminDashboardSectionProps {
  siteInfo: SiteInfo;
  candidates: CmsCandidate[];
  rooms: CmsRoom[];
  teachers: CmsTeacher[];
  exams: CmsExam[];
  examSlots: CmsExamSlot[];
  surveillances: CmsSurveillance[];
  announcements?: CmsAnnouncement[];
  role?: "proviseur" | "superadmin";
  onNavigateSection: (section: AdminSection) => void;
}

export default function AdminDashboardSection({
  siteInfo,
  candidates,
  rooms,
  teachers,
  exams,
  examSlots,
  surveillances,
  announcements = [],
  role = "superadmin",
  onNavigateSection,
}: AdminDashboardSectionProps) {
  // 1. TOTALS & BASELINE STATS
  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);
  const ttCandidatesCount = candidates.filter(
    (c) =>
      c.accommodation &&
      c.accommodation !== "Aucun" &&
      (c.accommodation.toLowerCase().includes("tiers") ||
        c.accommodation.toLowerCase().includes("1/3") ||
        c.accommodation.toLowerCase().includes("pap") ||
        c.accommodation.toLowerCase().includes("pps") ||
        c.accommodation.toLowerCase().includes("aménag"))
  ).length;

  const effectiveSurveillancesCount = exams.length === 0 || examSlots.length === 0 ? 0 : surveillances.length;
  const publishedAnnouncements = announcements.filter((a) => a.isPublished);

  // 2. DYNAMIC MOBILIZED ROOMS CALCULATION
  // A room is considered "mobilized" if it is explicitly selected in exam slots,
  // assigned in surveillances, or populated in candidate roomName.
  const mobilizedRoomMap = new Map<string, { name: string; capacity: number; building?: string; count: number }>();

  const registerMobilizedRoom = (rawName?: string) => {
    if (!rawName) return;
    const trimmed = rawName.trim();
    if (!trimmed || trimmed.toLowerCase() === "renfort") return;

    // Match against configured rooms table (case-insensitive)
    const matchedRoom = rooms.find(
      (r) => r.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    const standardName = matchedRoom ? matchedRoom.name : trimmed;
    const existing = mobilizedRoomMap.get(standardName);
    if (existing) {
      existing.count += 1;
    } else {
      mobilizedRoomMap.set(standardName, {
        name: standardName,
        capacity: matchedRoom ? Number(matchedRoom.capacity) || 0 : 0,
        building: matchedRoom?.building,
        count: 1,
      });
    }
  };

  (examSlots || []).forEach((slot) => {
    if (Array.isArray(slot.roomNames)) {
      slot.roomNames.forEach((rn) => registerMobilizedRoom(rn));
    }
  });

  (surveillances || []).forEach((s) => {
    registerMobilizedRoom(s.roomName);
  });

  (candidates || []).forEach((c) => {
    registerMobilizedRoom(c.roomName);
  });

  const mobilizedRoomList = Array.from(mobilizedRoomMap.values());
  const hasMobilizedRooms = mobilizedRoomList.length > 0;
  const mobilizedRoomsCount = hasMobilizedRooms ? mobilizedRoomList.length : rooms.length;
  const mobilizedCapacity = hasMobilizedRooms
    ? mobilizedRoomList.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0)
    : totalCapacity;

  // 3. DYNAMIC MOBILIZED SURVEILLANTS CALCULATION
  // Identify distinct invigilators assigned to active exams (both teachers & renforts)
  const mobilizedSurveillantMap = new Map<
    string,
    { name: string; isRenfort: boolean; missionsCount: number; rooms: Set<string> }
  >();

  (surveillances || []).forEach((s) => {
    if (s.teacherName && s.teacherName.trim()) {
      const name = s.teacherName.trim();
      const isRenfort =
        s.roomName === "Renfort" ||
        s.mission?.toLowerCase().includes("renfort") ||
        !teachers.some(
          (t) =>
            `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`.toLowerCase().includes(name.toLowerCase()) ||
            `${t.lastName} ${t.firstName}`.toLowerCase().includes(name.toLowerCase())
        );

      const existing = mobilizedSurveillantMap.get(name);
      if (existing) {
        existing.missionsCount += 1;
        if (isRenfort) existing.isRenfort = true;
        if (s.roomName && s.roomName !== "Renfort") existing.rooms.add(s.roomName);
      } else {
        const roomSet = new Set<string>();
        if (s.roomName && s.roomName !== "Renfort") roomSet.add(s.roomName);
        mobilizedSurveillantMap.set(name, {
          name,
          isRenfort,
          missionsCount: 1,
          rooms: roomSet,
        });
      }
    }
  });

  const mobilizedSurveillantsList = Array.from(mobilizedSurveillantMap.values());
  const hasMobilizedSurveillants = mobilizedSurveillantsList.length > 0;
  const mobilizedSurveillantsCount = mobilizedSurveillantsList.length;
  const renfortSurveillantsCount = mobilizedSurveillantsList.filter((s) => s.isRenfort).length;
  const profsSurveillantsCount = mobilizedSurveillantsCount - renfortSurveillantsCount;

  // 4. CANDIDATES DISPATCH STATUS
  const assignedCandidates = candidates.filter((c) => Boolean(c.roomName && c.roomName.trim()));
  const assignedCandidatesCount = assignedCandidates.length;
  const hasAssignedCandidates = assignedCandidatesCount > 0;
  const dispatchPercentage = candidates.length > 0
    ? Math.round((assignedCandidatesCount / candidates.length) * 100)
    : 0;

  // 5. EXAM SLOTS COVERAGE
  const coveredSlotIds = new Set<string>();
  (surveillances || []).forEach((s) => {
    if (s.slotId) coveredSlotIds.add(s.slotId);
  });
  const coveredSlotsCount = coveredSlotIds.size;

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      {/* 1. TOP EXECUTIVE WELCOME BANNER (LUMINOUS & REFINED FRENCH INSTITUTIONAL STYLE) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Institutional Tricolor Micro-Hairline Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002060] via-[#3498db] to-[#c92a2a]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#002060] font-bold text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#002060]" />
                {role === "proviseur" ? "Espace Proviseur & Organisation" : "Espace Direction & Organisation"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-xs">
                Session Officielle {siteInfo.schoolYear || "2026-2027"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tableau de Bord — Examens Blancs LFJP
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Supervisez l'intégralité du déroulement des épreuves : de l'import Pronote au brassage des tables, jusqu'à l'impression des convocations certifiées et la publication sur la vitrine officielle.
            </p>
          </div>

          {/* Quick Institutional Action Links - Harmonized */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => onNavigateSection("convoc-eleves")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs hover:shadow cursor-pointer active:scale-[0.98]"
            >
              <Printer className="h-4 w-4 text-amber-300" />
              <span>Imprimer Convocations</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateSection("organization")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#002060] text-xs font-bold transition shadow-2xs hover:shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Compass className="h-4 w-4 text-blue-700" />
              <span>Répartition & Brassage</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs hover:shadow-xs cursor-pointer active:scale-[0.98]"
              title="Ouvrir le site vitrine dans un nouvel onglet"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Voir la Vitrine</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. KEY METRICS ROW (DYNAMICALLY UPDATED BASED ON MOBILIZED CHOICES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Candidates (Inscrits & Répartis) */}
        <div
          onClick={() => onNavigateSection(hasAssignedCandidates ? "organization" : "data-eleves")}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer group"
          title="Cliquez pour gérer les élèves et la répartition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {hasAssignedCandidates ? "Candidats Répartis" : "Candidats Inscrits"}
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 group-hover:scale-110 transition">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 font-mono">
            {hasAssignedCandidates ? (
              <span>
                {assignedCandidatesCount}
                <span className="text-sm font-normal text-slate-400 ml-1">/ {candidates.length}</span>
              </span>
            ) : (
              candidates.length
            )}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            {hasAssignedCandidates ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                {dispatchPercentage}% en salle
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-bold text-[10px] border border-indigo-200">
                Cohorte active
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">♿ {ttCandidatesCount} Tiers-Temps</span>
          </div>
        </div>

        {/* Card 2: Rooms (Salles Mobilisées vs Salles Totales) */}
        <div
          onClick={() => onNavigateSection("data-salles")}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition cursor-pointer group"
          title="Cliquez pour consulter les jauges et salles mobilisées"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {hasMobilizedRooms ? "Salles Mobilisées" : "Salles d'Examens"}
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition">
              <School className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-700 font-mono">
            {mobilizedRoomsCount}
            {hasMobilizedRooms && rooms.length > mobilizedRoomsCount && (
              <span className="text-sm font-normal text-slate-400 ml-1">/ {rooms.length}</span>
            )}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
              {mobilizedCapacity} places assises
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">
              {hasMobilizedRooms ? `sur ${rooms.length} salles école` : "Capacité globale"}
            </span>
          </div>
        </div>

        {/* Card 3: Sessions & Slots */}
        <div
          onClick={() => onNavigateSection("creneaux-epreuves")}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-amber-300 transition cursor-pointer group"
          title="Cliquez pour planifier les créneaux et épreuves"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Créneaux d'Épreuves
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 font-mono">
            {examSlots.length}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold text-[10px] border border-amber-200">
              {exams.length} session{exams.length > 1 ? "s" : ""}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">
              {coveredSlotsCount > 0
                ? `${coveredSlotsCount}/${examSlots.length} surveillés`
                : "Calendrier actif"}
            </span>
          </div>
        </div>

        {/* Card 4: Surveillants (Surveillants Mobilisés vs Inscrits) */}
        <div
          onClick={() => onNavigateSection("planning-rooms")}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-rose-300 transition cursor-pointer group"
          title="Cliquez pour gérer les surveillances et renforts"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {hasMobilizedSurveillants ? "Surveillants Mobilisés" : "Surveillances Assignées"}
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 group-hover:scale-110 transition">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 font-mono">
            {hasMobilizedSurveillants ? (
              <span>
                {mobilizedSurveillantsCount}
                <span className="text-sm font-normal text-slate-400 ml-1">/ {teachers.length}</span>
              </span>
            ) : (
              effectiveSurveillancesCount
            )}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 font-bold text-[10px] border border-rose-200">
              {effectiveSurveillancesCount} poste{effectiveSurveillancesCount > 1 ? "s" : ""} couvert{effectiveSurveillancesCount > 1 ? "s" : ""}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">
              {renfortSurveillantsCount > 0
                ? `${profsSurveillantsCount} profs + ${renfortSurveillantsCount} renforts`
                : `${teachers.length} enseignants`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED REAL-TIME PANEL: DISPOSITIF & MOYENS MOBILISÉS POUR LA SESSION */}
      <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/70 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Dispositif & Moyens Réellement Mobilisés pour la Session
              </h2>
              <p className="text-xs text-slate-500">
                Synthèse exacte calculée à partir des créneaux sélectionnés, des surveillances affectées et du brassage des tables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateSection("organization")}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>Ajuster Répartition</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Section 1: Salles Mobilisées */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <DoorOpen className="h-4 w-4 text-emerald-600" />
                <span>Salles Retenues ({hasMobilizedRooms ? mobilizedRoomList.length : rooms.length})</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {mobilizedCapacity} places
              </span>
            </div>

            {hasMobilizedRooms ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {mobilizedRoomList.map((room) => (
                    <span
                      key={room.name}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs font-bold"
                    >
                      <School className="h-3 w-3 text-emerald-700" />
                      <span>{room.name}</span>
                      {room.capacity > 0 && (
                        <span className="text-[10px] font-medium text-emerald-700 bg-white/70 px-1 rounded">
                          {room.capacity} pl.
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Capacité requise : <strong>{candidates.length} places</strong></span>
                  <span className={mobilizedCapacity >= candidates.length ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                    {mobilizedCapacity >= candidates.length ? "✅ Jauge suffisante" : "⚠️ Attention jauge"}
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500 italic">
                  Aucune salle filtrée pour l'instant. Toutes les {rooms.length} salles configurées sont disponibles.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateSection("creneaux-epreuves")}
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  Sélectionner les salles des épreuves ➔
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Surveillants Mobilisés */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <UserCheck className="h-4 w-4 text-rose-600" />
                <span>Équipe de Surveillance ({hasMobilizedSurveillants ? mobilizedSurveillantsCount : 0})</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                {effectiveSurveillancesCount} affectations
              </span>
            </div>

            {hasMobilizedSurveillants ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {mobilizedSurveillantsList.slice(0, 8).map((surv) => (
                    <span
                      key={surv.name}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        surv.isRenfort
                          ? "bg-purple-50 text-purple-900 border-purple-200"
                          : "bg-rose-50/80 text-rose-900 border-rose-200/80"
                      }`}
                    >
                      <Shield className={`h-3 w-3 ${surv.isRenfort ? "text-purple-600" : "text-rose-600"}`} />
                      <span className="truncate max-w-[130px]">{surv.name}</span>
                      {surv.isRenfort && (
                        <span className="text-[9px] uppercase tracking-wider bg-purple-200/70 text-purple-800 px-1 rounded font-black">
                          Renfort
                        </span>
                      )}
                    </span>
                  ))}
                  {mobilizedSurveillantsList.length > 8 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                      +{mobilizedSurveillantsList.length - 8} autres
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Enseignants : <strong>{profsSurveillantsCount}</strong></span>
                  <span>Renforts volants : <strong>{renfortSurveillantsCount}</strong></span>
                </p>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500 italic">
                  Aucun surveillant affecté aux créneaux pour l'instant.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateSection("creneaux-epreuves")}
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  Assigner les surveillances ➔
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Candidats & Brassage */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Brassage des Élèves</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                dispatchPercentage === 100
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : hasAssignedCandidates
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                {dispatchPercentage}% placé
              </span>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Répartition en salle</span>
                  <span className="font-bold text-slate-900">{assignedCandidatesCount} / {candidates.length} élèves</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${dispatchPercentage}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>Aménagements Tiers-Temps : <strong>{ttCandidatesCount}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateSection("convoc-eleves")}
                  className="text-blue-700 font-bold hover:underline"
                >
                  Convocations ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RACCOURCIS D'ACCÈS RAPIDE AUX ESPACES CLÉS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Base Élèves",
            icon: Users,
            sec: "data-eleves",
            badge: hasAssignedCandidates
              ? `${assignedCandidatesCount}/${candidates.length} placés`
              : `${candidates.length} élèves`,
          },
          {
            label: "Salles & Jauges",
            icon: School,
            sec: "data-salles",
            badge: hasMobilizedRooms
              ? `${mobilizedRoomsCount} mobilisée${mobilizedRoomsCount > 1 ? "s" : ""}`
              : `${rooms.length} salles`,
          },
          {
            label: "Enseignants",
            icon: Shield,
            sec: "data-profs",
            badge: hasMobilizedSurveillants
              ? `${mobilizedSurveillantsCount} mobilisé${mobilizedSurveillantsCount > 1 ? "s" : ""}`
              : `${teachers.length} profs`,
          },
          {
            label: "Créneaux Épreuves",
            icon: Calendar,
            sec: "creneaux-epreuves",
            badge: `${examSlots.length} créneau${examSlots.length > 1 ? "x" : ""}`,
          },
          {
            label: "Brassage Tables",
            icon: Compass,
            sec: "organization",
            badge: hasAssignedCandidates ? `Terminé (${assignedCandidatesCount})` : "Répartition",
          },
          {
            label: "Convocations A4",
            icon: Printer,
            sec: "convoc-eleves",
            badge: "Impression",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigateSection(item.sec as AdminSection)}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition text-center flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
            >
              <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 text-slate-700 flex items-center justify-center transition">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition">
                {item.label}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. SUMMARY PANELS: SESSIONS D'EXAMENS & CONSIGNES OFFICIELLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
        {/* Active Exam Sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-700" />
              <span>Sessions d'Examens Programmées ({exams.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection("sessions-examens")}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Gérer ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {exams.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Aucune session d'examen enregistrée.
              </p>
            ) : (
              exams.slice(0, 4).map((ex) => (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{ex.title}</span>
                    <span className="text-[11px] text-slate-500">
                      {ex.period} • Niveau : <strong className="text-slate-700">{ex.targetLevel}</strong>
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {ex.status || "Prévu"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Published Announcements & Official Communications */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              <span>Consignes Officielles & Direction ({publishedAnnouncements.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection("config")}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Modifier ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {publishedAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Aucune consigne officielle publiée actuellement.
              </p>
            ) : (
              publishedAnnouncements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ann.title}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{ann.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{ann.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

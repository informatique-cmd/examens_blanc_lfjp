import React, { useMemo } from "react";
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
  ClipboardList,
  Accessibility,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  isCandidateTiersTemps,
  getExamTargetLevels,
  formatTargetLevelsSummary,
  type CmsCandidate,
  type CmsRoom,
  type CmsTeacher,
  type CmsExam,
  type CmsExamSlot,
  type CmsSurveillance,
  type SiteInfo,
  type CmsAnnouncement,
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
  const ttCandidatesCount = useMemo(
    () => candidates.filter((c) => isCandidateTiersTemps(c)).length,
    [candidates]
  );

  const effectiveSurveillancesCount =
    exams.length === 0 || examSlots.length === 0 ? 0 : surveillances.length;
  const publishedAnnouncements = announcements.filter((a) => a.isPublished);
  const activeSessionsCount = exams.filter((e) => e.status !== "Archivé").length;

  // 2. DYNAMIC MOBILIZED ROOMS CALCULATION
  const mobilizedRoomMap = new Map<
    string,
    { name: string; capacity: number; building?: string; count: number }
  >();

  const registerMobilizedRoom = (rawName?: string) => {
    if (!rawName) return;
    const trimmed = rawName.trim();
    if (!trimmed || trimmed.toLowerCase() === "renfort") return;

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
    if (c.assignmentsByExam) {
      Object.values(c.assignmentsByExam).forEach((assign) => {
        registerMobilizedRoom(assign?.roomName);
      });
    }
  });

  const mobilizedRoomList = Array.from(mobilizedRoomMap.values());
  const hasMobilizedRooms = mobilizedRoomList.length > 0;
  const mobilizedRoomsCount = hasMobilizedRooms ? mobilizedRoomList.length : rooms.length;
  const mobilizedCapacity = hasMobilizedRooms
    ? mobilizedRoomList.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0)
    : totalCapacity;

  // 3. DYNAMIC MOBILIZED SURVEILLANTS CALCULATION
  const mobilizedSurveillantMap = new Map<
    string,
    { name: string; isRenfort: boolean; missionsCount: number }
  >();

  (surveillances || []).forEach((s) => {
    if (s.teacherName && s.teacherName.trim()) {
      const name = s.teacherName.trim();
      const isRenfort =
        s.roomName === "Renfort" ||
        Boolean(s.mission?.toLowerCase().includes("renfort")) ||
        !teachers.some(
          (t) =>
            `${t.civility === "Madame" ? "Mme" : "M."} ${t.lastName} ${t.firstName}`
              .toLowerCase()
              .includes(name.toLowerCase()) ||
            `${t.lastName} ${t.firstName}`.toLowerCase().includes(name.toLowerCase())
        );

      const existing = mobilizedSurveillantMap.get(name);
      if (existing) {
        existing.missionsCount += 1;
        if (isRenfort) existing.isRenfort = true;
      } else {
        mobilizedSurveillantMap.set(name, {
          name,
          isRenfort,
          missionsCount: 1,
        });
      }
    }
  });

  const mobilizedSurveillantsList = Array.from(mobilizedSurveillantMap.values());
  const hasMobilizedSurveillants = mobilizedSurveillantsList.length > 0;
  const mobilizedSurveillantsCount = mobilizedSurveillantsList.length;

  // 4. CANDIDATES DISPATCH STATUS
  const assignedCandidates = candidates.filter(
    (c) =>
      Boolean(c.roomName && c.roomName.trim()) ||
      Boolean(
        c.assignmentsByExam &&
          Object.values(c.assignmentsByExam).some((a) => Boolean(a?.roomName?.trim()))
      )
  );
  const assignedCandidatesCount = assignedCandidates.length;
  const hasAssignedCandidates = assignedCandidatesCount > 0;
  const dispatchPercentage =
    candidates.length > 0
      ? Math.round((assignedCandidatesCount / candidates.length) * 100)
      : 0;

  // 5. EXAM SLOTS COVERAGE & LOGISTICAL ALERTS
  const slotAlerts = useMemo(() => {
    return (examSlots || []).map((slot) => {
      const slotRooms = slot.roomNames || [];
      const slotSurvs = (surveillances || []).filter(
        (s) =>
          (slot.id && s.slotId === slot.id) ||
          (s.date === slot.date &&
            s.timeSlot.includes(slot.startTime) &&
            (!s.examTitle ||
              s.examTitle.trim().toLowerCase() === slot.examTitle.trim().toLowerCase()))
      );
      const missingRooms = slotRooms.length === 0;
      const missingSurveillants = slotSurvs.length === 0;
      const uncoveredRoomsCount = Math.max(0, slotRooms.length - slotSurvs.length);
      return {
        slot,
        missingRooms,
        missingSurveillants,
        uncoveredRoomsCount,
        coveredCount: slotSurvs.length,
        roomCount: slotRooms.length,
      };
    });
  }, [examSlots, surveillances]);

  const logisticalIssues = useMemo(
    () =>
      slotAlerts.filter(
        (a) => a.missingRooms || a.missingSurveillants || a.uncoveredRoomsCount > 0
      ),
    [slotAlerts]
  );

  const upcomingSlots = useMemo(() => {
    return [...(examSlots || [])].sort((a, b) => {
      const d = (a.date || "").localeCompare(b.date || "");
      if (d !== 0) return d;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
  }, [examSlots]);

  // 6. GLOBAL WORKFLOW STEPPER PROGRESS
  const step1Done = candidates.length > 0 && rooms.length > 0;
  const step2Done = exams.length > 0 && examSlots.length > 0;
  const step3Done = assignedCandidatesCount > 0 && effectiveSurveillancesCount > 0;
  const step4Done = exams.some((e) => e.isPublished !== false) && step3Done;

  const completedStepsCount = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  const workflowProgressPct = Math.round((completedStepsCount / 4) * 100);

  const workflowSteps: Array<{
    num: string;
    title: string;
    detail: string;
    done: boolean;
    cta: string;
    section: AdminSection;
  }> = [
    {
      num: "01",
      title: "Import des élèves & salles",
      detail: `${candidates.length} candidat(s) • ${rooms.length} salle(s) • ${teachers.length} enseignant(s)`,
      done: step1Done,
      cta: "Données Pronote",
      section: "data-eleves",
    },
    {
      num: "02",
      title: "Sessions & créneaux des épreuves",
      detail: `${exams.length} session(s) • ${examSlots.length} créneau(x) programmé(s)`,
      done: step2Done,
      cta: "Créneaux",
      section: "creneaux-epreuves",
    },
    {
      num: "03",
      title: "Brassage des tables & surveillances",
      detail: `${assignedCandidatesCount}/${candidates.length} candidat(s) en salle • ${effectiveSurveillancesCount} poste(s)`,
      done: step3Done,
      cta: "Brassage",
      section: "organization",
    },
    {
      num: "04",
      title: "Convocations A4 & diffusion vitrine",
      detail: `${exams.filter((e) => e.isPublished !== false).length}/${exams.length} session(s) en ligne`,
      done: step4Done,
      cta: "Convocations",
      section: "convoc-eleves",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      {/* 1. INSTITUTIONAL HEADER BANNER (LFJP / AEFE) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F2A56] via-[#1D4ED8] to-[#c92a2a]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-1">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#0F2A56]/5 border border-[#0F2A56]/15 text-[#0F2A56] font-bold text-[11px] uppercase tracking-wider">
                {role === "proviseur" ? "Direction • Espace Proviseur" : "Direction • Administration LFJP"}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#1D4ED8] font-bold text-[11px]">
                Année scolaire {siteInfo.schoolYear || "2026-2027"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A56] tracking-tight">
              Tableau de Bord — Organisation des Examens
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Pilotage centralisé des épreuves du Lycée Français Jacques Prévert : cohorte Pronote, créneaux, brassage anti-fraude, surveillances et convocations A4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => onNavigateSection("convoc-eleves")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2A56] hover:bg-[#173B75] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <Printer className="h-4 w-4 text-amber-300" />
              <span>Convocations A4</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateSection("organization")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1D4ED8]/25 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-xs font-bold transition cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>Répartition & Brassage</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              title="Ouvrir le site vitrine dans un nouvel onglet"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Voir la Vitrine</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. 5 BALANCED EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Sessions actives */}
        <button
          type="button"
          onClick={() => onNavigateSection("sessions-examens")}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#1D4ED8]/50 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sessions actives
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#0F2A56]/5 border border-[#0F2A56]/10 flex items-center justify-center text-[#0F2A56]">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-[#0F2A56] font-mono tabular-nums">
            {activeSessionsCount}
            {exams.length !== activeSessionsCount && (
              <span className="text-xs font-medium text-slate-400 ml-1">/ {exams.length}</span>
            )}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500">
            <strong className="text-slate-700 tabular-nums">{examSlots.length}</strong> épreuve(s) programmée(s)
          </p>
        </button>

        {/* KPI 2: Candidats inscrits */}
        <button
          type="button"
          onClick={() => onNavigateSection(hasAssignedCandidates ? "organization" : "data-eleves")}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#1D4ED8]/50 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Candidats inscrits
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1D4ED8]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {candidates.length}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500">
            <strong className="text-emerald-700 tabular-nums">{dispatchPercentage}%</strong> affectés en salle
          </p>
        </button>

        {/* KPI 3: Salles mobilisées */}
        <button
          type="button"
          onClick={() => onNavigateSection("data-salles")}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Salles mobilisées
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <School className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
            {mobilizedRoomsCount}
            <span className="text-xs font-medium text-slate-400 ml-1">/ {rooms.length}</span>
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500">
            <strong className="text-slate-700 tabular-nums">{mobilizedCapacity}</strong> places assises
          </p>
        </button>

        {/* KPI 4: Surveillants affectés */}
        <button
          type="button"
          onClick={() => onNavigateSection("planning-rooms")}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Surveillants affectés
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {hasMobilizedSurveillants ? mobilizedSurveillantsCount : effectiveSurveillancesCount}
            <span className="text-xs font-medium text-slate-400 ml-1">/ {teachers.length}</span>
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500">
            <strong className="text-slate-700 tabular-nums">{effectiveSurveillancesCount}</strong> créneau(x) couvert(s)
          </p>
        </button>

        {/* KPI 5: Élèves PAP / PPS */}
        <button
          type="button"
          onClick={() => onNavigateSection("data-amenagements")}
          className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-purple-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Aménagements PAP/PPS
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <Accessibility className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-purple-800 font-mono tabular-nums">
            {ttCandidatesCount}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Tiers-temps (+1/3) actifs
          </p>
        </button>
      </div>

      {/* 3. BALANCED 2-COLUMN BODY: LEFT PROGRESSION, RIGHT UPCOMING SLOTS & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: WORKFLOW PROGRESSION & ACTIVE SESSIONS */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="font-extrabold text-sm text-[#0F2A56] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1D4ED8]" />
                  <span>État d&apos;avancement des sessions</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Progression globale du workflow d&apos;organisation ({completedStepsCount}/4 étapes)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#0F2A56]/5 border border-[#0F2A56]/15 text-[#0F2A56] font-mono font-bold text-xs tabular-nums">
                {workflowProgressPct}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/70">
              <div
                className="h-full bg-gradient-to-r from-[#0F2A56] to-[#1D4ED8] transition-all duration-500"
                style={{ width: `${workflowProgressPct}%` }}
              />
            </div>

            {/* 4 Step Action Rows */}
            <div className="space-y-2.5">
              {workflowSteps.map((step) => (
                <div
                  key={step.num}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-[#F8FAFC] hover:bg-white hover:border-[#1D4ED8]/30 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-7 w-7 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                        step.done
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-slate-300 text-slate-600"
                      }`}
                    >
                      {step.done ? "✓" : step.num}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{step.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{step.detail}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateSection(step.section)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-[#0F2A56] hover:text-white hover:border-[#0F2A56] text-slate-700 text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>{step.cta}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sessions Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#0F2A56] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#1D4ED8]" />
                <span>Sessions d&apos;examens ({exams.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateSection("sessions-examens")}
                className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                Gérer les sessions →
              </button>
            </div>

            <div className="space-y-2.5">
              {exams.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Aucune session d&apos;examen enregistrée.
                </p>
              ) : (
                exams.slice(0, 4).map((ex) => {
                  const slotsCount = examSlots.filter(
                    (s) =>
                      s.examId === ex.id ||
                      s.examTitle.trim().toLowerCase() === ex.title.trim().toLowerCase()
                  ).length;
                  return (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-white transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{ex.title}</span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {ex.period} • {formatTargetLevelsSummary(getExamTargetLevels(ex))} •{" "}
                          <strong className="text-slate-700">{slotsCount} créneau(x)</strong>
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-[#0F2A56] border border-blue-200 shrink-0">
                        {ex.status || "Prévu"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UPCOMING EPREUVES, LOGISTICAL ALERTS & ANNOUNCEMENTS */}
        <div className="space-y-6">
          {/* Logistical Alerts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#0F2A56] flex items-center gap-2">
                <AlertTriangle
                  className={`h-4 w-4 ${
                    logisticalIssues.length > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                />
                <span>Alertes logistiques ({logisticalIssues.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateSection("creneaux-epreuves")}
                className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                Vérifier les créneaux →
              </button>
            </div>

            {logisticalIssues.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Tous les créneaux disposent de salles mobilisées et de surveillants affectés.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {logisticalIssues.slice(0, 4).map(({ slot, missingRooms, missingSurveillants, uncoveredRoomsCount }) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {slot.subject}{" "}
                        <span className="font-normal text-slate-500">({slot.date})</span>
                      </p>
                      <p className="text-[11px] text-amber-800 truncate">
                        {missingRooms
                          ? "Aucune salle assignée sur ce créneau"
                          : missingSurveillants
                          ? "Aucun surveillant affecté"
                          : `${uncoveredRoomsCount} salle(s) sans surveillant`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateSection("creneaux-epreuves")}
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      Compléter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Programmed Slots */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#0F2A56] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1D4ED8]" />
                <span>Prochaines épreuves programmées ({upcomingSlots.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateSection("creneaux-epreuves")}
                className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                Planning complet →
              </button>
            </div>

            {upcomingSlots.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucune épreuve programmée pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingSlots.slice(0, 5).map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl border border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{slot.subject}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {slot.examTitle} • {(slot.roomNames || []).length} salle(s)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-mono font-bold text-[#0F2A56] text-[11px] tabular-nums">
                        {slot.date}
                      </span>
                      <span className="block font-mono text-[11px] text-slate-500 tabular-nums">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published Official Communications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#0F2A56] flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" />
                <span>Consignes & communiqués publiés ({publishedAnnouncements.length})</span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  onNavigateSection(role === "superadmin" ? "config" : "vitrine-publish")
                }
                className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                Gérer →
              </button>
            </div>

            <div className="space-y-2">
              {publishedAnnouncements.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">
                  Aucun communiqué publié actuellement sur la vitrine.
                </p>
              ) : (
                publishedAnnouncements.slice(0, 3).map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 truncate">{ann.title}</span>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0 tabular-nums">
                        {ann.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

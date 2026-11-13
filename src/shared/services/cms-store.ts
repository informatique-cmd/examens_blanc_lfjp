import { useState, useEffect } from "react";
import defaultCmsDataJson from "./default-cms-data.json";
import { type HomeCalloutCategory } from "../../features/home/constants";

export interface ProviseurAuth {
  email: string;
  password: string;
  name: string;
}

export interface PendingDeploymentInfo {
  requestedAt?: string;
  requestedBy?: string;
  summary?: string;
  savedAt: string;
  savedBy: string;
  notes: string;
}

export interface SiteInfo {
  title: string;
  subtitle: string;
  description: string;
  schoolYear: string;
  schoolName?: string;
  schoolCity?: string;
  logos: Array<{ src: string; alt?: string }>;
  bannerAlert: {
    enabled: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "urgent" | "success";
  };
  proviseurAuth?: ProviseurAuth;
  pendingDeployment?: PendingDeploymentInfo | null;
  standardSlots?: Array<{
    id: string;
    name: string;
    durationStd: number;
    standardHours: string;
    tiersTempsHours: string;
  }>;
  evaluationTypes?: string[];
  schoolLevels?: string[];
  sciencesSubjects?: Array<{
    id: string;
    name: string;
    enabled: boolean;
  }>;
  proviseurVisibleModules?: Record<string, boolean>;
}

export const DEFAULT_PROVISEUR_VISIBLE_MODULES: Record<string, boolean> = {
  dashboard: true,
  dataMenu: true,
  "sessions-examens": true,
  "creneaux-epreuves": true,
  organization: true,
  planningMenu: true,
  "view-edt": false,
  resMenu: false,
  convocMenu: true,
  publishDeployMenu: true,
};

export function getProviseurVisibleModules(
  siteInfo?: Partial<SiteInfo> | null
): Record<string, boolean> {
  return {
    ...DEFAULT_PROVISEUR_VISIBLE_MODULES,
    ...(siteInfo?.proviseurVisibleModules || {}),
  };
}

export function isProviseurSectionAllowed(
  siteInfo: Partial<SiteInfo> | null | undefined,
  section: string
): boolean {
  if (!section || section === "dashboard") return true;
  if (section === "config") return false;
  const vis = getProviseurVisibleModules(siteInfo);
  if (
    ["data-eleves", "data-salles", "data-profs", "data-amenagements", "sec-pochettes"].includes(
      section
    )
  ) {
    return vis.dataMenu !== false;
  }
  if (["planning-rooms", "planning-profs"].includes(section)) {
    return vis.planningMenu !== false;
  }
  if (
    [
      "corr-repartition",
      "res-import",
      "res-analyse",
      "res-releves",
      "res-datavis",
      "res-simul",
    ].includes(section)
  ) {
    return vis.resMenu === true;
  }
  if (["convoc-eleves", "convoc-profs"].includes(section)) {
    return vis.convocMenu !== false;
  }
  if (["vitrine-publish", "deployment"].includes(section)) {
    return vis.publishDeployMenu !== false;
  }
  if (section === "view-edt") {
    return vis["view-edt"] === true;
  }
  return vis[section] !== false;
}

export const DEFAULT_SCHOOL_LEVELS: string[] = [
  "3ème (DNB Collège)",
  "1ère (Baccalauréat EAF)",
  "Terminale (Baccalauréat)",
  "2nde (Seconde)",
  "4ème (Quatrième)",
  "5ème (Cinquième)",
  "6ème (Sixième)",
  "Tous niveaux",
];

export function getShortLevelBadge(level: string = ""): string {
  const norm = level.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (!norm) return "";
  if (norm.includes("tous")) return "Tous niveaux";
  if (norm.includes("terminale") || norm.includes("tle")) return "Terminale";
  if (norm.includes("1ere") || norm.includes("premiere") || norm.includes("eaf")) return "1ère";
  if (norm.includes("2nde") || norm.includes("seconde") || norm.includes("2nd")) return "2nde";
  if (norm.includes("3") || norm.includes("dnb")) return "3ème";
  if (norm.includes("4")) return "4ème";
  if (norm.includes("5")) return "5ème";
  if (norm.includes("6")) return "6ème";
  return level.split("(")[0].trim();
}

export function getExamTargetLevels(exam?: Partial<CmsExam> | null): string[] {
  if (!exam) return ["Tous niveaux"];
  if (Array.isArray(exam.targetLevels) && exam.targetLevels.length > 0) {
    return exam.targetLevels.map((l) => l.trim()).filter(Boolean);
  }
  const raw = (exam.targetLevel || "").trim();
  if (!raw) return ["Tous niveaux"];
  if (raw.includes(",")) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (raw.includes("+")) {
    return raw.split("+").map((s) => s.trim()).filter(Boolean);
  }
  return [raw];
}

export function formatTargetLevelsSummary(levels: string[]): string {
  const clean = levels.map((l) => l.trim()).filter(Boolean);
  if (clean.length === 0) return "Tous niveaux";
  if (clean.some((l) => l.toLowerCase().includes("tous"))) return "Tous niveaux";
  return clean.join(", ");
}

function matchSingleTargetLevel(normalizedClass: string, singleLevel: string): boolean {
  const normalizedLevel = singleLevel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalizedLevel || normalizedLevel.includes("tous")) return true;

  // 1. Terminale (Baccalauréat)
  if (normalizedLevel.includes("terminale") || normalizedLevel.includes("tle")) {
    return (
      normalizedClass.startsWith("tle") ||
      normalizedClass.includes("terminale") ||
      normalizedClass.startsWith("term") ||
      normalizedClass.includes(" tle") ||
      normalizedClass.includes("tle ")
    );
  }

  // 2. 1ère / Première (EAF)
  if (normalizedLevel.includes("1ere") || normalizedLevel.includes("premiere") || normalizedLevel.includes("eaf")) {
    return (
      normalizedClass.startsWith("1") ||
      normalizedClass.includes("1ere") ||
      normalizedClass.includes("premiere") ||
      normalizedClass.includes("1re") ||
      normalizedClass.includes("1er")
    );
  }

  // 3. 3ème / Troisième (DNB)
  if (normalizedLevel.includes("3") || normalizedLevel.includes("dnb") || normalizedLevel.includes("troisieme")) {
    return (
      normalizedClass.startsWith("3") ||
      /\b3[a-z0-9]*\b/.test(normalizedClass) ||
      normalizedClass.includes("3eme") ||
      normalizedClass.includes("troisieme") ||
      normalizedClass.includes("dnb")
    );
  }

  // 4. 2nde / Seconde
  if (normalizedLevel.includes("2nde") || normalizedLevel.includes("seconde") || normalizedLevel.includes("2nd")) {
    return (
      normalizedClass.startsWith("2") ||
      /\b2[a-z0-9]*\b/.test(normalizedClass) ||
      normalizedClass.includes("2nde") ||
      normalizedClass.includes("seconde") ||
      normalizedClass.includes("2nd")
    );
  }

  // 5. 4ème
  if (normalizedLevel.includes("4")) {
    return normalizedClass.startsWith("4") || normalizedClass.includes("4eme");
  }

  // 6. 5ème
  if (normalizedLevel.includes("5")) {
    return normalizedClass.startsWith("5") || normalizedClass.includes("5eme");
  }

  // 7. 6ème
  if (normalizedLevel.includes("6")) {
    return normalizedClass.startsWith("6") || normalizedClass.includes("6eme");
  }

  return normalizedClass.includes(normalizedLevel) || normalizedLevel.includes(normalizedClass);
}

/**
 * Checks whether a student's class name matches an exam's target school level(s).
 * Supports single string, comma-separated multi-levels, or string arrays.
 */
export function isCandidateMatchingLevel(
  className: string = "",
  targetLevel: string | string[] = ""
): boolean {
  const levels = Array.isArray(targetLevel)
    ? targetLevel
    : targetLevel
      ? targetLevel.split(/[,+]/).map((s) => s.trim()).filter(Boolean)
      : [];

  if (levels.length === 0) return true;
  if (levels.some((l) => l.toLowerCase().includes("tous"))) return true;

  const normalizedClass = className
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalizedClass) return false;
  return levels.some((lvl) => matchSingleTargetLevel(normalizedClass, lvl));
}

/**
 * Checks whether an exam or slot's level(s) match a selected level filter key (e.g. "all", "3ème", "2nde", "1ère", "Terminale").
 */
export function isLevelFilterMatch(
  levelSource: string | string[] | undefined,
  selectedFilter: string
): boolean {
  if (!selectedFilter || selectedFilter === "all") return true;
  const levels = Array.isArray(levelSource)
    ? levelSource
    : levelSource
      ? levelSource.split(/[,+]/).map((s) => s.trim()).filter(Boolean)
      : [];

  if (levels.length === 0) return true;
  if (levels.some((l) => l.toLowerCase().includes("tous"))) return true;

  const filterBadge = getShortLevelBadge(selectedFilter).toLowerCase();
  return levels.some((lvl) => {
    const badge = getShortLevelBadge(lvl).toLowerCase();
    if (badge === filterBadge) return true;
    const normL = lvl.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normF = selectedFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normL.includes(normF) || normF.includes(normL);
  });
}

/**
 * Accurately detects whether a candidate benefits from Tiers-Temps (+1/3) or exam accommodation
 * (Tiers-Temps, PAP, PPRE, PPS, PAI, Aménagement).
 */
export function isCandidateTiersTemps(cand?: Partial<CmsCandidate> | null): boolean {
  if (cand?.isTiersTemps === true) return true;
  const acc = (cand?.accommodation || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!acc || acc === "aucun" || acc === "aucune" || acc === "non" || acc === "-") {
    return false;
  }
  return (
    acc.includes("1/3") ||
    acc.includes("tiers") ||
    acc.includes("pap") ||
    acc.includes("ppre") ||
    acc.includes("pps") ||
    acc.includes("pai") ||
    acc.includes("amenag") ||
    /\btt\b/.test(acc)
  );
}

export interface CandidateExamAssignment {
  roomName: string;
  tableNumber: string;
  anonymatNumber: string;
}

/**
 * Resolves a candidate's room/table/anonymat strictly for a specific exam session,
 * preserving legacy assignments stored directly on roomName/tableNumber when appropriate
 * without leaking across unrelated exam sessions.
 */
export function getCandidateAssignmentForExam(
  cand: CmsCandidate,
  exam?: Pick<CmsExam, "id" | "title" | "mobilizedRoomIds"> | null,
  examSlots: CmsExamSlot[] = [],
  allRooms: CmsRoom[] = []
): CandidateExamAssignment {
  if (!exam) {
    return {
      roomName: cand.roomName || "",
      tableNumber: cand.tableNumber || "",
      anonymatNumber: cand.anonymatNumber || "",
    };
  }

  const byExam = cand.assignmentsByExam;
  if (byExam) {
    if (byExam[exam.id]) {
      return {
        roomName: byExam[exam.id].roomName || "",
        tableNumber: byExam[exam.id].tableNumber || "",
        anonymatNumber: byExam[exam.id].anonymatNumber || "",
      };
    }
    const normTitle = exam.title.trim().toLowerCase();
    const matchedKey = Object.keys(byExam).find((k) => k.trim().toLowerCase() === normTitle);
    if (matchedKey) {
      return {
        roomName: byExam[matchedKey].roomName || "",
        tableNumber: byExam[matchedKey].tableNumber || "",
        anonymatNumber: byExam[matchedKey].anonymatNumber || "",
      };
    }
  }

  // Legacy fallback: direct fields on candidate
  if (!cand.roomName) {
    return { roomName: "", tableNumber: "", anonymatNumber: "" };
  }

  const candExamNorm = (cand.examName || "").trim().toLowerCase();
  const examTitleNorm = exam.title.trim().toLowerCase();
  if (candExamNorm && candExamNorm === examTitleNorm) {
    return {
      roomName: cand.roomName,
      tableNumber: cand.tableNumber || "",
      anonymatNumber: cand.anonymatNumber || "",
    };
  }

  // Check if candidate's legacy room belongs to this exam's slots or mobilizedRoomIds
  const examSlotRooms = new Set(
    examSlots
      .filter((s) => s.examId === exam.id || s.examTitle.trim().toLowerCase() === examTitleNorm)
      .flatMap((s) => s.roomNames || [])
      .map((r) => r.trim().toLowerCase())
  );
  if (Array.isArray(exam.mobilizedRoomIds) && allRooms.length > 0) {
    exam.mobilizedRoomIds.forEach((rid) => {
      const rm = allRooms.find((r) => r.id === rid);
      if (rm?.name) examSlotRooms.add(rm.name.trim().toLowerCase());
    });
  }

  if (examSlotRooms.has(cand.roomName.trim().toLowerCase())) {
    return {
      roomName: cand.roomName,
      tableNumber: cand.tableNumber || "",
      anonymatNumber: cand.anonymatNumber || "",
    };
  }

  return { roomName: "", tableNumber: "", anonymatNumber: "" };
}

/**
 * Filters exam slots strictly for a given candidate's exam session, school level, and optional specialty.
 */
export function getCandidateMatchingSlots(
  cand: CmsCandidate,
  exam: Pick<CmsExam, "id" | "title" | "targetLevel" | "targetLevels"> | null | undefined,
  allSlots: CmsExamSlot[]
): CmsExamSlot[] {
  const examTitleNorm = exam?.title?.trim().toLowerCase() || "";
  const scopedSlots = exam
    ? allSlots.filter(
        (s) =>
          s.examId === exam.id ||
          (examTitleNorm && s.examTitle.trim().toLowerCase() === examTitleNorm)
      )
    : allSlots;

  const parentFallbackLevels = exam ? getExamTargetLevels(exam) : [];

  const candSpecs = [
    cand.specialty || "",
    ...(Array.isArray(cand.options) ? cand.options : []),
  ]
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  return scopedSlots.filter((slot) => {
    const slotLevels = slot.targetLevel
      ? slot.targetLevel
      : parentFallbackLevels.length > 0
        ? parentFallbackLevels
        : "Tous niveaux";

    if (!isCandidateMatchingLevel(cand.className, slotLevels)) {
      return false;
    }

    const slotSpec = (slot.targetSpecialty || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    if (slotSpec && candSpecs) {
      const slotTokens = slotSpec.split(/[,/+]+/).map((t) => t.trim()).filter((t) => t.length >= 2);
      if (slotTokens.length > 0 && !slotTokens.some((tok) => candSpecs.includes(tok))) {
        return false;
      }
    }

    return true;
  });
}

export interface CmsCallout {
  id: string;
  to: string;
  iconLabel?: string | null;
  subtitle?: string | null;
  title: string;
  dateLabel?: string | null;
  date?: string | null;
  footerLabel?: string | null;
  category: HomeCalloutCategory;
  isPublished: boolean;
  order: number;
}

export interface CmsAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: "information" | "important" | "urgent" | "resultats";
  target: "all" | "bac" | "dnb" | "teachers";
  isPublished: boolean;
  date: string;
}

export interface CmsExam {
  id: string;
  title: string;
  examType: string;
  targetLevel: string;
  targetLevels?: string[];
  period: string;
  startsAt: string;
  endsAt: string;
  description: string;
  status: "Prévu" | "En cours" | "Terminé" | "Archivé";
  isPublished?: boolean;
  mobilizedRoomIds?: string[];
  ttRoomIds?: string[];
  customRoomQuotas?: Record<string, number>;
  anonymatPrefix?: string;
  dispatchMode?: "brassage" | "alphabetique" | "classe" | "specialite";
}

export interface CmsRoom {
  id: string;
  name: string;
  capacity: number;
  building: string;
  notes: string;
}

export interface CmsTeacher {
  id: string;
  civility: "Madame" | "Monsieur";
  firstName: string;
  lastName: string;
  subject: string;
  email: string;
}

export interface CmsExamSlot {
  id: string;
  examId?: string;
  examTitle: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  tiersTempsEndTime?: string;
  tiersTempsDurationMinutes?: number;
  targetLevel?: string;
  targetSpecialty?: string;
  roomNames?: string[];
  notes?: string;
}

export interface CmsSurveillance {
  id: string;
  examTitle: string;
  slotId?: string;
  teacherName: string;
  roomName: string;
  date: string;
  timeSlot: string;
  mission: string;
}

export interface CmsCandidate {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  examName: string;
  roomName: string;
  convocationTime: string;
  accommodation: string;
  isTiersTemps?: boolean;
  specialty?: string;
  options?: string[];
  tableNumber?: string;
  anonymatNumber?: string;
  assignmentsByExam?: Record<string, CandidateExamAssignment>;
}

export interface CmsOfficialRule {
  id: string;
  title: string;
  content: string;
  icon?: "clock" | "book" | "shield" | "file" | "alert" | "check";
  category?: string;
  isPublished: boolean;
  order?: number;
}

export const DEFAULT_OFFICIAL_RULES: CmsOfficialRule[] = [
  {
    id: "rule-ponctualite",
    title: "Ponctualité & Appel",
    content: "Appel obligatoire des candidats 15 min avant l'épreuve. Aucun accès en salle après distribution des sujets.",
    icon: "clock",
    category: "Horaires",
    isPublished: true,
    order: 1,
  },
  {
    id: "rule-mode-examen",
    title: "Mode Examen",
    content: "Calculatrices avec mode examen activé (voyant clignotant). Tout téléphone doit être éteint dans le sac.",
    icon: "book",
    category: "Matériel",
    isPublished: true,
    order: 2,
  },
  {
    id: "rule-tiers-temps",
    title: "Tiers-Temps (+1/3)",
    content: "Majoration horaire automatique et salles dédiées pour les élèves bénéficiant d'aménagements PAP / PPS validés.",
    icon: "shield",
    category: "Aménagements",
    isPublished: true,
    order: 3,
  },
  {
    id: "rule-convocation",
    title: "Pièce & Convocation",
    content: "Convocation imprimée et pièce d'identité avec photo obligatoires pour émarger avant de débuter l'épreuve.",
    icon: "file",
    category: "Contrôle",
    isPublished: true,
    order: 4,
  },
];

export interface CmsData {
  version: string;
  updatedAt: string;
  siteInfo: SiteInfo;
  callouts: CmsCallout[];
  announcements: CmsAnnouncement[];
  officialRules?: CmsOfficialRule[];
  exams: CmsExam[];
  examSlots: CmsExamSlot[];
  rooms: CmsRoom[];
  teachers: CmsTeacher[];
  surveillances: CmsSurveillance[];
  candidates: CmsCandidate[];
}

export interface SavedConfigSnapshot {
  id: string;
  name: string;
  createdAt: string;
  schoolYear: string;
  examsCount: number;
  slotsCount: number;
  candidatesCount: number;
  roomsCount: number;
  teachersCount: number;
  data: CmsData;
}

const CMS_STORAGE_KEY = "lfjp_examens_cms_data_v1";
const CMS_SNAPSHOTS_KEY = "lfjp_config_snapshots_v1";
const CMS_EVENT_NAME = "lfjp_cms_updated";

// Default initial state built directly from the school's real configured data
export const DEFAULT_CMS_DATA: CmsData = defaultCmsDataJson as unknown as CmsData;

/**
 * Reads the latest CMS data from localStorage.
 * If an array property exists in storage (even empty []), it is strictly respected
 * so deleted items or reset states NEVER resurrect.
 */
export function getCmsData(): CmsData {
  if (typeof window === "undefined") {
    return DEFAULT_CMS_DATA;
  }

  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (!raw) return DEFAULT_CMS_DATA;
    const parsed = JSON.parse(raw) as Partial<CmsData>;
    return {
      version: parsed.version || DEFAULT_CMS_DATA.version,
      updatedAt: parsed.updatedAt || DEFAULT_CMS_DATA.updatedAt,
      siteInfo: {
        ...DEFAULT_CMS_DATA.siteInfo,
        ...(parsed.siteInfo || {}),
        evaluationTypes: Array.isArray(parsed.siteInfo?.evaluationTypes)
          ? parsed.siteInfo.evaluationTypes
          : (Array.isArray(DEFAULT_CMS_DATA.siteInfo?.evaluationTypes) ? DEFAULT_CMS_DATA.siteInfo.evaluationTypes : []),
        schoolLevels: Array.isArray(parsed.siteInfo?.schoolLevels)
          ? parsed.siteInfo.schoolLevels
          : DEFAULT_SCHOOL_LEVELS,
        sciencesSubjects: Array.isArray(parsed.siteInfo?.sciencesSubjects)
          ? parsed.siteInfo.sciencesSubjects
          : (Array.isArray(DEFAULT_CMS_DATA.siteInfo?.sciencesSubjects) ? DEFAULT_CMS_DATA.siteInfo.sciencesSubjects : []),
        standardSlots: Array.isArray(parsed.siteInfo?.standardSlots)
          ? parsed.siteInfo.standardSlots
          : (Array.isArray(DEFAULT_CMS_DATA.siteInfo?.standardSlots) ? DEFAULT_CMS_DATA.siteInfo.standardSlots : []),
        bannerAlert: {
          ...DEFAULT_CMS_DATA.siteInfo.bannerAlert,
          ...(parsed.siteInfo?.bannerAlert || {}),
        },
        proviseurVisibleModules: {
          ...DEFAULT_PROVISEUR_VISIBLE_MODULES,
          ...(DEFAULT_CMS_DATA.siteInfo?.proviseurVisibleModules || {}),
          ...(parsed.siteInfo?.proviseurVisibleModules || {}),
        },
      },
      callouts: Array.isArray(parsed.callouts)
        ? parsed.callouts.map((c, i) => ({
            id: c.id || `callout-${i + 1}`,
            to: c.to || "/",
            iconLabel: c.iconLabel || `Accéder à ${c.title || "l'examen"}`,
            subtitle: c.subtitle || "",
            title: c.title || "Examen",
            dateLabel: c.dateLabel || "",
            date: c.date || "",
            footerLabel: c.footerLabel || "Accéder à l'organisation complète",
            category: c.category || "general",
            isPublished: c.isPublished !== false,
            order: typeof c.order === "number" ? c.order : i + 1,
          }))
        : DEFAULT_CMS_DATA.callouts,
      announcements: Array.isArray(parsed.announcements)
        ? parsed.announcements
        : DEFAULT_CMS_DATA.announcements,
      officialRules: Array.isArray(parsed.officialRules)
        ? parsed.officialRules
        : DEFAULT_OFFICIAL_RULES,
      exams:
        Array.isArray(parsed.exams) && parsed.exams.length > 0
          ? parsed.exams.map((e) => ({ ...e, isPublished: e.isPublished !== false }))
          : DEFAULT_CMS_DATA.exams.map((e) => ({ ...e, isPublished: true })),
      examSlots:
        Array.isArray(parsed.examSlots) && parsed.examSlots.length > 0
          ? parsed.examSlots
          : DEFAULT_CMS_DATA.examSlots,
      rooms:
        Array.isArray(parsed.rooms) && parsed.rooms.length > 0
          ? parsed.rooms
          : DEFAULT_CMS_DATA.rooms,
      teachers:
        Array.isArray(parsed.teachers) && parsed.teachers.length > 0
          ? parsed.teachers
          : DEFAULT_CMS_DATA.teachers,
      surveillances: (() => {
        const rawSurvs =
          Array.isArray(parsed.surveillances) && parsed.surveillances.length > 0
            ? parsed.surveillances
            : DEFAULT_CMS_DATA.surveillances;
        const examsList =
          Array.isArray(parsed.exams) && parsed.exams.length > 0
            ? parsed.exams
            : DEFAULT_CMS_DATA.exams;
        if (examsList.length === 0) return [];
        const validTitles = new Set(examsList.map((e) => e.title?.trim().toLowerCase()).filter(Boolean));
        const validSlotIds = new Set(
          (Array.isArray(parsed.examSlots) && parsed.examSlots.length > 0
            ? parsed.examSlots
            : DEFAULT_CMS_DATA.examSlots
          ).map((s) => s.id)
        );
        return rawSurvs.filter((s) => {
          const hasSlot = s.slotId && validSlotIds.has(s.slotId);
          const hasExam = s.examTitle && validTitles.has(s.examTitle.trim().toLowerCase());
          return hasSlot || hasExam;
        });
      })(),
      candidates:
        Array.isArray(parsed.candidates) && parsed.candidates.length > 0
          ? parsed.candidates
          : DEFAULT_CMS_DATA.candidates,
    };
  } catch (err) {
    console.error("Erreur lors de la lecture du CMS :", err);
    return DEFAULT_CMS_DATA;
  }
}

/**
 * Saves CMS data to localStorage and dispatches a notification event.
 */
export function saveCmsData(
  data: CmsData,
  preserveTimestamp = false,
  skipServerSync = false
): void {
  if (typeof window === "undefined") return;
  const toSave: CmsData = {
    ...data,
    updatedAt: preserveTimestamp && data.updatedAt ? data.updatedAt : new Date().toISOString(),
  };
  localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(toSave));
  window.dispatchEvent(new Event(CMS_EVENT_NAME));

  if (skipServerSync) return;

  // Persist to server so other browsers and devices sync automatically in real time
  try {
    fetch("/api/save-cms-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    }).catch(() => {});
  } catch {
    // Ignore network errors
  }
}

/**
 * Snapshots management: Save and restore named configurations
 */
export function getSavedConfigSnapshots(): SavedConfigSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CMS_SNAPSHOTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveConfigSnapshot(name: string, dataToSave?: CmsData): SavedConfigSnapshot {
  const current = dataToSave || getCmsData();
  const snapshot: SavedConfigSnapshot = {
    id: `snap-${Date.now()}`,
    name: name.trim() || `Configuration du ${new Date().toLocaleDateString("fr-FR")}`,
    createdAt: new Date().toISOString(),
    schoolYear: current.siteInfo?.schoolYear || "2026-2027",
    examsCount: current.exams?.length || 0,
    slotsCount: current.examSlots?.length || 0,
    candidatesCount: current.candidates?.length || 0,
    roomsCount: current.rooms?.length || 0,
    teachersCount: current.teachers?.length || 0,
    data: current,
  };

  const existing = getSavedConfigSnapshots();
  const next = [snapshot, ...existing];
  if (typeof window !== "undefined") {
    localStorage.setItem(CMS_SNAPSHOTS_KEY, JSON.stringify(next));
  }
  return snapshot;
}

export function deleteConfigSnapshot(id: string): SavedConfigSnapshot[] {
  const existing = getSavedConfigSnapshots();
  const next = existing.filter((s) => s.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(CMS_SNAPSHOTS_KEY, JSON.stringify(next));
  }
  return next;
}

export function restoreConfigSnapshot(id: string): CmsData | null {
  const existing = getSavedConfigSnapshots();
  const found = existing.find((s) => s.id === id);
  if (!found) return null;
  saveCmsData(found.data);
  return found.data;
}

/**
 * Resets CMS data back to the default state.
 */
export function resetCmsData(): CmsData {
  const fresh = { ...DEFAULT_CMS_DATA, updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    localStorage.removeItem(CMS_STORAGE_KEY);
    window.dispatchEvent(new Event(CMS_EVENT_NAME));
  }
  return fresh;
}

/**
 * Exports current CMS data as pretty JSON.
 */
export function exportCmsDataJson(data?: CmsData): string {
  return JSON.stringify(data || getCmsData(), null, 2);
}

/**
 * Imports CMS data from a JSON string.
 */
export function importCmsDataJson(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Format de fichier invalide." };
    }
    saveCmsData(parsed as CmsData);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

/**
 * Marks that the Proviseur saved modifications, storing a pending deployment notification.
 */
export function markProviseurSaved(
  notes: string = "Mise à jour des examens effectuée par le Proviseur",
  savedBy: string = "Proviseur"
): CmsData {
  const current = getCmsData();
  const next: CmsData = {
    ...current,
    updatedAt: new Date().toISOString(),
    siteInfo: {
      ...current.siteInfo,
      pendingDeployment: {
        savedAt: new Date().toISOString(),
        savedBy,
        notes,
        requestedAt: new Date().toISOString(),
        requestedBy: savedBy,
        summary: notes,
      },
    },
  };
  saveCmsData(next);
  return next;
}

/**
 * Clears the pending deployment flag after SuperAdmin successfully deploys to GitHub / Vercel.
 */
export function clearPendingDeployment(): CmsData {
  const current = getCmsData();
  const next: CmsData = {
    ...current,
    siteInfo: {
      ...current.siteInfo,
      pendingDeployment: null,
    },
  };
  saveCmsData(next);
  return next;
}

/**
 * Generates the TypeScript code that can be committed to GitHub
 * to permanently bake CMS changes into the Vercel production build.
 */
export function generateConstantsTsCode(data: CmsData): string {
  const code = `// Fichier généré automatiquement par le CMS LFJP le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
// Ce fichier est déployé automatiquement sur Vercel lors de chaque commit GitHub.

export const HOME_PAGE_CONTENT = ${JSON.stringify(
    {
      logos: data.siteInfo?.logos || [],
      subtitle: data.siteInfo?.subtitle ?? "",
      title: data.siteInfo?.title ?? "",
      description: data.siteInfo?.description ?? "",
    },
    null,
    2
  )};

export type HomeCalloutCategory = "general" | "math" | "oral" | "surveillance";

export interface HomeCalloutEntry {
  to: string;
  iconLabel: string;
  subtitle: string;
  title: string;
  dateLabel: string;
  date: string;
  footerLabel: string;
  category: HomeCalloutCategory;
}

export const HOME_CALLOUT_ENTRIES: HomeCalloutEntry[] = ${JSON.stringify(
    (data.callouts || [])
      .filter((c) => c.isPublished)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((c) => ({
        to: c.to || "/",
        iconLabel: c.iconLabel || `Accéder à ${c.title || "l'examen"}`,
        subtitle: c.subtitle || "",
        title: c.title || "Examen",
        dateLabel: c.dateLabel || "",
        date: c.date || "",
        footerLabel: c.footerLabel || "Accéder à l'organisation complète",
        category: c.category || "general",
      })),
    null,
    2
  )};
`;
  return code;
}

/**
 * React hook to consume and update CMS state reactively.
 * Handles automatic cross-browser synchronization from the deployed cms-data.json.
 */
export function useCmsData() {
  const [data, setData] = useState<CmsData>(() => getCmsData());

  useEffect(() => {
    const handleUpdate = () => {
      setData(getCmsData());
    };

    window.addEventListener(CMS_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Automatic multi-browser synchronization from live /api/cms-data or deployed /cms-data.json
    const syncFromRemote = async () => {
      try {
        let remote: CmsData | null = null;
        try {
          const apiRes = await fetch(`/api/cms-data?_t=${Date.now()}`, { cache: "no-store" });
          if (apiRes.ok) {
            const parsedApi = (await apiRes.json()) as CmsData;
            if (parsedApi && typeof parsedApi === "object" && parsedApi.siteInfo && Array.isArray(parsedApi.exams)) {
              remote = parsedApi;
            }
          }
        } catch {
          // Fallback to static /cms-data.json below
        }

        if (!remote) {
          const res = await fetch(`/cms-data.json?_t=${Date.now()}`, { cache: "no-store" });
          if (!res.ok) return;
          const parsedStatic = (await res.json()) as CmsData;
          if (!parsedStatic || typeof parsedStatic !== "object" || !parsedStatic.siteInfo || !Array.isArray(parsedStatic.exams)) return;
          remote = parsedStatic;
        }

        const rawLocal = localStorage.getItem(CMS_STORAGE_KEY);
        if (!rawLocal) {
          saveCmsData(remote, true, true);
          setData(getCmsData());
          return;
        }

        const local = JSON.parse(rawLocal) as Partial<CmsData>;
        const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
        const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;

        const hasLocalCandidates = Array.isArray(local.candidates) && local.candidates.length > 0;
        const hasLocalRooms = Array.isArray(local.rooms) && local.rooms.length > 0;
        const hasLocalTeachers = Array.isArray(local.teachers) && local.teachers.length > 0;
        const hasLocalExams = Array.isArray(local.exams) && local.exams.length > 0;
        const localHasData = hasLocalCandidates || hasLocalRooms || hasLocalTeachers || hasLocalExams;

        // If local is completely empty but remote has exams or candidates, adopt remote immediately
        if (!localHasData && ((remote.exams && remote.exams.length > 0) || (remote.candidates && remote.candidates.length > 0))) {
          saveCmsData(remote, true, true);
          setData(getCmsData());
          return;
        }

        // If local is at least as recent as remote, keep local state untouched
        if (localTime >= remoteTime) {
          return;
        }

        // Adopt remote when remoteTime > localTime, protecting against accidental empty remote overwrites
        const remoteIsEmpty =
          (!remote.candidates || remote.candidates.length === 0) &&
          (!remote.rooms || remote.rooms.length === 0) &&
          (!remote.teachers || remote.teachers.length === 0) &&
          (!remote.exams || remote.exams.length === 0);

        if (localHasData && remoteIsEmpty) {
          return;
        }

        saveCmsData(remote, true, true);
        setData(getCmsData());
      } catch (err) {
        console.warn("Could not sync remote cms-data.json", err);
      }
    };

    syncFromRemote();

    // Sync on tab visibility and window focus
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncFromRemote();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", syncFromRemote);

    // Periodic check every 5 seconds for multi-device harmony
    const syncInterval = setInterval(syncFromRemote, 5000);

    return () => {
      window.removeEventListener(CMS_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", syncFromRemote);
      clearInterval(syncInterval);
    };
  }, []);

  const markProviseurSaved = (summary?: string) => {
    const text = summary || "Mises à jour des examens, créneaux et répartitions";
    const next: CmsData = {
      ...data,
      siteInfo: {
        ...data.siteInfo,
        pendingDeployment: {
          savedAt: new Date().toISOString(),
          savedBy: "Proviseur",
          notes: text,
          requestedAt: new Date().toISOString(),
          requestedBy: "Proviseur",
          summary: text,
        },
      },
    };
    saveCmsData(next);
    setData(next);
    return next;
  };

  const clearPendingDeployment = () => {
    const next: CmsData = {
      ...data,
      siteInfo: {
        ...data.siteInfo,
        pendingDeployment: null,
      },
    };
    saveCmsData(next);
    setData(next);
    return next;
  };

  const updateSiteInfo = (info: Partial<SiteInfo>) => {
    const title = info.title ?? info.schoolName ?? data.siteInfo.title;
    const schoolName = info.schoolName ?? info.title ?? data.siteInfo.schoolName ?? title;
    const schoolCity = info.schoolCity ?? data.siteInfo.schoolCity ?? "Saly, Sénégal";

    // Auto-harmonize subtitle if not explicitly provided
    let subtitle = info.subtitle ?? data.siteInfo.subtitle;
    if (!info.subtitle && (info.title || info.schoolName || info.schoolCity)) {
      subtitle = `${schoolName} de ${schoolCity} • Réseau AEFE`;
    }

    const next: CmsData = {
      ...data,
      siteInfo: {
        ...data.siteInfo,
        ...info,
        title,
        schoolName,
        schoolCity,
        subtitle,
      },
    };
    saveCmsData(next);
    setData(next);
  };

  const addCallout = (callout: Omit<CmsCallout, "id" | "order">) => {
    const newId = `callout-${Date.now()}`;
    const nextCallouts: CmsCallout[] = [
      ...data.callouts,
      {
        ...callout,
        id: newId,
        order: data.callouts.length + 1,
      },
    ];
    const next: CmsData = { ...data, callouts: nextCallouts };
    saveCmsData(next);
    setData(next);
    return newId;
  };

  const updateCallout = (id: string, updates: Partial<CmsCallout>) => {
    const nextCallouts = data.callouts.map((c) => (c.id === id ? { ...c, ...updates } : c));
    const next: CmsData = { ...data, callouts: nextCallouts };
    saveCmsData(next);
    setData(next);
  };

  const deleteCallout = (id: string) => {
    const nextCallouts = data.callouts.filter((c) => c.id !== id);
    const next: CmsData = { ...data, callouts: nextCallouts };
    saveCmsData(next);
    setData(next);
  };

  const reorderCallout = (id: string, direction: "up" | "down") => {
    const index = data.callouts.findIndex((c) => c.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === data.callouts.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newCallouts = [...data.callouts];
    const temp = newCallouts[index];
    newCallouts[index] = newCallouts[newIndex];
    newCallouts[newIndex] = temp;

    // update order numbers
    newCallouts.forEach((c, idx) => {
      c.order = idx + 1;
    });

    const next: CmsData = { ...data, callouts: newCallouts };
    saveCmsData(next);
    setData(next);
  };

  const duplicateCallout = (id: string): CmsCallout | null => {
    const original = data.callouts.find((c) => c.id === id);
    if (!original) return null;
    const originalIndex = data.callouts.findIndex((c) => c.id === id);
    const newId = `callout-${Date.now()}`;
    const duplicated: CmsCallout = {
      ...original,
      id: newId,
      title: `${original.title} (Copie)`,
      order: original.order + 1,
    };
    const nextCallouts = [...data.callouts];
    nextCallouts.splice(originalIndex + 1, 0, duplicated);
    nextCallouts.forEach((c, idx) => {
      c.order = idx + 1;
    });
    const next: CmsData = { ...data, callouts: nextCallouts };
    saveCmsData(next);
    setData(next);
    return duplicated;
  };

  // Announcements
  const addAnnouncement = (item: Omit<CmsAnnouncement, "id">) => {
    const newItem: CmsAnnouncement = { ...item, id: `ann-${Date.now()}` };
    const next: CmsData = { ...data, announcements: [newItem, ...data.announcements] };
    saveCmsData(next);
    setData(next);
  };

  const updateAnnouncement = (id: string, updates: Partial<CmsAnnouncement>) => {
    const next: CmsData = {
      ...data,
      announcements: data.announcements.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    };
    saveCmsData(next);
    setData(next);
  };

  const deleteAnnouncement = (id: string) => {
    const next: CmsData = {
      ...data,
      announcements: data.announcements.filter((a) => a.id !== id),
    };
    saveCmsData(next);
    setData(next);
  };

  // Official Rules & Regulations
  const addOfficialRule = (item: Omit<CmsOfficialRule, "id">) => {
    const newItem: CmsOfficialRule = {
      ...item,
      id: `rule-${Date.now()}`,
      order: (data.officialRules || DEFAULT_OFFICIAL_RULES).length + 1,
    };
    const next: CmsData = {
      ...data,
      officialRules: [...(data.officialRules || DEFAULT_OFFICIAL_RULES), newItem],
    };
    saveCmsData(next);
    setData(next);
  };

  const updateOfficialRule = (id: string, updates: Partial<CmsOfficialRule>) => {
    const current = data.officialRules || DEFAULT_OFFICIAL_RULES;
    const next: CmsData = {
      ...data,
      officialRules: current.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    };
    saveCmsData(next);
    setData(next);
  };

  const deleteOfficialRule = (id: string) => {
    const current = data.officialRules || DEFAULT_OFFICIAL_RULES;
    const next: CmsData = {
      ...data,
      officialRules: current.filter((r) => r.id !== id),
    };
    saveCmsData(next);
    setData(next);
  };

  const togglePublishOfficialRule = (id: string, isPublished: boolean) => {
    updateOfficialRule(id, { isPublished });
  };

  // Exams
  const addExam = (item: Omit<CmsExam, "id">) => {
    const newItem: CmsExam = { ...item, id: `exam-${Date.now()}` };
    const next: CmsData = { ...data, exams: [...data.exams, newItem] };
    saveCmsData(next);
    setData(next);
  };

  const updateExam = (id: string, updates: Partial<CmsExam>) => {
    const next: CmsData = {
      ...data,
      exams: data.exams.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    };
    saveCmsData(next);
    setData(next);
  };

  const deleteExam = (id: string) => {
    const target = data.exams.find((e) => e.id === id);
    const examTitle = target?.title?.trim().toLowerCase();

    // 1. Identify slots belonging to this exam
    const deletedSlots = (data.examSlots || []).filter(
      (s) => s.examId === id || (examTitle && s.examTitle?.trim().toLowerCase() === examTitle)
    );
    const deletedSlotIds = new Set(deletedSlots.map((s) => s.id));

    // 2. Filter remaining slots
    const remainingSlots = (data.examSlots || []).filter(
      (s) => s.examId !== id && (!examTitle || s.examTitle?.trim().toLowerCase() !== examTitle)
    );

    // 3. Cascade delete surveillances linked to this exam or its slots
    const remainingSurvs = (data.surveillances || []).filter(
      (surv) =>
        (!surv.slotId || !deletedSlotIds.has(surv.slotId)) &&
        (!examTitle || surv.examTitle?.trim().toLowerCase() !== examTitle)
    );

    // 4. Cascade reset candidate room assignments for this specific exam
    const remainingCandidates = (data.candidates || []).map((c) => {
      if (examTitle && c.examName?.trim().toLowerCase() === examTitle) {
        return { ...c, roomName: "", tableNumber: "", anonymatNumber: "" };
      }
      return c;
    });

    // 5. Cascade delete callout cards linked to this exam title
    const remainingCallouts = (data.callouts || []).filter(
      (c) => !examTitle || c.title?.trim().toLowerCase() !== examTitle
    );

    const next: CmsData = {
      ...data,
      exams: data.exams.filter((e) => e.id !== id),
      examSlots: remainingSlots,
      surveillances: remainingSurvs,
      candidates: remainingCandidates,
      callouts: remainingCallouts,
    };
    saveCmsData(next);
    setData(next);
  };

  const duplicateExam = (id: string): CmsExam | null => {
    const original = data.exams.find((e) => e.id === id);
    if (!original) return null;
    const newId = `exam-${Date.now()}`;
    const duplicated: CmsExam = {
      ...original,
      id: newId,
      title: `${original.title} (Copie)`,
      status: "Prévu",
    };
    const next: CmsData = { ...data, exams: [...data.exams, duplicated] };
    saveCmsData(next);
    setData(next);
    return duplicated;
  };

  // Rooms
  const addRoom = (item: Omit<CmsRoom, "id">) => {
    const newItem: CmsRoom = { ...item, id: `room-${Date.now()}` };
    const next: CmsData = { ...data, rooms: [...data.rooms, newItem] };
    saveCmsData(next);
    setData(next);
  };

  const updateRoom = (id: string, updates: Partial<CmsRoom>) => {
    const next: CmsData = {
      ...data,
      rooms: data.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    };
    saveCmsData(next);
    setData(next);
  };

  const deleteRoom = (id: string) => {
    const next: CmsData = {
      ...data,
      rooms: data.rooms.filter((r) => r.id !== id),
    };
    saveCmsData(next);
    setData(next);
  };

  // Teachers
  const addTeacher = (item: Omit<CmsTeacher, "id">) => {
    const newItem: CmsTeacher = { ...item, id: `tea-${Date.now()}` };
    const next: CmsData = { ...data, teachers: [...data.teachers, newItem] };
    saveCmsData(next);
    setData(next);
  };

  const updateTeacher = (id: string, updates: Partial<CmsTeacher>) => {
    const next: CmsData = {
      ...data,
      teachers: data.teachers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    };
    saveCmsData(next);
    setData(next);
  };

  const deleteTeacher = (id: string) => {
    const next: CmsData = {
      ...data,
      teachers: data.teachers.filter((t) => t.id !== id),
    };
    saveCmsData(next);
    setData(next);
  };

  // Surveillances
  const addSurveillance = (item: Omit<CmsSurveillance, "id">) => {
    const newItem: CmsSurveillance = { ...item, id: `surv-${Date.now()}` };
    const next: CmsData = { ...data, surveillances: [...data.surveillances, newItem] };
    saveCmsData(next);
    setData(next);
  };

  const updateSurveillance = (id: string, updates: Partial<CmsSurveillance>) => {
    const next: CmsData = {
      ...data,
      surveillances: data.surveillances.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    };
    saveCmsData(next);
    setData(next);
  };

  const deleteSurveillance = (id: string) => {
    const next: CmsData = {
      ...data,
      surveillances: data.surveillances.filter((s) => s.id !== id),
    };
    saveCmsData(next);
    setData(next);
  };

  const duplicateSurveillance = (id: string): CmsSurveillance | null => {
    const original = data.surveillances.find((s) => s.id === id);
    if (!original) return null;
    const newId = `surv-${Date.now()}`;
    const duplicated: CmsSurveillance = {
      ...original,
      id: newId,
    };
    const next: CmsData = { ...data, surveillances: [...data.surveillances, duplicated] };
    saveCmsData(next);
    setData(next);
    return duplicated;
  };

  // Candidates
  const addCandidate = (item: Omit<CmsCandidate, "id">) => {
    const newItem: CmsCandidate = { ...item, id: `cand-${Date.now()}` };
    const next: CmsData = { ...data, candidates: [...data.candidates, newItem] };
    saveCmsData(next);
    setData(next);
  };

  const updateCandidate = (id: string, updates: Partial<CmsCandidate>) => {
    const next: CmsData = {
      ...data,
      candidates: data.candidates.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    };
    saveCmsData(next);
    setData(next);
  };

  const deleteCandidate = (id: string) => {
    const next: CmsData = {
      ...data,
      candidates: data.candidates.filter((c) => c.id !== id),
    };
    saveCmsData(next);
    setData(next);
  };

  const setCandidates = (newCandidates: CmsCandidate[]) => {
    const next: CmsData = {
      ...data,
      candidates: newCandidates,
      updatedAt: new Date().toISOString(),
      siteInfo: {
        ...data.siteInfo,
        pendingDeployment: {
          savedAt: new Date().toISOString(),
          savedBy: "Import Pronote",
          notes: `${newCandidates.length} élèves importés`,
          requestedAt: new Date().toISOString(),
          requestedBy: "Import Pronote",
          summary: `${newCandidates.length} élèves importés`,
        },
      },
    };
    saveCmsData(next);
    setData(next);
  };

  // Exam Slots
  const addExamSlot = (item: Omit<CmsExamSlot, "id">) => {
    const newItem: CmsExamSlot = { ...item, id: `slot-${Date.now()}` };
    const next: CmsData = { ...data, examSlots: [...(data.examSlots || []), newItem] };
    saveCmsData(next);
    setData(next);
  };

  const updateExamSlot = (id: string, updates: Partial<CmsExamSlot>) => {
    const next: CmsData = {
      ...data,
      examSlots: (data.examSlots || []).map((s) => (s.id === id ? { ...s, ...updates } : s)),
    };
    saveCmsData(next);
    setData(next);
  };

  const deleteExamSlot = (id: string) => {
    const next: CmsData = {
      ...data,
      examSlots: (data.examSlots || []).filter((s) => s.id !== id),
      surveillances: (data.surveillances || []).filter((s) => s.slotId !== id),
    };
    saveCmsData(next);
    setData(next);
  };

  const setExamSlots = (newSlots: CmsExamSlot[]) => {
    const next: CmsData = { ...data, examSlots: newSlots };
    saveCmsData(next);
    setData(next);
  };

  const setSurveillances = (newSurvs: CmsSurveillance[]) => {
    const next: CmsData = { ...data, surveillances: newSurvs };
    saveCmsData(next);
    setData(next);
  };

  const setRooms = (newRooms: CmsRoom[]) => {
    const next: CmsData = {
      ...data,
      rooms: newRooms,
      updatedAt: new Date().toISOString(),
      siteInfo: {
        ...data.siteInfo,
        pendingDeployment: {
          savedAt: new Date().toISOString(),
          savedBy: "Import Pronote",
          notes: `${newRooms.length} salles importées`,
          requestedAt: new Date().toISOString(),
          requestedBy: "Import Pronote",
          summary: `${newRooms.length} salles importées`,
        },
      },
    };
    saveCmsData(next);
    setData(next);
  };

  const setTeachers = (newTeachers: CmsTeacher[]) => {
    const next: CmsData = {
      ...data,
      teachers: newTeachers,
      updatedAt: new Date().toISOString(),
      siteInfo: {
        ...data.siteInfo,
        pendingDeployment: {
          savedAt: new Date().toISOString(),
          savedBy: "Import Pronote",
          notes: `${newTeachers.length} enseignants importés`,
          requestedAt: new Date().toISOString(),
          requestedBy: "Import Pronote",
          summary: `${newTeachers.length} enseignants importés`,
        },
      },
    };
    saveCmsData(next);
    setData(next);
  };

  const saveEntireData = (nextData: CmsData) => {
    saveCmsData(nextData);
    setData(nextData);
  };

  const handleReset = () => {
    const fresh = resetCmsData();
    setData(fresh);
  };

  const resetForNewSchoolYear = (newSchoolYear: string, preserveCatalogs: boolean = true) => {
    const next: CmsData = {
      ...data,
      siteInfo: {
        ...data.siteInfo,
        schoolYear: newSchoolYear,
      },
      candidates: [],
      examSlots: [],
      surveillances: [],
      exams: data.exams.map((e) => ({
        ...e,
        status: "Prévu" as const,
      })),
      ...(preserveCatalogs ? {} : { rooms: [], teachers: [] }),
      updatedAt: new Date().toISOString(),
    };
    saveCmsData(next);
    setData(next);
    return next;
  };

  const saveSnapshot = (name: string) => {
    return saveConfigSnapshot(name, data);
  };

  const restoreSnapshot = (id: string) => {
    const restored = restoreConfigSnapshot(id);
    if (restored) {
      setData(restored);
    }
    return restored;
  };

  const removeSnapshot = (id: string) => {
    return deleteConfigSnapshot(id);
  };

  return {
    data,
    updateSiteInfo,
    addCallout,
    updateCallout,
    deleteCallout,
    reorderCallout,
    duplicateCallout,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addOfficialRule,
    updateOfficialRule,
    deleteOfficialRule,
    togglePublishOfficialRule,
    addExam,
    updateExam,
    deleteExam,
    duplicateExam,
    addExamSlot,
    updateExamSlot,
    deleteExamSlot,
    setExamSlots,
    addRoom,
    updateRoom,
    deleteRoom,
    setRooms,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    setTeachers,
    addSurveillance,
    updateSurveillance,
    deleteSurveillance,
    duplicateSurveillance,
    setSurveillances,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    setCandidates,
    saveEntireData,
    resetToDefaults: handleReset,
    resetForNewSchoolYear,
    saveSnapshot,
    restoreSnapshot,
    removeSnapshot,
    markProviseurSaved,
    clearPendingDeployment,
  };
}

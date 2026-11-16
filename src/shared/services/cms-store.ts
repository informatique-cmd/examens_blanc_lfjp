import { useState, useEffect, useRef } from "react";
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
  if (section === "config" || section === "deployment") return false;
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
  if (section === "vitrine-publish") {
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

export interface CandidateSlotAssignment extends CandidateExamAssignment {
  examId?: string;
  slotId?: string;
}

export function parseTimeMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.replace("h", ":").trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function slotsTimeOverlap(slotA: CmsExamSlot, slotB: CmsExamSlot): boolean {
  if ((slotA.date || "").trim() !== (slotB.date || "").trim()) return false;
  const startA = parseTimeMinutes(slotA.startTime);
  const startB = parseTimeMinutes(slotB.startTime);
  if (startA === null || startB === null) {
    return (slotA.startTime || "").trim() === (slotB.startTime || "").trim();
  }
  const endA =
    parseTimeMinutes(slotA.endTime) ??
    startA + (slotA.durationMinutes && slotA.durationMinutes > 0 ? slotA.durationMinutes : 60);
  const endB =
    parseTimeMinutes(slotB.endTime) ??
    startB + (slotB.durationMinutes && slotB.durationMinutes > 0 ? slotB.durationMinutes : 60);
  return startA < endB && startB < endA;
}

export function formatMinutesToColon(totalMinutes: number): string {
  const safe = ((Math.round(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseTimeRangeMinutes(
  timeSlot?: string
): { startMin: number; endMin: number } | null {
  if (!timeSlot) return null;
  const matches = timeSlot.match(/(\d{1,2})\s*[:hH]\s*(\d{2})/g);
  if (!matches || matches.length < 2) return null;
  const parsePart = (part: string): number | null => {
    const m = part.match(/(\d{1,2})\s*[:hH]\s*(\d{2})/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (isNaN(h) || isNaN(min)) return null;
    return h * 60 + min;
  };
  const s = parsePart(matches[0]);
  const e = parsePart(matches[1]);
  if (s === null || e === null) return null;
  return { startMin: s, endMin: e > s ? e : s + 60 };
}

export function surveillancesTimeOverlap(
  dateA: string,
  rangeA: string,
  dateB: string,
  rangeB: string
): boolean {
  if ((dateA || "").trim() !== (dateB || "").trim()) return false;
  const parsedA = parseTimeRangeMinutes(rangeA);
  const parsedB = parseTimeRangeMinutes(rangeB);
  if (parsedA && parsedB) {
    return parsedA.startMin < parsedB.endMin && parsedB.startMin < parsedA.endMin;
  }
  return (rangeA || "").trim() === (rangeB || "").trim();
}

export function computeTiersTempsEndTimeColon(
  startTime: string,
  durationMinutes: number,
  explicitTTEnd?: string
): string {
  if (explicitTTEnd && explicitTTEnd.trim()) {
    const normalized = explicitTTEnd.trim().replace(/[hH]/, ":");
    if (/^\d{1,2}:\d{2}$/.test(normalized)) {
      const [h, m] = normalized.split(":");
      return `${h.padStart(2, "0")}:${m}`;
    }
  }
  const startMin = parseTimeMinutes(startTime);
  if (startMin === null) return explicitTTEnd || "";
  const dur = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;
  return formatMinutesToColon(startMin + Math.round(dur * (4 / 3)));
}

export function isRoomMarkedTiersTemps(
  room: Pick<CmsRoom, "id" | "name" | "notes">,
  slots: CmsExamSlot[] = [],
  exam?: Pick<CmsExam, "ttRoomIds"> | null
): boolean {
  if (slots.some((s) => s.ttRoomIds?.includes(room.id))) return true;
  if (
    slots.some(
      (s) =>
        /\btiers[\s-]*temps\b/i.test(s.subject || "") &&
        (s.roomNames || []).some((rn) => rn.trim().toLowerCase() === room.name.trim().toLowerCase())
    )
  ) {
    return true;
  }
  if (exam?.ttRoomIds?.includes(room.id)) return true;
  const rName = (room.name || "").toLowerCase();
  const rNotes = (room.notes || "").toLowerCase();
  return (
    /\btt\b/.test(rName) ||
    rName.includes("tiers") ||
    /\btt\b/.test(rNotes) ||
    rNotes.includes("tiers")
  );
}

export function teacherMatchesSlotSubjects(
  teacherSubject: string = "",
  slotSubjects: string[] = []
): boolean {
  const normTeacher = (teacherSubject || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!normTeacher || slotSubjects.length === 0) return false;

  const combinedSlots = slotSubjects
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const pairs: Array<[RegExp, RegExp]> = [
    [/\bphilo/, /\bphilo/],
    [/\b(francais|lettres)/, /\b(francais|eaf)\b/],
    [/\bmath/, /\b(math\w*|eam)\b/],
    [/\b(pc|physique|chimie)/, /\b(pc|physique|chimie)/],
    [/\b(svt|vie de la terre)/, /\b(svt|sciences de la vie)\b/],
    [/\b(histoire|geographie|hg|hggsp)/, /\b(histoire|geographie|hggsp|hg)\b/],
    [/\b(ses|sciences economiques)/, /\b(ses|sciences economiques)\b/],
    [/\b(anglais|amc|llce)/, /\b(anglais|amc|llce)/],
    [/\bespagnol/, /\bespagnol/],
    [/\b(technologie|numerique|nsi)/, /\b(nsi|technologie)\b/],
  ];

  return pairs.some(([tRx, sRx]) => tRx.test(normTeacher) && sRx.test(combinedSlots));
}

export interface ConsolidatedTeacherSurveillance {
  id: string;
  examTitle: string;
  date: string;
  timeSlot: string;
  roomName: string;
  mission: string;
  teacherName: string;
  subjects: string[];
  rawIds: string[];
  isRenfort?: boolean;
  renfortRooms?: string[];
}

export function cleanSupervisorName(rawName?: string): string {
  if (!rawName) return "";
  return rawName
    .replace(
      /\(\s*(?:renfort|aed(?:\s*\/\s*vie\s*scolaire)?|vie\s*scolaire|cpe|externe|vacataire|personnel\s+administratif|surveillant(?:\s+externe)?|secr[eé]tariat(?:\s+d'examen)?|direction)[^)]*\)/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatSupervisorMissionLabel(mission?: string, isRenfort?: boolean): string {
  if (
    isRenfort ||
    (mission && /\b(renfort|couloir|remplacant|remplaçant)\b/i.test(mission))
  ) {
    return "Surveillant renfort";
  }
  return (mission || "Surveillant titulaire").trim();
}

export function isRenfortSurveillance(
  s: Pick<CmsSurveillance, "roomName" | "mission">
): boolean {
  const room = (s.roomName || "").trim().toLowerCase();
  const mission = (s.mission || "").trim().toLowerCase();
  if (
    room === "renfort" ||
    room === "salle renfort" ||
    /\b(renfort|couloir|remplacant|remplaçant)\b/i.test(room)
  ) {
    return true;
  }
  if (/\b(renfort|couloir|remplacant|remplaçant)\b/i.test(mission)) {
    return true;
  }
  return false;
}

export function consolidateTeacherSurveillances(
  survs: CmsSurveillance[],
  examSlots: CmsExamSlot[] = []
): ConsolidatedTeacherSurveillance[] {
  const map = new Map<string, ConsolidatedTeacherSurveillance>();

  for (const s of survs) {
    const isRenfort = isRenfortSurveillance(s);
    const displayRoomName = isRenfort ? "Salle Renfort" : s.roomName;
    const cleanedTeacherName = cleanSupervisorName(s.teacherName) || s.teacherName;
    const formattedMission = formatSupervisorMissionLabel(s.mission, isRenfort);

    const matchedSlot = examSlots.find(
      (sl) =>
        (s.slotId && sl.id === s.slotId) ||
        (!isRenfort &&
          sl.date === s.date &&
          (!s.examTitle || sl.examTitle.trim().toLowerCase() === s.examTitle.trim().toLowerCase()) &&
          (sl.roomNames || []).some(
            (rn) => rn.trim().toLowerCase() === (s.roomName || "").trim().toLowerCase()
          ) &&
          surveillancesTimeOverlap(sl.date, `${sl.startTime} - ${sl.tiersTempsEndTime || sl.endTime}`, s.date, s.timeSlot))
    );

    const parallelSlotsInRoom =
      s.roomName && !isRenfort
        ? examSlots.filter(
            (sl) =>
              sl.date === s.date &&
              (!s.examTitle ||
                sl.examTitle.trim().toLowerCase() === s.examTitle.trim().toLowerCase()) &&
              (sl.roomNames || []).some(
                (rn) => rn.trim().toLowerCase() === s.roomName.trim().toLowerCase()
              ) &&
              surveillancesTimeOverlap(
                sl.date,
                `${sl.startTime} - ${sl.tiersTempsEndTime || sl.endTime}`,
                s.date,
                s.timeSlot
              )
          )
        : [];

    const overlappingSlotsForRenfort = isRenfort
      ? examSlots.filter(
          (sl) =>
            sl.date === s.date &&
            (!s.examTitle ||
              sl.examTitle.trim().toLowerCase() === s.examTitle.trim().toLowerCase()) &&
            surveillancesTimeOverlap(
              sl.date,
              `${sl.startTime} - ${sl.tiersTempsEndTime || sl.endTime}`,
              s.date,
              s.timeSlot
            )
        )
      : [];

    const subjectNames = Array.from(
      new Set(
        [
          ...(matchedSlot ? [matchedSlot.subject] : []),
          ...parallelSlotsInRoom.map((sl) => sl.subject),
          ...(!matchedSlot ? overlappingSlotsForRenfort.map((sl) => sl.subject) : []),
        ].filter(Boolean)
      )
    );

    const rawRenfortRooms = isRenfort
      ? matchedSlot && Array.isArray(matchedSlot.roomNames) && matchedSlot.roomNames.length > 0
        ? matchedSlot.roomNames
        : overlappingSlotsForRenfort.flatMap((sl) => sl.roomNames || [])
      : [];

    const renfortRooms = Array.from(
      new Set(
        rawRenfortRooms
          .map((rn) => rn.trim())
          .filter((rn) => Boolean(rn) && rn.toLowerCase() !== "renfort")
      )
    ).sort((a, b) => a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }));

    const key = `${s.date}::${s.timeSlot}::${displayRoomName}::${(s.examTitle || "").trim().toLowerCase()}::${cleanedTeacherName.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      subjectNames.forEach((subj) => {
        if (!existing.subjects.includes(subj)) existing.subjects.push(subj);
      });
      if (isRenfort) {
        existing.isRenfort = true;
        existing.mission = "Surveillant renfort";
        if (renfortRooms.length > 0) {
          existing.renfortRooms = Array.from(
            new Set([...(existing.renfortRooms || []), ...renfortRooms])
          ).sort((a, b) => a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }));
        }
      }
      existing.rawIds.push(s.id);
    } else {
      const fallbackSubject = isRenfort ? "Surveillance renfort" : "Épreuve écrite";
      map.set(key, {
        id: s.id,
        examTitle: s.examTitle,
        date: s.date,
        timeSlot: s.timeSlot,
        roomName: displayRoomName,
        mission: formattedMission,
        teacherName: cleanedTeacherName,
        subjects: subjectNames.length > 0 ? subjectNames : [fallbackSubject],
        rawIds: [s.id],
        isRenfort,
        renfortRooms: isRenfort ? renfortRooms : undefined,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => (a.date || "").localeCompare(b.date || "") || (a.timeSlot || "").localeCompare(b.timeSlot || "")
  );
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
    const normTitle = (exam.title || "").trim().toLowerCase();
    const matchedKey = Object.keys(byExam).find((k) => k.trim().toLowerCase() === normTitle);
    if (matchedKey) {
      return {
        roomName: byExam[matchedKey].roomName || "",
        tableNumber: byExam[matchedKey].tableNumber || "",
        anonymatNumber: byExam[matchedKey].anonymatNumber || "",
      };
    }
  }

  // Fallback to first matching per-slot assignment in this exam if present
  if (cand.assignmentsBySlot) {
    const examTitleNorm = (exam.title || "").trim().toLowerCase();
    const examSlotIds = new Set(
      examSlots
        .filter((s) => s.examId === exam.id || (examTitleNorm && (s.examTitle || "").trim().toLowerCase() === examTitleNorm))
        .map((s) => s.id)
    );
    for (const [sId, sAssign] of Object.entries(cand.assignmentsBySlot)) {
      if (sAssign?.roomName && (sAssign.examId === exam.id || examSlotIds.has(sId))) {
        return {
          roomName: sAssign.roomName,
          tableNumber: sAssign.tableNumber || "",
          anonymatNumber: sAssign.anonymatNumber || "",
        };
      }
    }
  }

  // Legacy fallback: direct fields on candidate
  if (!cand.roomName) {
    return { roomName: "", tableNumber: "", anonymatNumber: "" };
  }

  const candExamNorm = (cand.examName || "").trim().toLowerCase();
  const examTitleNorm = (exam.title || "").trim().toLowerCase();
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
      .filter((s) => s.examId === exam.id || (examTitleNorm && (s.examTitle || "").trim().toLowerCase() === examTitleNorm))
      .flatMap((s) => s.roomNames || [])
      .map((r) => (r || "").trim().toLowerCase())
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

function normalizeSpecText(val?: string): string {
  return (val || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function expandSpecTokens(raw: string): string[] {
  const stopWords = new Set(["sujet", "groupe", "grp", "tc", "tronc", "commun", "specialite", "spe", "option"]);
  return normalizeSpecText(raw)
    .split(/[,/+()-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !/^\d+$/.test(t) && !stopWords.has(t));
}

function candidateHasSpecialtyToken(candSpecsNorm: string, tok: string): boolean {
  if (!candSpecsNorm || !tok) return false;
  if (candSpecsNorm.includes(tok)) return true;
  if (tok === "maths" || tok === "mathematiques" || tok === "math") {
    return /\b(math|maths|mathematiques)\b/.test(candSpecsNorm);
  }
  if (tok === "pc" || tok === "physique" || tok === "chimie") {
    return /\b(pc|physique|chimie)\b/.test(candSpecsNorm);
  }
  if (tok === "ses") {
    return /\b(ses|sciences economiques)\b/.test(candSpecsNorm);
  }
  if (tok === "svt") {
    return /\b(svt|sciences de la vie)\b/.test(candSpecsNorm);
  }
  if (tok === "hggsp") {
    return /\b(hggsp|geopolitique)\b/.test(candSpecsNorm);
  }
  if (tok === "hlp") {
    return /\b(hlp|humanites)\b/.test(candSpecsNorm);
  }
  if (tok === "llce" || tok === "llcer") {
    return /\b(llce|llcer)\b/.test(candSpecsNorm);
  }
  if (tok === "amc") {
    return /\bamc\b/.test(candSpecsNorm);
  }
  if (tok === "nsi") {
    return /\bnsi\b/.test(candSpecsNorm);
  }
  if (tok === "eam specialite" || tok === "specialite") {
    return /\b(specialite|spe)\b/.test(candSpecsNorm);
  }
  return false;
}

function isSlotExplicitTroncCommun(slot: CmsExamSlot): boolean {
  if (normalizeSpecText(slot.targetSpecialty)) return false;
  const subjNorm = normalizeSpecText(slot.subject);
  return /\b(philosophie|philo|francais|eaf|eam tc|tronc commun|histoire|geographie|emc|enseignement scientifique|maths specifique|oral|grand oral)\b/.test(
    subjNorm
  );
}

function extractSlotSpecialtyTokens(slot: CmsExamSlot): {
  hasExplicitSpec: boolean;
  tokens: string[];
} {
  const slotSpec = normalizeSpecText(slot.targetSpecialty);
  if (slotSpec) {
    return { hasExplicitSpec: true, tokens: expandSpecTokens(slotSpec) };
  }

  if (isSlotExplicitTroncCommun(slot)) {
    return { hasExplicitSpec: false, tokens: [] };
  }

  const subjNorm = normalizeSpecText(slot.subject);
  const lvlNorm = normalizeSpecText(slot.targetLevel);
  const isLyceeLevel =
    !lvlNorm ||
    lvlNorm.includes("terminale") ||
    lvlNorm.includes("tle") ||
    lvlNorm.includes("1ere") ||
    lvlNorm.includes("premiere") ||
    lvlNorm.includes("eaf") ||
    lvlNorm.includes("tous");

  if (/\beam specialite\b/.test(subjNorm)) {
    return { hasExplicitSpec: true, tokens: ["specialite"] };
  }

  if (isLyceeLevel) {
    const matches = subjNorm.match(
      /\b(hggsp|ses|svt|amc|nsi|hlp|llce|llcer|pc|physique|chimie|maths|mathematiques|si)\b/g
    );
    if (matches && matches.length > 0) {
      return { hasExplicitSpec: true, tokens: Array.from(new Set(matches)) };
    }
  }

  return { hasExplicitSpec: false, tokens: [] };
}

/**
 * Checks if a candidate is eligible for a specific exam slot based on level,
 * Tiers-Temps rules, specialty matching, and explicit per-slot assignment.
 */
export function isCandidateEligibleForSlot(
  cand: CmsCandidate,
  exam: Pick<CmsExam, "id" | "title" | "targetLevel" | "targetLevels"> | null | undefined,
  slot: CmsExamSlot,
  opts: { ignoreExistingAssignment?: boolean; allowMissingSpecialty?: boolean } = {}
): boolean {
  if (!opts.ignoreExistingAssignment && cand.assignmentsBySlot?.[slot.id]?.roomName) {
    return true;
  }

  const parentFallbackLevels = exam ? getExamTargetLevels(exam) : [];
  const slotLevels = slot.targetLevel
    ? slot.targetLevel
    : parentFallbackLevels.length > 0
      ? parentFallbackLevels
      : "Tous niveaux";

  if (!isCandidateMatchingLevel(cand.className, slotLevels)) {
    return false;
  }

  const isCandTT = isCandidateTiersTemps(cand);
  const subjNorm = normalizeSpecText(slot.subject);
  if (!isCandTT && /\btiers[\s-]*temps\b/.test(subjNorm)) {
    return false;
  }

  const candSpecs = normalizeSpecText(
    [cand.specialty || "", ...(Array.isArray(cand.options) ? cand.options : [])].join(" ")
  );

  const { hasExplicitSpec, tokens } = extractSlotSpecialtyTokens(slot);
  if (hasExplicitSpec && tokens.length > 0) {
    if (!candSpecs) {
      return Boolean(opts.allowMissingSpecialty);
    }
    if (!tokens.some((tok) => candidateHasSpecialtyToken(candSpecs, tok))) {
      return false;
    }
  }

  return true;
}

/**
 * Filters exam slots strictly for a given candidate's exam session, school level, and specialties,
 * enforcing ZERO time overlap (at most 1 épreuve per overlapping time window on any date)
 * and sorting chronologically (date asc, startTime asc).
 */
export function getCandidateMatchingSlots(
  cand: CmsCandidate,
  exam: Pick<CmsExam, "id" | "title" | "targetLevel" | "targetLevels" | "mobilizedRoomIds"> | null | undefined,
  allSlots: CmsExamSlot[]
): CmsExamSlot[] {
  const examTitleNorm = exam?.title?.trim().toLowerCase() || "";
  const scopedSlots = exam
    ? allSlots.filter(
        (s) =>
          s.examId === exam.id ||
          (examTitleNorm && (s.examTitle || "").trim().toLowerCase() === examTitleNorm)
      )
    : allSlots;

  const isCandTT = isCandidateTiersTemps(cand);
  const candSpecs = normalizeSpecText(
    [cand.specialty || "", ...(Array.isArray(cand.options) ? cand.options : [])].join(" ")
  );
  const legacyExamRoom = exam
    ? (getCandidateAssignmentForExam(cand, exam, allSlots).roomName || "").trim().toLowerCase()
    : "";

  const matched = scopedSlots.filter((slot) =>
    isCandidateEligibleForSlot(cand, exam, slot, {
      ignoreExistingAssignment: false,
      allowMissingSpecialty: false,
    })
  );

  const sorted = [...matched].sort((a, b) => {
    const dateCmp = (a.date || "").localeCompare(b.date || "");
    if (dateCmp !== 0) return dateCmp;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });

  // Strict anti-overlap deduplication: cluster any slots whose (date, startTime..endTime) overlap
  const scoreSlot = (slot: CmsExamSlot): number => {
    let score = 0;
    if (cand.assignmentsBySlot?.[slot.id]?.roomName) score += 10000;
    const subjNorm = normalizeSpecText(slot.subject);
    const isSlotTT = /\btiers[\s-]*temps\b/.test(subjNorm);
    if (isCandTT && isSlotTT) score += 1000;
    if (!isCandTT && isSlotTT) score -= 5000;
    const { hasExplicitSpec, tokens } = extractSlotSpecialtyTokens(slot);
    if (hasExplicitSpec && candSpecs && tokens.some((tok) => candidateHasSpecialtyToken(candSpecs, tok))) {
      score += 300;
    }
    if (isSlotExplicitTroncCommun(slot)) score += 150;
    if (
      legacyExamRoom &&
      Array.isArray(slot.roomNames) &&
      slot.roomNames.some((r) => r.trim().toLowerCase() === legacyExamRoom)
    ) {
      score += 50;
    }
    return score;
  };

  const resolved: CmsExamSlot[] = [];
  for (const slot of sorted) {
    const overlappingIndices: number[] = [];
    resolved.forEach((existing, idx) => {
      if (slotsTimeOverlap(existing, slot)) {
        overlappingIndices.push(idx);
      }
    });

    if (overlappingIndices.length === 0) {
      resolved.push(slot);
    } else {
      const candidateScore = scoreSlot(slot);
      const bestExistingScore = Math.max(
        ...overlappingIndices.map((i) => scoreSlot(resolved[i]))
      );
      if (candidateScore > bestExistingScore) {
        // Replace all overlapping lower-priority slots with this winning slot
        const keep = resolved.filter((_, i) => !overlappingIndices.includes(i));
        keep.push(slot);
        resolved.length = 0;
        resolved.push(...keep);
      }
    }
  }

  return resolved.sort((a, b) => {
    const dateCmp = (a.date || "").localeCompare(b.date || "");
    if (dateCmp !== 0) return dateCmp;
    const minA = parseTimeMinutes(a.startTime);
    const minB = parseTimeMinutes(b.startTime);
    if (minA !== null && minB !== null && minA !== minB) return minA - minB;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });
}

/**
 * Distributes `totalCount` candidates evenly across `roomList` without exceeding
 * each room's quota unless `totalCount` exceeds the sum of all room quotas.
 */
export function computeBalancedRoomTargets(
  roomList: CmsRoom[],
  totalCount: number,
  getQuota: (room: CmsRoom) => number
): number[] {
  const n = roomList.length;
  if (n === 0 || totalCount <= 0) return new Array(n).fill(0);
  const quotas = roomList.map((r) => Math.max(0, getQuota(r)));
  const targets = new Array(n).fill(0);
  let remaining = totalCount;

  while (remaining > 0) {
    let minLoad = Infinity;
    for (let i = 0; i < n; i++) {
      if (targets[i] < quotas[i] && targets[i] < minLoad) {
        minLoad = targets[i];
      }
    }
    if (!Number.isFinite(minLoad)) break;
    let progressed = false;
    for (let i = 0; i < n && remaining > 0; i++) {
      if (targets[i] < quotas[i] && targets[i] === minLoad) {
        targets[i]++;
        remaining--;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  let idx = 0;
  while (remaining > 0) {
    targets[idx % n]++;
    remaining--;
    idx++;
  }

  return targets;
}

/**
 * Scores how well a given exam slot matches a candidate's profile (Tiers-Temps,
 * specialty vs Tronc Commun, and optional shared-room TT role).
 */
export function scoreSlotForCandidateProfile(
  cand: CmsCandidate,
  slot: CmsExamSlot,
  opts: { isRoomTTInSlot?: boolean; slotHasAnyTTRoom?: boolean } = {}
): number {
  let score = 0;
  const isCandTT = isCandidateTiersTemps(cand);
  const slotMentionsTT = /\b(tiers[\s-]*temps|tt)\b/i.test(slot.subject || "");

  if (opts.isRoomTTInSlot !== undefined) {
    if (isCandTT && opts.isRoomTTInSlot) score += 150;
    else if (!isCandTT && opts.isRoomTTInSlot) score -= 150;
  }

  if (isCandTT) {
    if (slotMentionsTT) score += 200;
    else if (opts.slotHasAnyTTRoom) score += 60;
  } else {
    if (slotMentionsTT) score -= 500;
  }

  const candSpecsNorm = normalizeSpecText(
    [cand.specialty || "", ...(Array.isArray(cand.options) ? cand.options : [])].join(" ")
  );
  const slotIsExplicitTC = isSlotExplicitTroncCommun(slot);
  const { hasExplicitSpec, tokens } = extractSlotSpecialtyTokens(slot);

  if (candSpecsNorm) {
    if (hasExplicitSpec && tokens.some((tok) => candidateHasSpecialtyToken(candSpecsNorm, tok))) {
      score += 300;
    } else if (hasExplicitSpec) {
      score += 100;
    } else if (slotIsExplicitTC) {
      score += 30;
    }
  } else {
    if (slotIsExplicitTC) score += 50;
    else if (!hasExplicitSpec) score += 20;
  }

  if (cand.assignmentsBySlot?.[slot.id]?.roomName) {
    score += 10;
  }

  return score;
}

/**
 * Resolves the exact owner slot in `candidateSlots` for a candidate placed in `roomId`.
 * - If a single slot owns `roomId`, returns that slot strictly.
 * - If multiple slots share `roomId`, picks the best-matching slot for the candidate's profile.
 */
export function resolveOwnerSlotForRoomAndCandidate(
  roomId: string,
  cand: CmsCandidate,
  exam: Pick<CmsExam, "id" | "title" | "targetLevel" | "targetLevels"> | null | undefined,
  candidateSlots: CmsExamSlot[],
  getSlotRoomIds: (slot: CmsExamSlot) => string[],
  getSlotTTRoomIds: (slot: CmsExamSlot, slotRoomIds: string[]) => string[]
): CmsExamSlot | null {
  if (candidateSlots.length === 0) return null;

  const owners = roomId
    ? candidateSlots.filter((sl) => getSlotRoomIds(sl).includes(roomId))
    : [];

  if (owners.length === 1) {
    return owners[0];
  }

  const poolBase = owners.length > 1 ? owners : candidateSlots;
  const eligible = poolBase.filter((sl) =>
    isCandidateEligibleForSlot(cand, exam, sl, {
      ignoreExistingAssignment: true,
      allowMissingSpecialty: true,
    })
  );
  const pool = eligible.length > 0 ? eligible : poolBase;

  let best = pool[0];
  let bestScore = -Infinity;

  for (const sl of pool) {
    const sRooms = getSlotRoomIds(sl);
    const sTT = getSlotTTRoomIds(sl, sRooms);
    const sc = scoreSlotForCandidateProfile(cand, sl, {
      isRoomTTInSlot: roomId ? sTT.includes(roomId) : undefined,
      slotHasAnyTTRoom: sTT.length > 0,
    });
    if (sc > bestScore) {
      bestScore = sc;
      best = sl;
    }
  }

  return best;
}

/**
 * Formats a table number cleanly (e.g. "4" -> "04").
 */
export function formatConvocationTableNumber(tableNumber?: string): string {
  const clean = (tableNumber || "").trim();
  if (!clean) return "";
  return /^\d+$/.test(clean) ? clean.padStart(2, "0") : clean;
}

/**
 * Formats the exact Room & Table string for convocations (e.g. "S1 • Table 04"),
 * or returns "Non affecté" when no room has been assigned yet for the slot.
 */
export function formatConvocationRoomAndTable(roomName?: string, tableNumber?: string): string {
  const cleanRoom = (roomName || "").trim();
  if (!cleanRoom) return "Non affecté";
  const formattedTable = formatConvocationTableNumber(tableNumber);
  return formattedTable ? `${cleanRoom} • Table ${formattedTable}` : cleanRoom;
}

/**
 * Checks whether a candidate can be assigned to a target slot without overlapping
 * an already-assigned slot on the same date & time window.
 */
export function canAssignCandidateToSlot(
  cand: CmsCandidate,
  targetSlot: CmsExamSlot,
  examSlots: CmsExamSlot[]
): { allowed: boolean; conflictingSlot?: CmsExamSlot; conflictingRoom?: string } {
  for (const other of examSlots) {
    if (other.id === targetSlot.id) continue;
    if (!slotsTimeOverlap(other, targetSlot)) continue;
    const existing = cand.assignmentsBySlot?.[other.id];
    if (existing?.roomName) {
      return {
        allowed: false,
        conflictingSlot: other,
        conflictingRoom: existing.roomName,
      };
    }
  }
  return { allowed: true };
}

export interface ScheduleConflictItem {
  candidate: CmsCandidate;
  slotA: CmsExamSlot;
  slotB: CmsExamSlot;
  kind: "assigned_overlap" | "eligible_overlap";
  roomA?: string;
  roomB?: string;
}

/**
 * Detects any time-overlapping slots for candidates in an exam:
 * - "assigned_overlap": candidate was somehow assigned to 2 overlapping slots
 * - "eligible_overlap": two compatible slots (level + specialty) for the candidate overlap in time
 */
export function detectExamScheduleConflicts(
  candidates: CmsCandidate[],
  exam: Pick<CmsExam, "id" | "title" | "targetLevel" | "targetLevels" | "mobilizedRoomIds"> | null | undefined,
  examSlots: CmsExamSlot[]
): ScheduleConflictItem[] {
  if (!exam || examSlots.length < 2) return [];
  const examTitleNorm = (exam.title || "").trim().toLowerCase();
  const scopedSlots = examSlots
    .filter(
      (s) =>
        s.examId === exam.id ||
        (examTitleNorm && (s.examTitle || "").trim().toLowerCase() === examTitleNorm)
    )
    .sort((a, b) => {
      const d = (a.date || "").localeCompare(b.date || "");
      if (d !== 0) return d;
      const mA = parseTimeMinutes(a.startTime) ?? 0;
      const mB = parseTimeMinutes(b.startTime) ?? 0;
      return mA - mB;
    });

  const conflicts: ScheduleConflictItem[] = [];

  for (const cand of candidates) {
    const assignedInExam = scopedSlots.filter((s) =>
      Boolean(cand.assignmentsBySlot?.[s.id]?.roomName)
    );
    let hasAssignedPair = false;
    for (let i = 0; i < assignedInExam.length; i++) {
      for (let j = i + 1; j < assignedInExam.length; j++) {
        if (slotsTimeOverlap(assignedInExam[i], assignedInExam[j])) {
          hasAssignedPair = true;
          conflicts.push({
            candidate: cand,
            slotA: assignedInExam[i],
            slotB: assignedInExam[j],
            kind: "assigned_overlap",
            roomA: cand.assignmentsBySlot?.[assignedInExam[i].id]?.roomName,
            roomB: cand.assignmentsBySlot?.[assignedInExam[j].id]?.roomName,
          });
        }
      }
    }

    if (!hasAssignedPair) {
      const compatibleSlots = scopedSlots.filter((s) =>
        isCandidateEligibleForSlot(cand, exam, s, {
          ignoreExistingAssignment: true,
          allowMissingSpecialty: false,
        })
      );
      for (let i = 0; i < compatibleSlots.length; i++) {
        for (let j = i + 1; j < compatibleSlots.length; j++) {
          if (slotsTimeOverlap(compatibleSlots[i], compatibleSlots[j])) {
            const subjA = normalizeSpecText(compatibleSlots[i].subject);
            const subjB = normalizeSpecText(compatibleSlots[j].subject);
            const isTwinTT =
              (/\btiers[\s-]*temps\b/.test(subjA) && !/\btiers[\s-]*temps\b/.test(subjB)) ||
              (!/\btiers[\s-]*temps\b/.test(subjA) && /\btiers[\s-]*temps\b/.test(subjB));
            if (isTwinTT) continue;
            conflicts.push({
              candidate: cand,
              slotA: compatibleSlots[i],
              slotB: compatibleSlots[j],
              kind: "eligible_overlap",
            });
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Resolves the precise room, table number, and anonymat assigned to a candidate
 * strictly for a specific exam slot. Never leaks assignments across unrelated slots
 * and returns empty roomName ("Non affecté") until dispatch is explicitly run for the slot.
 */
export function getCandidateAssignmentForSlot(
  cand: CmsCandidate,
  exam: Pick<CmsExam, "id" | "title" | "mobilizedRoomIds"> | null | undefined,
  slot: CmsExamSlot,
  allSlots: CmsExamSlot[] = [],
  allRooms: CmsRoom[] = []
): CandidateExamAssignment {
  const slotAssign = cand.assignmentsBySlot?.[slot.id];
  if (slotAssign && slotAssign.roomName) {
    return {
      roomName: slotAssign.roomName,
      tableNumber: slotAssign.tableNumber || "",
      anonymatNumber: slotAssign.anonymatNumber || "",
    };
  }

  const slotRooms = Array.isArray(slot.roomNames) ? slot.roomNames.filter(Boolean) : [];
  const examAssign = getCandidateAssignmentForExam(cand, exam, allSlots, allRooms);

  // Check whether candidate already uses per-slot assignments in this exam
  const examTitleNorm = exam?.title?.trim().toLowerCase() || "";
  const examSlotIds = new Set(
    allSlots
      .filter((s) => !exam || s.examId === exam.id || (examTitleNorm && (s.examTitle || "").trim().toLowerCase() === examTitleNorm))
      .map((s) => s.id)
  );
  const hasAnySlotAssignInExam = Boolean(
    cand.assignmentsBySlot &&
      Object.entries(cand.assignmentsBySlot).some(
        ([sId, a]) => Boolean(a?.roomName) && ((!exam && examSlotIds.has(sId)) || (exam && (a.examId === exam.id || examSlotIds.has(sId))))
      )
  );

  if (hasAnySlotAssignInExam) {
    return {
      roomName: "",
      tableNumber: "",
      anonymatNumber: examAssign.anonymatNumber || "",
    };
  }

  // Legacy exam-level fallback (only if candidate has NO per-slot assignments yet in this exam)
  if (examAssign.roomName) {
    if (slotRooms.length === 0) return examAssign;
    const matchInSlot = slotRooms.find(
      (r) => r.trim().toLowerCase() === examAssign.roomName.trim().toLowerCase()
    );
    if (matchInSlot) {
      return {
        roomName: matchInSlot,
        tableNumber: examAssign.tableNumber,
        anonymatNumber: examAssign.anonymatNumber,
      };
    }
  }

  return {
    roomName: "",
    tableNumber: "",
    anonymatNumber: examAssign.anonymatNumber || "",
  };
}

/**
 * Resolves the precise room assigned to a candidate for a specific exam slot.
 * Never returns a multi-room list.
 */
export function getCandidateSlotRoom(
  cand: CmsCandidate,
  exam: Pick<CmsExam, "id" | "title" | "mobilizedRoomIds"> | null | undefined,
  slot: CmsExamSlot,
  allSlots: CmsExamSlot[] = [],
  allRooms: CmsRoom[] = []
): string {
  return getCandidateAssignmentForSlot(cand, exam, slot, allSlots, allRooms).roomName;
}

/**
 * Summarizes the top-box room/table display for a candidate convocation:
 * returns singleRoom/singleTable if identical across all épreuves, or hasMultipleLocations=true
 * ("Voir tableau ci-dessous") when rooms vary across épreuves.
 */
export function summarizeCandidateConvocationLocation(
  cand: CmsCandidate,
  exam: Pick<CmsExam, "id" | "title" | "mobilizedRoomIds"> | null | undefined,
  matchingSlots: CmsExamSlot[],
  allSlots: CmsExamSlot[] = [],
  allRooms: CmsRoom[] = []
): {
  singleRoom: string;
  singleTable: string;
  hasMultipleLocations: boolean;
  anonymatNumber: string;
} {
  const examAssign = getCandidateAssignmentForExam(cand, exam, allSlots, allRooms);
  const slotAssigns = matchingSlots.map((slot) =>
    getCandidateAssignmentForSlot(cand, exam, slot, allSlots, allRooms)
  );

  const distinctRooms = Array.from(
    new Set(slotAssigns.map((a) => a.roomName.trim()).filter(Boolean))
  );
  const distinctTables = Array.from(
    new Set(slotAssigns.map((a) => a.tableNumber.trim()).filter(Boolean))
  );
  const firstAnon =
    slotAssigns.map((a) => a.anonymatNumber.trim()).find(Boolean) ||
    examAssign.anonymatNumber ||
    "";

  if (distinctRooms.length > 1) {
    return {
      singleRoom: "",
      singleTable: "",
      hasMultipleLocations: true,
      anonymatNumber: firstAnon,
    };
  }

  if (distinctRooms.length === 1) {
    const hasUnassignedSlots = slotAssigns.some((a) => !a.roomName.trim());
    if (hasUnassignedSlots) {
      return {
        singleRoom: "",
        singleTable: "",
        hasMultipleLocations: true,
        anonymatNumber: firstAnon,
      };
    }
    return {
      singleRoom: distinctRooms[0],
      singleTable: distinctTables.length === 1 ? distinctTables[0] : "",
      hasMultipleLocations: false,
      anonymatNumber: firstAnon,
    };
  }

  if (matchingSlots.length === 0 && examAssign.roomName) {
    return {
      singleRoom: examAssign.roomName,
      singleTable: examAssign.tableNumber,
      hasMultipleLocations: false,
      anonymatNumber: firstAnon,
    };
  }

  return {
    singleRoom: "",
    singleTable: "",
    hasMultipleLocations: false,
    anonymatNumber: firstAnon,
  };
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
  ttRoomIds?: string[];
  customRoomQuotas?: Record<string, number>;
  dispatchMode?: "brassage" | "alphabetique" | "classe" | "specialite";
  anonymatPrefix?: string;
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
  assignmentsBySlot?: Record<string, CandidateSlotAssignment>;
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
  const dataRef = useRef<CmsData>(data);
  dataRef.current = data;

  const commitUpdate = (updater: (curr: CmsData) => CmsData): CmsData => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    saveCmsData(next);
    setData(next);
    return next;
  };

  useEffect(() => {
    const handleUpdate = () => {
      const fresh = getCmsData();
      dataRef.current = fresh;
      setData(fresh);
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
        const synced = getCmsData();
        dataRef.current = synced;
        setData(synced);
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
    commitUpdate((curr) => ({
      ...curr,
      exams: curr.exams.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
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

    // 4. Cascade reset candidate room assignments for this specific exam & its slots
    const remainingCandidates = (data.candidates || []).map((c) => {
      const nextByExam = c.assignmentsByExam ? { ...c.assignmentsByExam } : undefined;
      if (nextByExam) {
        delete nextByExam[id];
      }
      const nextBySlot = c.assignmentsBySlot ? { ...c.assignmentsBySlot } : undefined;
      if (nextBySlot) {
        Object.keys(nextBySlot).forEach((sId) => {
          if (deletedSlotIds.has(sId) || nextBySlot[sId]?.examId === id) {
            delete nextBySlot[sId];
          }
        });
      }
      if (examTitle && c.examName?.trim().toLowerCase() === examTitle) {
        return {
          ...c,
          roomName: "",
          tableNumber: "",
          anonymatNumber: "",
          ...(nextByExam ? { assignmentsByExam: nextByExam } : {}),
          ...(nextBySlot ? { assignmentsBySlot: nextBySlot } : {}),
        };
      }
      return {
        ...c,
        ...(nextByExam ? { assignmentsByExam: nextByExam } : {}),
        ...(nextBySlot ? { assignmentsBySlot: nextBySlot } : {}),
      };
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
    commitUpdate((curr) => ({
      ...curr,
      candidates: newCandidates,
      updatedAt: new Date().toISOString(),
      siteInfo: {
        ...curr.siteInfo,
        pendingDeployment: {
          savedAt: new Date().toISOString(),
          savedBy: "Import Pronote",
          notes: `${newCandidates.length} élèves importés`,
          requestedAt: new Date().toISOString(),
          requestedBy: "Import Pronote",
          summary: `${newCandidates.length} élèves importés`,
        },
      },
    }));
  };

  // Exam Slots
  const addExamSlot = (item: Omit<CmsExamSlot, "id">) => {
    const newItem: CmsExamSlot = { ...item, id: `slot-${Date.now()}` };
    commitUpdate((curr) => ({
      ...curr,
      examSlots: [...(curr.examSlots || []), newItem],
    }));
  };

  const updateExamSlot = (id: string, updates: Partial<CmsExamSlot>) => {
    commitUpdate((curr) => ({
      ...curr,
      examSlots: (curr.examSlots || []).map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteExamSlot = (id: string) => {
    commitUpdate((curr) => {
      const nextCandidates = (curr.candidates || []).map((c) => {
        if (!c.assignmentsBySlot || !c.assignmentsBySlot[id]) return c;
        const nextBySlot = { ...c.assignmentsBySlot };
        delete nextBySlot[id];
        return { ...c, assignmentsBySlot: nextBySlot };
      });
      return {
        ...curr,
        examSlots: (curr.examSlots || []).filter((s) => s.id !== id),
        surveillances: (curr.surveillances || []).filter((s) => s.slotId !== id),
        candidates: nextCandidates,
      };
    });
  };

  const setExamSlots = (newSlots: CmsExamSlot[]) => {
    commitUpdate((curr) => ({ ...curr, examSlots: newSlots }));
  };

  const setSurveillances = (newSurvs: CmsSurveillance[]) => {
    commitUpdate((curr) => ({ ...curr, surveillances: newSurvs }));
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

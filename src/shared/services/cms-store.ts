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
  priority: "information" | "important" | "urgent";
  target: "all" | "bac" | "dnb" | "teachers";
  isPublished: boolean;
  date: string;
}

export interface CmsExam {
  id: string;
  title: string;
  examType: string;
  targetLevel: string;
  period: string;
  startsAt: string;
  endsAt: string;
  description: string;
  status: "Prévu" | "En cours" | "Terminé" | "Archivé";
  isPublished?: boolean;
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
  tableNumber?: string;
  anonymatNumber?: string;
}

export interface CmsData {
  version: string;
  updatedAt: string;
  siteInfo: SiteInfo;
  callouts: CmsCallout[];
  announcements: CmsAnnouncement[];
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
      exams: Array.isArray(parsed.exams)
        ? parsed.exams.map((e) => ({ ...e, isPublished: e.isPublished !== false }))
        : DEFAULT_CMS_DATA.exams.map((e) => ({ ...e, isPublished: true })),
      examSlots: Array.isArray(parsed.examSlots)
        ? parsed.examSlots
        : DEFAULT_CMS_DATA.examSlots,
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : DEFAULT_CMS_DATA.rooms,
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : DEFAULT_CMS_DATA.teachers,
      surveillances: (() => {
        const rawSurvs = Array.isArray(parsed.surveillances)
          ? parsed.surveillances
          : DEFAULT_CMS_DATA.surveillances;
        const examsList = Array.isArray(parsed.exams) ? parsed.exams : DEFAULT_CMS_DATA.exams;
        if (examsList.length === 0) return [];
        const validTitles = new Set(examsList.map((e) => e.title?.trim().toLowerCase()).filter(Boolean));
        const validSlotIds = new Set((Array.isArray(parsed.examSlots) ? parsed.examSlots : []).map((s) => s.id));
        return rawSurvs.filter((s) => {
          const hasSlot = s.slotId && validSlotIds.has(s.slotId);
          const hasExam = s.examTitle && validTitles.has(s.examTitle.trim().toLowerCase());
          return hasSlot || hasExam;
        });
      })(),
      candidates: Array.isArray(parsed.candidates)
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
export function saveCmsData(data: CmsData, preserveTimestamp = false): void {
  if (typeof window === "undefined") return;
  const toSave: CmsData = {
    ...data,
    updatedAt: preserveTimestamp && data.updatedAt ? data.updatedAt : new Date().toISOString(),
  };
  localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(toSave));
  window.dispatchEvent(new Event(CMS_EVENT_NAME));
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

    // Automatic multi-browser synchronization from deployed /cms-data.json
    const syncFromRemote = async () => {
      try {
        const res = await fetch(`/cms-data.json?_t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const remote = (await res.json()) as CmsData;
        if (!remote || typeof remote !== "object" || !remote.siteInfo || !Array.isArray(remote.exams)) return;

        const rawLocal = localStorage.getItem(CMS_STORAGE_KEY);
        if (!rawLocal) {
          saveCmsData(remote, true);
          setData(remote);
          return;
        }

        const local = JSON.parse(rawLocal) as Partial<CmsData>;
        const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
        const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;

        // CRITICAL PROTECTION: If this browser has made any local changes (localTime >= remoteTime),
        // or has local imported data (candidates, rooms, teachers, exams) or pending deployment,
        // NEVER overwrite local data with remote!
        const hasLocalCandidates = Array.isArray(local.candidates) && local.candidates.length > 0;
        const hasLocalRooms = Array.isArray(local.rooms) && local.rooms.length > 0;
        const hasLocalTeachers = Array.isArray(local.teachers) && local.teachers.length > 0;
        const hasLocalExams = Array.isArray(local.exams) && local.exams.length > 0;
        const hasPendingDeployment = Boolean(local.siteInfo?.pendingDeployment);

        // If local has active changes or was modified after the remote deployment, strictly protect local work
        if (localTime >= remoteTime || hasPendingDeployment) {
          return;
        }

        // Only adopt remote if remote is strictly NEWER than local cache AND local has no unpushed data
        if (remoteTime > localTime) {
          const remoteIsEmpty = (!remote.candidates || remote.candidates.length === 0) &&
                                (!remote.rooms || remote.rooms.length === 0) &&
                                (!remote.teachers || remote.teachers.length === 0);
          const localHasData = hasLocalCandidates || hasLocalRooms || hasLocalTeachers || hasLocalExams;

          if (localHasData && remoteIsEmpty) {
            // Protect local work from being wiped out by an empty remote
            return;
          }

          saveCmsData(remote, true);
          setData(getCmsData());
        }
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

    // Periodic check every 20 seconds for multi-device harmony
    const syncInterval = setInterval(syncFromRemote, 20000);

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

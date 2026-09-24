import { useState, useEffect } from "react";
import {
  HOME_PAGE_CONTENT,
  HOME_CALLOUT_ENTRIES,
  type HomeCalloutCategory,
} from "../../features/home/constants";

export interface SiteInfo {
  title: string;
  subtitle: string;
  description: string;
  schoolYear: string;
  logos: Array<{ src: string; alt?: string }>;
  bannerAlert: {
    enabled: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "urgent" | "success";
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

export interface CmsSurveillance {
  id: string;
  examTitle: string;
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
}

export interface CmsData {
  version: string;
  updatedAt: string;
  siteInfo: SiteInfo;
  callouts: CmsCallout[];
  announcements: CmsAnnouncement[];
  exams: CmsExam[];
  rooms: CmsRoom[];
  teachers: CmsTeacher[];
  surveillances: CmsSurveillance[];
  candidates: CmsCandidate[];
}

const CMS_STORAGE_KEY = "lfjp_examens_cms_data_v1";
const CMS_EVENT_NAME = "lfjp_cms_updated";

// Default initial state built directly from the school's existing data
export const DEFAULT_CMS_DATA: CmsData = {
  version: "1.0.0",
  updatedAt: new Date().toISOString(),
  siteInfo: {
    title: HOME_PAGE_CONTENT.title,
    subtitle: HOME_PAGE_CONTENT.subtitle,
    description: HOME_PAGE_CONTENT.description,
    schoolYear: "2025-2026",
    logos: [...HOME_PAGE_CONTENT.logos],
    bannerAlert: {
      enabled: false,
      title: "Consigne d'organisation des épreuves",
      message: "Veuillez vous présenter 15 minutes avant le début de chaque épreuve muni de votre convocation et d'une pièce d'identité.",
      type: "info",
    },
  },
  callouts: HOME_CALLOUT_ENTRIES.map((entry, index) => ({
    id: `callout-${index + 1}`,
    to: entry.to,
    iconLabel: entry.iconLabel,
    subtitle: entry.subtitle,
    title: entry.title,
    dateLabel: entry.dateLabel,
    date: entry.date,
    footerLabel: entry.footerLabel,
    category: entry.category,
    isPublished: true,
    order: index + 1,
  })),
  announcements: [
    {
      id: "ann-1",
      title: "Rappel des horaires de convocation",
      content: "Les candidats doivent se présenter 15 minutes avant l'heure indiquée sur la convocation avec leur pièce d'identité et leur matériel obligatoire.",
      priority: "important",
      target: "all",
      isPublished: true,
      date: "2026-02-01",
    },
    {
      id: "ann-2",
      title: "Calculatrices autorisées en mode examen",
      content: "Pour les épreuves de mathématiques et de sciences, les calculatrices doivent obligatoirement être activées en mode examen dès l'entrée en salle.",
      priority: "information",
      target: "bac",
      isPublished: true,
      date: "2026-02-10",
    },
    {
      id: "ann-3",
      title: "Émargement des feuilles de surveillance",
      content: "Mesdames et Messieurs les enseignants surveillants sont priés de remettre les pochettes d'émargement au secrétariat des examens dès la fin de l'épreuve.",
      priority: "urgent",
      target: "teachers",
      isPublished: true,
      date: "2026-02-12",
    },
  ],
  exams: [
    {
      id: "exam-1",
      title: "Baccalauréat blanc 1ère et Terminale (Session Décembre)",
      examType: "Baccalauréat blanc",
      targetLevel: "1ère & Terminale",
      period: "10, 11 et 12 décembre 2025",
      startsAt: "2025-12-10T08:00",
      endsAt: "2025-12-12T17:00",
      description: "Épreuves écrites complètes toutes spécialités pour les élèves de première et terminale.",
      status: "Terminé",
    },
    {
      id: "exam-2",
      title: "DNB blanc ZAO",
      examType: "DNB blanc",
      targetLevel: "3ème",
      period: "3 et 4 février 2026",
      startsAt: "2026-02-03T08:00",
      endsAt: "2026-02-04T16:30",
      description: "Épreuves écrites de français, mathématiques, histoire-géo et sciences pour les classes de troisième.",
      status: "Terminé",
    },
    {
      id: "exam-3",
      title: "Bac blanc de Mathématiques 1ère (Février)",
      examType: "Spécialité Mathématiques",
      targetLevel: "1ère Spé Maths",
      period: "13 février 2026",
      startsAt: "2026-02-13T08:00",
      endsAt: "2026-02-13T10:00",
      description: "Épreuve anticipée de spécialité mathématiques première.",
      status: "Terminé",
    },
    {
      id: "exam-4",
      title: "Baccalauréat blanc 1ère et Terminale (Session Avril)",
      examType: "Baccalauréat blanc",
      targetLevel: "1ère & Terminale",
      period: "7 au 10 avril 2026",
      startsAt: "2026-04-07T08:00",
      endsAt: "2026-04-10T17:00",
      description: "Épreuves blanches de printemps et EAF anticipées.",
      status: "Prévu",
    },
    {
      id: "exam-5",
      title: "Oraux blancs EAF 1ère (Session Avril)",
      examType: "Épreuves anticipées orales",
      targetLevel: "1ère",
      period: "13, 14 et 15 avril 2026",
      startsAt: "2026-04-13T08:00",
      endsAt: "2026-04-15T18:00",
      description: "Passations individuelles devant les examinateurs de français.",
      status: "Prévu",
    },
    {
      id: "exam-6",
      title: "Grand Oral Blanc",
      examType: "Grand Oral",
      targetLevel: "Terminale",
      period: "Vendredi 17 avril 2026",
      startsAt: "2026-04-17T08:00",
      endsAt: "2026-04-17T17:00",
      description: "Entraînement officiel au Grand Oral avec jury pluri-disciplinaire.",
      status: "Prévu",
    },
    {
      id: "exam-7",
      title: "Oraux du DNB",
      examType: "Épreuve orale DNB",
      targetLevel: "3ème",
      period: "20 mai 2026",
      startsAt: "2026-05-20T08:00",
      endsAt: "2026-05-20T17:00",
      description: "Soutenance de projet devant le jury pour les élèves de troisième.",
      status: "Prévu",
    },
  ],
  rooms: [
    { id: "room-1", name: "Salle S12", capacity: 24, building: "Bâtiment Secondaire", notes: "Sujets écrits généraux" },
    { id: "room-2", name: "Salle S14", capacity: 28, building: "Bâtiment Secondaire", notes: "Configuration examen standard" },
    { id: "room-3", name: "Salle Informatique 1", capacity: 18, building: "Bâtiment Scientifique", notes: "Postes informatiques équipés" },
    { id: "room-4", name: "Salle Polyvalente", capacity: 65, building: "Rez-de-chaussée", notes: "Grande capacité épreuves communes" },
    { id: "room-5", name: "Salle S04 (Tiers-Temps)", capacity: 12, building: "Bâtiment Administratif", notes: "Espace calme aménagements et PAI" },
    { id: "room-6", name: "Salle S08 (Oral)", capacity: 4, building: "Étage 1", notes: "Jury individuel d'oral" },
  ],
  teachers: [
    { id: "tea-1", civility: "Madame", firstName: "Fatou", lastName: "Diop", subject: "Lettres modernes", email: "fatou.diop@lfjpsaly.org" },
    { id: "tea-2", civility: "Monsieur", firstName: "Bastien", lastName: "Capel", subject: "Mathématiques", email: "bastien.capel@lfjpsaly.org" },
    { id: "tea-3", civility: "Madame", firstName: "Aïda", lastName: "Sow", subject: "Histoire-Géographie", email: "aida.sow@lfjpsaly.org" },
    { id: "tea-4", civility: "Monsieur", firstName: "David", lastName: "Lemoine", subject: "Sciences Physiques", email: "david.lemoine@lfjpsaly.org" },
    { id: "tea-5", civility: "Madame", firstName: "Sophie", lastName: "Diallo", subject: "SVT", email: "sophie.diallo@lfjpsaly.org" },
    { id: "tea-6", civility: "Monsieur", firstName: "Cheikh", lastName: "Ndiaye", subject: "Philosophie", email: "cheikh.ndiaye@lfjpsaly.org" },
  ],
  surveillances: [
    { id: "surv-1", examTitle: "Baccalauréat blanc 1ère et Terminale", teacherName: "M. Bastien Capel", roomName: "Salle S12", date: "2026-04-07", timeSlot: "08h00 - 12h00", mission: "Surveillance principale" },
    { id: "surv-2", examTitle: "Baccalauréat blanc 1ère et Terminale", teacherName: "Mme Sophie Diallo", roomName: "Salle S14", date: "2026-04-07", timeSlot: "08h00 - 12h00", mission: "Surveillance principale" },
    { id: "surv-3", examTitle: "Baccalauréat blanc 1ère et Terminale", teacherName: "M. David Lemoine", roomName: "Salle Polyvalente", date: "2026-04-07", timeSlot: "13h30 - 17h30", mission: "Surveillance & Distribution" },
    { id: "surv-4", examTitle: "Bac blanc de maths 1ère", teacherName: "Mme Aïda Sow", roomName: "Salle S04 (Tiers-Temps)", date: "2026-04-08", timeSlot: "08h00 - 11h00", mission: "Surveillance aménagements" },
  ],
  candidates: [
    { id: "cand-1", firstName: "Moussa", lastName: "Ba", className: "Terminale G1", examName: "Bac blanc 2026", roomName: "Salle S12", convocationTime: "07h45", accommodation: "Aucun" },
    { id: "cand-2", firstName: "Aminata", lastName: "Cissé", className: "Terminale G1", examName: "Bac blanc 2026", roomName: "Salle S12", convocationTime: "07h45", accommodation: "Aucun" },
    { id: "cand-3", firstName: "Lucas", lastName: "Dupont", className: "1ère G2", examName: "Bac blanc 2026", roomName: "Salle S04 (Tiers-Temps)", convocationTime: "07h30", accommodation: "Tiers-temps accordé" },
    { id: "cand-4", firstName: "Mariama", lastName: "Faye", className: "3ème A", examName: "DNB blanc", roomName: "Salle S14", convocationTime: "07h45", accommodation: "Aucun" },
  ],
};

/**
 * Reads the latest CMS data from localStorage with full fallback to defaults.
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
        bannerAlert: {
          ...DEFAULT_CMS_DATA.siteInfo.bannerAlert,
          ...(parsed.siteInfo?.bannerAlert || {}),
        },
      },
      callouts: Array.isArray(parsed.callouts) && parsed.callouts.length > 0
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
      exams: Array.isArray(parsed.exams) ? parsed.exams : DEFAULT_CMS_DATA.exams,
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : DEFAULT_CMS_DATA.rooms,
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : DEFAULT_CMS_DATA.teachers,
      surveillances: Array.isArray(parsed.surveillances) ? parsed.surveillances : DEFAULT_CMS_DATA.surveillances,
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : DEFAULT_CMS_DATA.candidates,
    };
  } catch (err) {
    console.error("Erreur lors de la lecture du CMS :", err);
    return DEFAULT_CMS_DATA;
  }
}

/**
 * Saves CMS data to localStorage and dispatches a notification event.
 */
export function saveCmsData(data: CmsData): void {
  if (typeof window === "undefined") return;
  const toSave: CmsData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(toSave));
  window.dispatchEvent(new Event(CMS_EVENT_NAME));
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
 */
export function useCmsData() {
  const [data, setData] = useState<CmsData>(() => getCmsData());

  useEffect(() => {
    const handleUpdate = () => {
      setData(getCmsData());
    };

    window.addEventListener(CMS_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(CMS_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateSiteInfo = (info: Partial<SiteInfo>) => {
    const next: CmsData = {
      ...data,
      siteInfo: {
        ...data.siteInfo,
        ...info,
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
    const next: CmsData = {
      ...data,
      exams: data.exams.filter((e) => e.id !== id),
    };
    saveCmsData(next);
    setData(next);
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

  const handleReset = () => {
    const fresh = resetCmsData();
    setData(fresh);
  };

  return {
    data,
    updateSiteInfo,
    addCallout,
    updateCallout,
    deleteCallout,
    reorderCallout,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addExam,
    updateExam,
    deleteExam,
    addRoom,
    updateRoom,
    deleteRoom,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addSurveillance,
    updateSurveillance,
    deleteSurveillance,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    resetToDefaults: handleReset,
  };
}

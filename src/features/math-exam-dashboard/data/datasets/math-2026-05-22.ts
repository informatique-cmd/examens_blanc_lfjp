import { defaultDashboardTabs, defaultTypeVariants } from "../common";
import {
  createTeacherDirectory,
  createTeacherDirectoryByShortName,
} from "../utils";
import type { MathExamDashboardData, RoomScheduleDay } from "../types";

const teacherDirectory = createTeacherDirectory([
  { civility: "Madame", lastName: "CAPEL", firstName: "Émilie" },
  { civility: "Monsieur", lastName: "FRAYON", firstName: "Arnaud" },
  { civility: "Monsieur", lastName: "NDOYE", firstName: "Abdoulaye" },
  { civility: "Monsieur", lastName: "SERVATE", firstName: "Samuel" },
]);

const roomSchedule: RoomScheduleDay[] = [
  {
    day: "Vendredi 22/05",
    rooms: {
      S10: [
        {
          time: "11h10 - 13h10",
          teacher: "SERVATE S.",
          detail: "Mathématiques 1ère",
          type: "mathematiques",
          highlight: true,
        },
      ],
      S13: [
        {
          time: "11h10 - 13h10",
          teacher: "FRAYON A.",
          detail: "Mathématiques 1ère",
          type: "mathematiques",
          highlight: true,
        },
      ],
      S14: [
        {
          time: "11h10 - 13h10",
          teacher: "NDOYE A.",
          detail: "Mathématiques 1ère",
          type: "mathematiques",
          highlight: true,
        },
      ],
      S15: [
        {
          time: "11h10 - 13h10",
          teacher: "CAPEL E.",
          detail: "Mathématiques 1ère",
          type: "mathematiques",
          highlight: true,
        },
      ],
    },
  },
];

export const mathExamDashboardData20260522: MathExamDashboardData = {
  header: {
    title: "Bac blanc de mathématiques 1ère",
    date: "Vendredi 22 mai 2026 • 11h10",
    reprographyDeadline: {
      label: "Mardi 19 mai 2026",
    },
  },
  keyFigures: [
    { value: "4", label: "Salles mobilisées" },
    { value: "52", label: "Candidats inscrits" },
    {
      value: "11h10",
      label: "Heure de début",
      extra: "Accueil des élèves dès 10h40",
    },
    {
      value: "2",
      unit: "h",
      label: "Durée de l'épreuve",
      extra: "Épreuve écrite de mathématiques",
    },
  ],
  accommodationGroups: [
    {
      icon: { Icon: defaultTypeVariants.support.icon, bg: "bg-emerald-100", color: "text-emerald-600" },
      title: "1ère – Aménagements prévus",
      description: "Élèves bénéficiant d'un tiers temps ou de dispositions particulières :",
      students: ["À compléter si nécessaire"],
      note: "Merci de signaler tout besoin complémentaire à la vie scolaire avant le 19 mai.",
      noteClasses: "bg-amber-100/80 text-amber-900",
    },
  ],
  teacherDirectory,
  teacherDirectoryByShortName: createTeacherDirectoryByShortName(teacherDirectory),
  surveillanceSchedule: [
    {
      teacher: "CAPEL E.",
      datetime: "vendredi 22/05 à 11h10",
      room: "S15",
      mission: "Bac blanc mathématiques 1ère",
      duration: "2:00:00",
      type: "mathematiques",
    },
    {
      teacher: "FRAYON A.",
      datetime: "vendredi 22/05 à 11h10",
      room: "S13",
      mission: "Bac blanc mathématiques 1ère",
      duration: "2:00:00",
      type: "mathematiques",
    },
    {
      teacher: "NDOYE A.",
      datetime: "vendredi 22/05 à 11h10",
      room: "S14",
      mission: "Bac blanc mathématiques 1ère",
      duration: "2:00:00",
      type: "mathematiques",
    },
    {
      teacher: "SERVATE S.",
      datetime: "vendredi 22/05 à 11h10",
      room: "S10",
      mission: "Bac blanc mathématiques 1ère",
      duration: "2:00:00",
      type: "mathematiques",
    },
  ],
  roomColumns: ["S10", "S13", "S14", "S15"],
  roomSchedule,
  examRooms: [
    { name: "S10", examCapacity: 13 },
    { name: "S13", examCapacity: 12 },
    { name: "S14", examCapacity: 12 },
    { name: "S15", examCapacity: 15 },
  ],
  defaultStudentCount: 52,
  typeVariants: defaultTypeVariants,
  dashboardTabs: defaultDashboardTabs,
};


// Alias de compatibilité pour les imports existants de la page 2026-05-23
export const mathExamDashboardData20260523 = mathExamDashboardData20260522;

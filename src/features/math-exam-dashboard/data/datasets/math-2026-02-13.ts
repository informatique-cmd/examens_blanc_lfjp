import { defaultDashboardTabs, defaultTypeVariants } from "../common";
import {
  createTeacherDirectory,
  createTeacherDirectoryByShortName,
} from "../utils";
import type { MathExamDashboardData, RoomScheduleDay } from "../types";

const teacherDirectory = createTeacherDirectory([
  { civility: "Madame", lastName: "MICHON GUILLAUME", firstName: "Mathilde" },
  { civility: "Madame", lastName: "MOURAIN DIOP", firstName: "Fanelly" },
  { civility: "Monsieur", lastName: "NDOYE", firstName: "Abdoulaye" },
  { civility: "Monsieur", lastName: "SERVATE", firstName: "Samuel" },
]);

const roomSchedule: RoomScheduleDay[] = [
  {
    day: "Vendredi 13/02",
    rooms: {
      S10: [
        {
          time: "09h00 - 11h00",
          teacher: "MOURAIN DIOP F.",
          detail: "Mathématiques",
          type: "mathematiques",
          highlight: true,
        },
      ],
      S12: [
        {
          time: "09h00 - 11h00",
          teacher: "NDOYE A.",
          detail: "Mathématiques",
          type: "mathematiques",
          highlight: true,
        },
      ],
      "S11 COOP": [
        {
          time: "09h00 - 11h00",
          teacher: "SERVATE S.",
          detail: "Mathématiques",
          type: "mathematiques",
          highlight: true,
        },
      ],
      S14: [
        {
          time: "09h00 - 11h00",
          teacher: "MICHON G. M.",
          detail: "Mathématiques",
          type: "mathematiques",
          highlight: true,
        },
      ],
    },
  },
];

export const mathExamDashboardData20260213: MathExamDashboardData = {
  header: {
    title: "Bac blanc de mathématiques",
    date: "Vendredi 13 février 2026 • 09h00",
    reprographyDeadline: {
      label: "Vendredi 6 février 2026",
    },
  },
  keyFigures: [
    { value: "4", label: "Salles mobilisées" },
    { value: "52", label: "Candidats inscrits" },
    {
      value: "09h00",
      label: "Heure de début",
      extra: "Accueil des élèves dès 8h30",
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
      title: "Terminale – Aménagements prévus",
      description: "Élèves bénéficiant d'un tiers temps ou de dispositions particulières :",
      students: ["À compléter si nécessaire"],
      note: "Informer la vie scolaire de tout besoin complémentaire au plus tard le 6 février.",
      noteClasses: "bg-amber-100/80 text-amber-900",
    },
  ],
  teacherDirectory,
  teacherDirectoryByShortName: createTeacherDirectoryByShortName(teacherDirectory),
  surveillanceSchedule: [
    {
      teacher: "MICHON GUILLAUME M.",
      datetime: "vendredi 13/02 à 09h00",
      room: "S14",
      mission: "Bac blanc de mathématiques",
      duration: "2:00:00",
      type: "mathematiques",
    },
    {
      teacher: "MOURAIN DIOP F.",
      datetime: "vendredi 13/02 à 09h00",
      room: "S10",
      mission: "Bac blanc de mathématiques",
      duration: "2:00:00",
      type: "mathematiques",
    },
    {
      teacher: "NDOYE A.",
      datetime: "vendredi 13/02 à 09h00",
      room: "S12",
      mission: "Bac blanc de mathématiques",
      duration: "2:00:00",
      type: "mathematiques",
    },
    {
      teacher: "SERVATE S.",
      datetime: "vendredi 13/02 à 09h00",
      room: "S11 COOP",
      mission: "Bac blanc de mathématiques",
      duration: "2:00:00",
      type: "mathematiques",
    },
  ],
  roomColumns: ["S10", "S12", "S11 COOP", "S14"],
  roomSchedule,
  examRooms: [
    { name: "S10", examCapacity: 13 },
    { name: "S12", examCapacity: 13 },
    { name: "S11 COOP", examCapacity: 12 },
    { name: "S14", examCapacity: 12 },
  ],
  defaultStudentCount: 52,
  typeVariants: defaultTypeVariants,
  dashboardTabs: defaultDashboardTabs,
};

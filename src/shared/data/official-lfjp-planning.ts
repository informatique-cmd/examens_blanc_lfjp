/**
 * Official Planning de surveillance des épreuves - Lycée Français Jacques Prévert (LFJP) Saly
 * Source: Document officiel Google Sheets / PDF (8 au 10 décembre)
 */

export interface OfficialSlotSurveillance {
  roomName: string;
  isTiersTemps?: boolean;
  subject?: string;
  subSlots: Array<{
    timeSlot: string;
    teacherName: string;
    note?: string;
  }>;
}

export interface OfficialPlanningSession {
  id: string;
  jour: string; // e.g. "mardi 8/12"
  creneau: "Matin" | "Après-midi";
  date: string; // "2026-12-08"
  startTime: string; // "08:00"
  endTime: string; // "12:00"
  tiersTempsEndTime: string; // "13:20"
  examTitle: string;
  subjectTitle: string;
  rooms: OfficialSlotSurveillance[];
  renfort?: string;
}

export const OFFICIAL_LFJP_PLANNING_SESSIONS: OfficialPlanningSession[] = [
  {
    id: "session-mardi-matin",
    jour: "mardi 8/12",
    creneau: "Matin",
    date: "2026-12-08",
    startTime: "08:00",
    endTime: "12:00",
    tiersTempsEndTime: "13:20",
    examTitle: "EXAMEN BLANC DECEMBRE",
    subjectTitle: "Philosophie",
    renfort: "Mme Diadio et Mme D'Aquino",
    rooms: [
      {
        roomName: "S1",
        subject: "Philosophie",
        subSlots: [{ timeSlot: "8h00 - 12h00", teacherName: "Mme Rivière" }],
      },
      {
        roomName: "S2",
        subject: "Philosophie",
        subSlots: [{ timeSlot: "8h00 - 12h00", teacherName: "M. Ane" }],
      },
      {
        roomName: "S3",
        subject: "Philosophie",
        subSlots: [{ timeSlot: "8h00 - 12h00", teacherName: "M. Fall" }],
      },
      {
        roomName: "S4",
        subject: "Philosophie",
        subSlots: [
          { timeSlot: "8h00 - 10h00", teacherName: "Mme Jaït" },
          { timeSlot: "10h00 - 12h00", teacherName: "M. Gomis" },
        ],
      },
      {
        roomName: "S5 (tiers temps)",
        isTiersTemps: true,
        subject: "Philosophie",
        subSlots: [
          { timeSlot: "8h00 - 10h00", teacherName: "Mme Mboup" },
          { timeSlot: "10h00 - 11h00", teacherName: "Mme Mourain Diop" },
          { timeSlot: "11h00 - 12h00", teacherName: "M. David" },
          { timeSlot: "12h00 - 13h20", teacherName: "Mme Diadio" },
        ],
      },
    ],
  },
  {
    id: "session-mardi-aprem",
    jour: "mardi 8/12",
    creneau: "Après-midi",
    date: "2026-12-08",
    startTime: "13:00",
    endTime: "15:00",
    tiersTempsEndTime: "15:40",
    examTitle: "EXAMEN BLANC DECEMBRE",
    subjectTitle: "EAM Spécialité / EAM TC",
    renfort: "Mme Diadio",
    rooms: [
      {
        roomName: "S1",
        subject: "EAM Spécialité",
        subSlots: [{ timeSlot: "13h00 - 15h00", teacherName: "M. David" }],
      },
      {
        roomName: "S2",
        subject: "EAM Spécialité",
        subSlots: [{ timeSlot: "13h00 - 15h00", teacherName: "M. Ane" }],
      },
      {
        roomName: "S3",
        subject: "EAM TC",
        subSlots: [
          { timeSlot: "13h00 - 14h00", teacherName: "Mme Michon-Guillaume" },
          { timeSlot: "14h00 - 15h00", teacherName: "Mme Mboup" },
        ],
      },
      {
        roomName: "S4",
        subject: "EAM TC",
        subSlots: [
          { timeSlot: "13h00 - 14h00", teacherName: "Mme Piaggio" },
          { timeSlot: "14h00 - 15h00", teacherName: "Mme D'Aquino" },
        ],
      },
      {
        roomName: "S6 (tiers temps)",
        isTiersTemps: true,
        subject: "EAM TC / Spécialité",
        subSlots: [{ timeSlot: "13h00 - 15h40", teacherName: "M. Gomis" }],
      },
    ],
  },
  {
    id: "session-mercredi-matin",
    jour: "mercredi 9/12",
    creneau: "Matin",
    date: "2026-12-09",
    startTime: "08:00",
    endTime: "12:00",
    tiersTempsEndTime: "13:20",
    examTitle: "EXAMEN BLANC DECEMBRE",
    subjectTitle: "HGGSP / SPC / Maths / SES",
    renfort: "Mme Diadio",
    rooms: [
      {
        roomName: "S1",
        subject: "HGGSP",
        subSlots: [
          { timeSlot: "8h00 - 10h00", teacherName: "Mme Bossu" },
          { timeSlot: "10h00 - 11h00", teacherName: "M. Piaggio" },
          { timeSlot: "11h00 - 12h00", teacherName: "Mme Porter" },
        ],
      },
      {
        roomName: "S2",
        subject: "SPC",
        subSlots: [
          { timeSlot: "8h00 - 10h00", teacherName: "Mme Jaït" },
          { timeSlot: "10h00 - 11h00", teacherName: "Mme Michon-Guillaume" },
          { timeSlot: "11h00 - 12h00", teacherName: "M. Faye" },
        ],
      },
      {
        roomName: "S3",
        subject: "Maths / AMC (sujet 1)",
        subSlots: [{ timeSlot: "8h00 - 12h00", teacherName: "Mme Mourain Diop" }],
      },
      {
        roomName: "S4",
        subject: "SES (sujet 2)",
        subSlots: [{ timeSlot: "8h00 - 12h00", teacherName: "Mme D'Aquino" }],
      },
      {
        roomName: "S5 (tiers temps)",
        isTiersTemps: true,
        subject: "HGGSP / SPC",
        subSlots: [
          { timeSlot: "8h00 - 13h20", teacherName: "M. Gomis", note: "8h00 - 13h20 (HGGSP) / 8h00 - 12h40 (SPC)" },
        ],
      },
    ],
  },
  {
    id: "session-jeudi-matin",
    jour: "jeudi 10/12",
    creneau: "Matin",
    date: "2026-12-10",
    startTime: "08:00",
    endTime: "12:00",
    tiersTempsEndTime: "13:20",
    examTitle: "EXAMEN BLANC DECEMBRE",
    subjectTitle: "Maths / SES / AMC / SVT",
    rooms: [
      {
        roomName: "S1",
        subject: "Maths",
        subSlots: [{ timeSlot: "8h00 - 12h00", teacherName: "Surveillant affecté" }],
      },
      {
        roomName: "S2",
        subject: "SES (sujet 1)",
        subSlots: [
          { timeSlot: "10h00 - 11h00", teacherName: "Mme Porter" },
          { timeSlot: "11h00 - 12h00", teacherName: "Mme Diadio" },
        ],
      },
      {
        roomName: "S3",
        subject: "Maths / AMC (sujet 2)",
        subSlots: [
          { timeSlot: "10h00 - 11h00", teacherName: "M. Ane" },
          { timeSlot: "11h00 - 12h00", teacherName: "M. Baritou" },
        ],
      },
      {
        roomName: "S4",
        subject: "SVT",
        subSlots: [{ timeSlot: "8h00 - 11h30", teacherName: "Surveillant affecté" }],
      },
      {
        roomName: "S5 (tiers temps)",
        isTiersTemps: true,
        subject: "SVT / AMC / Maths",
        subSlots: [
          { timeSlot: "9h00 - 10h00", teacherName: "M. Faye" },
          { timeSlot: "10h00 - 12h00", teacherName: "M. Thomas" },
          { timeSlot: "12h00 - 13h20", teacherName: "M. Faye" },
        ],
      },
    ],
  },
  {
    id: "session-jeudi-aprem",
    jour: "jeudi 10/12",
    creneau: "Après-midi",
    date: "2026-12-10",
    startTime: "14:00",
    endTime: "18:00",
    tiersTempsEndTime: "18:20",
    examTitle: "EXAMEN BLANC DECEMBRE",
    subjectTitle: "EAF (Épreuve Anticipée de Français)",
    renfort: "Mme Perez et Mme D'Aquino",
    rooms: [
      {
        roomName: "S1",
        subject: "EAF",
        subSlots: [{ timeSlot: "14h00 - 18h00", teacherName: "M. Ane" }],
      },
      {
        roomName: "S2",
        subject: "EAF",
        subSlots: [
          { timeSlot: "14h00 - 15h00", teacherName: "Mme Gibus" },
          { timeSlot: "15h00 - 16h00", teacherName: "Mme Porter" },
          { timeSlot: "16h00 - 18h00", teacherName: "M. Fall" },
        ],
      },
      {
        roomName: "S3",
        subject: "EAF",
        subSlots: [{ timeSlot: "14h00 - 18h00", teacherName: "Mme Mboup" }],
      },
      {
        roomName: "S4",
        subject: "EAF",
        subSlots: [{ timeSlot: "14h00 - 18h00", teacherName: "M. Gomis" }],
      },
      {
        roomName: "S6 (tiers temps)",
        isTiersTemps: true,
        subject: "EAF",
        subSlots: [{ timeSlot: "13h00 - 18h20", teacherName: "Mme Rivière" }],
      },
    ],
  },
];

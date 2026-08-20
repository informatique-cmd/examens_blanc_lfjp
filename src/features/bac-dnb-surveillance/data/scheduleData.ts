export interface ExamColumn {
  date: string;
  subject: string;
  time: string;
  endExtra: string;
  color: string;
  bg: string;
  ring: string;
}

export interface ExamRow {
  room: string;
  note?: string;
  shifts: string[][];
}

export interface ExamDataset {
  columns: ExamColumn[];
  rows: ExamRow[];
}

export interface ScheduleData {
  bac: ExamDataset;
  dnb: ExamDataset;
}

// Données facilement modifiables pour ajuster les surveillances.
export const scheduleData: ScheduleData = {
  bac: {
    columns: [
      {
        date: "08/06/2026",
        subject: "Français",
        time: "7h30-11h30",
        endExtra: "12h50",
        color: "text-blue-700",
        bg: "bg-blue-50",
        ring: "ring-blue-600/20",
      },
      {
        date: "08/06/2026",
        subject: "Maths",
        time: "14h-16h",
        endExtra: "16h40",
        color: "text-orange-700",
        bg: "bg-orange-50",
        ring: "ring-orange-600/20",
      },
      {
        date: "09/06/2026",
        subject: "Philo",
        time: "7h30-11h30",
        endExtra: "12h50",
        color: "text-purple-700",
        bg: "bg-purple-50",
        ring: "ring-purple-600/20",
      },
      {
        date: "10/06/2026",
        subject: "Spe1",
        time: "7h30-11h30",
        endExtra: "12h50",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        ring: "ring-emerald-600/20",
      },
      {
        date: "11/06/2026",
        subject: "Spe2",
        time: "7h30-11h30",
        endExtra: "12h50",
        color: "text-cyan-700",
        bg: "bg-cyan-50",
        ring: "ring-cyan-600/20",
      },
    ],
    rows: [
      {
        room: "SALLE 7",
        note: "(1/3 temps)",
        shifts: [
          ["M. FALL B.", "M. PIAGGIO"],
          ["Mme PORTER", "M. FALL B."],
          ["M. GOMIS", "M. FRAYON"],
          ["Mme MICHON GUI...", "Mme DUFAY"],
          ["Mme GIBUS", "Mme PORTER"],
        ],
      },
      {
        room: "SALLE 6",
        shifts: [
          ["M. NDAW", "Mme MBOUP"],
          ["Mme DRAME", "M. DIANDY"],
          ["Mme CAPEL", "M. PIAGGIO"],
          ["Mme MBOUP", "Mme CAPEL"],
          ["Mme MBOUP", "M. ANE"],
        ],
      },
      {
        room: "SALLE 5",
        shifts: [
          ["Mme GIBUS", "M. DIANDY"],
          ["Mme D'AQUINO", "M. FAYE"],
          ["Mme D'AQUINO", "Mme DRAME"],
          ["M. PIAGGIO", "Mme PORTER"],
          ["M. PIAGGIO", "Mme PEREZ"],
        ],
      },
      {
        room: "SALLE 4",
        shifts: [
          ["M. SERVATE", "M. THOMAS"],
          ["M. SERVATE", "M. THOMAS"],
          ["Mme PORTER", "Mme JAÏT"],
          ["M. GOMIS", "M. ANE"],
          ["M. DAVID", "Mme DUFAY"],
        ],
      },
      {
        room: "SALLE 3",
        shifts: [
          ["M. FAYE", "M. FRAYON"],
          ["Mme DIADIO", "M. NDAW"],
          ["Mme DIADIO", "Vie scolaire"],
          ["M. DAVID", "Mme PEREZ"],
          ["Mme MICHON GUI...", "Mme JAÏT"],
        ],
      },
      {
        room: "SALLE 2",
        note: "Charlie Rispal",
        shifts: [[], [], ["Vie scolaire"], ["Vie scolaire"], ["Vie scolaire"]],
      },
    ],
  },
  dnb: {
    columns: [
      {
        date: "18/06/2026",
        subject: "Français",
        time: "8h00-11h15",
        endExtra: "Matin",
        color: "text-blue-700",
        bg: "bg-blue-50",
        ring: "ring-blue-600/20",
      },
      {
        date: "18/06/2026",
        subject: "Maths",
        time: "13h00-15h00",
        endExtra: "Après-Midi",
        color: "text-orange-700",
        bg: "bg-orange-50",
        ring: "ring-orange-600/20",
      },
      {
        date: "19/06/2026",
        subject: "HG & Sciences",
        time: "8h00-11h15",
        endExtra: "Matin",
        color: "text-purple-700",
        bg: "bg-purple-50",
        ring: "ring-purple-600/20",
      },
    ],
    rows: [
      { room: "SALLE 7", note: "(1/3 temps)", shifts: [["Mme JAÏT"], ["M. PIAGGIO"], ["M. NDIAYE"]] },
      {
        room: "SALLE 6",
        shifts: [["M. FRAYON", "M. GOMIS"], ["M. FRAYON", "Mme DUFAY"], ["M. FRAYON", "Mme CHABERT"]],
      },
      {
        room: "SALLE 5",
        shifts: [["Mme PORTER", "Mme CAPEL"], ["Mme PORTER", "Mme BOSSU"], ["Mme PORTER", "Mme BOSSU"]],
      },
      {
        room: "SALLE 4",
        shifts: [["M. NDAW", "M. ANE"], ["Mme D'AQUINO", "Mme CHABERT"], ["Mme MBOUP", "Mme GIBUS"]],
      },
      {
        room: "SALLE 3",
        shifts: [["Mme BOSSU", "M. NDIAYE"], ["M. FAYE", "M. SERVATE"], ["Mme MICHON GUI...", "M. PIAGGIO"]],
      },
      {
        room: "SALLE 2",
        shifts: [["Mme DRAME", "Mme CHABERT"], ["Mme DRAME", "Mme MICHON-GUILLAUME"], ["Mme DRAME", "Mme PEREZ"]],
      },
      { room: "SALLE 1", shifts: [["Mme DIADIO"], ["M. DIANDY"], ["M. DAVID"]] },
      { room: "Couloir et soutien", shifts: [["M. FALL B."], ["M. THOMAS"], []] },
    ],
  },
};

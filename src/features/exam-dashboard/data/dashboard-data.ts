import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calculator,
  Calendar,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Clock,
  Clock3,
  Info,
  LayoutGrid,
  LifeBuoy,
  Settings,
  MapPin,
  PenLine,
  Sun,
  UserCheck,
  Users,
  Users2,
} from "lucide-react";

export type TeacherCivility = "Madame" | "Monsieur";
export type TeacherGender = "female" | "male";

export interface TeacherDirectoryEntry {
  civility: TeacherCivility;
  gender: TeacherGender;
  lastName: string;
  firstName: string;
  shortName: string;
}

type TeacherDirectorySourceEntry = {
  civility: TeacherCivility;
  lastName: string;
  firstName: string;
};

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const createShortName = (lastName: string, firstName: string): string => {
  const normalizedLastName = normalizeWhitespace(lastName).toUpperCase();
  const normalizedFirstName = normalizeWhitespace(firstName);
  if (!normalizedFirstName) {
    return normalizedLastName;
  }
  const initial = normalizedFirstName.charAt(0).toUpperCase();
  return `${normalizedLastName} ${initial}.`;
};

const teacherDirectorySource: TeacherDirectorySourceEntry[] = [
  { civility: "Monsieur", lastName: "ANE", firstName: "Alassane" },
  { civility: "Monsieur", lastName: "BARITOU", firstName: "Olivier" },
  { civility: "Madame", lastName: "BLONDEAU", firstName: "Chloé" },
  { civility: "Madame", lastName: "BOSSU", firstName: "Claire" },
  { civility: "Madame", lastName: "BROUILLAT", firstName: "Maud" },
  { civility: "Madame", lastName: "CAPEL", firstName: "Eve" },
  { civility: "Monsieur", lastName: "CAPEL", firstName: "Bastien" },
  { civility: "Madame", lastName: "CHABERT", firstName: "Karine" },
  { civility: "Monsieur", lastName: "CORNALI", firstName: "Karim" },
  { civility: "Madame", lastName: "D'AQUINO", firstName: "Roselyne" },
  { civility: "Madame", lastName: "DAVID", firstName: "Sylvana" },
  { civility: "Monsieur", lastName: "DAVID", firstName: "Vincent" },
  { civility: "Madame", lastName: "DESMARETS", firstName: "Sahar" },
  { civility: "Madame", lastName: "DIADIO", firstName: "Ira" },
  { civility: "Monsieur", lastName: "DIANDY", firstName: "Antoine" },
  { civility: "Madame", lastName: "DIOUF", firstName: "Elisabeth" },
  { civility: "Madame", lastName: "DRAMÉ", firstName: "Claire" },
  { civility: "Madame", lastName: "DUFAY", firstName: "Maguette" },
  { civility: "Madame", lastName: "FALL", firstName: "Nafissatou" },
  { civility: "Monsieur", lastName: "FALL", firstName: "Baba" },
  { civility: "Monsieur", lastName: "FAYE", firstName: "François" },
  { civility: "Madame", lastName: "FAYE", firstName: "Penda" },
  { civility: "Monsieur", lastName: "FRAYON", firstName: "Antoine" },
  { civility: "Madame", lastName: "GIBUS", firstName: "Amandine" },
  { civility: "Monsieur", lastName: "GOMIS", firstName: "Alain" },
  { civility: "Madame", lastName: "JAÏT", firstName: "Layla" },
  { civility: "Madame", lastName: "JENOUDET", firstName: "Sandra" },
  { civility: "Madame", lastName: "KREMER", firstName: "Laurence" },
  { civility: "Madame", lastName: "KUNTZ", firstName: "Emilie" },
  { civility: "Madame", lastName: "LE RUE", firstName: "Fabienne" },
  { civility: "Madame", lastName: "MAGINOT-FRANCE", firstName: "Nathalie" },
  { civility: "Madame", lastName: "MAHE", firstName: "Justine" },
  { civility: "Madame", lastName: "MARCOS", firstName: "Rachel" },
  { civility: "Madame", lastName: "MARTIN", firstName: "Cécile" },
  { civility: "Madame", lastName: "MBOUP", firstName: "Nathalie" },
  { civility: "Madame", lastName: "MICHON GUILLAUME", firstName: "Mathilde" },
  { civility: "Madame", lastName: "MOURAIN DIOP", firstName: "Fanelly" },
  { civility: "Monsieur", lastName: "NDAW", firstName: "Adam" },
  { civility: "Monsieur", lastName: "NDIAYE", firstName: "Alassane" },
  { civility: "Monsieur", lastName: "NDOYE", firstName: "Abdoulaye" },
  { civility: "Madame", lastName: "PAILLIER", firstName: "Roxane" },
  { civility: "Madame", lastName: "PATANÉ", firstName: "Romane" },
  { civility: "Madame", lastName: "PEREZ", firstName: "Fanny" },
  { civility: "Monsieur", lastName: "PIAGGIO", firstName: "Fernando" },
  { civility: "Madame", lastName: "PORTER", firstName: "Elizabeth" },
  { civility: "Monsieur", lastName: "SERVATE", firstName: "Samuel" },
  { civility: "Madame", lastName: "SERVILE", firstName: "Sylvie" },
  { civility: "Madame", lastName: "SOLY", firstName: "Laura" },
  { civility: "Monsieur", lastName: "THOMAS", firstName: "Yvon" },
  { civility: "Madame", lastName: "TRIQUENAUX", firstName: "Alexandra" },
];

export const teacherDirectory: TeacherDirectoryEntry[] = teacherDirectorySource.map((entry) => {
  const civility = entry.civility;
  const gender: TeacherGender = civility === "Madame" ? "female" : "male";
  const lastName = normalizeWhitespace(entry.lastName).toUpperCase();
  const firstName = normalizeWhitespace(entry.firstName);
  return {
    civility,
    gender,
    lastName,
    firstName,
    shortName: createShortName(lastName, firstName),
  };
});

export const teacherDirectoryByShortName: Record<string, TeacherDirectoryEntry> =
  teacherDirectory.reduce((acc, entry) => {
    acc[entry.shortName] = entry;
    return acc;
  }, {} as Record<string, TeacherDirectoryEntry>);

export interface BacBlancStudentEntry {
  lastName: string;
  firstName: string;
  specialty1: string;
  specialty2: string;
  className: string;
  philosophyRoom: string;
  specialty1Room: string;
  specialty2Room: string;
}

export interface PremiereBacBlancStudentEntry {
  lastName: string;
  firstName: string;
  className: string;
  room: string;
}

export const bacBlanc1PremiereStudents: PremiereBacBlancStudentEntry[] = [
  { lastName: "ALLIER", firstName: "Faustine", className: "1ERE1", room: "S12" },
  {
    lastName: "BENSON",
    firstName: "Marilyse Lucia Fanta",
    className: "1ERE1",
    room: "S12",
  },
  { lastName: "BIER", firstName: "Awa Eve", className: "1ERE2", room: "S12" },
  { lastName: "BOUSSO", firstName: "Coumba", className: "1ERE1", room: "S12" },
  {
    lastName: "BOYER",
    firstName: "Camille Laurence Nella",
    className: "1ERE1",
    room: "S12",
  },
  { lastName: "BRU", firstName: "Marie", className: "1ERE1", room: "S12" },
  { lastName: "CALDEIRA", firstName: "Giovanna", className: "1ERE2", room: "S12" },
  { lastName: "CISSE-SOHM", firstName: "Elah-Khayta", className: "1ERE2", room: "S12" },
  { lastName: "CROIZAT", firstName: "Liliane", className: "1ERE2", room: "S12" },
  {
    lastName: "DARWICHE",
    firstName: "Iris Marie Raymonde",
    className: "1ERE1",
    room: "S12",
  },
  { lastName: "DAVID", firstName: "Hoel", className: "1ERE1", room: "S13" },
  {
    lastName: "DE GAIGNERON JOLLIMON DE MAROLLES",
    firstName: "Clovis",
    className: "1ERE1",
    room: "S13",
  },
  { lastName: "DIAGNE", firstName: "Seydina Alioune", className: "1ERE1", room: "S13" },
  { lastName: "DIAKHABY", firstName: "Safia", className: "1ERE2", room: "S13" },
  { lastName: "DIAKITE", firstName: "Assietou Dite Assy", className: "1ERE2", room: "S13" },
  { lastName: "DIALLO", firstName: "Marvin Noah Diouldé", className: "1ERE2", room: "S13" },
  { lastName: "ELABIB", firstName: "Fatiha", className: "1ERE2", room: "S10" },
  { lastName: "ENNADIFI", firstName: "Mohamed", className: "1ERE2", room: "S13" },
  { lastName: "FALL", firstName: "Cheikh Saliou Mbacké", className: "1ERE1", room: "S13" },
  { lastName: "FALL", firstName: "Souleymane", className: "1ERE1", room: "S13" },
  { lastName: "FAYE", firstName: "Imane", className: "1ERE2", room: "S13" },
  { lastName: "GAFFARI", firstName: "Mattéo", className: "1ERE1", room: "S14" },
  { lastName: "GAYE", firstName: "Ababacar", className: "1ERE1", room: "S14" },
  { lastName: "GNING", firstName: "Maya Aïssatou", className: "1ERE1", room: "S14" },
  { lastName: "HACHIM", firstName: "Rayan", className: "1ERE2", room: "S14" },
  { lastName: "HAFFNER", firstName: "Juliette", className: "1ERE1", room: "S14" },
  {
    lastName: "JENOUDET",
    firstName: "Thiméo Owen Thibault",
    className: "1ERE1",
    room: "S9 PRIO/EPS",
  },
  { lastName: "KERDUDO", firstName: "Zeina", className: "1ERE2", room: "S9 PRIO/EPS" },
  { lastName: "LAH", firstName: "Aïssa", className: "1ERE1", room: "S14" },
  { lastName: "LAM", firstName: "Magate Aïcha", className: "1ERE1", room: "S14" },
  { lastName: "LAMBERT", firstName: "Clara Noémie", className: "1ERE2", room: "S14" },
  { lastName: "LARSEN", firstName: "Diara Kalstrup", className: "1ERE2", room: "S14" },
  { lastName: "LAURIENTE", firstName: "Alexandra", className: "1ERE1", room: "S14" },
  { lastName: "LEMAIRE", firstName: "Simon", className: "1ERE1", room: "S15" },
  { lastName: "MBAYE", firstName: "Assy", className: "1ERE2", room: "S15" },
  { lastName: "MBOUP", firstName: "Amy", className: "1ERE2", room: "S15" },
  { lastName: "METZ", firstName: "Celia", className: "1ERE2", room: "S15" },
  { lastName: "MOUAQIT", firstName: "Achraf", className: "1ERE1", room: "S15" },
  { lastName: "NDIAYE", firstName: "Felwine Alicia", className: "1ERE2", room: "S15" },
  { lastName: "NDIAYE", firstName: "Maty", className: "1ERE2", room: "S15" },
  { lastName: "NGOM", firstName: "Aicha Khoyane", className: "1ERE2", room: "S15" },
  { lastName: "NIANG", firstName: "Fatoumata Helene Semou", className: "1ERE2", room: "S15" },
  { lastName: "NOUHANDO ROD", firstName: "Orient", className: "1ERE2", room: "S15" },
  { lastName: "RUNG", firstName: "Agathe", className: "1ERE2", room: "S10" },
  { lastName: "SALL", firstName: "Tamsir", className: "1ERE1", room: "S10" },
  { lastName: "SAMBA", firstName: "Babacar", className: "1ERE2", room: "S10" },
  { lastName: "SANÉ", firstName: "Djiraël Tidjani Kany", className: "1ERE1", room: "S10" },
  { lastName: "SARR", firstName: "Mame Diarra Bousso", className: "1ERE2", room: "S10" },
  { lastName: "SARR", firstName: "Sokhna Faty", className: "1ERE1", room: "S9 PRIO/EPS" },
  { lastName: "SAVI", firstName: "Loris Tahirou", className: "1ERE1", room: "S9 PRIO/EPS" },
  { lastName: "SECK", firstName: "Ousseynatou", className: "1ERE1", room: "S10" },
  { lastName: "TSHIBANDA", firstName: "Raymond", className: "1ERE1", room: "S10" },
  { lastName: "WONE", firstName: "Oumar", className: "1ERE2", room: "S10" },
];

export const bacBlanc1Students: BacBlancStudentEntry[] = [
  {
    lastName: "ABOUDOU AMOUSSA",
    firstName: "Inès",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S12",
    specialty1Room: "S13",
    specialty2Room: "S10",
  },
  {
    lastName: "ACETO",
    firstName: "Awa",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S12",
    specialty1Room: "S13",
    specialty2Room: "S10",
  },
  {
    lastName: "APACK",
    firstName: "Nayla",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S12",
    specialty1Room: "S13",
    specialty2Room: "S10",
  },
  {
    lastName: "ARRON",
    firstName: "Hélène",
    specialty1: "SPE MATHS",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S12",
    specialty1Room: "S10",
    specialty2Room: "S13",
  },
  {
    lastName: "BA",
    firstName: "Khalifa Ababacar",
    specialty1: "SPE MATHS",
    specialty2: "SPE SES",
    className: "TERMINALE1",
    philosophyRoom: "S12",
    specialty1Room: "S10",
    specialty2Room: "S10",
  },
  {
    lastName: "BABO",
    firstName: "Yanis",
    specialty1: "SPE MATHS",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S12",
    specialty1Room: "S10",
    specialty2Room: "S10",
  },
  {
    lastName: "BARIC",
    firstName: "Yerim",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S12",
    specialty1Room: "S12",
    specialty2Room: "S10",
  },
  {
    lastName: "BASTIDE AHMED",
    firstName: "Malik",
    specialty1: "SPE MATHS",
    specialty2: "SPE SPC",
    className: "TERMINALE1",
    philosophyRoom: "S12",
    specialty1Room: "S10",
    specialty2Room: "S13",
  },
  {
    lastName: "BELKHAYAT ZOUKKARI",
    firstName: "Mouna",
    specialty1: "SPE MATHS",
    specialty2: "SPE SES",
    className: "TERMINALE1",
    philosophyRoom: "S13",
    specialty1Room: "S10",
    specialty2Room: "S10",
  },
  {
    lastName: "BRARD",
    firstName: "Louka",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S13",
    specialty1Room: "S12",
    specialty2Room: "S10",
  },
  {
    lastName: "BRUNIE",
    firstName: "Sarah",
    specialty1: "SPE SES",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S13",
    specialty1Room: "S15",
    specialty2Room: "S13",
  },
  {
    lastName: "BUOVOLO",
    firstName: "Mariam",
    specialty1: "SPE MATHS",
    specialty2: "SPE SPC",
    className: "TERMINALE1",
    philosophyRoom: "S13",
    specialty1Room: "S10",
    specialty2Room: "S13",
  },
  {
    lastName: "CERNEJESKI",
    firstName: "Hugo",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S13",
    specialty1Room: "S13",
    specialty2Room: "S12",
  },
  {
    lastName: "CISSE",
    firstName: "Ibrahima",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S13",
    specialty1Room: "S10",
    specialty2Room: "S13",
  },
  {
    lastName: "CISSE",
    firstName: "Combé",
    specialty1: "SPE MATHS",
    specialty2: "SPE SPC",
    className: "TERMINALE1",
    philosophyRoom: "S13",
    specialty1Room: "S13",
    specialty2Room: "S12",
  },
  {
    lastName: "DANCOING",
    firstName: "Louna",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SVT",
    className: "TERMINALE2",
    philosophyRoom: "S13",
    specialty1Room: "S12",
    specialty2Room: "S13",
  },
  {
    lastName: "DE GAIGNERON JOLLIMON DE MAROLLES",
    firstName: "Philippine",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SVT",
    className: "TERMINALE2",
    philosophyRoom: "S14",
    specialty1Room: "S13",
    specialty2Room: "S14",
  },
  {
    lastName: "DJOUKWE",
    firstName: "David",
    specialty1: "SPE MATHS",
    specialty2: "SPE SES",
    className: "TERMINALE1",
    philosophyRoom: "S14",
    specialty1Room: "S10",
    specialty2Room: "S12",
  },
  {
    lastName: "FALL",
    firstName: "Djellya Yacine",
    specialty1: "SPE MATHS",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S14",
    specialty1Room: "S10",
    specialty2Room: "S14",
  },
  {
    lastName: "FALL CLAMENS",
    firstName: "Omar  Louis",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S9",
    specialty1Room: "S9",
    specialty2Room: "S9",
  },
  {
    lastName: "GALAND",
    firstName: "Aurelien",
    specialty1: "SPE MATHS",
    specialty2: "SPE SPC",
    className: "TERMINALE1",
    philosophyRoom: "S15",
    specialty1Room: "S10",
    specialty2Room: "S13",
  },
  {
    lastName: "GAZI",
    firstName: "Ethan",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S14",
    specialty1Room: "S12",
    specialty2Room: "S12",
  },
  {
    lastName: "JACOBE",
    firstName: "Lou",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SVT",
    className: "TERMINALE2",
    philosophyRoom: "S14",
    specialty1Room: "S12",
    specialty2Room: "S14",
  },
  {
    lastName: "KOUROUMA",
    firstName: "Bakary",
    specialty1: "SPE MATHS",
    specialty2: "SPE SES",
    className: "TERMINALE1",
    philosophyRoom: "S14",
    specialty1Room: "S10",
    specialty2Room: "S12",
  },
  {
    lastName: "LANZETTI",
    firstName: "Luigi",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S14",
    specialty1Room: "S12",
    specialty2Room: "S12",
  },
  {
    lastName: "MAREGA",
    firstName: "Yssa",
    specialty1: "SPE MATHS",
    specialty2: "SPE SES",
    className: "TERMINALE1",
    philosophyRoom: "S14",
    specialty1Room: "S10",
    specialty2Room: "S12",
  },
  {
    lastName: "MBOUP",
    firstName: "Mame Diarra",
    specialty1: "SPE SES",
    specialty2: "SPE LLCE AMC",
    className: "TERMINALE2",
    philosophyRoom: "S14",
    specialty1Room: "S15",
    specialty2Room: "S10",
  },
  {
    lastName: "MBOW",
    firstName: "Ramatoulaye",
    specialty1: "SPE SPC",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S15",
    specialty1Room: "S15",
    specialty2Room: "S14",
  },
  {
    lastName: "MERDJANOPOULOS",
    firstName: "Louka",
    specialty1: "SPE MATHS",
    specialty2: "SPE SPC",
    className: "TERMINALE1",
    philosophyRoom: "S15",
    specialty1Room: "S10",
    specialty2Room: "S13",
  },
  {
    lastName: "MESSINA",
    firstName: "Tom",
    specialty1: "SPE SES",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S15",
    specialty1Room: "S15",
    specialty2Room: "S14",
  },
  {
    lastName: "MINGOU",
    firstName: "Cécilia",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S15",
    specialty1Room: "S13",
    specialty2Room: "S12",
  },
  {
    lastName: "MONTMASSON",
    firstName: "Héléna Amy",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S15",
    specialty1Room: "S13",
    specialty2Room: "S12",
  },
  {
    lastName: "MOUABE",
    firstName: "Aaron",
    specialty1: "SPE SES",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S15",
    specialty1Room: "S15",
    specialty2Room: "S14",
  },
  {
    lastName: "N'JAMBONG",
    firstName: "Asaja",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S15",
    specialty1Room: "S13",
    specialty2Room: "S12",
  },
  {
    lastName: "NDAW",
    firstName: "Mary Louise",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S10",
    specialty1Room: "S12",
    specialty2Room: "S12",
  },
  {
    lastName: "NDOUR",
    firstName: "Fatou",
    specialty1: "SPE HGGSP",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S9",
    specialty1Room: "S9",
    specialty2Room: "S9",
  },
  {
    lastName: "NGOM",
    firstName: "Khadija",
    specialty1: "SPE HGGSP",
    specialty2: "SPE LLCE AMC",
    className: "TERMINALE2",
    philosophyRoom: "S10",
    specialty1Room: "S13",
    specialty2Room: "S10",
  },
  {
    lastName: "NIANG",
    firstName: "Papa Ibrahima Cheikh",
    specialty1: "SPE MATHS",
    specialty2: "SPE SPC",
    className: "TERMINALE1",
    philosophyRoom: "S10",
    specialty1Room: "S10",
    specialty2Room: "S13",
  },
  {
    lastName: "PERINER",
    firstName: "Angie",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SVT",
    className: "TERMINALE2",
    philosophyRoom: "S10",
    specialty1Room: "S12",
    specialty2Room: "S14",
  },
  {
    lastName: "RAGUIN",
    firstName: "Kesya",
    specialty1: "SPE SPC",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S10",
    specialty1Room: "S15",
    specialty2Room: "S14",
  },
  {
    lastName: "RISPAL",
    firstName: "Charlie",
    specialty1: "SPE SPC",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S9",
    specialty1Room: "S9",
    specialty2Room: "S9",
  },
  {
    lastName: "ROWLAND",
    firstName: "NoahDilhane",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SES",
    className: "TERMINALE2",
    philosophyRoom: "S10",
    specialty1Room: "S12",
    specialty2Room: "S12",
  },
  {
    lastName: "SIDHOUM",
    firstName: "Anas",
    specialty1: "SPE MATHS",
    specialty2: "SPE SPC",
    className: "TERMINALE1",
    philosophyRoom: "S10",
    specialty1Room: "S10",
    specialty2Room: "S13",
  },
  {
    lastName: "SOBLOG",
    firstName: "Oscar",
    specialty1: "SPE SPC",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S9",
    specialty1Room: "S9",
    specialty2Room: "S9",
  },
  {
    lastName: "SON",
    firstName: "Ye Seon",
    specialty1: "SPE SES",
    specialty2: "SPE SVT",
    className: "TERMINALE1",
    philosophyRoom: "S10",
    specialty1Room: "S15",
    specialty2Room: "S14",
  },
  {
    lastName: "SOW",
    firstName: "Aminata Soraya",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SVT",
    className: "TERMINALE2",
    philosophyRoom: "S10",
    specialty1Room: "S12",
    specialty2Room: "S14",
  },
  {
    lastName: "SOW",
    firstName: "Diyé",
    specialty1: "SPE LLCE AMC",
    specialty2: "SPE SVT",
    className: "TERMINALE2",
    philosophyRoom: "S15",
    specialty1Room: "S12",
    specialty2Room: "S14",
  },
  {
    lastName: "WONE",
    firstName: "Fatimata",
    specialty1: "SPE HGGSP",
    specialty2: "SPE LLCE AMC",
    className: "TERMINALE2",
    philosophyRoom: "S13",
    specialty1Room: "S13",
    specialty2Room: "S10",
  },
  {
    lastName: "ZARB",
    firstName: "Frédy",
    specialty1: "SPE MATHS",
    specialty2: "SPE SPC",
    className: "TERMINALE1",
    philosophyRoom: "S9",
    specialty1Room: "S9",
    specialty2Room: "S9",
  },
];

export type SurveillanceType =
  | "philosophie"
  | "specialite"
  | "eaf"
  | "support";

export interface TypeVariant {
  label: string;
  icon: LucideIcon;
  badgeClasses: string;
  iconColor: string;
  cardBorder: string;
  cardBackground: string;
  textColor: string;
}

export const typeVariants: Record<string, TypeVariant> = {
  philosophie: {
    label: "Philosophie",
    icon: BookOpen,
    badgeClasses: "bg-slate-200 text-slate-700",
    iconColor: "text-slate-600",
    cardBorder: "border-slate-300",
    cardBackground: "bg-slate-50",
    textColor: "text-slate-700",
  },
  specialite: {
    label: "Spécialité",
    icon: Calculator,
    badgeClasses: "bg-blue-100 text-blue-700",
    iconColor: "text-blue-600",
    cardBorder: "border-blue-200",
    cardBackground: "bg-blue-50",
    textColor: "text-blue-700",
  },
  eaf: {
    label: "EAF",
    icon: PenLine,
    badgeClasses: "bg-violet-100 text-violet-700",
    iconColor: "text-violet-600",
    cardBorder: "border-violet-200",
    cardBackground: "bg-violet-50",
    textColor: "text-violet-700",
  },
  support: {
    label: "Support",
    icon: LifeBuoy,
    badgeClasses: "bg-amber-100 text-amber-700",
    iconColor: "text-amber-600",
    cardBorder: "border-amber-200",
    cardBackground: "bg-amber-50",
    textColor: "text-amber-700",
  },
  default: {
    label: "Épreuve",
    icon: CalendarDays,
    badgeClasses: "bg-slate-100 text-slate-700",
    iconColor: "text-slate-600",
    cardBorder: "border-slate-200",
    cardBackground: "bg-white",
    textColor: "text-slate-700",
  },
};

export interface KeyFigure {
  value: string;
  label: string;
  unit?: string;
  extra?: string;
}

export const keyFigures: KeyFigure[] = [
  { value: "6", label: "Salles mobilisées" },
  { value: "4", label: "Épreuves", extra: "Spécialités N°1 & N°2, Philosophie, EAF" },
  { value: "3,7", unit: "h", label: "Durée moyenne", extra: "31 missions planifiées" },
  { value: "114", unit: "h", label: "Surveillance cumulée", extra: "Inclut les missions de renfort" },
];

export interface AccommodationGroup {
  icon: { Icon: LucideIcon; bg: string; color: string };
  title: string;
  description: string;
  students: string[];
  note?: string;
  noteClasses?: string;
}

export const accommodationGroups: AccommodationGroup[] = [
  {
    icon: { Icon: Users2, bg: "bg-green-100", color: "text-green-600" },
    title: "Terminale",
    description: "Liste des élèves avec aménagements d'examen :",
    students: [
      "RISPAL Charlie",
      "NDOUR Fatou",
      "SOBLOG Oscar",
      "FALL CLAMENS Omar",
      "ZARB Frédy",
    ],
  },
  {
    icon: { Icon: UserCheck, bg: "bg-purple-100", color: "text-purple-600" },
    title: "Première",
    description: "Liste des élèves avec aménagements d'examen :",
    students: [
      "SAVI Loris",
      "JENOUDET Thiméo",
      "SARR Sokhna Faty",
      "KERDUDO Zeina",
    ],
  },
];

export interface SurveillanceMission {
  teacher: string;
  datetime: string;
  room: string;
  mission: string;
  duration: string;
  type: SurveillanceType;
}

export const surveillanceSchedule: SurveillanceMission[] = [
  {
    teacher: "ANE A.",
    datetime: "jeudi 11/12 à 08h00",
    room: "S13",
    mission: "Bac blanc : Enseignement de spécialité N°1",
    duration: "4:00:00",
    type: "specialite",
  },
  {
    teacher: "ANE A.",
    datetime: "vendredi 12/12 à 08h00",
    room: "S9 PRIO / EPS",
    mission: "Bac blanc : Enseignement de spécialité N°2",
    duration: "5:30:00",
    type: "specialite",
  },
  {
    teacher: "BARITOU O.",
    datetime: "jeudi 11/12 à 08h00",
    room: "S10",
    mission: "Bac blanc : Enseignement de spécialité N°1",
    duration: "4:00:00",
    type: "specialite",
  },
  {
    teacher: "BARITOU O.",
    datetime: "jeudi 11/12 à 14h05",
    room: "S12",
    mission: "Bac blanc EAF",
    duration: "4:00:00",
    type: "eaf",
  },
  {
    teacher: "BOSSU C.",
    datetime: "mercredi 10/12 à 08h00",
    room: "S9 PRIO / EPS",
    mission: "Bac blanc de philosophie",
    duration: "5:30:00",
    type: "philosophie",
  },
  {
    teacher: "BOSSU C., PIAGGIO F.",
    datetime: "jeudi 11/12 à 15h30",
    room: "Salles 9, 10, 12, 13, 14, 15",
    mission:
      "Remplacer les surveillants du baccalauréat blanc pour qu'ils prennent une pause dans les salles 9, 10, 12, 13, 14 et 15",
    duration: "2:30:00",
    type: "support",
  },
  {
    teacher: "CHABERT K., DRAMÉ C., JAÏT L.",
    datetime: "jeudi 11/12 à 11h10",
    room: "Salles 9, 10, 12, 13, 15",
    mission:
      "Remplacer les surveillants du baccalauréat blanc pour qu'ils prennent une pause dans les salles 9, 10, 12, 13 et 15",
    duration: "1:00:00",
    type: "support",
  },
  {
    teacher: "DAVID V.",
    datetime: "jeudi 11/12 à 08h00",
    room: "S12",
    mission: "Bac blanc : Enseignement de spécialité N°1",
    duration: "4:00:00",
    type: "specialite",
  },
  {
    teacher: "DRAMÉ C.",
    datetime: "mercredi 10/12 à 08h00",
    room: "S15",
    mission: "Bac blanc de philosophie",
    duration: "4:00:00",
    type: "philosophie",
  },
  {
    teacher: "GOMIS A.",
    datetime: "jeudi 11/12 à 08h00",
    room: "S9 PRIO / EPS",
    mission: "Bac blanc : Enseignement de spécialité N°1",
    duration: "5:00:00",
    type: "specialite",
  },
  {
    teacher: "DAVID V.",
    datetime: "vendredi 12/12 à 10h00",
    room: "Salles 9, 10, 12, 13, 14",
    mission:
      "Remplacer les surveillants du baccalauréat blanc pour qu'ils prennent une pause dans les salles 9, 10, 12, 13 et 14",
    duration: "2:00:00",
    type: "support",
  },
  {
    teacher: "FALL B.",
    datetime: "mercredi 10/12 à 08h00",
    room: "S10",
    mission: "Bac blanc de philosophie",
    duration: "4:00:00",
    type: "philosophie",
  },
  {
    teacher: "FRAYON A., GIBUS A.",
    datetime: "mercredi 10/12 à 10h00",
    room: "Salles 9, 10, 12, 13, 14, 15",
    mission:
      "Remplacer les surveillants du baccalauréat blanc pour qu'ils prennent une pause dans les salles 9, 10, 12, 13, 14 et 15",
    duration: "2:00:00",
    type: "support",
  },
  {
    teacher: "GOMIS A.",
    datetime: "jeudi 11/12 à 14h05",
    room: "S15",
    mission: "Bac blanc EAF",
    duration: "4:00:00",
    type: "eaf",
  },
  {
    teacher: "GOMIS A.",
    datetime: "mercredi 10/12 à 08h00",
    room: "S12",
    mission: "Bac blanc de philosophie",
    duration: "4:00:00",
    type: "philosophie",
  },
  {
    teacher: "FALL B.",
    datetime: "vendredi 12/12 à 08h00",
    room: "S13",
    mission: "Bac blanc : Enseignement de spécialité N°2",
    duration: "4:00:00",
    type: "specialite",
  },
  {
    teacher: "JAÏT L.",
    datetime: "jeudi 11/12 à 08h00",
    room: "Salles 9, 10, 12, 13, 15",
    mission:
      "Remplacer les surveillants du baccalauréat blanc pour qu'ils prennent une pause dans les salles 9, 10, 12, 13 et 15",
    duration: "2:00:00",
    type: "support",
  },
  {
    teacher: "JAÏT L.",
    datetime: "jeudi 11/12 à 13h05",
    room: "S9 PRIO / EPS",
    mission: "Bac blanc EAF",
    duration: "5:00:00",
    type: "eaf",
  },
  {
    teacher: "MBOUP N.",
    datetime: "jeudi 11/12 à 10h00",
    room: "Salles 9, 10, 12, 13, 15",
    mission:
      "Remplacer les surveillants du baccalauréat blanc pour qu'ils prennent une pause dans les salles 9, 10, 12, 13 et 15",
    duration: "1:30:00",
    type: "support",
  },
  {
    teacher: "MBOUP N.",
    datetime: "jeudi 11/12 à 14h05",
    room: "S10",
    mission: "Bac blanc EAF",
    duration: "4:00:00",
    type: "eaf",
  },
  {
    teacher: "MBOUP N.",
    datetime: "vendredi 12/12 à 08h00",
    room: "S14",
    mission: "Bac blanc : Enseignement de spécialité N°2",
    duration: "4:00:00",
    type: "specialite",
  },
  {
    teacher: "MICHON GUILLAUME M.",
    datetime: "mercredi 10/12 à 08h00",
    room: "S14",
    mission: "Bac blanc de philosophie",
    duration: "4:00:00",
    type: "philosophie",
  },
  {
    teacher: "MICHON GUILLAUME M.",
    datetime: "vendredi 12/12 à 09h00",
    room: "Salles 9, 10, 12, 13, 14",
    mission:
      "Remplacer les surveillants du baccalauréat blanc pour qu'ils prennent une pause dans les salles 9, 10, 12, 13 et 14",
    duration: "2:00:00",
    type: "support",
  },
  {
    teacher: "MOURAIN DIOP F.",
    datetime: "jeudi 11/12 à 08h00",
    room: "S15",
    mission: "Bac blanc : Enseignement de spécialité N°1",
    duration: "4:00:00",
    type: "specialite",
  },
  {
    teacher: "PEREZ F.",
    datetime: "jeudi 11/12 à 14h05",
    room: "S13",
    mission: "Bac blanc EAF",
    duration: "4:00:00",
    type: "eaf",
  },
  {
    teacher: "MOURAIN DIOP F.",
    datetime: "mercredi 10/12 à 08h00",
    room: "S13",
    mission: "Bac blanc de philosophie",
    duration: "4:00:00",
    type: "philosophie",
  },
  {
    teacher: "NDIAYE A.",
    datetime: "vendredi 12/12 à 08h00",
    room: "S10",
    mission: "Bac blanc : Enseignement de spécialité N°2",
    duration: "4:00:00",
    type: "specialite",
  },
  {
    teacher: "NDOYE A.",
    datetime: "jeudi 11/12 à 14h05",
    room: "S14",
    mission: "Bac blanc EAF",
    duration: "4:00:00",
    type: "eaf",
  },
  {
    teacher: "NDOYE A.",
    datetime: "vendredi 12/12 à 08h00",
    room: "S12",
    mission: "Bac blanc : Enseignement de spécialité N°2",
    duration: "4:00:00",
    type: "specialite",
  },
];

export const roomColumns = [
  "S9 PRIO / EPS",
  "S10",
  "S11",
  "S12",
  "S13",
  "S14",
  "S15",
] as const;

export type RoomColumn = (typeof roomColumns)[number];

export interface RoomSession {
  time?: string;
  teacher?: string;
  detail?: string;
  type?: SurveillanceType;
  label?: string;
  highlight?: boolean;
}

export interface RoomScheduleDay {
  day: string;
  rooms: Record<RoomColumn, RoomSession[]>;
}

export const roomSchedule: RoomScheduleDay[] = [
  {
    day: "Mercredi 10/12",
    rooms: {
      "S9 PRIO / EPS": [
        {
          time: "08h00 - 13h30",
          teacher: "BOSSU C.",
          detail: "Philosophie",
          type: "philosophie",
        },
      ],
      S10: [
        {
          time: "08h00 - 12h00",
          teacher: "FALL B.",
          detail: "Philosophie",
          type: "philosophie",
        },
      ],
      S11: [],
      S12: [
        {
          time: "08h00 - 12h00",
          teacher: "GOMIS A.",
          detail: "Philosophie",
          type: "philosophie",
        },
      ],
      S13: [
        {
          time: "08h00 - 12h00",
          teacher: "MOURAIN DIOP F.",
          detail: "Philosophie",
          type: "philosophie",
        },
      ],
      S14: [
        {
          time: "08h00 - 12h00",
          teacher: "MICHON G. M.",
          detail: "Philosophie",
          type: "philosophie",
        },
      ],
      S15: [
        {
          time: "08h00 - 12h00",
          teacher: "DRAMÉ C.",
          detail: "Philosophie",
          type: "philosophie",
        },
      ],
    },
  },
  {
    day: "Jeudi 11/12",
    rooms: {
      "S9 PRIO / EPS": [
        {
          label: "Matin",
          time: "08h00 - 13h00",
          teacher: "GOMIS A.",
          detail: "Spécialité N°1",
          highlight: true,
          type: "specialite",
        },
        {
          label: "Après-midi",
          time: "13h05 - 18h05",
          teacher: "JAÏT L.",
          detail: "EAF",
          type: "eaf",
        },
      ],
      S10: [
        {
          label: "Matin",
          time: "08h00 - 12h00",
          teacher: "BARITOU O.",
          detail: "Spécialité N°1",
          highlight: true,
          type: "specialite",
        },
        {
          label: "Après-midi",
          time: "14h05 - 18h05",
          teacher: "MBOUP N.",
          detail: "EAF",
          type: "eaf",
        },
      ],
      S11: [],
      S12: [
        {
          label: "Matin",
          time: "08h00 - 12h00",
          teacher: "DAVID V.",
          detail: "Spécialité N°1",
          highlight: true,
          type: "specialite",
        },
        {
          label: "Après-midi",
          time: "14h05 - 18h05",
          teacher: "BARITOU O.",
          detail: "EAF",
          type: "eaf",
        },
      ],
      S13: [
        {
          label: "Matin",
          time: "08h00 - 12h00",
          teacher: "ANE A.",
          detail: "Spécialité N°1",
          highlight: true,
          type: "specialite",
        },
        {
          label: "Après-midi",
          time: "14h05 - 18h05",
          teacher: "PEREZ F.",
          detail: "EAF",
          type: "eaf",
        },
      ],
      S14: [
        {
          label: "Après-midi",
          time: "14h05 - 18h05",
          teacher: "NDOYE A.",
          detail: "EAF",
          type: "eaf",
        },
      ],
      S15: [
        {
          label: "Matin",
          time: "08h00 - 12h00",
          teacher: "MOURAIN DIOP F.",
          detail: "Spécialité N°1",
          highlight: true,
          type: "specialite",
        },
        {
          label: "Après-midi",
          time: "14h05 - 18h05",
          teacher: "GOMIS A.",
          detail: "EAF",
          type: "eaf",
        },
      ],
    },
  },
  {
    day: "Vendredi 12/12",
    rooms: {
      "S9 PRIO / EPS": [
        {
          time: "08h00 - 13h30",
          teacher: "ANE A.",
          detail: "Spécialité N°2",
          type: "specialite",
        },
      ],
      S10: [
        {
          time: "08h00 - 12h00",
          teacher: "NDIAYE A.",
          detail: "Spécialité N°2",
          type: "specialite",
        },
      ],
      S11: [],
      S12: [
        {
          time: "08h00 - 12h00",
          teacher: "NDOYE A.",
          detail: "Spécialité N°2",
          type: "specialite",
        },
      ],
      S13: [
        {
          time: "08h00 - 12h00",
          teacher: "FALL B.",
          detail: "Spécialité N°2",
          type: "specialite",
        },
      ],
      S14: [
        {
          time: "08h00 - 12h00",
          teacher: "MBOUP N.",
          detail: "Spécialité N°2",
          type: "specialite",
        },
      ],
      S15: [],
    },
  },
];

export interface DashboardTab {
  id: "setup" | "teacher" | "convocation" | "students" | "room" | "day";
  label: string;
  Icon: LucideIcon;
}

export const dashboardTabs: DashboardTab[] = [
  { id: "setup", label: "Paramétrage des salles", Icon: Settings },
  { id: "teacher", label: "Vue par enseignant", Icon: Users },
  { id: "convocation", label: "Convocations", Icon: ClipboardList },
  { id: "students", label: "Élèves", Icon: Users2 },
  { id: "room", label: "Vue par salle", Icon: LayoutGrid },
  { id: "day", label: "Vue par jour", Icon: Calendar },
];

export const infoIcon = Info;
export const alertTriangleIcon = AlertTriangle;
export const todayIcon = Sun;
export const calendarClockIcon = CalendarClock;
export const mapPinIcon = MapPin;
export const clock3Icon = Clock3;
export const clipboardListIcon = ClipboardList;
export const alertCircleIcon = AlertCircle;
export const clockIcon = Clock;

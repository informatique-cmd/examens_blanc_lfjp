export const HOME_PAGE_CONTENT = {
  logos: [
    {
      src: "https://i.imgur.com/0YmGlXO.png",
      alt: "Logo de l'AEFE",
    },
  ],
  subtitle: "Espace examens blancs LFJP",
  title:
    "Toute l'organisation des examens blancs centralisée pour les enseignants du LFJP",
  description:
    "Cet espace réunit l'ensemble des informations pratiques nécessaires pour préparer, coordonner et faire vivre les épreuves. Vous y trouverez les documents, convocations, affectations de salles et les consignes indispensables pour guider sereinement chaque étape du déroulement des examens blancs.",
};

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

export const HOME_DASHBOARD_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs",
  iconLabel: "Accéder à l'organisation des examens blancs",
  subtitle: "",
  title: "Baccalauréat blanc 1ère et Terminale",
  dateLabel: "10, 11 et 12 décembre 2025",
  date: "2025-12-10",
  footerLabel: "Accéder à l'organisation complète",
  category: "general",
};

export const HOME_MATH_EXAM_20260213_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs/mathematiques-2026-02-13",
  iconLabel: "Consulter l'organisation du bac blanc de maths 1ère",
  subtitle: "",
  title: "Bac blanc de maths 1ère",
  dateLabel: "13 février 2026",
  date: "2026-02-13",
  footerLabel: "Accéder à l'organisation complète",
  category: "math",
};

export const HOME_MATH_EXAM_20260523_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs/mathematiques-2026-05-23",
  iconLabel: "Consulter l'organisation du bac blanc de maths 1ère",
  subtitle: "",
  title: "Bac blanc de maths 1ère",
  dateLabel: "23 mai 2026",
  date: "2026-05-23",
  footerLabel: "Accéder à l'organisation complète",
  category: "math",
};

export const HOME_EAF_EXAM_20260407_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs/eaf-2026-04-07",
  iconLabel: "Accéder à l'organisation du baccalauréat blanc 1ère et Terminale",
  subtitle: "",
  title: "Baccalauréat blanc 1ère et Terminale",
  dateLabel: "7 au 10 avril 2026",
  date: "2026-04-07",
  footerLabel: "Accéder à l'organisation complète",
  category: "general",
};

export const HOME_EAF_ORAL_202604_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs/oraux-eaf-2026-04",
  iconLabel: "Consulter l'organisation des oraux blancs de français",
  subtitle: "",
  title: "Oraux blancs EAF 1ère",
  dateLabel: "13, 14 et 15 avril 2026",
  date: "2026-04-13",
  footerLabel: "Accéder au planning détaillé",
  category: "oral",
};

export const HOME_EAF_ORAL_202605_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs/oraux-eaf-2026-05",
  iconLabel: "Consulter l'organisation des oraux blancs de français",
  subtitle: "",
  title: "Oraux blancs EAF 1ère",
  dateLabel: "11, 12 et 13 mai 2026",
  date: "2026-05-11",
  footerLabel: "Accéder au planning détaillé",
  category: "oral",
};

export const HOME_GRAND_ORAL_20260417_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs/grand-oral-2026-04-17",
  iconLabel: "Consulter l'organisation du Grand Oral Blanc",
  subtitle: "",
  title: "Grand Oral Blanc",
  dateLabel: "Vendredi 17 avril 2026",
  date: "2026-04-17",
  footerLabel: "Accéder au planning détaillé",
  category: "oral",
};

export const HOME_DNB_ZAO_202602_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs/dnb-blanc-zao-2026-02-03",
  iconLabel: "Organisation du DNB blanc",
  subtitle: "",
  title: "DNB blanc",
  dateLabel: "3 et 4 février 2026",
  date: "2026-02-03",
  footerLabel: "Consulter plannings et surveillances",
  category: "general",
};

export const HOME_DNB_ORAL_20260520_ENTRY: HomeCalloutEntry = {
  to: "https://bastiencapel.github.io/OralDNB2026/",
  iconLabel: "Consulter l'organisation des oraux du DNB",
  subtitle: "",
  title: "Oraux du DNB",
  dateLabel: "20 mai 2026",
  date: "2026-05-20",
  footerLabel: "Accéder au planning détaillé",
  category: "oral",
};


export const HOME_EAF_ORAL_202606_ENTRY: HomeCalloutEntry = {
  to: "/examens-blancs/oraux-eaf-2026-06",
  iconLabel: "Consulter l'organisation des oraux de français",
  subtitle: "",
  title: "Oral de français",
  dateLabel: "1er au 5 juin 2026",
  date: "2026-06-01",
  footerLabel: "Accéder à la liste des élèves",
  category: "oral",
};

export const HOME_SURVEILLANCE_BAC_DNB_ENTRY: HomeCalloutEntry = {
  to: "/surveillances-bac-dnb",
  iconLabel: "Consulter le planning des surveillances BAC et DNB",
  subtitle: "",
  title: "Surveillances BAC et DNB",
  dateLabel: "Session Juin 2026",
  date: "2026-06-08",
  footerLabel: "Accéder au planning détaillé",
  category: "surveillance",
};
export const HOME_CALLOUT_ENTRIES: HomeCalloutEntry[] = [
  HOME_DASHBOARD_ENTRY,
  HOME_DNB_ZAO_202602_ENTRY,
  HOME_MATH_EXAM_20260213_ENTRY,
  HOME_EAF_EXAM_20260407_ENTRY,
  HOME_EAF_ORAL_202604_ENTRY,
  HOME_GRAND_ORAL_20260417_ENTRY,
  HOME_EAF_ORAL_202605_ENTRY,
  HOME_DNB_ORAL_20260520_ENTRY,
  HOME_MATH_EXAM_20260523_ENTRY,
  HOME_EAF_ORAL_202606_ENTRY,
  HOME_SURVEILLANCE_BAC_DNB_ENTRY,
];

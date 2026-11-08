// Fichier généré automatiquement par le CMS LFJP le 08/11/2026 à 14:13:49
// Ce fichier est déployé automatiquement sur Vercel lors de chaque commit GitHub.

export const HOME_PAGE_CONTENT = {
  "logos": [
    {
      "src": "/assets/aistudio/logo-lfjp_62451311.png",
      "alt": "Lycée Français Jacques Prévert - Saly, Sénégal"
    },
    {
      "src": "https://aefe.fr/sites/default/files/asset/document/logo-aefe-bleu-et-orange_0.svg",
      "alt": "Agence pour l'enseignement français à l'étranger"
    }
  ],
  "subtitle": "Lycée Français Jacques Prévert de Saly • Réseau AEFE",
  "title": "Toute l'organisation des examens blancs centralisée pour les enseignants du LFJP",
  "description": "Cet espace réunit l'ensemble des informations pratiques nécessaires pour préparer, coordonner et faire vivre les épreuves. Vous y trouverez les documents, convocations, affectations de salles et les consignes indispensables pour guider sereinement chaque étape du déroulement des examens blancs."
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

export const HOME_CALLOUT_ENTRIES: HomeCalloutEntry[] = [
  {
    "to": "/examens-blancs",
    "iconLabel": "Accéder à l'organisation du Baccalauréat blanc 1ère et Terminale",
    "subtitle": "Organisation complète",
    "title": "Baccalauréat blanc 1ère et Terminale",
    "dateLabel": "10, 11 et 12 décembre 2025",
    "date": "2025-12-10",
    "footerLabel": "Accéder à l'organisation",
    "category": "general"
  },
  {
    "to": "/examens-blancs/bac-mathematiques-terminale-2026-04-07",
    "iconLabel": "Accéder à l'organisation de l'épreuve de spécialité Mathématiques",
    "subtitle": "Épreuve de spécialité",
    "title": "Mathématiques Terminale",
    "dateLabel": "Mardi 7 avril 2026",
    "date": "2026-04-07",
    "footerLabel": "Consulter l'épreuve de spécialité",
    "category": "math"
  },
  {
    "to": "/surveillances-bac-dnb",
    "iconLabel": "Accéder au planning de surveillance Bac et DNB",
    "subtitle": "Planning & convocations",
    "title": "Surveillances Bac & DNB",
    "dateLabel": "Sessions 2025-2026",
    "date": "2026-04-07",
    "footerLabel": "Consulter les surveillances",
    "category": "surveillance"
  }
];

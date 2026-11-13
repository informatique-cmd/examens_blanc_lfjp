// Fichier généré automatiquement par le CMS LFJP le 13/11/2026 à 12:14:09
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
  "subtitle": "Lycée Français Jacques Prévert de Saly, Sénégal • Réseau AEFE",
  "title": "Lycée Français Jacques Prévert",
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

export const HOME_CALLOUT_ENTRIES: HomeCalloutEntry[] = [];

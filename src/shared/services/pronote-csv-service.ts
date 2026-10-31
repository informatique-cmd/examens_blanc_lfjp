import type { CmsCandidate, CmsTeacher, CmsRoom } from "./cms-store";

// ============================================================================
// TEMPLATES CSV OFFICIELS PRONOTE (AVEC BOM UTF-8 POUR EXCEL ET PRONOTE)
// ============================================================================

export const CSV_TEMPLATES = {
  eleves: {
    filename: "template_pronote_eleves.csv",
    title: "Modèle Pronote Élèves / Candidats",
    description: "Format standard d'export des listes d'élèves depuis Pronote / SIECLE",
    content:
`Nom;Prénom;Classe;Sexe;DateNaissance;Aménagement;MEF
DIOP;Moussa;3A;M;12/04/2011;;3EME
FALL;Fatou;3A;F;05/09/2011;Tiers-temps (+1/3 temps);3EME
GIRARD;Alexandre;3B;M;18/01/2011;;3EME
MOREAU;Camille;3B;F;23/11/2011;Ordinateur + Tiers-temps;3EME
BA;Ibrahima;3C;M;09/06/2011;;3EME
KOUASSI;Aya;3C;F;14/03/2011;Secrétaire scripteur;3EME
SOW;Oumar;1A;M;03/07/2009;;1ERE GENERALE
TRAORE;Aissatou;1B;F;19/10/2009;Tiers-temps (+1/3 temps);1ERE GENERALE
DUPONT;Lucas;TLE A;M;22/02/2008;;TERMINALE GENERALE
CISSE;Mariama;TLE B;F;30/08/2008;;TERMINALE GENERALE`,
  },

  profs: {
    filename: "template_pronote_enseignants.csv",
    title: "Modèle Pronote Professeurs",
    description: "Format d'export de l'équipe pédagogique depuis Pronote / EDT",
    content:
`Civilité;Nom;Prénom;Discipline;Courriel
Monsieur;NDIAYE;Babacar;Mathématiques;b.ndiaye@lfjpsaly.org
Madame;DUPONT;Claire;Lettres Modernes / Français;c.dupont@lfjpsaly.org
Monsieur;FALL;Amadou;Histoire-Géographie & EMC;a.fall@lfjpsaly.org
Madame;SOW;Khadija;Sciences de la Vie et de la Terre (SVT);k.sow@lfjpsaly.org
Monsieur;GIRARD;Patrick;Physique-Chimie;p.girard@lfjpsaly.org
Madame;KANE;Aminata;Anglais LV1;a.kane@lfjpsaly.org
Monsieur;MARTIN;Thomas;Philosophie;t.martin@lfjpsaly.org
Madame;BA;Coumba;Sciences Économiques et Sociales (SES);c.ba@lfjpsaly.org`,
  },

  salles: {
    filename: "template_pronote_salles.csv",
    title: "Modèle Pronote Salles de Classe & Espaces",
    description: "Format d'export des salles et capacités depuis Pronote / EDT",
    content:
`Nom Salle;Capacité;Bâtiment;Aménagement Tiers-Temps;Remarques
Salle 101;28;Bâtiment Principal;Non;Table individuelle avec numérotation
Salle 102;30;Bâtiment Principal;Non;Table individuelle avec numérotation
Salle 103;26;Bâtiment Principal;Non;Table individuelle avec numérotation
Salle 104;24;Bâtiment Principal;Non;Table individuelle avec numérotation
Salle TT-1;12;Bâtiment B;Oui;Salle dédiée Tiers-Temps (+1/3 temps) et calme
Salle TT-2;10;Bâtiment B;Oui;Prises électriques pour ordinateurs et secrétaires
Labo Sciences;24;Bâtiment Sciences;Non;Paillasses d'examen
Permanence;40;Rez-de-chaussée;Non;Grande salle polyvalente`,
  },
};

/**
 * Télécharge un fichier CSV formaté avec le BOM UTF-8 (\uFEFF)
 * pour compatibilité parfaite avec Excel, Pronote et LibreOffice.
 */
export function downloadCsvTemplate(type: "eleves" | "profs" | "salles") {
  const tpl = CSV_TEMPLATES[type];
  if (!tpl) return;

  const bom = "\uFEFF";
  const blob = new Blob([bom + tpl.content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", tpl.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// DÉTECTION ET NETTOYAGE DES LIGNES CSV
// ============================================================================

function detectDelimiter(firstLine: string): string {
  const tabs = (firstLine.match(/\t/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;

  if (tabs > semicolons && tabs > commas) return "\t";
  if (semicolons >= commas) return ";";
  return ",";
}

function cleanCell(val: string): string {
  if (!val) return "";
  let res = val.trim();
  // Strip surrounding quotes
  if (
    (res.startsWith('"') && res.endsWith('"')) ||
    (res.startsWith("'") && res.endsWith("'"))
  ) {
    res = res.slice(1, -1).trim();
  }
  return res;
}

function parseCsvRows(content: string): string[][] {
  const cleanContent = content.replace(/^\uFEFF/, "").trim();
  const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);

  return lines.map((line) => {
    // Basic regex-aware split on delimiter
    const row: string[] = [];
    let insideQuotes = false;
    let current = "";

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        insideQuotes = !insideQuotes;
      } else if (ch === delimiter && !insideQuotes) {
        row.push(cleanCell(current));
        current = "";
      } else {
        current += ch;
      }
    }
    row.push(cleanCell(current));
    return row;
  });
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// ============================================================================
// PARSERS PRONOTE TOLÉRANTS
// ============================================================================

/**
 * Analyse un CSV ou un copier-coller de Pronote pour les élèves.
 */
export function parsePronoteElevesCsv(content: string): {
  success: boolean;
  data: CmsCandidate[];
  count: number;
  error?: string;
} {
  try {
    const rows = parseCsvRows(content);
    if (rows.length < 2) {
      return { success: false, data: [], count: 0, error: "Le fichier CSV est vide ou ne contient qu'une seule ligne." };
    }

    const header = rows[0].map(normalizeHeader);

    // Map column indexes
    let idxNom = header.findIndex((h) => h.includes("nom") && !h.includes("prenom"));
    let idxPrenom = header.findIndex((h) => h.includes("prenom"));
    let idxClasse = header.findIndex((h) => h.includes("classe") || h.includes("division") || h.includes("groupe") || h.includes("mef"));
    const idxAménagement = header.findIndex((h) => h.includes("amenagement") || h.includes("tiers") || h.includes("pap") || h.includes("pps"));

    // Fallbacks if Pronote exported without standard headers
    if (idxNom === -1) idxNom = 0;
    if (idxPrenom === -1) idxPrenom = 1;
    if (idxClasse === -1) idxClasse = 2;

    const results: CmsCandidate[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || !row[idxNom]) continue;

      const nom = row[idxNom] || "";
      const prenom = row[idxPrenom] || "";
      const classe = (idxClasse !== -1 && row[idxClasse]) ? row[idxClasse] : "3ème";
      const amenagement = (idxAménagement !== -1 && row[idxAménagement]) ? row[idxAménagement] : "";

      if (!nom.trim()) continue;

      results.push({
        id: `cand-${Date.now()}-${r}-${Math.random().toString(36).substr(2, 4)}`,
        lastName: nom.toUpperCase(),
        firstName: prenom,
        className: classe,
        examName: "DNB Blanc / Bac Blanc",
        roomName: "",
        convocationTime: "07h45",
        accommodation: amenagement,
        tableNumber: "",
        anonymatNumber: "",
      });
    }

    if (results.length === 0) {
      return { success: false, data: [], count: 0, error: "Aucun élève valide détecté dans les lignes du fichier." };
    }

    return { success: true, data: results, count: results.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur de lecture du fichier CSV Pronote.";
    return { success: false, data: [], count: 0, error: msg };
  }
}

/**
 * Analyse un CSV ou un copier-coller de Pronote pour les professeurs.
 */
export function parsePronoteProfsCsv(content: string): {
  success: boolean;
  data: CmsTeacher[];
  count: number;
  error?: string;
} {
  try {
    const rows = parseCsvRows(content);
    if (rows.length < 2) {
      return { success: false, data: [], count: 0, error: "Le fichier CSV est vide ou incomplet." };
    }

    const header = rows[0].map(normalizeHeader);

    const idxCiv = header.findIndex((h) => h.includes("civ"));
    let idxNom = header.findIndex((h) => h.includes("nom") && !h.includes("prenom"));
    let idxPrenom = header.findIndex((h) => h.includes("prenom"));
    let idxMatiere = header.findIndex((h) => h.includes("matiere") || h.includes("discipline") || h.includes("cours"));
    const idxEmail = header.findIndex((h) => h.includes("email") || h.includes("courriel") || h.includes("mail"));

    if (idxNom === -1) idxNom = 1;
    if (idxPrenom === -1) idxPrenom = 2;
    if (idxMatiere === -1) idxMatiere = 3;

    const results: CmsTeacher[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0) continue;

      const civRaw = (idxCiv !== -1 && row[idxCiv]) ? row[idxCiv].toLowerCase() : "";
      const civ: "Madame" | "Monsieur" = civRaw.includes("mme") || civRaw.includes("madame") || civRaw.includes("f") ? "Madame" : "Monsieur";

      const nom = row[idxNom] || "";
      const prenom = (idxPrenom !== -1 && row[idxPrenom]) ? row[idxPrenom] : "";
      const matiere = (idxMatiere !== -1 && row[idxMatiere]) ? row[idxMatiere] : "Enseignement Général";
      const email = (idxEmail !== -1 && row[idxEmail]) ? row[idxEmail] : "";

      if (!nom.trim()) continue;

      results.push({
        id: `teach-${Date.now()}-${r}-${Math.random().toString(36).substr(2, 4)}`,
        civility: civ,
        lastName: nom.toUpperCase(),
        firstName: prenom,
        subject: matiere,
        email: email || `${prenom.charAt(0).toLowerCase()}.${nom.toLowerCase()}@lfjpsaly.org`,
      });
    }

    if (results.length === 0) {
      return { success: false, data: [], count: 0, error: "Aucun professeur valide détecté." };
    }

    return { success: true, data: results, count: results.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur de lecture du fichier CSV.";
    return { success: false, data: [], count: 0, error: errorMsg };
  }
}

/**
 * Analyse un CSV ou un copier-coller de Pronote pour les salles de classe / espaces.
 */
export function parsePronoteSallesCsv(content: string): {
  success: boolean;
  data: CmsRoom[];
  count: number;
  error?: string;
} {
  try {
    const rows = parseCsvRows(content);
    if (rows.length < 2) {
      return { success: false, data: [], count: 0, error: "Le fichier CSV est vide ou incomplet." };
    }

    const header = rows[0].map(normalizeHeader);

    let idxNom = header.findIndex((h) => h.includes("salle") || h.includes("espace") || h.includes("nom"));
    let idxCapacite = header.findIndex((h) => h.includes("capacite") || h.includes("places") || h.includes("effectif") || h.includes("jauge"));
    const idxBatiment = header.findIndex((h) => h.includes("batiment") || h.includes("etage") || h.includes("zone") || h.includes("aile"));
    const idxRemarques = header.findIndex((h) => h.includes("remarque") || h.includes("note") || h.includes("amenagement") || h.includes("info"));

    if (idxNom === -1) idxNom = 0;
    if (idxCapacite === -1) idxCapacite = 1;

    const results: CmsRoom[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0) continue;

      const nom = row[idxNom] || "";
      const capStr = (idxCapacite !== -1 && row[idxCapacite]) ? row[idxCapacite] : "30";
      const capacite = parseInt(capStr.replace(/[^0-9]/g, ""), 10) || 30;
      const batiment = (idxBatiment !== -1 && row[idxBatiment]) ? row[idxBatiment] : "Bâtiment Principal";
      const notes = (idxRemarques !== -1 && row[idxRemarques]) ? row[idxRemarques] : "";

      if (!nom.trim()) continue;

      results.push({
        id: `room-${Date.now()}-${r}-${Math.random().toString(36).substr(2, 4)}`,
        name: nom.trim(),
        capacity: capacite,
        building: batiment,
        notes: notes,
      });
    }

    if (results.length === 0) {
      return { success: false, data: [], count: 0, error: "Aucune salle valide détectée." };
    }

    return { success: true, data: results, count: results.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur de lecture du fichier CSV des salles.";
    return { success: false, data: [], count: 0, error: errorMsg };
  }
}

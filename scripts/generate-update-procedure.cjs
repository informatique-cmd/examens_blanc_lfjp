const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

const outputPath = path.resolve(__dirname, "..", "docs", "procedure-mise-a-jour-examens-lfjp.pdf");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const doc = new jsPDF({ unit: "pt", format: "a4" });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 48;
const contentWidth = pageWidth - margin * 2;
let y = margin;

function footer() {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Procédure de mise à jour - Examens blancs LFJP", margin, pageHeight - 24);
  doc.text(String(doc.getNumberOfPages()), pageWidth - margin, pageHeight - 24, { align: "right" });
}

function ensureSpace(height) {
  if (y + height > pageHeight - 52) {
    footer();
    doc.addPage();
    y = margin;
  }
}

function title(text) {
  ensureSpace(42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(text, margin, y);
  y += 30;
}

function heading(text) {
  ensureSpace(32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text(text, margin, y);
  y += 22;
}

function paragraph(text) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(text, contentWidth);
  ensureSpace(lines.length * 14 + 8);
  doc.text(lines, margin, y, { lineHeightFactor: 1.35 });
  y += lines.length * 14 + 10;
}

function step(number, text) {
  const lines = doc.splitTextToSize(text, contentWidth - 42);
  ensureSpace(lines.length * 14 + 30);
  doc.setFillColor(30, 64, 175);
  doc.circle(margin + 12, y - 4, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(String(number), margin + 12, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(lines, margin + 34, y, { lineHeightFactor: 1.3 });
  y += lines.length * 14 + 12;
}

function bullet(text) {
  const lines = doc.splitTextToSize(text, contentWidth - 18);
  ensureSpace(lines.length * 14 + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text("•", margin, y);
  doc.text(lines, margin + 14, y, { lineHeightFactor: 1.3 });
  y += lines.length * 14 + 5;
}

function code(text) {
  const lines = doc.splitTextToSize(text, contentWidth - 20);
  ensureSpace(lines.length * 12 + 16);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y - 12, contentWidth, lines.length * 12 + 16, 4, 4, "F");
  doc.text(lines, margin + 10, y, { lineHeightFactor: 1.25 });
  y += lines.length * 12 + 18;
}

// Cover
const coverY = 180;
doc.setFillColor(15, 23, 42);
doc.rect(0, 0, pageWidth, pageHeight, "F");
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(27);
doc.text("Procédure de mise à jour", margin, coverY);
doc.setFontSize(20);
doc.setTextColor(147, 197, 253);
doc.text("Examens blancs LFJP", margin, coverY + 40);
doc.setFont("helvetica", "normal");
doc.setFontSize(12);
doc.setTextColor(226, 232, 240);
doc.text("Préparer une nouvelle année, publier et déployer", margin, coverY + 82);
doc.text("Version de référence : 20 août 2026", margin, coverY + 104);
doc.setDrawColor(96, 165, 250);
doc.line(margin, coverY + 132, pageWidth - margin, coverY + 132);
doc.setFontSize(10);
doc.setTextColor(203, 213, 225);
doc.text("Procédure destinée à la personne qui maintient les données et publie l'application.", margin, coverY + 164);
footer();
doc.addPage();
y = margin;

title("1. Avant de commencer");
paragraph("Cette application contient des données statiques dans des fichiers TypeScript. Pour préparer une nouvelle session, il faut modifier les données, vérifier les liens et les dates, tester la compilation, puis publier le commit sur GitHub. Vercel reconstruira ensuite automatiquement l'application.");
heading("À préparer");
bullet("Les dates officielles des épreuves.");
bullet("Les listes d'élèves et leurs classes.");
bullet("La liste actualisée des enseignants.");
bullet("Les salles, capacités et aménagements.");
bullet("Les horaires, jurys et surveillances.");
bullet("Les informations à afficher sur l'accueil.");
heading("Règle importante");
paragraph("Ne modifiez jamais le dossier dist : il est généré automatiquement. Travaillez dans src, puis laissez Vite reconstruire dist.");

title("2. Mettre à jour l'accueil");
step(1, "Ouvrir src/features/home/constants.ts.");
step(2, "Modifier les titres, dates, libellés et liens des cartes d'examens dans HOME_CALLOUT_ENTRIES.");
step(3, "Utiliser une date ISO pour le champ date, par exemple 2026-12-12.");
step(4, "Vérifier que chaque lien correspond à une route réellement déclarée dans src/app/App.tsx.");
code('dateLabel: "12, 13 et 14 décembre 2026",\ndate: "2026-12-12",\ntitle: "Baccalauréat blanc 2026",');

heading("Ajouter une nouvelle carte");
paragraph("Créer une constante HomeCalloutEntry, l'ajouter dans HOME_CALLOUT_ENTRIES, puis créer la page correspondante si la route n'existe pas encore.");

title("3. Mettre à jour les données");
heading("Tableau de bord principal");
paragraph("Modifier src/features/exam-dashboard/data/dashboard-data.ts. Ce fichier contient notamment les enseignants, élèves, salles, missions de surveillance, horaires, indicateurs et aménagements.");
heading("Mathématiques et DNB");
paragraph("Modifier ou créer un fichier dans src/features/math-exam-dashboard/data/datasets. Le jeu de données doit respecter MathExamDashboardData : en-tête, indicateurs, enseignants, surveillance, salles et onglets.");
heading("Oraux");
paragraph("Modifier les candidats dans les dossiers src/features/french-oral-exam-202604, french-oral-exam-202605, french-oral-exam-202606 ou grand-oral-exam-202604. Vérifier les dates ISO, heures, classes, jurys et salles.");
heading("Surveillances BAC et DNB");
paragraph("Modifier src/features/bac-dnb-surveillance/data/scheduleData.ts. Vérifier les colonnes d'épreuves, les horaires et les noms des surveillants. L'heure de présence est calculée automatiquement 30 minutes avant l'épreuve.");

heading("Contrôles de cohérence");
bullet("Chaque salle utilisée existe dans la liste des salles.");
bullet("Chaque enseignant utilisé existe dans l'annuaire.");
bullet("Les dates sont au format YYYY-MM-DD lorsqu'elles sont utilisées pour le tri.");
bullet("Les horaires de convocation précèdent les horaires de passage.");
bullet("Les routes de l'accueil correspondent aux routes React.");

title("4. Tester en local");
step(1, "Ouvrir un terminal à la racine du projet.");
step(2, "Installer les dépendances avec npm install.");
step(3, "Lancer npm run lint et corriger toute erreur.");
step(4, "Lancer npm run build et vérifier que la compilation réussit.");
step(5, "Lancer npm run dev, ouvrir l'adresse affichée et tester les pages modifiées.");
code("npm install\nnpm run lint\nnpm run build\nnpm run dev");
heading("Test manuel minimal");
bullet("Ouvrir la page d'accueil.");
bullet("Cliquer sur chaque carte modifiée.");
bullet("Recharger directement une URL interne.");
bullet("Tester les onglets et la recherche.");
bullet("Tester au moins un export PDF et un export CSV.");
bullet("Vérifier l'affichage sur ordinateur et mobile.");

title("5. Publier sur GitHub");
paragraph("Une fois les tests terminés, vérifier les fichiers modifiés avant de créer le commit.");
code("git status\ngit add .\ngit commit -m \"Update exam data for 2026\"\ngit push origin main");
paragraph("Le push doit se terminer par une confirmation d'envoi vers origin/main. Si Git signale un conflit ou un rejet, ne forcez pas le push : récupérez d'abord les changements distants avec git pull.");

heading("Vérification après publication");
code("git status --short --branch\ngit log --oneline --max-count=2");
paragraph("Le résultat attendu est une branche main synchronisée avec origin/main et aucun fichier non suivi ou modifié non prévu.");

title("6. Déployer avec Vercel");
step(1, "Ouvrir le projet Vercel relié au dépôt GitHub.");
step(2, "Vérifier que la branche de production est main.");
step(3, "Vérifier que le Framework est Vite, la commande npm run build et le dossier de sortie dist.");
step(4, "Lancer Redeploy ou attendre le déploiement automatique du nouveau commit.");
step(5, "Ouvrir le domaine Vercel et tester la page d'accueil ainsi qu'une URL interne.");
heading("Configuration des routes");
paragraph("Le fichier vercel.json contient une réécriture vers index.html. Il est nécessaire pour que les routes React fonctionnent lors d'un accès direct ou après un rechargement de page.");

heading("En cas d'erreur npm");
paragraph("Si Vercel affiche ERESOLVE, vérifier que package.json et package-lock.json sont bien commités ensemble. Le projet utilise ESLint 8 et TypeScript 5.5.4 pour rester compatible avec les outils TypeScript utilisés par l'application.");

heading("En cas d'erreur de build");
bullet("Lire la première erreur réelle, pas seulement le résumé final.");
bullet("Reproduire localement avec npm run build.");
bullet("Corriger le fichier indiqué par le message.");
bullet("Committer et pousser la correction sur main.");
bullet("Relancer le déploiement Vercel.");

title("7. Checklist annuelle");
bullet("Les dates de l'accueil sont actualisées.");
bullet("Les routes des nouvelles pages existent.");
bullet("Les listes d'élèves sont actualisées.");
bullet("L'annuaire des enseignants est actualisé.");
bullet("Les salles et capacités sont vérifiées.");
bullet("Les surveillances et convocations sont vérifiées.");
bullet("Les exports PDF et CSV ont été testés.");
bullet("npm run lint passe sans erreur.");
bullet("npm run build passe sans erreur.");
bullet("Le commit est envoyé sur main.");
bullet("Vercel affiche un déploiement réussi.");
bullet("Le site en ligne a été testé après déploiement.");

heading("Évolution recommandée");
paragraph("À terme, déplacer les données dans une base de données ou un outil d'administration permettrait de modifier les sessions sans toucher au code. En attendant, cette procédure garantit une mise à jour contrôlée et réversible grâce à Git.");

footer();
doc.save(outputPath);
console.log(`PDF généré : ${outputPath}`);
